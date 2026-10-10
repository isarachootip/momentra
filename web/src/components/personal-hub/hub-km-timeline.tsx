'use client';

import React, { useState } from 'react';
import type { KmItem, KmCategory } from '@/types/personal-hub';
import { Search, ArrowUpDown, Calendar, ExternalLink, Sparkles, FileText, Video, Image, StickyNote, BookOpen } from 'lucide-react';

interface HubKmTimelineProps {
  items: KmItem[];
}

function getCategoryIcon(cat: KmCategory) {
  switch (cat) {
    case 'video': return <Video className="h-3.5 w-3.5 text-red-600" />;
    case 'image': return <Image className="h-3.5 w-3.5 text-blue-600" />;
    case 'document': return <FileText className="h-3.5 w-3.5 text-amber-600" />;
    case 'article': return <BookOpen className="h-3.5 w-3.5 text-emerald-600" />;
    default: return <StickyNote className="h-3.5 w-3.5 text-purple-600" />;
  }
}

export function HubKmTimeline({ items }: HubKmTimelineProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  const filtered = items.filter((item) => {
    const matchCat = selectedCat === 'all' || item.km_category === selectedCat;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || (item.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const timeA = new Date(a.event_start).getTime();
    const timeB = new Date(b.event_start).getTime();
    return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-rose-800" /> คลังความรู้และผลงานดิจิทัล (KM Timeline)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เรียงลำดับตามวันเวลาของเหตุการณ์จริงในประวัติศาสตร์ (B.E. & C.E.)
          </p>
        </div>

        {/* Sort Direction Toggle */}
        <button
          onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 self-start sm:self-auto"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>เรียง: {sortDirection === 'desc' ? 'ใหม่ ➔ เก่า' : 'เก่า ➔ ใหม่'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผลงานหรือบทความ..."
            className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-800"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['all', 'article', 'video', 'image', 'document', 'note'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                selectedCat === cat ? 'bg-rose-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : cat === 'article' ? 'บทความ' : cat === 'video' ? 'วิดีโอ' : cat === 'image' ? 'รูปภาพ' : cat === 'document' ? 'เอกสาร' : 'บันทึก'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 pt-2">
        {sorted.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">ไม่พบรายการคลังความรู้ที่ตรงกับการค้นหา</div>
        ) : (
          sorted.map((item) => {
            const dateObj = new Date(item.event_start);
            const beYear = dateObj.getUTCFullYear() + 543;
            const ceYear = dateObj.getUTCFullYear();
            return (
              <div key={item.id} className="relative group">
                {/* Timeline Node Point */}
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-rose-900 shadow-xs"></div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize shadow-2xs">
                        {getCategoryIcon(item.km_category)} {item.km_category}
                      </span>
                      {item.is_circa && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.2 text-[9px] font-bold text-amber-800">
                          ประมาณการ (Circa)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>พ.ศ. {beYear} (ค.ศ. {ceYear})</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-900 transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {item.link_url && (
                    <div className="pt-1">
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 hover:underline"
                      >
                        <span>เปิดอ่านแหล่งข้อมูลต้นฉบับ</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((t) => (
                        <span key={t} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500 font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
