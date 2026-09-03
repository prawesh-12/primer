import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ExternalLinkIcon } from 'lucide-react';

import Breadcrumb, { type Crumb } from '@/components/Breadcrumb';
import Pager from '@/components/Pager';
import Ownership from '@/components/Ownership';
import Toc from '@/components/Toc';
import {
  allPages,
  allSections,
  groupsInSection,
  neighbours,
  pageByRoute,
  imageSizes,
  renderPage,
  sectionById,
} from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';
import { manifest } from '@/lib/content';
import { LICENSE, SITE_NAME, UPSTREAM, absolute } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Headings shown to the reader that differ from the frontmatter title.  The
 * title itself has to stay verbatim — verify-fidelity.mjs counts it as one of
 * the published lines — so the display name is overridden here instead.
 */
const HEADING_OVERRIDE: Record<string, string> = {
  '/about/license': 'License / Ownership',
};

interface Params {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return [
    ...allSections().map((section) => ({ slug: section.route.slice(1).split('/') })),
    ...allPages().map((page) => ({ slug: page.route.slice(1).split('/') })),
  ];
}

function resolve(slug: string[]) {
  const route = `/${slug.join('/')}`;
  const section = allSections().find((candidate) => candidate.route === route);
  if (section) return { kind: 'section' as const, section };
  const page = pageByRoute(route);
  if (page) return { kind: 'page' as const, page };
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const found = resolve((await params).slug);
  if (!found) return {};

  if (found.kind === 'section') {
    const { section } = found;
    return {
      title: section.title,
      description: section.tagline,
      alternates: { canonical: `${section.route}/` },
      openGraph: {
        type: 'website',
        title: `${section.title} · ${SITE_NAME}`,
        description: section.tagline,
        url: `${absolute(section.route)}/`,
      },
    };
  }

  const { page } = found;
  const section = sectionById(page.section);
  const heading = HEADING_OVERRIDE[page.route] ?? page.title;
  return {
    title: heading,
    description: page.description,
    alternates: { canonical: `${page.route}/` },
    keywords: [page.title, page.navTitle, section?.title ?? '', 'system design'].filter(Boolean),
    openGraph: {
      type: 'article',
      title: `${heading} · ${SITE_NAME}`,
      description: page.description,
      url: `${absolute(page.route)}/`,
    },
    twitter: { card: 'summary_large_image', title: heading, description: page.description },
  };
}

function breadcrumbJsonLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${absolute(item.href)}${item.href === '/' ? '' : '/'}` } : {}),
    })),
  };
}

export default async function CatchAll({ params }: Params) {
  const found = resolve((await params).slug);
  if (!found) notFound();

  /* ------------------------------------------------------- section hub */
  if (found.kind === 'section') {
    const { section } = found;
    const groups = groupsInSection(section.id);
    const crumbs: Crumb[] = [{ label: 'Home', href: '/' }, { label: section.title }];
    const lead = section.lead
      ? await renderMarkdown(section.lead, {
          route: section.route,
          anchors: manifest().anchors,
          topAnchors: manifest().topAnchors,
          files: manifest().files,
          ownAnchors: new Set<string>(),
          imageSizes: imageSizes(),
        })
      : '';

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
        />
        <Breadcrumb items={crumbs.slice(0, -1)} />

        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-[2.75rem]">
          {section.title}
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-pretty text-(color:--text-2)">
          {section.tagline}
        </p>
        {lead && <div className="prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: lead }} />}

        {groups.map((group) => (
          <section key={group.name} className="mt-16">
            <div className="flex items-center gap-3">
              <h2 className="font-heading relative pl-4 text-2xl font-bold tracking-tight before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground/25">
                {group.name}
              </h2>
              <Separator className="flex-1" />
              <Badge variant="ghost" className="text-muted-foreground tabular-nums">
                {group.pages.length}
              </Badge>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {group.pages.map((page) => (
                <Card
                  key={page.route}
                  className="hover:ring-foreground/25 relative gap-3 py-5 transition-shadow"
                >
                  <CardHeader className="px-5">
                    <CardTitle className="text-[0.95rem] font-semibold">
                      {/* Stretched so the whole card is the hit target. */}
                      <Link href={page.route} className="after:absolute after:inset-0">
                        {page.navTitle}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
                    <p className="text-muted-foreground line-clamp-3 text-sm">{page.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  /* ------------------------------------------------------- content page */
  const { page } = found;
  const section = sectionById(page.section)!;
  const heading = HEADING_OVERRIDE[page.route] ?? page.title;
  const html = await renderPage(page);
  const { previous, next } = neighbours(page.route);
  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    { label: section.title, href: section.route },
    { label: page.group },
    { label: heading },
  ];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: heading,
    description: page.description,
    url: `${absolute(page.route)}/`,
    inLanguage: 'en',
    isAccessibleForFree: true,
    license: LICENSE.url,
    author: { '@type': 'Person', name: LICENSE.holder, url: UPSTREAM },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: absolute('/') },
    articleSection: section.title,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${absolute(page.route)}/` },
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 lg:px-8">
      <article className="w-full min-w-0 max-w-3xl py-12 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([articleJsonLd, breadcrumbJsonLd(crumbs)]) }}
        />
        <Breadcrumb items={crumbs.slice(0, -1)} />

        <h1
          id={page.topAnchor}
          className="font-heading scroll-mt-24 text-4xl font-bold tracking-tight text-balance sm:text-[2.75rem]"
        >
          {heading}
        </h1>
        {page.lede && (
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-pretty text-(color:--text-2)">
            {page.lede}
          </p>
        )}

        <p className="text-muted-foreground mt-5 text-xs">
          Source:{' '}
          <a
            href={`${UPSTREAM}/blob/master/${page.source}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:text-link-hover inline-flex items-center gap-1 underline underline-offset-4 transition-colors"
          >
            {page.source}
            <ExternalLinkIcon className="size-3" />
          </a>
        </p>

        <Separator className="mt-8 mb-10" />

        <div
          className={cn('prose', page.route === '/about/license' && 'prose-quoted')}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {page.route === '/about/license' && <Ownership />}

        <Pager previous={previous} next={next} />
      </article>

      <Toc headings={page.headings} />
    </div>
  );
}
