'use client';

import React from 'react';
import { TimelineCanvas } from '@/components/timeline/timeline-canvas';
import { Clock } from 'lucide-react';

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-rose-900 mb-1">
          <Clock className="h-5 w-5" />
          <h1 className="text-xl font-bold text-slate-900">ผังเวลาประวัติศาสตร์ (Historical Timeline)</h1>
        </div>
        <p className="text-xs text-slate-500">
          แสดงลำดับเหตุการณ์ ภาพถ่าย บันทึก และลิงก์อ้างอิงตามวันเวลาเกิดจริง รองรับการปรับเปลี่ยนมาตราส่วนการซูม
        </p>
      </div>

      <TimelineCanvas />
    </div>
  );
}
