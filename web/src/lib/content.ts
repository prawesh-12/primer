import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

import { renderMarkdown, toPlainText, type LinkContext } from './markdown';

const CONTENT = path.join(process.cwd(), 'content');

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface PageMeta {
  route: string;
  slug: string;
  section: string;
  group: string;
  title: string;
  navTitle: string;
  description: string;
  lede: string;
  source: string;
  sourceAnchor: string | null;
  topAnchor: string;
  headings: Heading[];
}

export interface SectionMeta {
  id: string;
  route: string;
  title: string;
  kicker: string;
  tagline: string;
  lead: string;
}

interface Manifest {
  sections: SectionMeta[];
  pages: PageMeta[];
  anchors: Record<string, string>;
  topAnchors: Record<string, string>;
  files: Record<string, string>;
}

let cache: Manifest | null = null;
let imageCache: Record<string, { width: number; height: number }> | null = null;

export function imageSizes(): Record<string, { width: number; height: number }> {
  if (!imageCache) {
    const file = path.join(CONTENT, 'image-sizes.json');
    imageCache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  }
  return imageCache!;
}

export function manifest(): Manifest {
  if (!cache) {
    const file = path.join(CONTENT, 'manifest.json');
    if (!fs.existsSync(file)) {
      throw new Error('content/manifest.json is missing - run `npm run content` first.');
    }
    cache = JSON.parse(fs.readFileSync(file, 'utf8')) as Manifest;
  }
  return cache;
}

export const allSections = (): SectionMeta[] => manifest().sections;
export const allPages = (): PageMeta[] => manifest().pages;

export const sectionById = (id: string): SectionMeta | undefined =>
  allSections().find((section) => section.id === id);

export const pagesInSection = (id: string): PageMeta[] =>
  allPages().filter((page) => page.section === id);

export const pageByRoute = (route: string): PageMeta | undefined =>
  allPages().find((page) => page.route === route);

/** Section pages bucketed into their named groups, in reading order. */
export function groupsInSection(id: string): { name: string; pages: PageMeta[] }[] {
  const groups: { name: string; pages: PageMeta[] }[] = [];
  for (const page of pagesInSection(id)) {
    let group = groups.find((candidate) => candidate.name === page.group);
    if (!group) groups.push((group = { name: page.group, pages: [] }));
    group.pages.push(page);
  }
  return groups;
}

/** Flat reading order across the whole site, for previous/next links. */
export function readingOrder(): PageMeta[] {
  const order = allSections().map((section) => section.id);
  return [...allPages()].sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));
}

export function neighbours(route: string): { previous?: PageMeta; next?: PageMeta } {
  const order = readingOrder();
  const index = order.findIndex((page) => page.route === route);
  if (index < 0) return {};
  return { previous: order[index - 1], next: order[index + 1] };
}

function fileFor(page: PageMeta) {
  return path.join(CONTENT, page.section, `${page.slug}.md`);
}

export function rawBody(page: PageMeta): string {
  return matter(fs.readFileSync(fileFor(page), 'utf8')).content;
}

/** Render one page to HTML, with every original link pointed at its new home. */
export async function renderPage(page: PageMeta): Promise<string> {
  const { anchors, topAnchors, files } = manifest();
  const slugger = new GithubSlugger();
  const own = new Set<string>();
  const body = rawBody(page);

  let fenced = false;
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const match = !fenced && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) own.add(slugger.slug(match[2].trim()));
  }

  const ctx: LinkContext = {
    route: page.route,
    anchors,
    topAnchors,
    files,
    ownAnchors: own,
    imageSizes: imageSizes(),
  };
  return renderMarkdown(body, ctx);
}

/** Every heading on a page, for the on-this-page table of contents. */
export function tableOfContents(page: PageMeta): Heading[] {
  return page.headings;
}

/** The README's own opening block (its cover diagram), for the home page. */
export async function renderHomeLead(): Promise<string> {
  const file = path.join(CONTENT, 'home.md');
  if (!fs.existsSync(file)) return '';
  const { anchors, topAnchors, files } = manifest();
  return renderMarkdown(matter(fs.readFileSync(file, 'utf8')).content, {
    route: '/',
    anchors,
    topAnchors,
    files,
    ownAnchors: new Set<string>(),
    imageSizes: imageSizes(),
  });
}

export function searchIndex() {
  return allPages().map((page) => ({
    route: page.route,
    title: page.title,
    navTitle: page.navTitle,
    section: page.section,
    group: page.group,
    description: page.description,
    text: toPlainText(rawBody(page)).slice(0, 4000),
  }));
}
