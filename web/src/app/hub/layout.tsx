'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Link2, BookOpen, CreditCard, ExternalLink, Sparkles } from 'lucide-react';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [username, setUsername] = useState<string>('drmum');

  useEffect(() => {
    // Read cached username or profile
    const saved = localStorage.getItem('momentra_hub_username');
    if (saved) setUsername(saved);
  }, []);

  const tabs = [
    { href: '/hub/profile', label: 'แก้ไขโปรไฟล์', icon: User },
    { href: '/hub/links', label: 'ลิงก์โซเชียล', icon: Link2 },
    { href: '/hub/km', label: 'คลังความรู้ (KM)', icon: BookOpen },
    { href: '/hub/billing', label: 'แพ็กเกจ & โควตา', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
              <Sparkles className="h-3 w-3" /> Personal Hub Studio
            </span>
            <span className="text-xs text-slate-500 font-mono">@{username}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            ระบบจัดการหน้าโปรไฟล์และคลังความรู้
          </h1>
          <p className="text-xs text-slate-600">
            บริหารช่องทางโซเชียล เรียบเรียงผลงานบน Timeline และจัดการแพ็กเกจสมาชิก
          </p>
        </div>

        <Link
          href={`/${username}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <span>ดูหน้าโปรไฟล์สาธารณะ</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Studio Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-rose-900 text-rose-900'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Studio Body */}
      <div>{children}</div>
    </div>
  );
}
