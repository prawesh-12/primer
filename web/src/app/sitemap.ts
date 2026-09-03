import type { MetadataRoute } from 'next';

import { allPages, allSections } from '@/lib/content';
import { absolute } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: absolute('/'), lastModified: now, changeFrequency: 'weekly' as const, priority: 1 },
    ...allSections().map((section) => ({
      url: `${absolute(section.route)}/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...allPages().map((page) => ({
      url: `${absolute(page.route)}/`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: page.section === 'hld' || page.section === 'lld' ? 0.8 : 0.6,
    })),
  ];
}
