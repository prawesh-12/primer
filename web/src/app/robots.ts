import type { MetadataRoute } from 'next';

import { SITE_URL, absolute } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // `/robots.txt` is the longer, and so the winning, match against
        // the `*.txt` rule below, which excludes Next's RSC payloads.
        allow: ['/', '/robots.txt'],
        disallow: ['/*.txt$', '/search-index.json'],
      },
    ],
    sitemap: absolute('/sitemap.xml'),
    host: new URL(SITE_URL).origin,
  };
}
