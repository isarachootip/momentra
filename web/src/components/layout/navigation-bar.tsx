'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Search, CalendarPlus, LayoutGrid, BookOpen, UserCircle } from 'lucide-react';

export function NavigationBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'หน้าแรก (Overview)', icon: LayoutGrid },
    { href: '/timeline', label: 'ผังเวลาไทม์ไลน์ (Timeline)', icon: Clock },
    { href: '/search', label: 'ค้นหาจดหมายเหตุ (Search)', icon: Search },
    { href: '/date-picker', label: 'เครื่องมือเลือกวันเวลา (Date Picker)', icon: CalendarPlus },
    { href: '/hub/profile', label: 'จัดการ Personal Hub', icon: UserCircle },
    { href: '/faq', label: 'คู่มือ & FAQ (User Guide)', icon: BookOpen },
  ];

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 px-4 sm:px-6 lg:px-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 border-b-2 py-3.5 px-3 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-rose-900 text-rose-900'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
