# The System Design Primer — web edition

A Next.js reading edition of [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer).

The markdown in this repository stays the single source of truth. Nothing here rewrites it: a build step
*splits* the one very long `README.md` (plus the `solutions/` folders and notebooks) into one page per topic,
files those pages under a **High Level Design** and a **Low Level Design** track, and repoints every link that
used to jump around a single document.

## What the restructure did

| Section | Route | Comes from |
|---|---|---|
| Getting Started | `/getting-started` | Motivation, index of topics, study guide, how to approach an interview, flashcards |
| **High Level Design** | `/hld` | Fundamentals · building blocks · eight worked case studies |
| **Low Level Design** | `/lld` | The object-oriented design questions and their notebooks |
| Reference | `/reference` | The README's Appendix — powers of two, latency numbers, real-world architectures |
| About | `/about` | Contributing, under development, credits, contact, license |

`npm run verify` proves the split is lossless: every non-blank line of the sources must still appear,
unchanged, in exactly one published page. Heading levels are the only thing allowed to move, since a section
that becomes a page has to be re-levelled, and the README's "Appendix" is shown as "Reference" so the sidebar
entry says something.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # prerenders every page to ./out
npm run verify   # content fidelity check
```

`npm run content` alone regenerates `content/` from the markdown: it re-splits the sources, refreshes
`public/images`, downloads any diagram the solutions host remotely, and writes the search index.

## Deploying

Every page is prerendered to static HTML (`output: 'export'`), so any static host will do and crawlers never
need to run JavaScript.

Set `NEXT_PUBLIC_SITE_URL` to wherever the site lives. If that URL has a path — a GitHub Pages project site,
say — the `basePath` follows automatically:

```bash
NEXT_PUBLIC_SITE_URL=https://prawesh-12.github.io/system-design-primer npm run build   # -> /system-design-primer
NEXT_PUBLIC_SITE_URL=https://example.com npm run build                                  # -> /
```

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `master`. Enable it under
**Settings → Pages → Source → GitHub Actions**.

### Getting indexed

The build already emits what Google asks for: a `sitemap.xml` listing all 54 URLs, a `robots.txt` pointing at
it, per-page `<title>`/meta description/canonical, Open Graph and Twitter cards, and JSON-LD (`WebSite`,
`TechArticle`, `BreadcrumbList`) on every page. After the first deploy, add the property in
[Google Search Console](https://search.google.com/search-console), verify it, and submit
`https://<your-domain>/sitemap.xml`.

## Layout

```
scripts/generate-content.mjs   splits the sources into content/**.md + manifest.json
scripts/verify-fidelity.mjs    proves no line was dropped or invented
src/lib/markdown.ts            remark/rehype pipeline; rewrites every original link to its new home
src/lib/content.ts             loads the manifest, builds nav and reading order
src/app/[...slug]/page.tsx     renders both section hubs and content pages
```

## Credit

All prose, diagrams and code are Donne Martin's, published under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This edition only rearranges them.
