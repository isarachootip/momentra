'use client';

import React from 'react';
import type { SearchResultItem } from '@/types';
import { Image, Link2, FileText, CalendarCheck, Clock, Sparkles } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResultItem[];
  totalHits: number;
  isLoading: boolean;
}

export function SearchResults({ results, totalHits, isLoading }: SearchResultsProps) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <Image className="h-4 w-4 text-emerald-600" />;
      case 'link':
        return <Link2 className="h-4 w-4 text-sky-600" />;
      case 'note':
        return <FileText className="h-4 w-4 text-amber-600" />;
      default:
        return <CalendarCheck className="h-4 w-4 text-rose-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
        <h4 className="text-sm font-semibold text-slate-700">ไม่พบผลการค้นหาที่ตรงกับเงื่อนไข</h4>
        <p className="mt-1 text-xs text-slate-500">
          ลองใช้คำค้นหาที่กว้างขึ้น เช่น "2475", "สยาม", หรือยกเลิกตัวกรองประเภทข้อมูล
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>พบ {totalHits} ผลลัพธ์</span>
        <span className="flex items-center gap-1 text-rose-900 font-medium">
          <Sparkles className="h-3 w-3" /> เรียงตามความเกี่ยวข้องและลำดับเหตุการณ์
        </span>
      </div>

      <div className="space-y-3">
        {results.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-rose-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-2">
                {getItemIcon(item.type)}
                <span className="capitalize font-semibold text-slate-700">{item.type}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-medium text-rose-900">
                  <Clock className="h-3 w-3" />
                  {item.display_date_be}
                </span>
                {item.display_date_ce && (
                  <span className="text-slate-400 text-[11px]">({item.display_date_ce})</span>
                )}
              </div>
              {item.is_circa && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  ประมาณการ
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-900 leading-snug">
              {item.title}
            </h3>

            {item.description && (
              <p
                className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3"
                dangerouslySetInnerHTML={{
                  __html: item.headline_description || item.description,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
