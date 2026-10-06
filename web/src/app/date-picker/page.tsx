'use client';

import React, { useState } from 'react';
import { HistoricalDatePicker } from '@/components/date-picker/historical-date-picker';
import type { HistoricalDateValue } from '@/components/date-picker/date-picker.types';
import { CalendarPlus, Code2 } from 'lucide-react';

export default function DatePickerPlayground() {
  const [value, setValue] = useState<HistoricalDateValue>({
    precision: 'day',
    isRange: true,
    isCirca: true,
    startBeYear: 2475,
    startCeYear: 1932,
    startMonth: 6,
    startDay: 24,
    endBeYear: 2489,
    endCeYear: 1946,
    endMonth: 5,
    endDay: 9,
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-rose-900 mb-1">
          <CalendarPlus className="h-5 w-5" />
          <h1 className="text-xl font-bold text-slate-900">
            ระบบเลือกวันเวลาเชิงประวัติศาสตร์ (Historical Date Picker Demo)
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          ทดสอบความสามารถในการเลือกวันเวลาที่กำกวม (Date Precision), การคำนวณ พ.ศ. ⇄ ค.ศ. แบบสด,
          การเลือกช่วงเวลา (Date Range), และการระบุเหตุการณ์แบบประมาณการ (Circa)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Date Picker Interactive Component */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3">หน้าต่างเลือกวันเวลา (Interactive UI)</h2>
          <HistoricalDatePicker value={value} onChange={setValue} />
        </div>

        {/* Live State Payload Inspector */}
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
            <Code2 className="h-4 w-4 text-rose-900" />
            <span>โครงสร้างข้อมูลที่ส่งไปยัง Backend API (Live JSON Payload)</span>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
            <pre>{JSON.stringify(value, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
