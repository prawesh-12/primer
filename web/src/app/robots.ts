import type { MetadataRoute } from 'next';

import { SITE_URL, absolute } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/robots.txt` is listed explicitly because it is the longer, and so
        // the winning, match against the `*.txt` rule below.
        allow: ['/', '/robots.txt'],
        // Next writes an RSC payload beside every page for client-side
        // navigation.  They are machine-readable duplicates of pages that are
        // already indexed, so keep crawl budget on the HTML.  The search index
        // is the same content again, as one 100 KB JSON blob.
        disallow: ['/*.txt$', '/search-index.json'],
      },
    ],
    sitemap: absolute('/sitemap.xml'),
    host: new URL(SITE_URL).origin,
  };
}
