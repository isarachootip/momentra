'use client';

import React from 'react';
import Link from 'next/link';
import { isSysAdmin, getCurrentUser } from '@/lib/user-store';
import { ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface SysAdminBannerProps {
  pageUsername: string;
}

export function SysAdminBanner({ pageUsername }: SysAdminBannerProps) {
  const currentUser = getCurrentUser();
  const showBanner = isSysAdmin() && pageUsername.toLowerCase() !== currentUser.username.toLowerCase();

  if (!showBanner) return null;

  return (
    <aside
      aria-label="SysAdmin Inspection Mode"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-slate-950 px-4 py-2 text-xs text-amber-200 border-b border-amber-500/30 shadow-md backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-300">
          <ShieldCheck className="h-3.5 w-3.5" />
        </span>
        <span>
          โหมดตรวจการ SysAdmin: กำลังดูเพจสมาชิก <strong>@{pageUsername}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/admin/users?search=${encodeURIComponent(pageUsername)}`}
          className="inline-flex items-center gap-1 font-semibold text-white hover:text-amber-300 transition-colors"
        >
          <span>จัดการผู้ใช้นี้</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 font-bold text-amber-300 transition-colors border border-amber-500/40"
        >
          <span>กลับสู่ SysAdmin Portal</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}
