'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  BoxesIcon,
  ChevronRightIcon,
  CompassIcon,
  InfoIcon,
  NetworkIcon,
  RulerIcon,
} from 'lucide-react';

import type { NavSection } from '@/lib/nav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface Props {
  nav: NavSection[];
  pathname: string;
}

/** A landmark per track, so the eye jumps between sections instead of reading. */
const SECTION_ICON: Record<string, ComponentType<{ className?: string }>> = {
  'getting-started': CompassIcon,
  hld: NetworkIcon,
  lld: BoxesIcon,
  reference: RulerIcon,
  about: InfoIcon,
};

export default function AppSidebar({ nav, pathname }: Props) {
  const activeSection = useMemo(
    () =>
      nav.find((section) => pathname === section.route || pathname.startsWith(`${section.route}/`))
        ?.id,
    [nav, pathname],
  );

  // Only the track you are in is open on arrival; the rest stay folded away so
  // the nav reads as five choices rather than fifty-three links.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nav.map((section) => [section.id, section.id === activeSection])),
  );

  // Navigating into a folded section opens it, without closing what you opened.
  useEffect(() => {
    if (!activeSection) return;
    setOpen((current) =>
      current[activeSection] ? current : { ...current, [activeSection]: true },
    );
  }, [activeSection]);

  return (
    <Sidebar
      // Hangs off the bottom of the site header rather than the viewport.
      className="top-(--header-height) bottom-0 h-[calc(100svh-var(--header-height))]"
      aria-label="Primer contents"
    >
      <SidebarHeader className="h-10 flex-row items-center justify-end py-0">
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <ScrollArea className="scroll-shadow h-full">
          <SidebarMenu className="gap-0 px-2 pb-6">
            {nav.map((section, index) => {
              const Icon = SECTION_ICON[section.id] ?? CompassIcon;
              const onHub = pathname === section.route;
              const inSection = activeSection === section.id;

              return (
                <Fragment key={section.id}>
                  {index > 0 && (
                    <li aria-hidden className="my-2">
                      <SidebarSeparator className="mx-0" />
                    </li>
                  )}
                  <Collapsible
                    open={open[section.id] ?? false}
                    onOpenChange={(next) =>
                      setOpen((current) => ({ ...current, [section.id]: next }))
                    }
                    className="group/collapsible"
                    asChild
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={onHub}
                        className={cn(
                          // one shared row box for every section
                          'h-9 gap-2 transition-colors duration-150',
                          // selected: white tile, outlined in the tile's own near-black
                          'data-active:bg-sidebar-active data-active:font-semibold data-active:text-sidebar-active-foreground data-active:shadow-xs data-active:ring-1 data-active:ring-sidebar-active-foreground',
                          // holding the active page: outlined only, no fill.  The ring
                          // has to read against the rail, so it comes off the sidebar
                          // foreground rather than the tile's.
                          inSection && !onHub && 'ring-1 ring-sidebar-foreground/30',
                        )}
                      >
                        <Link href={section.route}>
                          <Icon
                            className={cn(
                              'size-4 shrink-0 transition-colors',
                              inSection ? 'text-sidebar-foreground' : 'text-sidebar-foreground/55',
                            )}
                          />
                          <span className="font-heading text-[0.9375rem] leading-5 font-bold tracking-tight">
                            {section.title}
                          </span>
                          {/* Only the abbreviated tracks earn a chip; the rest would repeat themselves. */}
                          {section.kicker.length <= 4 && (
                            <Badge className="bg-sidebar-foreground text-sidebar h-5 shrink-0 border-transparent px-1.5 font-mono text-[0.6rem] font-semibold tracking-wider">
                              {section.kicker}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>

                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction
                          className={cn(
                            // the base sets `top-1.5 right-1` AND a peer variant that
                            // outranks a plain `top-*`, so the override has to use the
                            // same variant.  8px centres a 20px box in the 36px row,
                            // and right-2 mirrors the button's own p-2 on the left.
                            'peer-data-[size=default]/menu-button:top-2 right-2',
                            'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                            // on the white tile the chevron must flip to the tile's ink
                            // or it disappears into the fill
                            'peer-data-active/menu-button:text-sidebar-active-foreground',
                          )}
                          aria-label={`Toggle ${section.title}`}
                        >
                          <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuAction>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        {section.groups.map((group) => (
                          <div key={`${section.id}-${group.name}`} className="mt-4 mb-1">
                            {/* Group headers: tiny, tracked, ruled — unmistakably not a link. */}
                            <div className="flex items-center gap-2 px-2 pb-1">
                              <span className="text-sidebar-foreground/45 text-[0.65rem] font-semibold tracking-[0.1em] uppercase">
                                {group.name}
                              </span>
                              <span className="bg-sidebar-border h-px flex-1" />
                              {/* Same chip language as the section badge, one tier down. */}
                              <span className="bg-sidebar-foreground/10 text-sidebar-foreground/75 flex h-4 min-w-4 items-center justify-center rounded-sm px-1 text-[0.65rem] font-semibold tabular-nums">
                                {group.pages.length}
                              </span>
                            </div>

                            <SidebarMenuSub className="border-sidebar-border/80 mx-2 gap-1">
                              {group.pages.map((page) => (
                                <SidebarMenuSubItem
                                  key={page.route}
                                  // The rail lights up beside the page you are on.
                                  className={cn(
                                    // the thread: a tick joining each child to the rule on its left
                                    'group/thread relative',
                                    'after:bg-sidebar-border after:absolute after:top-1/2 after:-left-[10px] after:h-px after:w-[7px] after:transition-colors',
                                    'hover:after:bg-sidebar-foreground/40',
                                    // the active marker replaces the tick outright
                                    'before:absolute before:inset-y-1 before:-left-[11px] before:w-0.5 before:rounded-full before:bg-transparent before:transition-colors',
                                    'has-[[data-active=true]]:before:bg-sidebar-foreground has-[[data-active=true]]:after:opacity-0',
                                  )}
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={pathname === page.route}
                                    className="hover:bg-sidebar-accent/70 h-auto min-h-7 py-1.5 leading-snug whitespace-normal transition-all duration-150 hover:translate-x-0.5 data-active:font-semibold data-active:bg-sidebar-active data-active:text-sidebar-active-foreground data-active:shadow-xs data-active:ring-1 data-active:ring-foreground/8 [&>span:last-child]:whitespace-normal"
                                  >
                                    <Link
                                      href={page.route}
                                      aria-current={pathname === page.route ? 'page' : undefined}
                                    >
                                      {page.navTitle}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </Fragment>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      {/* Collapsed offcanvas leaves this strip at the screen edge to reopen with. */}
      <SidebarRail />
    </Sidebar>
  );
}
