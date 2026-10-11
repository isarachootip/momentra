'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WorkspaceHeader } from '@/components/layout/workspace-header';
import { NavigationBar } from '@/components/layout/navigation-bar';
import { SysAdminBanner } from '@/components/layout/sysadmin-banner';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // 1. Auth Pages: completely clean layout without headers
  if (pathname === '/login' || pathname === '/register') {
    return <main>{children}</main>;
  }

  // 2. Determine if current page is internal management or public showcase
  const isInternalApp =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/hub') ||
    pathname.startsWith('/timeline') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/date-picker') ||
    pathname.startsWith('/faq');

  // 3. Public Showcase route (e.g. /drmum): render clean view with SysAdmin Banner if applicable
  if (!isInternalApp) {
    const pageUsername = pathname.replace(/^\//, '').split('/')[0] || '';
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100">
        <SysAdminBanner pageUsername={pageUsername} />
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </div>
    );
  }

  // 4. Internal Workspace and Admin pages: render standard Workspace Header & Navigation
  return (
    <>
      <WorkspaceHeader />
      <NavigationBar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
