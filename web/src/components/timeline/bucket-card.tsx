'use client';

import React from 'react';
import type { TimelineBucket, TimelineItem } from '@/types';
import { Image, Link2, FileText, CalendarCheck, Clock } from 'lucide-react';

interface BucketCardProps {
  bucket: TimelineBucket;
  onItemClick: (item: TimelineItem) => void;
}

export function BucketCard({ bucket, onItemClick }: BucketCardProps) {
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

  return (
    <div className="relative pl-6 pb-8 border-l-2 border-slate-200 last:border-l-0">
      {/* Timeline Node Pip */}
      <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-rose-900 shadow-sm" />

      {/* Bucket Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="text-base font-bold text-slate-900">{bucket.display_label}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {bucket.count} รายการ
        </span>
      </div>

      {/* Items in Bucket */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bucket.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-rose-400 hover:shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <div className="flex items-center gap-1.5">
                {getItemIcon(item.type)}
                <span className="capitalize font-medium">{item.type}</span>
              </div>
              {item.is_circa && (
                <span className="rounded-sm bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  ประมาณการ
                </span>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-900 group-hover:text-rose-900 line-clamp-2">
              {item.title}
            </h4>

            {item.description && (
              <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.display_date_be || item.event_start}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
