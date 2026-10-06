'use client';

import React from 'react';
import { SearchInterface } from '@/components/search/search-interface';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-rose-900 mb-1">
          <Search className="h-5 w-5" />
          <h1 className="text-xl font-bold text-slate-900">สืบค้นจดหมายเหตุ (Archival Search)</h1>
        </div>
        <p className="text-xs text-slate-500">
          ค้นหาข้อมูลภาษาไทยและภาษาอังกฤษด้วยระบบตัดคำ ICU, ขยายคำพ้องประวัติศาสตร์, และระบบตัวกรองมิติข้อมูล (Facets)
        </p>
      </div>

      <SearchInterface />
    </div>
  );
}
