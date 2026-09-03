'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

/**
 * The way back in once the sidebar is gone.  It sits just under the header —
 * level with the toggle inside the sidebar — rather than in the header itself.
 */
export default function SidebarToggle() {
  const { state, isMobile } = useSidebar();
  if (!isMobile && state !== 'collapsed') return null;

  return (
    <SidebarTrigger className="bg-background fixed top-[calc(var(--header-height)+0.375rem)] left-2 z-40 border shadow-xs" />
  );
}
