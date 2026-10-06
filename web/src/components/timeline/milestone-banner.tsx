'use client';

import React from 'react';
import type { Milestone } from '@/types';
import { Flag } from 'lucide-react';

interface MilestoneBannerProps {
  milestones: Milestone[];
}

export function MilestoneBanner({ milestones }: MilestoneBannerProps) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="flex items-center gap-2 mb-2 text-rose-950 font-semibold text-sm">
        <Flag className="h-4 w-4 text-rose-700" />
        <span>หมุดหมายสำคัญในประวัติศาสตร์ (Key Milestones)</span>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm border border-rose-100 text-xs"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: m.color || '#E11D48' }}
            />
            <span className="font-semibold text-slate-800">{m.title}</span>
            {m.description && (
              <span className="text-slate-500 text-[11px] truncate max-w-[200px]">
                ({m.description})
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
