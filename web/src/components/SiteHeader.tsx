'use client';

import Link from 'next/link';
import { SearchIcon } from 'lucide-react';

import ModeToggle from './ModeToggle';
import { GitHubIcon } from './Icons';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { BUILDER } from '@/lib/site';

export default function SiteHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="bg-background/80 sticky top-0 z-50 flex h-(--header-height) w-full shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md md:px-6">
      <Link href="/" className="group font-heading flex items-baseline gap-1.5 tracking-tight">
        <span className="text-base font-bold">System Design</span>
        <span className="text-muted-foreground group-hover:text-foreground text-base font-medium transition-colors">
          Primer
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onSearch}
          className="text-muted-foreground justify-start gap-2 font-normal md:w-56"
          aria-label="Search the primer"
        >
          <SearchIcon />
          <span className="hidden md:inline">Search…</span>
          <Kbd className="ml-auto hidden md:inline-flex">⌘K</Kbd>
        </Button>

        <ModeToggle />

        <Button variant="ghost" size="icon-sm" asChild>
          <a href={BUILDER} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GitHubIcon />
          </a>
        </Button>
      </div>
    </header>
  );
}
