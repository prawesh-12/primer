# System Design Primer, web edition

A statically generated reading edition of
[The System Design Primer](https://github.com/donnemartin/system-design-primer),
split into **High Level Design** and **Low Level Design** tracks.

**[systemdesignprimer.vercel.app](https://systemdesignprimer.vercel.app/)**

The primer is one very long README. This repo turns it into 44 browsable pages
with a sidebar, search, per-page contents and dark mode. The text itself is
never rewritten: `npm run verify` fails if a single line was dropped or invented.

No copy of the primer's text is kept here. The build pulls it from upstream into
a gitignored `.upstream/` cache, so this repo holds only the code around it.

## Getting started

```bash
cd web
npm install
npm run dev
```

Other commands, all from `web/`:

```bash
npm run build    # static export to web/out
npm run content  # regenerate web/content from the upstream primer and solutions/
npm run verify   # check the published text against the sources
```

The first run needs network access. After that `.upstream/` is reused — delete
it to pull a fresh copy.

## Layout

```
solutions/   upstream worked solutions and notebooks
images/      diagrams referenced by the content
web/         the Next.js site
  scripts/   content generation and the fidelity check
  src/       app router pages and components
```

Built with Next.js, React, TypeScript, Tailwind CSS and shadcn/ui.

See [LICENSE.txt](LICENSE.txt).
