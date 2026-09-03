'use client';

import { useEffect, useRef, useState } from 'react';

import type { Heading } from '@/lib/content';
import { cn } from '@/lib/utils';

/** The right-hand "on this page" rail, tracking the reader's position. */
export default function Toc({ headings }: { headings: Heading[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string | null>(null);

  // Which heading is the reader currently under?
  useEffect(() => {
    if (headings.length < 2) return;
    const ids = headings.map((heading) => heading.id);

    const update = () => {
      const elements = ids
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => Boolean(element));
      if (!elements.length) return;

      // The offset clears the sticky header, so a heading counts as "current"
      // once it reaches the top of the readable area rather than the viewport.
      const offset = 96;
      let current = elements[0].id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top - offset > 0) break;
        current = element.id;
      }

      // The last section can never win on height alone; at the bottom of the
      // page it should always be the active one.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? elements[elements.length - 1].id : current);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [headings]);

  // Keep the active entry in view *within the rail*, never by moving the page.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !active) return;
    const link = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;

    const railBox = nav.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    if (linkBox.top < railBox.top) {
      nav.scrollTop += linkBox.top - railBox.top - 12;
    } else if (linkBox.bottom > railBox.bottom) {
      nav.scrollTop += linkBox.bottom - railBox.bottom + 12;
    }
  }, [active]);

  if (headings.length < 2) return null;

  return (
    // A flex column, so the list gets whatever height is left over rather than
    // a height hand-matched to the label above it.
    <aside className="sticky top-(--header-height) hidden h-[calc(100svh-var(--header-height))] w-56 shrink-0 flex-col py-10 xl:flex">
      <p className="text-muted-foreground mb-4 shrink-0 text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
        On this page
      </p>

      {/* min-h-0 is what actually lets a flex child scroll instead of growing. */}
      <nav
        ref={navRef}
        aria-label="On this page"
        className="toc-scroll min-h-0 flex-1 scroll-smooth overflow-y-auto pr-3"
      >
        <ul className="border-l">
          {headings.map((heading) => {
            const isActive = active === heading.id;
            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  aria-current={isActive ? 'location' : undefined}
                  className={cn(
                    '-ml-px block border-l py-1.5 leading-snug transition-colors',
                    isActive
                      ? 'border-l-foreground text-foreground font-medium'
                      : 'hover:border-l-foreground/40 hover:text-foreground border-transparent',
                    !isActive &&
                      (heading.level <= 2
                        ? 'text-[0.8125rem] font-medium text-(color:--text-2)'
                        : 'text-muted-foreground text-[0.78rem]'),
                    isActive && (heading.level <= 2 ? 'text-[0.8125rem]' : 'text-[0.78rem]'),
                  )}
                  style={{ paddingLeft: `${0.85 + Math.max(0, heading.level - 2) * 0.75}rem` }}
                >
                  {heading.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
