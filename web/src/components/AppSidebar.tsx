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

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nav.map((section) => [section.id, section.id === activeSection])),
  );

  useEffect(() => {
    if (!activeSection) return;
    setOpen((current) =>
      current[activeSection] ? current : { ...current, [activeSection]: true },
    );
  }, [activeSection]);

  return (
    <Sidebar
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
                          'h-9 gap-2 transition-colors duration-150',
                          'data-active:bg-sidebar-active data-active:font-semibold data-active:text-sidebar-active-foreground data-active:shadow-xs data-active:ring-1 data-active:ring-sidebar-active-foreground',
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
                            // The base sets top via a peer variant, which outranks
                            // a plain `top-*`; the override needs the same variant.
                            'peer-data-[size=default]/menu-button:top-2 right-2',
                            'text-sidebar-foreground/70 hover:text-sidebar-foreground',
                            // Or the chevron disappears into the active tile's fill.
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
                            <div className="flex items-center gap-2 px-2 pb-1">
                              <span className="text-sidebar-foreground/45 text-[0.65rem] font-semibold tracking-[0.1em] uppercase">
                                {group.name}
                              </span>
                              <span className="bg-sidebar-border h-px flex-1" />
                              <span className="bg-sidebar-foreground/10 text-sidebar-foreground/75 flex h-4 min-w-4 items-center justify-center rounded-sm px-1 text-[0.65rem] font-semibold tabular-nums">
                                {group.pages.length}
                              </span>
                            </div>

                            <SidebarMenuSub className="border-sidebar-border/80 mx-2 gap-1">
                              {group.pages.map((page) => (
                                <SidebarMenuSubItem
                                  key={page.route}
                                  className={cn(
                                    'group/thread relative',
                                    'after:bg-sidebar-border after:absolute after:top-1/2 after:-left-[10px] after:h-px after:w-[7px] after:transition-colors',
                                    'hover:after:bg-sidebar-foreground/40',
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
