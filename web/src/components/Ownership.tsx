import { BookOpenIcon, CheckIcon, CodeIcon, ExternalLinkIcon } from 'lucide-react';

import { BUILDER, LICENSE, REPO, UPSTREAM } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const link = 'text-link hover:text-link-hover underline underline-offset-4 transition-colors';

const PERMISSIONS = [
  'Share it: copy and redistribute in any medium or format',
  'Adapt it: remix, transform and build on it, for any purpose',
  'Use it commercially, with no additional permission needed',
];

export default function Ownership() {
  return (
    <section aria-labelledby="ownership" className="mt-16">
      <div className="flex items-center gap-3">
        <h2 id="ownership" className="font-heading text-2xl font-bold tracking-tight">
          Ownership
        </h2>
        <Separator className="flex-1" />
      </div>

      <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-(color:--text-2)">
        Two different things are being credited on this page. The writing belongs to one person, and
        the website around it was built by another.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="outline" className="gap-1.5">
              <BookOpenIcon className="size-3" />
              The content
            </Badge>
            <CardTitle className="mt-2 text-base">Donne Martin</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <p>
              Every chapter, diagram and code sample on this site is the work of{' '}
              <a href={UPSTREAM} target="_blank" rel="noopener noreferrer" className={link}>
                Donne Martin
                <ExternalLinkIcon className="ml-0.5 inline size-3 align-baseline" />
              </a>
              , taken from <em>The System Design Primer</em> and reproduced unchanged. A build-time
              check fails if a single line of it is dropped or altered.
            </p>
            <p>
              Copyright stays with him, and the text is published under the licence quoted above.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="outline" className="gap-1.5">
              <CodeIcon className="size-3" />
              This web edition
            </Badge>
            <CardTitle className="mt-2 text-base">prawesh-12</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
            <p>
              The site you are reading was built by{' '}
              <a href={BUILDER} target="_blank" rel="noopener noreferrer" className={link}>
                prawesh-12
                <ExternalLinkIcon className="ml-0.5 inline size-3 align-baseline" />
              </a>
              : the split into High Level and Low Level Design tracks, the navigation, the search and
              the visual design. Its source lives at{' '}
              <a href={REPO} target="_blank" rel="noopener noreferrer" className={link}>
                prawesh-12/primer
              </a>
              .
            </p>
            <p>
              One kind of writing here is original: the{' '}
              <span className="text-foreground font-medium">Notes for this edition</span> at the foot
              of each chapter, which cover how the topic tends to be examined in an interview. They
              are marked as such wherever they appear, and they are kept out of the primer&rsquo;s own
              text on purpose.
            </p>
            <p className="text-foreground font-medium">
              No ownership of the primer&rsquo;s content is claimed here. Nothing above those notes on
              any page is original to this edition.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/40 mt-4 rounded-xl border p-5">
        <p className="text-sm font-semibold">
          What {LICENSE.name} lets you do with the content
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {PERMISSIONS.map((permission) => (
            <li key={permission} className="text-muted-foreground flex gap-2 text-sm leading-snug">
              <CheckIcon className="text-foreground mt-0.5 size-4 shrink-0" />
              <span>{permission}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-4 text-sm">
          The one condition is attribution: credit {LICENSE.holder}, link to{' '}
          <a href={LICENSE.url} target="_blank" rel="noopener noreferrer" className={link}>
            the licence
          </a>
          , and say whether you changed anything. Full terms are on the{' '}
          <a href={LICENSE.url} target="_blank" rel="noopener noreferrer" className={link}>
            Creative Commons site
          </a>
          .
        </p>
      </div>
    </section>
  );
}
