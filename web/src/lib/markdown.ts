import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Element, Root, Text } from 'hast';

import { UPSTREAM, asset } from './site';

export interface LinkContext {
  /** Route of the page being rendered, e.g. "/hld/cache". */
  route: string;
  /** Original heading slug -> route it now lives on. */
  anchors: Record<string, string>;
  /** Route -> the anchor that page used to answer to as a whole. */
  topAnchors: Record<string, string>;
  /** Repo file path -> route, for links between solution pages. */
  files: Record<string, string>;
  /** Heading ids that exist on this page. */
  ownAnchors: Set<string>;
  /** Image file name -> intrinsic size, so the browser can reserve the box. */
  imageSizes: Record<string, { width: number; height: number }>;
}

const IMGUR = /^https?:\/\/i\.imgur\.com\/([\w.-]+)$/;
/** GitHub proxies remote images through camo; the hex path is the real URL. */
const CAMO = /^https?:\/\/camo\.githubusercontent\.com\/[0-9a-f]+\/([0-9a-f]+)$/;
const DROPPED = new Set(['CONTRIBUTING.md', 'TRANSLATIONS.md', 'LICENSE.txt']);

function upstream(fragment: string) {
  return `${UPSTREAM}#${fragment}`;
}

/**
 * Point every link in the original markdown at its new home.  Anchors that
 * used to jump around one huge README now cross page boundaries; relative
 * repo paths become routes; anything still unresolved falls back to the
 * upstream repository rather than 404ing.
 */
function rewriteLinks(ctx: LinkContext) {
  const resolveAnchor = (fragment: string) => {
    if (!fragment) return ctx.route;
    if (ctx.ownAnchors.has(fragment)) return `#${fragment}`;
    const route = ctx.anchors[fragment];
    if (!route) return upstream(fragment);
    // The whole page answers to this anchor: link to the page, not a fragment.
    if (ctx.topAnchors[route] === fragment) return route === ctx.route ? '#top' : `${asset(route)}/`;
    return route === ctx.route ? `#${fragment}` : `${asset(route)}/#${fragment}`;
  };

  const resolvePath = (raw: string) => {
    const [rawPath, fragment = ''] = raw.split('#');
    const tail = fragment ? `#${fragment}` : '';
    const clean = rawPath.replace(/^\.\//, '');
    const base = clean.split('/').pop() || '';

    if (!clean || clean === 'README.md') return fragment ? resolveAnchor(fragment) : asset('/');
    if (DROPPED.has(base)) return `${UPSTREAM}/blob/master/${base}`;
    if (clean.startsWith('images/')) return asset(`/${clean}`);

    const direct = ctx.files[clean];
    if (direct) return `${asset(direct)}/${tail}`;

    // "../scaling_aws/README.md" and friends: match on the trailing segments.
    const match = Object.keys(ctx.files).find((key) => key.endsWith(clean.replace(/^(\.\.\/)+/, '')));
    if (match) return `${asset(ctx.files[match])}/${tail}`;

    return `${UPSTREAM}/blob/master/${clean.replace(/^(\.\.\/)+/, '')}${tail}`;
  };

  let firstImage = true;

  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'a') {
        const href = String(node.properties?.href ?? '');
        if (!href) return;

        if (href.startsWith('#')) {
          node.properties!.href = resolveAnchor(href.slice(1));
        } else if (href.startsWith(`${UPSTREAM}#`)) {
          node.properties!.href = resolveAnchor(href.split('#')[1]);
        } else if (/^(https?:|mailto:|data:)/.test(href)) {
          if (!node.properties!.className) {
            node.properties!.target = '_blank';
            node.properties!.rel = ['noopener', 'noreferrer'];
          }
        } else {
          node.properties!.href = resolvePath(href);
        }
        return;
      }

      if (node.tagName === 'img') {
        let src = String(node.properties?.src ?? '');
        const camo = CAMO.exec(src);
        if (camo) src = Buffer.from(camo[1], 'hex').toString('utf8');
        const imgur = IMGUR.exec(src);
        if (imgur) node.properties!.src = asset(`/images/${imgur[1]}`);
        else if (!/^(https?:|data:|\/)/.test(src)) node.properties!.src = asset(`/${src.replace(/^\.\//, '')}`);
        else node.properties!.src = src;
        const name = String(node.properties!.src).split('/').pop() || '';
        const size = ctx.imageSizes[name];
        if (size) {
          node.properties!.width = size.width;
          node.properties!.height = size.height;
        }

        // The first diagram is usually what the reader waits for; the rest can wait.
        node.properties!.loading = firstImage ? 'eager' : 'lazy';
        if (firstImage) node.properties!.fetchPriority = 'high';
        firstImage = false;

        node.properties!.decoding = 'async';
        if (!node.properties!.alt) node.properties!.alt = '';
      }
    });
  };
}

/** Wide tables must scroll inside their own box, never the page body. */
function scrollableTables() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === null || index === undefined) return;
      if ((parent as Element).tagName === 'div') return;
      (parent as Root).children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      } as Element;
    });
  };
}

/** GitHub renders `:+1:`; a browser needs the character. */
function emoji() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text) => {
      node.value = node.value.replace(/:\+1:/g, '✅');
    });
  };
}

const AUTOLINK: AutolinkOptions = {
  behavior: 'append',
  properties: { className: ['heading-anchor'], ariaLabel: 'Permalink to this section' },
  content: { type: 'text', value: '#' },
};

/**
 * GitHub's HTML parser accepts unquoted attribute values such as
 * `<a href=https://example.com>`; CommonMark does not, and the URL would end
 * up autolinked as literal text.  Quoting them keeps the rendered output
 * identical to what GitHub shows.  Fenced code is left alone.
 */
function quoteRawAttributes(markdown: string): string {
  let fenced = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      return line.replace(/(<[a-zA-Z][^>]*?\s(?:href|src|alt|align)=)([^"'\s>]+)/g, '$1"$2"');
    })
    .join('\n');
}

export async function renderMarkdown(markdown: string, ctx: LinkContext): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(emoji)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, AUTOLINK)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(scrollableTables)
    .use(rewriteLinks(ctx))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(quoteRawAttributes(markdown));

  return String(file);
}

/** Plain text of a markdown document, for search indexing and meta tags. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>|`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
