'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'สืบค้นจดหมายเหตุ คลังข้อมูล หรือบุคคลสำคัญ เช่น "2475", "ปรีดี", "สะพานพุทธ"...',
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-24 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-900/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-14 flex items-center pr-2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={onSearch}
        className="absolute inset-y-1.5 right-1.5 rounded-xl bg-rose-900 px-4 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors"
      >
        ค้นหา
      </button>
    </div>
  );
}
