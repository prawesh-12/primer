import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ExternalLinkIcon } from 'lucide-react';

import Breadcrumb, { type Crumb } from '@/components/Breadcrumb';
import InterviewNotes from '@/components/InterviewNotes';
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
import { COMMENTARY, COMMENTARY_ANCHOR, commentaryFor } from '@/lib/commentary';
import { BUILDER, LICENSE, SITE_KEYWORDS, SITE_NAME, SITE_OG_IMAGE, UPSTREAM, absolute } from '@/lib/site';
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

const SECTION_SEO: Record<string, { title: string; keywords: string[] }> = {
  'getting-started': {
    title: 'System Design for Beginners',
    keywords: ['system design for beginners', 'system design primer', 'system design study guide'],
  },
  hld: {
    title: 'High Level System Design (HLD)',
    keywords: ['high level system design', 'high level design', 'HLD system design'],
  },
  lld: {
    title: 'Low Level Design (LLD)',
    keywords: ['low level design', 'LLD', 'object oriented design interview'],
  },
  reference: {
    title: 'System Design Reference',
    keywords: ['system design reference', 'latency numbers', 'back of the envelope estimates'],
  },
  about: {
    title: 'About the System Design Primer',
    keywords: ['system design primer license', 'system design primer credits'],
  },
};

/**
 * Search results cut a title off around 60 characters, and the brand suffix
 * costs 23 of them.  A page whose own heading is longer than that gets a
 * shorter title here; `solo` drops the suffix instead, for the handful of
 * headings that are themselves the phrase people search for.
 */
const PAGE_SEO_TITLE: Record<string, { title: string; solo?: boolean }> = {
  '/getting-started/how-to-approach-a-system-design-interview-question': {
    title: 'System Design Interview Approach',
  },
  '/hld/case-studies': { title: 'System Design Interview Questions' },
  '/hld/case-studies/query-cache': { title: 'Design a Query Cache' },
  '/hld/case-studies/scaling-aws': { title: 'Design a System That Scales on AWS' },
  '/hld/case-studies/social-graph': { title: 'Design a Social Network Graph' },
  '/hld/case-studies/sales-rank': { title: 'Design Amazon Sales Rank' },
  '/hld/case-studies/twitter': { title: 'Design Twitter Timeline and Search' },
  '/hld/additional-interview-questions': { title: 'More System Design Questions' },
  '/lld/interview-questions': { title: 'Object-Oriented Design Questions' },
  '/reference/latency-numbers-every-programmer-should-know': {
    title: 'Latency Numbers Every Programmer Should Know',
    solo: true,
  },
};

const BEGINNER_ROADMAP = [
  {
    title: 'Start with the study guide',
    href: '/getting-started/study-guide',
    description: 'Choose a short, medium or long study plan based on how much interview prep time you have.',
  },
  {
    title: 'Learn the interview framework',
    href: '/getting-started/how-to-approach-a-system-design-interview-question',
    description: 'Practice requirements, constraints, high level design, component deep dives and scaling trade-offs.',
  },
  {
    title: 'Review system design topics',
    href: '/getting-started/index-of-system-design-topics',
    description: 'Scan the major building blocks: scalability, availability, consistency, databases, caches and queues.',
  },
  {
    title: 'Move into HLD fundamentals',
    href: '/hld/start-here',
    description: 'Continue with high level system design patterns before working through full interview case studies.',
  },
];

const BEGINNER_FAQ = [
  {
    question: 'Where should a beginner start in the System Design Primer?',
    answer:
      'Begin with the study guide, then read the system design interview approach, then move into high level design fundamentals.',
  },
  {
    question: 'Do I need low level design before high level design?',
    answer:
      'No. Most learners should start with high level system design, then use low level design practice for object-oriented interview rounds.',
  },
];

// Commentary is keyed by route, and routes move.  Checking at module scope
// means a rename fails the build rather than silently dropping a page's notes
// or leaving a "where to next" link pointing at nothing.
{
  const routes = new Set(allPages().map((page) => page.route));
  const missing = Object.keys(COMMENTARY).filter((route) => !routes.has(route));
  const dangling = Object.entries(COMMENTARY).flatMap(([route, entry]) =>
    (entry.related ?? []).filter((link) => !routes.has(link.route)).map((link) => `${route} -> ${link.route}`),
  );
  if (missing.length) throw new Error(`commentary for routes that no longer exist: ${missing.join(', ')}`);
  if (dangling.length) throw new Error(`commentary links to routes that do not exist: ${dangling.join(', ')}`);
}

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
const OG_IMAGE = SITE_OG_IMAGE;

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
    const seo = SECTION_SEO[section.id];
    const title = seo?.title ?? section.title;
    const keywords = unique([...(seo?.keywords ?? []), ...SITE_KEYWORDS]);
    return {
      title,
      description: section.tagline,
      alternates: { canonical: `${section.route}/` },
      keywords,
      openGraph: {
        type: 'website',
        siteName: SITE_NAME,
        locale: 'en_US',
        title: `${title} · ${SITE_NAME}`,
        description: section.tagline,
        url: `${absolute(section.route)}/`,
        images: [OG_IMAGE],
      },
      twitter: { card: 'summary_large_image', title, description: section.tagline, images: [OG_IMAGE.url] },
    };
  }

  const { page } = found;
  const section = sectionById(page.section);
  const heading = HEADING_OVERRIDE[page.route] ?? page.title;
  const override = PAGE_SEO_TITLE[page.route];
  const seoTitle = override?.title ?? heading;
  return {
    title: override?.solo ? { absolute: seoTitle } : seoTitle,
    description: page.description,
    alternates: { canonical: `${page.route}/` },
    keywords: unique([page.title, page.navTitle, page.group, section?.title ?? '', ...SITE_KEYWORDS]),
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_US',
      title: `${seoTitle} · ${SITE_NAME}`,
      description: page.description,
      url: `${absolute(page.route)}/`,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: seoTitle, description: page.description, images: [OG_IMAGE.url] },
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
    const sectionPages = groups.flatMap((group) => group.pages);
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
    const sectionJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${absolute(section.route)}/#collection`,
          url: `${absolute(section.route)}/`,
          name: SECTION_SEO[section.id]?.title ?? section.title,
          description: section.tagline,
          inLanguage: 'en',
          isPartOf: { '@id': `${absolute('/')}#website` },
          about:
            section.id === 'getting-started'
              ? [
                  { '@type': 'Thing', name: 'system design for beginners' },
                  { '@type': 'Thing', name: 'system design interview preparation' },
                ]
              : undefined,
          mainEntity: {
            '@type': 'ItemList',
            name: `${section.title} chapters`,
            itemListElement: sectionPages.map((page, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: page.navTitle,
              description: page.description,
              url: `${absolute(page.route)}/`,
            })),
          },
        },
        ...(section.id === 'getting-started'
          ? [
              {
                '@type': 'FAQPage',
                '@id': `${absolute(section.route)}/#faq`,
                mainEntity: BEGINNER_FAQ.map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
              },
            ]
          : []),
      ],
    };

    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 lg:px-8 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([sectionJsonLd, breadcrumbJsonLd(crumbs)]) }}
        />
        <Breadcrumb items={crumbs.slice(0, -1)} />

        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-[2.75rem]">
          {section.title}
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-pretty text-(color:--text-2)">
          {section.tagline}
        </p>
        {lead && <div className="prose mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: lead }} />}

        {section.id === 'getting-started' && (
          <>
            <section className="mt-12" aria-labelledby="beginner-roadmap-title">
              <h2 id="beginner-roadmap-title" className="font-heading text-2xl font-bold tracking-tight">
                Beginner roadmap
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {BEGINNER_ROADMAP.map((item, index) => (
                  <Card key={item.href} className="relative gap-3 py-5">
                    <CardHeader className="px-5">
                      <Badge variant="outline" className="w-fit font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </Badge>
                      <CardTitle className="mt-2 text-[0.95rem] font-semibold">
                        <Link href={item.href} className="after:absolute after:inset-0">
                          {item.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5">
                      <p className="text-muted-foreground text-sm leading-6">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="mt-12" aria-labelledby="beginner-faq-title">
              <h2 id="beginner-faq-title" className="font-heading text-2xl font-bold tracking-tight">
                Beginner FAQ
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {BEGINNER_FAQ.map((item) => (
                  <Card key={item.question} className="py-5">
                    <CardHeader className="px-5">
                      <CardTitle className="text-base font-semibold leading-6">{item.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5">
                      <p className="text-muted-foreground text-sm leading-6">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}

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
  const commentary = commentaryFor(page.route);
  const headings = commentary
    ? [...page.headings, { level: 2, text: commentary.heading, id: COMMENTARY_ANCHOR }]
    : page.headings;
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
    keywords: unique([page.title, page.navTitle, page.group, section.title, ...SITE_KEYWORDS]).join(', '),
    about: [
      { '@type': 'Thing', name: section.title },
      { '@type': 'Thing', name: page.group },
      { '@type': 'Thing', name: 'system design interview preparation' },
    ],
    license: LICENSE.url,
    datePublished: page.lastModified,
    dateModified: page.lastModified,
    author: { '@type': 'Person', name: LICENSE.holder, url: UPSTREAM },
    // The chapter is his; the interview notes under it are not.  Saying so is
    // both more accurate and the honest version of the attribution.
    ...(commentaryFor(page.route) ? { contributor: { '@type': 'Person', name: 'prawesh-12', url: BUILDER } } : {}),
    publisher: { '@id': `${absolute('/')}#organization` },
    articleSection: section.title,
    isPartOf: { '@id': `${absolute('/')}#learning-resource` },
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

        {commentary && <InterviewNotes commentary={commentary} />}

        {page.route === '/about/license' && <Ownership />}

        <Pager previous={previous} next={next} />
      </article>

      <Toc headings={headings} />
    </div>
  );
}
