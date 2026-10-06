'use client';

import React from 'react';
import type { CalendarStandard, TimelineGranularity } from '@/types';
import { ZoomIn, Calendar, Layers } from 'lucide-react';

interface TimelineControlsProps {
  granularity: TimelineGranularity;
  calendar: CalendarStandard;
  onGranularityChange: (g: TimelineGranularity) => void;
  onCalendarChange: (c: CalendarStandard) => void;
  onQuickJump: (range: { from: string; to: string }) => void;
}

export function TimelineControls({
  granularity,
  calendar,
  onGranularityChange,
  onCalendarChange,
  onQuickJump,
}: TimelineControlsProps) {
  const granularities: { id: TimelineGranularity; label: string }[] = [
    { id: 'decade', label: 'ทศวรรษ' },
    { id: 'year', label: 'รายปี' },
    { id: 'month', label: 'รายเดือน' },
    { id: 'day', label: 'รายวัน' },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      {/* 1. Zoom Granularity */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> มาตราส่วน:
        </span>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          {granularities.map((g) => (
            <button
              key={g.id}
              onClick={() => onGranularityChange(g.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                granularity === g.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Quick Jump Historical Eras */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400">ช่วงสำคัญ:</span>
        <button
          onClick={() =>
            onQuickJump({ from: '1930-01-01T00:00:00Z', to: '1940-12-31T23:59:59Z' })
          }
          className="rounded-md bg-rose-50 px-2.5 py-1 font-medium text-rose-800 hover:bg-rose-100"
        >
          2475 (เปลี่ยนแปลงการปกครอง)
        </button>
        <button
          onClick={() =>
            onQuickJump({ from: '1995-01-01T00:00:00Z', to: '2005-12-31T23:59:59Z' })
          }
          className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200"
        >
          2540 (ยุคดิจิทัล & BTS)
        </button>
      </div>

      {/* 3. Calendar Preference Toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> ปฏิทิน:
        </span>
        <div className="flex rounded-lg bg-slate-100 p-0.5">
          <button
            onClick={() => onCalendarChange('be')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              calendar === 'be'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            พ.ศ.
          </button>
          <button
            onClick={() => onCalendarChange('ce')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              calendar === 'ce'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ค.ศ.
          </button>
        </div>
      </div>
    </div>
  );
}
