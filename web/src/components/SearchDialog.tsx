'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { CommandDialog } from '@/components/ui/command';
import { asset } from '@/lib/site';

export interface SearchDoc {
  route: string;
  title: string;
  navTitle: string;
  section: string;
  group: string;
  description: string;
  text: string;
}

interface Result extends SearchDoc {
  score: number;
  snippet: string;
}

let cached: SearchDoc[] | null = null;

function score(doc: SearchDoc, terms: string[]) {
  const title = `${doc.title} ${doc.navTitle}`.toLowerCase();
  const body = doc.text.toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (title.includes(term)) total += title.startsWith(term) ? 12 : 8;
    if (doc.description.toLowerCase().includes(term)) total += 3;
    const hits = body.split(term).length - 1;
    if (hits) total += Math.min(4, 1 + Math.log2(hits));
    else if (!title.includes(term)) return 0;
  }
  return total;
}

function snippetFor(doc: SearchDoc, term: string) {
  const index = doc.text.toLowerCase().indexOf(term);
  if (index < 0) return doc.description;
  const start = Math.max(0, index - 60);
  return `${start ? '…' : ''}${doc.text.slice(start, start + 170).trim()}…`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<SearchDoc[]>(cached ?? []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || cached) return;
    fetch(asset('/search-index.json'))
      .then((response) => response.json())
      .then((data: SearchDoc[]) => {
        cached = data;
        setDocs(data);
      })
      .catch(() => setDocs([]));
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return docs
      .map((doc) => ({ ...doc, score: score(doc, terms), snippet: snippetFor(doc, terms[0]) }))
      .filter((doc) => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [docs, query]);

  const go = (route: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(route);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search the primer"
      description="Find a topic, pattern or case study across every chapter."
      className="sm:max-w-2xl"
    >
      {/* Scoring is ours — full-text, not fuzzy over labels — so cmdk must not filter. */}
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search topics, patterns, case studies…"
        />
        <CommandList className="max-h-[60vh]">
          {query ? (
            <CommandEmpty>No matches for “{query}”.</CommandEmpty>
          ) : (
            <CommandEmpty>Type to search all {docs.length || 48} chapters.</CommandEmpty>
          )}
          {results.length > 0 && (
            <CommandGroup heading="Chapters">
              {results.map((result) => (
                <CommandItem
                  key={result.route}
                  value={result.route}
                  onSelect={() => go(result.route)}
                  className="cursor-pointer flex-col items-start gap-0.5 py-2 [&>svg:last-child]:hidden"
                >
                  <span className="text-muted-foreground text-[0.7rem] tracking-wide uppercase">
                    {result.section} · {result.group}
                  </span>
                  <span className="font-medium">{result.title}</span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">{result.snippet}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
