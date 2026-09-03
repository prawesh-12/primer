#!/usr/bin/env node
/**
 * Prove the restructure is lossless: every non-blank line of the original
 * markdown must still appear, unchanged, in exactly one generated page.
 * Heading markers are the one thing allowed to differ, since a section that
 * becomes a page has to be re-levelled.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const WEB = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ROOT = path.dirname(WEB);
const CONTENT = path.join(WEB, 'content');

const strip = (line) => line.replace(/^#{1,6}\s+/, '').trimEnd();
const meaningful = (line) => line.trim().length > 0;

function linesOf(md) {
  return md.split('\n').map(strip).filter(meaningful);
}

// ---- what the sources contain --------------------------------------------

// The primer text lives only in the upstream repo; generate-content.mjs caches
// it here, so verify reads whatever that last pulled.
const CACHED_README = path.join(ROOT, '.upstream', 'README.md');
if (!fs.existsSync(CACHED_README)) {
  console.error('missing .upstream/README.md - run `npm run content` first.');
  process.exit(1);
}
const sources = [CACHED_README];
for (const dir of fs.readdirSync(path.join(ROOT, 'solutions', 'system_design'))) {
  const file = path.join(ROOT, 'solutions', 'system_design', dir, 'README.md');
  if (fs.existsSync(file)) sources.push(file);
}

const expected = new Map();
for (const file of sources) {
  for (const line of linesOf(fs.readFileSync(file, 'utf8'))) {
    expected.set(line, (expected.get(line) || 0) + 1);
  }
}

// Notebook cells, flattened the same way the generator flattens them.
for (const dir of fs.readdirSync(path.join(ROOT, 'solutions', 'object_oriented_design'))) {
  const folder = path.join(ROOT, 'solutions', 'object_oriented_design', dir);
  if (!fs.statSync(folder).isDirectory()) continue;
  for (const file of fs.readdirSync(folder).filter((name) => name.endsWith('.ipynb'))) {
    const nb = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));
    for (const cell of nb.cells || []) {
      const chunks = [(cell.source || []).join('')];
      for (const out of cell.outputs || []) {
        const data = out.data || {};
        if (data['text/plain']) chunks.push([].concat(data['text/plain']).join(''));
        else if (out.output_type === 'stream') chunks.push([].concat(out.text || []).join(''));
      }
      for (const chunk of chunks) {
        for (const line of linesOf(chunk)) expected.set(line, (expected.get(line) || 0) + 1);
      }
    }
  }
}

// ---- what the site contains ----------------------------------------------

const produced = new Map();
const walk = (dir) => {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.md')) {
      const parsed = matter(fs.readFileSync(full, 'utf8'));
      const bump = (line) => produced.set(line, (produced.get(line) || 0) + 1);
      // A page's title is rendered as its <h1>; it lives in the frontmatter.
      if (parsed.data.title) bump(strip(String(parsed.data.title)));
      for (const line of linesOf(parsed.content)) bump(line);
    }
  }
};
walk(CONTENT);

// Section hubs render their lead straight out of the manifest.
const { sections } = JSON.parse(fs.readFileSync(path.join(CONTENT, 'manifest.json'), 'utf8'));
for (const section of sections) {
  for (const line of linesOf(section.lead || '')) produced.set(line, (produced.get(line) || 0) + 1);
}

/**
 * One heading is deliberately re-labelled: the README's "Appendix" is the
 * site's "Reference" section, because a sidebar entry called Appendix tells a
 * reader nothing.  Its text is published unchanged underneath.
 */
const RELABELLED = new Set(['Appendix']);

// ---- compare --------------------------------------------------------------

const dropped = [];
for (const [line, count] of expected) {
  const have = produced.get(line) || 0;
  if (have < count && !RELABELLED.has(line)) dropped.push({ line, expected: count, produced: have });
}

// Fence markers the notebook flattening introduces around code and output.
const SCAFFOLD = new Set(['```python', '```text', '```']);

const added = [];
for (const [line, count] of produced) {
  if (!expected.has(line) && !SCAFFOLD.has(line)) added.push({ line, count });
}

console.log(`source lines:    ${expected.size} distinct`);
console.log(`published lines: ${produced.size} distinct`);
console.log(`dropped:         ${dropped.length}`);
console.log(`invented:        ${added.length}`);
console.log(`relabelled:      ${[...RELABELLED].join(', ')}`);

for (const item of dropped.slice(0, 25)) console.log(`  - ${JSON.stringify(item.line).slice(0, 140)}`);
for (const item of added.slice(0, 25)) console.log(`  + ${JSON.stringify(item.line).slice(0, 140)}`);

process.exit(dropped.length || added.length ? 1 : 0);
