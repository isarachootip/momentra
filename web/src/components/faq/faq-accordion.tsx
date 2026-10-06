'use client';

import React, { useState } from 'react';
import type { FaqItem } from './faq-data';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all shadow-xs"
          >
            <button
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/80"
            >
              <div className="flex items-center gap-3 pr-4">
                <HelpCircle className="h-5 w-5 shrink-0 text-rose-800" />
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {item.question}
                </span>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-rose-900' : ''
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/60 p-5 pt-4 text-xs sm:text-sm text-slate-700 leading-relaxed animate-in fade-in">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
