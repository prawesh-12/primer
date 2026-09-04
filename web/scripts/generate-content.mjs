#!/usr/bin/env node
// Splits the primer's sources into ./content/**.md + ./content/manifest.json.
// Only splits and re-levels: no sentence of the original text is rewritten.

import crypto from 'node:crypto';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GithubSlugger from 'github-slugger';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(WEB);
const OUT = path.join(WEB, 'content');

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

// The primer's text is not kept in this repo; it is pulled from upstream
// into a gitignored cache.
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

const omittedChunks = [];

// Both point at translated READMEs this edition does not carry.
const LEAD_OMIT = [/^\*\[English\]\(/, /^\*\*Help \[translate\]\(/];
const slugify = (text) => new GithubSlugger().slug(text);

// Markdown helpers, all fence aware.

function eachLine(md, fn) {
  let fenced = false;
  return md.split('\n').map((line) => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    return fn(line, fenced);
  });
}

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

function headings(md) {
  const found = [];
  eachLine(md, (line, fenced) => {
    const m = !fenced && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) found.push({ level: m[1].length, text: m[2].trim() });
    return line;
  });
  return found;
}

function takeTitle(md) {
  const lines = md.split('\n');
  const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[0]);
  if (!m) return { title: '', body: md.trim() };
  return { title: m[2].trim(), body: lines.slice(1).join('\n').trim() };
}

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

// `lede` is the primer's own blockquote summary; `description` falls back to
// the opening prose. Both come from the source, never invented.
function summarize(md, fallback) {
  const plain = (value) =>
    value
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const clip = (value) => (value.length > 160 ? value.slice(0, 157).trimEnd() + '...' : value);

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


const readmeLead = (() => {
  const [lead] = splitOnHeading(primerReadme, 2);
  const { title, body } = takeTitle(lead);
  const kept = [];
  for (const line of body.split('\n')) {
    if (LEAD_OMIT.some((re) => re.test(line))) omittedChunks.push(line);
    else if (/^#\s+The System Design Primer\s*$/.test(line)) omittedChunks.push(line);
    else kept.push(line);
  }
  return { title, body: kept.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
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

// Every page, in reading order.

const SECTIONS = [
  {
    id: 'getting-started',
    route: '/getting-started',
    title: 'Getting Started',
    kicker: 'Start here',
    tagline:
      'System design for beginners: why the primer exists, how to plan your study time, and how to run the interview itself.',
  },
  {
    id: 'hld',
    route: '/hld',
    title: 'High Level Design',
    kicker: 'HLD',
    tagline:
      'High level system design: system architecture trade-offs, reusable building blocks, and full worked case studies.',
  },
  {
    id: 'lld',
    route: '/lld',
    title: 'Low Level Design',
    kicker: 'LLD',
    tagline:
      'Low level system design: object-oriented classes, relationships and runnable code for whiteboard interview questions.',
  },
  {
    id: 'reference',
    route: '/reference',
    title: 'Reference',
    kicker: 'Reference',
    tagline:
      'Tables, latency numbers and real-world architectures to reach for during back-of-the-envelope estimates in a system design interview.',
  },
  {
    id: 'about',
    route: '/about',
    title: 'About',
    kicker: 'About',
    tagline:
      'Who wrote the System Design Primer, who built this reading edition, and the Creative Commons licence that covers the content in both.',
  },
];

// Declared here so the fidelity check can tell a chosen removal from an
// accidental one. Drop an anchor and the section comes back.
const OMITTED_SECTIONS = [
  'anki-flashcards',
  'contributing',
  'under-development',
  'contact-info',
];

// Fenced code is skipped so a `#` inside a block is never read as a heading.
function dropSubsection(md, heading) {
  const lines = md.split('\n');
  const out = [];
  const removed = [];
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
        removed.push(line);
        continue;
      }
    }
    if (removingAt === null) out.push(line);
    else removed.push(line);
  }
  omittedChunks.push(removed.join('\n'));
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Hand-written rather than clipped from the opening paragraph, which left
// several pages looking like near duplicates. Metadata only.
const DESCRIPTIONS = {
  '/hld/case-studies/pastebin':
    'Design Pastebin.com or Bit.ly: use cases, constraints, back-of-the-envelope estimates, API design, data model, and how to scale the read-heavy path.',
  '/hld/case-studies/twitter':
    'Design the Twitter timeline and search: fan-out on write versus read, the tweet and user graph data model, feed generation, and scaling to millions of users.',
  '/hld/case-studies/web-crawler':
    'Design a web crawler: crawl scheduling, duplicate URL detection, politeness and rate limiting, link extraction, and distributing the crawl across workers.',
  '/hld/case-studies/mint':
    'Design Mint.com: connecting bank accounts, categorising transactions, the budget data model, and running recurring extracts without hammering upstream APIs.',
  '/hld/case-studies/social-graph':
    'Design a social network graph: model friendships, find the shortest path between people, and shard a graph that will not fit on one machine.',
  '/hld/case-studies/query-cache':
    'Design a key-value store for a search engine: cache eviction with an LRU, sizing the cache, handling misses, and keeping cached queries fresh.',
  '/hld/case-studies/sales-rank':
    "Design Amazon's sales ranking by category: aggregating sales events with MapReduce, choosing the ranking window, and serving ranks with low latency.",
  '/hld/case-studies/scaling-aws':
    'Design a system that scales to millions of users on AWS: moving from a single box through vertical scaling, read replicas, caching, autoscaling and a CDN.',

  '/getting-started/motivation':
    'System design for beginners: why learn system design, what interviews test, how this guide is organised, and what to study first.',
  '/getting-started/index-of-system-design-topics':
    'A beginner-friendly index of system design topics: scalability, databases, caching, queues, availability, consistency and the trade-offs behind each.',
  '/getting-started/study-guide':
    'System design study guide for beginners: what to review in a short, medium or long interview preparation plan using the System Design Primer.',
  '/getting-started/how-to-approach-a-system-design-interview-question':
    'A four step method for system design interviews: outline use cases and constraints, sketch a high level design, dive into components, then scale the design.',
  '/hld/start-here':
    'High level system design starts here: learn architecture fundamentals, trade-offs, scalability patterns, and the HLD building blocks used in interviews.',
  '/hld/latency-vs-throughput':
    'Latency is the time to perform an action; throughput is how many actions complete per unit of time. Why you aim for maximal throughput at acceptable latency.',
  '/hld/security':
    'Security basics for the system design interview: encrypt in transit and at rest, sanitise user input against XSS and SQL injection, and apply least privilege.',
  '/reference/powers-of-two-table':
    'Powers of two from 2^7 to 2^40 with exact and approximate values in bytes, the table to reach for during back-of-the-envelope capacity estimates.',
  '/reference/real-world-architectures':
    'How real systems are actually built: engineering write-ups on the architectures behind large scale products, and what to take from each.',
  '/reference/company-architectures':
    'Published architectures from Amazon, Netflix, Twitter, Uber, Pinterest and others, worth reading before an interview with any of them.',
  '/reference/company-engineering-blogs':
    'Engineering blogs from the companies you are interviewing with, the best source of current, real world design decisions and their trade-offs.',
  '/about/credits':
    'Sources and further reading behind this guide, including Hired in Tech, Cracking the Coding Interview, and the High Scalability archives.',

  '/hld/availability-vs-consistency':
    'The CAP theorem for system design interviews: a distributed system can only guarantee two of consistency, availability and partition tolerance. CP versus AP.',
  '/hld/availability-patterns':
    'Two patterns keep a system available: fail-over, as active-passive or active-active, and replication, as master-slave or master-master. The trade-offs of each.',
  '/hld/domain-name-system':
    'How DNS translates a domain name such as www.example.com into an IP address: NS, MX, A and CNAME records, DNS caching, and latency or geolocation based routing.',
  '/hld/database':
    'Databases in system design: relational databases with ACID, replication, federation, sharding and denormalization, versus NoSQL key-value and document stores.',
  '/hld/case-studies':
    'Eight worked system design interview questions with discussion, diagrams and code: Pastebin, Twitter, a web crawler, Mint, a social graph and scaling on AWS.',
  '/hld/additional-interview-questions':
    'More system design interview questions with links to worked solutions: a file sync service, a search engine, a recommendation system and an ad click aggregator.',
  '/lld/interview-questions':
    'Object-oriented design interview questions with worked solutions: design a deck of cards, a parking lot, a hash map, an online chat and a circular array.',

  '/hld/performance-vs-scalability':
    'Performance versus scalability in system design: a service is scalable when performance grows in proportion to the resources added. How to tell the two apart.',
  '/hld/consistency-patterns':
    'Consistency patterns for distributed systems: weak consistency, eventual consistency and strong consistency, and the workloads each one is the right fit for.',
  '/hld/content-delivery-network':
    'How a CDN works: push versus pull content delivery networks, serving static files from locations closer to the user, TTLs, and the trade-offs of each approach.',
  '/hld/load-balancer':
    'Load balancing in system design: layer 4 versus layer 7, round robin and least connections, active-passive failover, and the trade-offs of horizontal scaling.',
  '/hld/reverse-proxy-web-server':
    'Reverse proxy servers: centralizing internal services behind one interface, SSL termination, compression and caching, and how they differ from a load balancer.',
  '/hld/application-layer':
    'The application layer in system design: separating the web tier from the platform tier, microservices, service discovery, and scaling each layer independently.',
  '/hld/cache':
    'Caching in system design: client, CDN, web server, database and application caches, cache-aside, write-through and write-behind, and eviction with an LRU.',
  '/hld/asynchronism':
    'Asynchronism in system design: message queues, task queues and back pressure, and how moving expensive work off the request path cuts user-facing latency.',
  '/hld/communication':
    'Communication in system design: HTTP, TCP versus UDP, remote procedure calls and REST, and how to choose between them when you design a service API.',
  '/lld/hash-map':
    'Low level design of a hash map: the class design behind a hash table, hashing keys into buckets, collision resolution by chaining, and runnable Python code.',
  '/lld/lru-cache':
    'Low level design of an LRU cache: a hash map paired with a doubly linked list for O(1) lookup and eviction, with the class design and runnable Python code.',
  '/lld/call-center':
    'Low level design of a call center: modelling operators, supervisors and directors, routing a call to the first free employee, and the runnable Python classes.',
  '/lld/deck-of-cards':
    'Low level design of a deck of cards: modelling cards, suits and a shuffled deck, then extending it to blackjack, with a class diagram and runnable Python.',
  '/lld/parking-lot':
    'Low level design of a parking lot: modelling vehicles, spot sizes and levels, assigning and freeing spots, with the class design and runnable Python code.',
  '/lld/online-chat':
    'Low level design of an online chat service: modelling users, friend lists, private and group conversations, and adding messages, with runnable Python classes.',
  '/reference/latency-numbers-every-programmer-should-know':
    'Latency numbers every programmer should know: L1 and L2 cache reads, a main memory reference, an SSD read, a disk seek, and a round trip across the Atlantic.',
  '/about/license':
    'The open source licence covering the System Design Primer: Creative Commons Attribution 4.0 for the text, and what you may do with the code and the diagrams.',
};

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

  rm('system-design-topics-start-here', 'hld', 'Fundamentals', 'start-here'),
  rm('performance-vs-scalability', 'hld', 'Fundamentals', 'performance-vs-scalability'),
  rm('latency-vs-throughput', 'hld', 'Fundamentals', 'latency-vs-throughput'),
  rm('availability-vs-consistency', 'hld', 'Fundamentals', 'availability-vs-consistency'),
  rm('consistency-patterns', 'hld', 'Fundamentals', 'consistency-patterns'),
  rm('availability-patterns', 'hld', 'Fundamentals', 'availability-patterns'),

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

  rm('object-oriented-design-interview-questions-with-solutions', 'lld', 'Overview', 'interview-questions'),
  ood('hash_table', 'hash_map.ipynb', 'lld', 'Solutions', 'hash-map', 'Design a hash map'),
  ood('lru_cache', 'lru_cache.ipynb', 'lld', 'Solutions', 'lru-cache', 'Design a least recently used cache'),
  ood('call_center', 'call_center.ipynb', 'lld', 'Solutions', 'call-center', 'Design a call center'),
  ood('deck_of_cards', 'deck_of_cards.ipynb', 'lld', 'Solutions', 'deck-of-cards', 'Design a deck of cards'),
  ood('parking_lot', 'parking_lot.ipynb', 'lld', 'Solutions', 'parking-lot', 'Design a parking lot'),
  ood('online_chat', 'online_chat.ipynb', 'lld', 'Solutions', 'online-chat', 'Design a chat server'),

  ax('powers-of-two-table', 'reference', 'Estimation', 'powers-of-two-table'),
  ax('latency-numbers-every-programmer-should-know', 'reference', 'Estimation', 'latency-numbers-every-programmer-should-know'),
  ax('real-world-architectures', 'reference', 'In the wild', 'real-world-architectures'),
  ax('company-architectures', 'reference', 'In the wild', 'company-architectures'),
  ax('company-engineering-blogs', 'reference', 'In the wild', 'company-engineering-blogs'),

  rm('credits', 'about', 'Project', 'credits'),
  rm('license', 'about', 'Project', 'license', 'License / Ownership'),
];


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
    ...(DESCRIPTIONS[route] ? { description: DESCRIPTIONS[route] } : {}),
    source,
    sourceAnchor: entry.anchor || null,
    body,
    headings: headings(body)
      .filter((h) => h.level === 2 || h.level === 3)
      .map((h) => ({ ...h, id: slugify(h.text) })),
  };
}

const pages = PAGES.map(buildPage);

const sectionLead = { reference: appendixSections.lead };

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
anchors.appendix = anchors.appendix || '/reference';
for (const s of SECTIONS) anchors[s.id] = anchors[s.id] || s.route;

const topAnchors = {};
for (const page of pages) topAnchors[page.route] = page.topAnchor;
topAnchors['/reference'] = 'appendix';

const files = {};
for (const [i, entry] of PAGES.entries()) {
  if (entry.kind === 'solution') files[`solutions/system_design/${entry.dir}/README.md`] = pages[i].route;
  if (entry.kind === 'notebook')
    files[`solutions/object_oriented_design/${entry.dir}/${entry.file}`] = pages[i].route;
}


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

// <lastmod> is only worth sending if it is true, so a page's date moves only
// when its content hash does. The ledger is committed so the dates survive a
// fresh checkout on the build machine.
const LEDGER = path.join(WEB, 'content-dates.json');
const knownDates = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};
const TODAY = new Date().toISOString().slice(0, 10);
const ledger = {};

function stamp(key, ...parts) {
  const hash = crypto.createHash('sha256').update(parts.join('\u0000')).digest('hex').slice(0, 16);
  const previous = knownDates[key];
  ledger[key] = previous && previous.hash === hash ? previous : { hash, lastModified: TODAY };
  return ledger[key].lastModified;
}

const newest = (...dates) => dates.sort().at(-1);

for (const page of pages) {
  page.lastModified = stamp(page.route, page.title, page.description, page.lede, page.body);
}

const sectionDates = Object.fromEntries(
  SECTIONS.map((section) => {
    const own = stamp(section.route, section.title, section.tagline, sectionLead[section.id] || '');
    const children = pages.filter((page) => page.section === section.id).map((page) => page.lastModified);
    return [section.route, newest(own, ...children)];
  }),
);

const homeDate = newest(
  stamp('/', readmeLead.title, readmeLead.body),
  ...Object.values(sectionDates),
);

fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n', 'utf8');

const manifest = {
  generatedFrom: 'README.md + solutions/**',
  home: { title: readmeLead.title },
  dates: { '/': homeDate, ...sectionDates },
  sections: SECTIONS.map((s) => ({ ...s, lead: sectionLead[s.id] || '' })),
  pages: pages.map(({ body, ...rest }) => rest),
  anchors,
  topAnchors,
  files,
};
for (const anchor of OMITTED_SECTIONS) {
  const section = readmeSections.get(anchor);
  if (!section) throw new Error(`OMITTED_SECTIONS names a section that does not exist: ${anchor}`);
  omittedChunks.push(section.md);
}
fs.writeFileSync(path.join(OUT, 'omitted.json'), JSON.stringify(omittedChunks, null, 2), 'utf8');

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

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

// Pull anything referenced but not committed, so the site never hotlinks.
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
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

const sizes = {};
for (const name of fs.readdirSync(IMG_OUT)) {
  const file = path.join(IMG_OUT, name);
  if (!fs.statSync(file).isFile()) continue;
  const size = imageSize(file);
  if (size) sizes[name] = size;
}
const RENDITION_WIDTHS = [640, 1024, 1536];

// Encoding all of these takes the better part of a minute, and `npm run dev`
// waits on it, so the result is cached against the source image's hash.
const RENDITION_CACHE = path.join(WEB, '.image-cache.json');
const cachedRenditions = fs.existsSync(RENDITION_CACHE)
  ? JSON.parse(fs.readFileSync(RENDITION_CACHE, 'utf8'))
  : {};
const freshRenditions = {};

// Line art on flat colour is where a lossy encoder loses to PNG, so both
// modes are tried and the smaller wins. A rendition is kept only if it beats
// the PNG: a matching <source> always wins over the <img>.
async function renditions(name, size) {
  const source = path.join(IMG_OUT, name);
  const buffer = fs.readFileSync(source);
  const original = buffer.length;
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16);
  const stem = name.replace(/\.[^.]+$/, '');

  const previous = cachedRenditions[name];
  if (
    previous?.hash === hash &&
    previous.renditions.every((r) => fs.existsSync(path.join(IMG_OUT, r.file)))
  ) {
    freshRenditions[name] = previous;
    return previous.renditions;
  }
  const widths = [...new Set(RENDITION_WIDTHS.filter((w) => w < size.width).concat(size.width))].sort(
    (a, b) => a - b,
  );

  const kept = [];
  for (const width of widths) {
    const file = `${stem}-${width}.webp`;
    const target = path.join(IMG_OUT, file);
    const resized = () => sharp(source).resize({ width, withoutEnlargement: true });
    const [lossy, lossless] = await Promise.all([
      resized().webp({ quality: 82, effort: 5 }).toBuffer(),
      resized().webp({ lossless: true, effort: 5 }).toBuffer(),
    ]);
    const best = lossless.length < lossy.length ? lossless : lossy;
    if (best.length >= original) {
      fs.rmSync(target, { force: true });
      continue;
    }
    fs.writeFileSync(target, best);
    kept.push({ width, file });
  }
  freshRenditions[name] = { hash, renditions: kept };
  return kept;
}

for (const [name, size] of Object.entries(sizes)) {
  size.renditions = await renditions(name, size);
}
fs.writeFileSync(RENDITION_CACHE, JSON.stringify(freshRenditions, null, 2) + '\n', 'utf8');

fs.writeFileSync(path.join(OUT, 'image-sizes.json'), JSON.stringify(sizes, null, 2), 'utf8');

const pngBytes = Object.keys(sizes).reduce((a, n) => a + fs.statSync(path.join(IMG_OUT, n)).size, 0);
const webpBytes = Object.values(sizes)
  .flatMap((s) => s.renditions)
  .reduce((a, r) => a + fs.statSync(path.join(IMG_OUT, r.file)).size, 0);
const widest = Object.values(sizes).filter((s) => s.renditions.length);
console.log(
  `images: ${Object.keys(sizes).length} PNG (${(pngBytes / 1e6).toFixed(1)} MB) -> ` +
    `${Object.values(sizes).flatMap((s) => s.renditions).length} WebP renditions ` +
    `(${(webpBytes / 1e6).toFixed(1)} MB) across ${widest.length} images`,
);

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
