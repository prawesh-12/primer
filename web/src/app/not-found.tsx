import Link from 'next/link';
import { CompassIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-20">
      <Empty className="w-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon />
          </EmptyMedia>
          <EmptyTitle>That page moved.</EmptyTitle>
          <EmptyDescription>
            This edition splits the original primer into separate chapters, so a few old anchors no longer
            line up. Try the two main tracks, or search with <Kbd>⌘K</Kbd>.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/hld">High Level Design</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/lld">Low Level Design</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
