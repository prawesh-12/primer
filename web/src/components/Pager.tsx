import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

import type { PageMeta } from '@/lib/content';
import { Button } from '@/components/ui/button';

export default function Pager({ previous, next }: { previous?: PageMeta; next?: PageMeta }) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Previous and next page"
      className="mt-12 grid gap-3 border-t pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Button asChild variant="outline" className="h-auto items-start justify-start gap-1 px-4 py-3">
          <Link href={previous.route} rel="prev">
            <span className="flex flex-col items-start gap-1 text-left">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <ArrowLeftIcon className="size-3" /> Previous
              </span>
              <span className="text-sm font-medium text-wrap">{previous.navTitle}</span>
            </span>
          </Link>
        </Button>
      ) : (
        <span />
      )}

      {next && (
        <Button
          asChild
          variant="outline"
          className="h-auto items-start justify-end gap-1 px-4 py-3 sm:col-start-2"
        >
          <Link href={next.route} rel="next">
            <span className="flex flex-col items-end gap-1 text-right">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                Next <ArrowRightIcon className="size-3" />
              </span>
              <span className="text-sm font-medium text-wrap">{next.navTitle}</span>
            </span>
          </Link>
        </Button>
      )}
    </nav>
  );
}
