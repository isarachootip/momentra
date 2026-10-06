'use client';

import React from 'react';
import type { ItemType, SearchFacets } from '@/types';
import { Filter, RotateCcw } from 'lucide-react';

interface FacetSidebarProps {
  facets: SearchFacets;
  selectedType?: ItemType;
  fromYear?: number;
  toYear?: number;
  circaOnly: boolean;
  onTypeSelect: (type?: ItemType) => void;
  onFromYearChange: (year?: number) => void;
  onToYearChange: (year?: number) => void;
  onCircaToggle: (val: boolean) => void;
  onReset: () => void;
}

export function FacetSidebar({
  facets,
  selectedType,
  fromYear,
  toYear,
  circaOnly,
  onTypeSelect,
  onFromYearChange,
  onToYearChange,
  onCircaToggle,
  onReset,
}: FacetSidebarProps) {
  const types: { id: ItemType; label: string }[] = [
    { id: 'asset', label: 'ไฟล์สินทรัพย์ (Assets)' },
    { id: 'link', label: 'ลิงก์และแหล่งอ้างอิง (Links)' },
    { id: 'note', label: 'บทความและบันทึก (Notes)' },
    { id: 'event', label: 'เหตุการณ์ (Events)' },
  ];

  const getFacetCount = (type: string) => {
    const f = facets.types.find((t) => t.key === type);
    return f ? f.count : 0;
  };

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Filter className="h-4 w-4 text-rose-900" /> ตัวกรองการสืบค้น
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-900"
        >
          <RotateCcw className="h-3 w-3" /> ล้าง
        </button>
      </div>

      {/* 1. Item Types Facet */}
      <div className="mt-4">
        <span className="text-xs font-semibold uppercase text-slate-400">ประเภทข้อมูล</span>
        <div className="mt-2 space-y-1.5">
          <button
            onClick={() => onTypeSelect(undefined)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !selectedType
                ? 'bg-rose-50 text-rose-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>ทั้งหมด</span>
          </button>
          {types.map((t) => {
            const count = getFacetCount(t.id);
            return (
              <button
                key={t.id}
                onClick={() => onTypeSelect(selectedType === t.id ? undefined : t.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-rose-50 text-rose-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{t.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Year Range Filter */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <span className="text-xs font-semibold uppercase text-slate-400">ช่วงปี (พ.ศ. / ค.ศ.)</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-slate-500 mb-0.5">ตั้งแต่ปี</label>
            <input
              type="number"
              placeholder="เช่น 2470"
              value={fromYear || ''}
              onChange={(e) => onFromYearChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-rose-900"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-0.5">ถึงปี</label>
            <input
              type="number"
              placeholder="เช่น 2485"
              value={toYear || ''}
              onChange={(e) => onToYearChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-rose-900"
            />
          </div>
        </div>
      </div>

      {/* 3. Circa Checkbox */}
      <div className="mt-6 border-t border-slate-100 pt-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
          <input
            type="checkbox"
            checked={circaOnly}
            onChange={(e) => onCircaToggle(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-rose-900 focus:ring-rose-800"
          />
          <span>เฉพาะวันที่ประมาณการ (Circa)</span>
        </label>
      </div>
    </aside>
  );
}
