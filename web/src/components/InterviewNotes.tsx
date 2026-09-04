import Link from 'next/link';
import { ArrowRightIcon, PencilLineIcon } from 'lucide-react';

import { COMMENTARY_ANCHOR, type Commentary } from '@/lib/commentary';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * The one block on a chapter page that is not the primer's writing.
 *
 * It is deliberately marked as such — a badge, a rule above it, and a
 * different type treatment from the prose — because the rest of the page is
 * reproduced verbatim under CC BY and a reader has to be able to tell the two
 * apart at a glance.
 */
export default function InterviewNotes({ commentary }: { commentary: Commentary }) {
  return (
    <section aria-labelledby={COMMENTARY_ANCHOR} className="mt-16">
      <Separator className="mb-8" />

      <Badge variant="outline" className="gap-1.5">
        <PencilLineIcon className="size-3" />
        Notes for this edition
      </Badge>

      <h2
        id={COMMENTARY_ANCHOR}
        className="font-heading mt-3 scroll-mt-24 text-2xl font-bold tracking-tight text-balance"
      >
        {commentary.heading}
      </h2>

      {commentary.body.map((paragraph) => (
        <p key={paragraph} className="mt-4 max-w-[62ch] text-base leading-relaxed text-(color:--text-2)">
          {paragraph}
        </p>
      ))}

      <dl className="mt-7 space-y-4">
        {commentary.points.map((point) => (
          <div key={point.term} className="border-border border-l-2 pl-4">
            <dt className="text-[0.95rem] font-semibold">{point.term}</dt>
            <dd className="text-muted-foreground mt-1 max-w-[62ch] text-sm leading-relaxed">
              {point.detail}
            </dd>
          </div>
        ))}
      </dl>

      {commentary.related && commentary.related.length > 0 && (
        <div className="mt-8">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Where to next</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {commentary.related.map((item) => (
              <li key={item.route}>
                <Link
                  href={item.route}
                  className="hover:bg-muted hover:text-foreground text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                >
                  {item.label}
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
