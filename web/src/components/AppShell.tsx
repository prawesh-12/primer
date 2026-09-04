'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import AppSidebar from './AppSidebar';
import SearchDialog from './SearchDialog';
import SiteFooter from './SiteFooter';
import SidebarToggle from './SidebarToggle';
import SiteHeader from './SiteHeader';
import type { NavSection } from '@/lib/nav';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, useSidebar } from '@/components/ui/sidebar';

const normalize = (value: string) => (value !== '/' ? value.replace(/\/+$/, '') : '/');

function DismissOnNavigate({ pathname }: { pathname: string }) {
  const { setOpenMobile } = useSidebar();
  useEffect(() => setOpenMobile(false), [pathname, setOpenMobile]);
  return null;
}

export default function AppShell({ nav, children }: { nav: NavSection[]; children: ReactNode }) {
  const pathname = normalize(usePathname() || '/');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((event.target as HTMLElement)?.tagName ?? '');
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === '/' && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <SidebarProvider className="flex-col" style={{ '--sidebar-width': '17rem' } as React.CSSProperties}>
      <Button
        asChild
        size="sm"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-100"
      >
        <a href="#content">Skip to content</a>
      </Button>

      <SiteHeader onSearch={() => setSearchOpen(true)} />

      <div className="flex flex-1">
        <SidebarToggle />
        <AppSidebar nav={nav} pathname={pathname} />
        <SidebarInset id="content" className="min-w-0">
          {children}
          <SiteFooter />
        </SidebarInset>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <DismissOnNavigate pathname={pathname} />
    </SidebarProvider>
  );
}
