'use client';

import React from 'react';
import type { DatePrecision } from '@/types';
import type { DatePickerProps, HistoricalDateValue } from './date-picker.types';
import { THAI_MONTHS, beToCe, ceToBe, formatPreview, validateRange } from './calendar-sync';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export function HistoricalDatePicker({ value, onChange, className }: DatePickerProps) {
  const precisionTabs: { id: DatePrecision; label: string }[] = [
    { id: 'year', label: 'ระบุเฉพาะปี' },
    { id: 'month', label: 'ระบุเดือน-ปี' },
    { id: 'day', label: 'ระบุวัน-เดือน-ปี' },
    { id: 'datetime', label: 'ระบุวันเวลา' },
  ];

  const handleBeChange = (be: number, isEnd = false) => {
    const ce = beToCe(be);
    if (isEnd) {
      onChange({ ...value, endBeYear: be, endCeYear: ce });
    } else {
      onChange({ ...value, startBeYear: be, startCeYear: ce });
    }
  };

  const handleCeChange = (ce: number, isEnd = false) => {
    const be = ceToBe(ce);
    if (isEnd) {
      onChange({ ...value, endBeYear: be, endCeYear: ce });
    } else {
      onChange({ ...value, startBeYear: be, startCeYear: ce });
    }
  };

  const validation = validateRange(value);

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className || ''}`}>
      {/* 1. Precision Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
        {precisionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange({ ...value, precision: tab.id })}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
              value.precision === tab.id
                ? 'bg-rose-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Options: Range & Circa */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.isRange}
            onChange={(e) => onChange({ ...value, isRange: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-rose-900 focus:ring-rose-800"
          />
          <span className="font-medium">เป็นช่วงเวลา (Date Range)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.isCirca}
            onChange={(e) => onChange({ ...value, isCirca: e.target.checked })}
            className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs">
            ประมาณการ (Circa)
          </span>
        </label>
      </div>

      {/* 3. Date Input Fields */}
      <div className="mt-4 space-y-4">
        {/* Start Date */}
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500">
            {value.isRange ? 'วันเริ่มต้น' : 'วันที่เกิดเหตุการณ์'}
          </span>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">ปี พ.ศ.</label>
              <input
                type="number"
                value={value.startBeYear}
                onChange={(e) => handleBeChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5">ปี ค.ศ. (Sync)</label>
              <input
                type="number"
                value={value.startCeYear}
                onChange={(e) => handleCeChange(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:border-rose-800 focus:outline-none"
              />
            </div>

            {(value.precision === 'month' || value.precision === 'day' || value.precision === 'datetime') && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">เดือน</label>
                <select
                  value={value.startMonth ?? 1}
                  onChange={(e) => onChange({ ...value, startMonth: parseInt(e.target.value, 10) })}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
                >
                  {THAI_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(value.precision === 'day' || value.precision === 'datetime') && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">วันที่</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={value.startDay ?? 1}
                  onChange={(e) => onChange({ ...value, startDay: parseInt(e.target.value, 10) || 1 })}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* End Date (if isRange) */}
        {value.isRange && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold uppercase text-slate-500">วันสิ้นสุด</span>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">ปี พ.ศ. สิ้นสุด</label>
                <input
                  type="number"
                  value={value.endBeYear ?? value.startBeYear}
                  onChange={(e) => handleBeChange(parseInt(e.target.value, 10) || 0, true)}
                  className="w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:border-rose-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">ปี ค.ศ. (Sync)</label>
                <input
                  type="number"
                  value={value.endCeYear ?? value.startCeYear}
                  onChange={(e) => handleCeChange(parseInt(e.target.value, 10) || 0, true)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Preview Chip & Validation */}
      <div className="mt-5 rounded-lg bg-slate-50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-800">
          <Calendar className="h-4 w-4 text-rose-800" />
          <span className="font-medium">{formatPreview(value)}</span>
        </div>
        {!validation.isValid && (
          <div className="flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{validation.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
