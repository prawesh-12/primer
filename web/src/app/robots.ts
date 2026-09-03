import type { MetadataRoute } from 'next';

import { SITE_URL, absolute } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absolute('/sitemap.xml'),
    host: new URL(SITE_URL).origin,
  };
}
