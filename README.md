# System Design Primer, web edition

A navigable, statically generated reading edition of
[The System Design Primer](https://github.com/donnemartin/system-design-primer),
restructured into two tracks: **High Level Design** and **Low Level Design**.

Live site: https://prawesh-12.github.io/system-design-primer/

## What this repo is

The primer is one very long README. This repo turns it into a browsable site:
44 pages with a sidebar, full text search, per page contents, and light and
dark themes. **Not one sentence of the original text is rewritten.**

No copy of the primer's text is kept here. The build pulls it straight from
[donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)
into a gitignored `.upstream/` cache, so this repo holds only the code that
presents it.

## Credit

All content is by **Donne Martin**, published under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This repo only
provides the reading experience around it. See [LICENSE.txt](LICENSE.txt).

## Getting started

```bash
cd web
npm install
npm run dev     # regenerates content, then starts Next.js
```

Other commands, all run from `web/`:

```bash
npm run build    # static export to web/out
npm run content  # regenerate web/content from the upstream primer and solutions/
npm run verify   # check the published text against the sources
```

## Layout

```
.upstream/   primer source fetched from the main repo, gitignored
solutions/   upstream worked solutions and notebooks
images/      diagrams referenced by the content
web/         the Next.js site
  scripts/   content generation and the fidelity check
  content/   generated markdown, gitignored, never edited by hand
  src/       app router pages and components
```

## How the content pipeline works

`npm run content` fetches the primer's README from the main repo, slices it and
`solutions/` into one markdown file per page under `web/content/`, and rewrites
every internal link and anchor to its new home. `npm run verify` then compares
every non blank line of the sources against what was published, and reports
anything dropped or invented.

The first run needs network access. After that the cache in `.upstream/` is
reused; delete it to pull a fresh copy.

Pages deliberately left out of this edition are declared in
`web/scripts/generate-content.mjs`, so `verify` reports them as dropped by
design rather than by accident.

## Built with

Next.js 15 static export, React 19, TypeScript, Tailwind CSS v4 and shadcn/ui.
