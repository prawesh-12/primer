import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';

import { allPages, allSections, pagesInSection, renderHomeLead } from '@/lib/content';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: `${SITE_NAME}: High Level & Low Level System Design`,
  description:
    'Learn how to design large-scale systems and prep for the system design interview. The System Design Primer, restructured into High Level Design (HLD) and Low Level Design (LLD) tracks with worked solutions.',
  alternates: { canonical: '/' },
};

const TRACK_BLURB: Record<string, string[]> = {
  hld: [
    'Trade-offs: performance, latency, availability, consistency',
    'Building blocks: DNS, CDN, load balancers, databases, caches, queues',
    'Eight worked case studies, end to end',
  ],
  lld: [
    'Object-oriented design questions asked at the whiteboard',
    'Classes, relationships and runnable Python for each',
    'Six worked solutions from the primer notebooks',
  ],
};

export default async function Home() {
  const cover = await renderHomeLead();
  const sections = allSections();
  const tracks = sections.filter((section) => section.id === 'hld' || section.id === 'lld');
  const rest = sections.filter((section) => section.id !== 'hld' && section.id !== 'lld');
  const caseStudies = allPages().filter((page) => page.route.startsWith('/hld/case-studies/'));

  const stats = [
    { value: allPages().length, label: 'chapters' },
    { value: pagesInSection('hld').length, label: 'HLD pages' },
    { value: pagesInSection('lld').length, label: 'LLD pages' },
    { value: caseStudies.length, label: 'worked case studies' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
      <section className="max-w-3xl">
        <Badge variant="secondary">Open source · CC BY 4.0</Badge>
        <h1 className="font-heading mt-5 text-[2.75rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-6xl">
          Learn how to design large-scale systems.
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-pretty text-(color:--text-2)">
          {SITE_TAGLINE} The original primer, restructured into two clearly separated tracks,
          High Level Design and Low Level Design, so you always know where you are and what comes
          next.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href="/hld">
              Start with High Level Design <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/lld">Go to Low Level Design</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/getting-started/study-guide">Study guide</Link>
          </Button>
        </div>
      </section>

      <dl className="bg-border mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card px-5 py-6">
            <dt className="font-heading text-3xl font-bold tabular-nums">{stat.value}</dt>
            <dd className="text-muted-foreground mt-1 text-xs tracking-wide uppercase">{stat.label}</dd>
          </div>
        ))}
      </dl>

      {cover && (
        <div
          // The primer's cover diagram is enormous; keep it from owning the fold.
          className="prose mt-16 max-w-none [&_img]:mx-auto [&_img]:max-h-[30rem] [&_img]:w-auto"
          dangerouslySetInnerHTML={{ __html: cover }}
        />
      )}

      <div className="mt-20 grid gap-5 md:grid-cols-2">
        {tracks.map((section) => (
          <Card key={section.id} className="flex flex-col">
            <CardHeader>
              <Badge variant="outline" className="font-mono">
                {section.kicker}
              </Badge>
              <CardTitle className="font-heading mt-3 text-2xl font-bold tracking-tight">{section.title}</CardTitle>
              <CardDescription className="text-pretty">{section.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {TRACK_BLURB[section.id].map((line) => (
                  <li key={line} className="text-muted-foreground flex gap-2 text-sm">
                    <CheckIcon className="text-foreground mt-0.5 size-4 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" size="sm">
                <Link href={section.route}>
                  Open {section.kicker} <ArrowRightIcon />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {rest.map((section) => (
        <section key={section.id} className="mt-20">
          <div className="flex items-center gap-3">
            <h2 className="font-heading relative pl-4 text-2xl font-bold tracking-tight before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground/25">
              {section.title}
            </h2>
            <Separator className="flex-1" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagesInSection(section.id).map((page) => (
              <Card
                key={page.route}
                className="hover:ring-foreground/25 relative gap-3 py-5 transition-shadow"
              >
                <CardHeader className="px-5">
                  <Badge variant="ghost" className="text-muted-foreground -ml-2 px-2 text-[0.7rem]">
                    {page.group}
                  </Badge>
                  <CardTitle className="mt-1 text-[0.95rem] font-semibold">
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
