#!/usr/bin/env node
/**
 * Split the primer's markdown sources into one file per page.
 *
 * The markdown is the single source of truth.  This script only *splits* it,
 * orders the pieces into sections, and records where every original heading
 * anchor now lives.  Not one sentence of the original text is rewritten.
 *
 *     node scripts/generate-content.mjs   ->  ./content/**.md + ./content/manifest.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(WEB);
const OUT = path.join(WEB, 'content');

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

/**
 * The primer's own text is not kept in this repository.  The upstream repo is
 * the single reference for it, and the source is pulled from there on demand
 * into a gitignored cache so a build never needs a local copy.
 */
const UPSTREAM_RAW = 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master';
const CACHE = path.join(ROOT, '.upstream');

async function upstream(rel) {
  const cached = path.join(CACHE, rel);
  if (!fs.existsSync(cached)) {
    const response = await fetch(`${UPSTREAM_RAW}/${rel}`);
    if (!response.ok) {
      throw new Error(`could not fetch ${rel} from donnemartin/system-design-primer: ${response.status}`);
    }
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    fs.writeFileSync(cached, await response.text());
    console.log(`  fetched ${rel} from donnemartin/system-design-primer`);
  }
  return fs.readFileSync(cached, 'utf8');
}

const primerReadme = await upstream('README.md');
const slugify = (text) => new GithubSlugger().slug(text);

// ---------------------------------------------------------------------------
// markdown helpers (all fence aware)
// ---------------------------------------------------------------------------

function eachLine(md, fn) {
  let fenced = false;
  return md.split('\n').map((line) => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    return fn(line, fenced);
  });
}

/** Split markdown on a heading level, returning [lead, blocks]. */
function splitOnHeading(md, level) {
  const marker = '#'.repeat(level) + ' ';
  const lead = [];
  const blocks = [];
  let current = null;
  eachLine(md, (line, fenced) => {
    const isHeading = !fenced && line.startsWith(marker);
    if (isHeading) {
      if (current) blocks.push(current.join('\n'));
      current = [line];
    } else if (current) {
      current.push(line);
    } else {
      lead.push(line);
    }
    return line;
  });
  if (current) blocks.push(current.join('\n'));
  return [lead.join('\n').trim(), blocks];
}

/** Every heading in a document, in order, as {level, text}. */
function headings(md) {
  const found = [];
  eachLine(md, (line, fenced) => {
    const m = !fenced && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) found.push({ level: m[1].length, text: m[2].trim() });
    return line;
  });
  return found;
}

/** Pull the first heading off a block; return {title, body}. */
function takeTitle(md) {
  const lines = md.split('\n');
  const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[0]);
  if (!m) return { title: '', body: md.trim() };
  return { title: m[2].trim(), body: lines.slice(1).join('\n').trim() };
}

/** Re-level a page body so its shallowest heading becomes an <h2>. */
function normalizeHeadings(md) {
  const levels = headings(md).map((h) => h.level);
  if (!levels.length) return md;
  const delta = 2 - Math.min(...levels);
  if (delta === 0) return md;
  return eachLine(md, (line, fenced) => {
    const m = !fenced && /^(#{1,6})(\s+.*)$/.exec(line);
    if (!m) return line;
    const level = Math.min(6, Math.max(1, m[1].length + delta));
    return '#'.repeat(level) + m[2];
  }).join('\n');
}

/**
 * A page's own summary line, taken from the source and never invented:
 *   - `lede`        the primer's own blockquote summary, shown under the title
 *   - `description` the lede, else the page's opening prose, for meta tags
 */
function summarize(md, fallback) {
  const plain = (value) =>
    value
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const clip = (value) => (value.length > 200 ? value.slice(0, 197).trimEnd() + '...' : value);

  // Fenced code is never a summary, so drop it before looking at blocks.
  let fenced = false;
  const prose = md
    .split('\n')
    .filter((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return false;
      }
      return !fenced;
    })
    .join('\n');

  const classify = (block) => {
    if (block.startsWith('#')) return 'heading';
    if (block.startsWith('<')) return 'html';
    if (block.startsWith('|')) return 'table';
    if (block.startsWith('>')) return 'quote';
    if (/^[*\-+]\s/.test(block) || /^\d+\.\s/.test(block)) return 'list';
    if (/^This notebook was prepared by/.test(block)) return 'boilerplate';
    return 'paragraph';
  };

  const blocks = prose
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({ kind: classify(block), text: block }));

  const firstHeading = blocks.findIndex((block) => block.kind === 'heading');
  const intro = firstHeading < 0 ? blocks : blocks.slice(0, firstHeading);

  const take = (pool, kind, minimum) => {
    const block = pool.find((candidate) => candidate.kind === kind);
    if (!block) return '';
    const line = plain(kind === 'quote' ? block.text.split('\n')[0] : block.text);
    return line.length >= minimum ? clip(line) : '';
  };

  const lede = take(intro, 'quote', 20);
  const description =
    lede ||
    take(intro, 'paragraph', 40) ||
    take(blocks, 'paragraph', 40) ||
    take(blocks, 'list', 40) ||
    take(blocks, 'quote', 20) ||
    fallback;

  return { lede, description };
}

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------

const readmeLead = (() => {
  const [lead] = splitOnHeading(primerReadme, 2);
  return takeTitle(lead);
})();

const readmeSections = (() => {
  const md = primerReadme;
  const [, blocks] = splitOnHeading(md, 2);
  const map = new Map();
  for (const block of blocks) {
    const { title } = takeTitle(block);
    map.set(slugify(title), { title, md: block });
  }
  return map;
})();

const appendixSections = (() => {
  const block = readmeSections.get('appendix').md;
  const [lead, blocks] = splitOnHeading(block, 3);
  const map = new Map();
  for (const b of blocks) {
    const { title } = takeTitle(b);
    map.set(slugify(title), { title, md: b });
  }
  return { lead: takeTitle(lead).body, sections: map };
})();

function solutionSource(name) {
  return read('solutions', 'system_design', name, 'README.md');
}

function notebookSource(dir, file) {
  const nb = JSON.parse(read('solutions', 'object_oriented_design', dir, file));
  const parts = [];
  for (const cell of nb.cells || []) {
    const source = (cell.source || []).join('').replace(/\s+$/, '');
    if (!source.trim()) continue;
    if (cell.cell_type === 'markdown') {
      parts.push(source);
    } else if (cell.cell_type === 'code') {
      parts.push('```python\n' + source + '\n```');
      const texts = [];
      for (const out of cell.outputs || []) {
        const data = out.data || {};
        if (data['text/plain']) texts.push([].concat(data['text/plain']).join(''));
        else if (out.output_type === 'stream') texts.push([].concat(out.text || []).join(''));
      }
      const text = texts.join('\n').replace(/\s+$/, '');
      if (text) parts.push('```text\n' + text + '\n```');
    }
  }
  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// the site map: every page, in reading order
// ---------------------------------------------------------------------------

const SECTIONS = [
  {
    id: 'getting-started',
    route: '/getting-started',
    title: 'Getting Started',
    kicker: 'Start here',
    tagline: 'Why the primer exists, how to plan your study time, and how to run the interview itself.',
  },
  {
    id: 'hld',
    route: '/hld',
    title: 'High Level Design',
    kicker: 'HLD',
    tagline:
      'System-level architecture: the trade-offs, the building blocks you assemble into a design, and full worked case studies.',
  },
  {
    id: 'lld',
    route: '/lld',
    title: 'Low Level Design',
    kicker: 'LLD',
    tagline:
      'Object-oriented design: classes, relationships and runnable code for the questions asked at the whiteboard.',
  },
  {
    id: 'reference',
    route: '/reference',
    title: 'Reference',
    kicker: 'Reference',
    tagline: 'Tables, latency numbers and real-world architectures to reach for during back-of-the-envelope estimates.',
  },
  {
    id: 'about',
    route: '/about',
    title: 'About',
    kicker: 'About',
    tagline: 'Who wrote the primer, who built this edition, and the licence that covers both.',
  },
];

/**
 * Remove a named sub-section, heading and body, from an extracted slice.
 * Used where a page carries something that only makes sense in the upstream
 * repository.  Fenced code is skipped so a `#` inside a block is never read
 * as a heading.
 */
function dropSubsection(md, heading) {
  const lines = md.split('\n');
  const out = [];
  let fenced = false;
  let removingAt = null;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const m = !fenced && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      const level = m[1].length;
      if (removingAt !== null && level <= removingAt) removingAt = null;
      if (removingAt === null && m[2].trim() === heading) {
        removingAt = level;
        continue;
      }
    }
    if (removingAt === null) out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

const rm = (anchor, section, group, slug, short, omit) => ({ kind: 'readme', anchor, section, group, slug, short, omit });
const ax = (anchor, section, group, slug) => ({ kind: 'appendix', anchor, section, group, slug });
const sd = (dir, section, group, slug, short) => ({ kind: 'solution', dir, section, group, slug, short });
const ood = (dir, file, section, group, slug, short) => ({
  kind: 'notebook',
  dir,
  file,
  section,
  group,
  slug,
  short,
});

const PAGES = [
  // ----- Getting started ---------------------------------------------------
  rm('motivation', 'getting-started', 'Orientation', 'motivation', undefined, [
    'Learn from the open source community',
  ]),
  rm('index-of-system-design-topics', 'getting-started', 'Orientation', 'index-of-system-design-topics'),
  rm('study-guide', 'getting-started', 'Prepare', 'study-guide'),
  rm(
    'how-to-approach-a-system-design-interview-question',
    'getting-started',
    'Prepare',
    'how-to-approach-a-system-design-interview-question',
  ),

  // ----- HLD: fundamentals -------------------------------------------------
  rm('system-design-topics-start-here', 'hld', 'Fundamentals', 'start-here'),
  rm('performance-vs-scalability', 'hld', 'Fundamentals', 'performance-vs-scalability'),
  rm('latency-vs-throughput', 'hld', 'Fundamentals', 'latency-vs-throughput'),
  rm('availability-vs-consistency', 'hld', 'Fundamentals', 'availability-vs-consistency'),
  rm('consistency-patterns', 'hld', 'Fundamentals', 'consistency-patterns'),
  rm('availability-patterns', 'hld', 'Fundamentals', 'availability-patterns'),

  // ----- HLD: building blocks ---------------------------------------------
  rm('domain-name-system', 'hld', 'Building blocks', 'domain-name-system'),
  rm('content-delivery-network', 'hld', 'Building blocks', 'content-delivery-network'),
  rm('load-balancer', 'hld', 'Building blocks', 'load-balancer'),
  rm('reverse-proxy-web-server', 'hld', 'Building blocks', 'reverse-proxy-web-server'),
  rm('application-layer', 'hld', 'Building blocks', 'application-layer'),
  rm('database', 'hld', 'Building blocks', 'database'),
  rm('cache', 'hld', 'Building blocks', 'cache'),
  rm('asynchronism', 'hld', 'Building blocks', 'asynchronism'),
  rm('communication', 'hld', 'Building blocks', 'communication'),
  rm('security', 'hld', 'Building blocks', 'security'),

  // ----- HLD: case studies -------------------------------------------------
  rm('system-design-interview-questions-with-solutions', 'hld', 'Case studies', 'case-studies'),
  sd('pastebin', 'hld', 'Case studies', 'case-studies/pastebin', 'Design Pastebin.com (or Bit.ly)'),
  sd('twitter', 'hld', 'Case studies', 'case-studies/twitter', 'Design the Twitter timeline and search'),
  sd('web_crawler', 'hld', 'Case studies', 'case-studies/web-crawler', 'Design a web crawler'),
  sd('mint', 'hld', 'Case studies', 'case-studies/mint', 'Design Mint.com'),
  sd('social_graph', 'hld', 'Case studies', 'case-studies/social-graph', 'Design the data structures for a social network'),
  sd('query_cache', 'hld', 'Case studies', 'case-studies/query-cache', 'Design a key-value store for a search engine'),
  sd('sales_rank', 'hld', 'Case studies', 'case-studies/sales-rank', "Design Amazon's sales ranking by category feature"),
  sd('scaling_aws', 'hld', 'Case studies', 'case-studies/scaling-aws', 'Design a system that scales to millions of users on AWS'),
  ax('additional-system-design-interview-questions', 'hld', 'Case studies', 'additional-interview-questions'),

  // ----- LLD ---------------------------------------------------------------
  rm('object-oriented-design-interview-questions-with-solutions', 'lld', 'Overview', 'interview-questions'),
  ood('hash_table', 'hash_map.ipynb', 'lld', 'Solutions', 'hash-map', 'Design a hash map'),
  ood('lru_cache', 'lru_cache.ipynb', 'lld', 'Solutions', 'lru-cache', 'Design a least recently used cache'),
  ood('call_center', 'call_center.ipynb', 'lld', 'Solutions', 'call-center', 'Design a call center'),
  ood('deck_of_cards', 'deck_of_cards.ipynb', 'lld', 'Solutions', 'deck-of-cards', 'Design a deck of cards'),
  ood('parking_lot', 'parking_lot.ipynb', 'lld', 'Solutions', 'parking-lot', 'Design a parking lot'),
  ood('online_chat', 'online_chat.ipynb', 'lld', 'Solutions', 'online-chat', 'Design a chat server'),

  // ----- Reference ---------------------------------------------------------
  ax('powers-of-two-table', 'reference', 'Estimation', 'powers-of-two-table'),
  ax('latency-numbers-every-programmer-should-know', 'reference', 'Estimation', 'latency-numbers-every-programmer-should-know'),
  ax('real-world-architectures', 'reference', 'In the wild', 'real-world-architectures'),
  ax('company-architectures', 'reference', 'In the wild', 'company-architectures'),
  ax('company-engineering-blogs', 'reference', 'In the wild', 'company-engineering-blogs'),

  // ----- About -------------------------------------------------------------
  rm('credits', 'about', 'Project', 'credits'),
  rm('license', 'about', 'Project', 'license', 'License / Ownership'),
];

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

function buildPage(entry) {
  const route = `${SECTIONS.find((s) => s.id === entry.section).route}/${entry.slug}`;
  let title;
  let body;
  let source;

  if (entry.kind === 'readme' || entry.kind === 'appendix') {
    const bag = entry.kind === 'readme' ? readmeSections : appendixSections.sections;
    const found = bag.get(entry.anchor);
    if (!found) throw new Error(`no such section: ${entry.anchor}`);
    if (entry.omit) found.md = entry.omit.reduce(dropSubsection, found.md);
    ({ title, body } = takeTitle(found.md));
    source = 'README.md';
  } else if (entry.kind === 'solution') {
    ({ title, body } = takeTitle(solutionSource(entry.dir)));
    source = `solutions/system_design/${entry.dir}/README.md`;
  } else {
    const md = notebookSource(entry.dir, entry.file);
    const lines = md.split('\n');
    const i = lines.findIndex((l) => /^#\s+\S/.test(l));
    title = i >= 0 ? lines[i].replace(/^#\s+/, '').trim() : entry.short;
    if (i >= 0) lines.splice(i, 1);
    body = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    source = `solutions/object_oriented_design/${entry.dir}/${entry.file}`;
  }

  body = normalizeHeadings(body);

  return {
    route,
    slug: entry.slug,
    topAnchor: entry.anchor || slugify(title),
    section: entry.section,
    group: entry.group,
    title,
    navTitle: entry.short || title,
    ...summarize(body, title),
    source,
    sourceAnchor: entry.anchor || null,
    body,
    headings: headings(body)
      .filter((h) => h.level === 2 || h.level === 3)
      .map((h) => ({ ...h, id: slugify(h.text) })),
  };
}

const pages = PAGES.map(buildPage);

// The reference hub carries the Appendix's own intro paragraph.
const sectionLead = { reference: appendixSections.lead };

// Anchor map: every original README heading -> the route it now lives on.
const anchors = {};
for (const entry of PAGES) {
  if (entry.kind !== 'readme' && entry.kind !== 'appendix') continue;
  const bag = entry.kind === 'readme' ? readmeSections : appendixSections.sections;
  const page = pages.find((p) => p.sourceAnchor === entry.anchor && p.section === entry.section);
  for (const h of headings(bag.get(entry.anchor).md)) {
    const slug = slugify(h.text);
    if (!(slug in anchors)) anchors[slug] = page.route;
  }
}
// Sections that are not pages of their own still need somewhere to point.
anchors.appendix = anchors.appendix || '/reference';
for (const s of SECTIONS) anchors[s.id] = anchors[s.id] || s.route;

// The anchor a page used to answer to as a whole: a link to it is a link to
// the page itself, not to a fragment inside it.
const topAnchors = {};
for (const page of pages) topAnchors[page.route] = page.topAnchor;
topAnchors['/reference'] = 'appendix';

// Solution + notebook routes, keyed by their repo path, for relative links.
const files = {};
for (const [i, entry] of PAGES.entries()) {
  if (entry.kind === 'solution') files[`solutions/system_design/${entry.dir}/README.md`] = pages[i].route;
  if (entry.kind === 'notebook')
    files[`solutions/object_oriented_design/${entry.dir}/${entry.file}`] = pages[i].route;
}

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => JSON.stringify(s);

for (const page of pages) {
  const file = path.join(OUT, page.section, `${page.slug}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const frontmatter = [
    '---',
    `title: ${esc(page.title)}`,
    `navTitle: ${esc(page.navTitle)}`,
    `description: ${esc(page.description)}`,
    `lede: ${esc(page.lede)}`,
    `route: ${esc(page.route)}`,
    `section: ${esc(page.section)}`,
    `group: ${esc(page.group)}`,
    `source: ${esc(page.source)}`,
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(file, frontmatter + page.body + '\n', 'utf8');
}

fs.writeFileSync(
  path.join(OUT, 'home.md'),
  ['---', `title: ${esc(readmeLead.title)}`, '---', '', readmeLead.body, ''].join('\n'),
  'utf8',
);

const manifest = {
  generatedFrom: 'README.md + solutions/**',
  home: { title: readmeLead.title },
  sections: SECTIONS.map((s) => ({ ...s, lead: sectionLead[s.id] || '' })),
  pages: pages.map(({ body, ...rest }) => rest),
  anchors,
  topAnchors,
  files,
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

// Keep public/images in sync with the repo's own images folder.  The handful
// of diagrams the solutions host on imgur are committed alongside them.
const IMG_SRC = path.join(ROOT, 'images');
const IMG_OUT = path.join(WEB, 'public', 'images');
fs.mkdirSync(IMG_OUT, { recursive: true });
let copied = 0;
for (const name of fs.readdirSync(IMG_SRC)) {
  const from = path.join(IMG_SRC, name);
  const to = path.join(IMG_OUT, name);
  if (!fs.statSync(from).isFile()) continue;
  if (fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size) continue;
  fs.copyFileSync(from, to);
  copied += 1;
}

// A few diagrams in the solutions are hosted on imgur (and one behind
// GitHub's camo proxy) rather than committed to the repo.  Pull anything
// referenced but missing so the site never hotlinks a third party.
const remote = new Set();
for (const page of pages) {
  for (const [, url] of page.body.matchAll(/https?:\/\/i\.imgur\.com\/([\w.-]+)/g) ) remote.add(url);
  for (const [, hex] of page.body.matchAll(/camo\.githubusercontent\.com\/[0-9a-f]+\/([0-9a-f]+)/g)) {
    const decoded = Buffer.from(hex, 'hex').toString('utf8');
    const name = decoded.split('/').pop();
    if (name) remote.add(name);
  }
}

let fetched = 0;
for (const name of remote) {
  const to = path.join(IMG_OUT, name);
  if (fs.existsSync(to)) continue;
  const response = await fetch(`https://i.imgur.com/${name}`);
  if (!response.ok) {
    console.warn(`  ! could not fetch ${name}: ${response.status}`);
    continue;
  }
  fs.writeFileSync(to, Buffer.from(await response.arrayBuffer()));
  fetched += 1;
}

/** Intrinsic size of a PNG or JPEG, straight out of the file header. */
function imageSize(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }; // PNG IHDR
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      // SOF0..SOF15, skipping the four that are not frame headers
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

// Intrinsic sizes let the browser reserve the right box before an image
// arrives, which is the difference between a stable page and a jumping one.
const sizes = {};
for (const name of fs.readdirSync(IMG_OUT)) {
  const file = path.join(IMG_OUT, name);
  if (!fs.statSync(file).isFile()) continue;
  const size = imageSize(file);
  if (size) sizes[name] = size;
}
fs.writeFileSync(path.join(OUT, 'image-sizes.json'), JSON.stringify(sizes, null, 2), 'utf8');

// A flat index the client-side search dialog fetches once, on first open.
const plainText = (md) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1')
    .replace(/[#*_>|`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const index = pages.map((page) => ({
  route: page.route,
  title: page.title,
  navTitle: page.navTitle,
  section: page.section,
  group: page.group,
  description: page.description,
  text: plainText(page.body).slice(0, 4000),
}));
fs.writeFileSync(path.join(WEB, 'public', 'search-index.json'), JSON.stringify(index), 'utf8');

console.log(
  `content: ${pages.length} pages, ${Object.keys(anchors).length} anchors, ` +
    `${copied} images refreshed, ${fetched} fetched -> ${path.relative(ROOT, OUT)}`,
);
