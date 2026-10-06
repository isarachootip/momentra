'use client';

import React, { useState } from 'react';
import { FAQ_LIST } from '@/components/faq/faq-data';
import { FaqAccordion } from '@/components/faq/faq-accordion';
import { BookOpen, Layers, Clock, Search, ShieldCheck } from 'lucide-react';

export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All)' },
    { id: 'concept', label: 'แนวคิดหลัก (Core Concept)' },
    { id: 'dates', label: 'วันเวลาและปฏิทิน (Dates & Calendars)' },
    { id: 'search', label: 'การสืบค้น (Search)' },
    { id: 'security', label: 'ความปลอดภัยและการสำรองข้อมูล (Security & Backup)' },
  ];

  const filteredItems =
    selectedCategory === 'all'
      ? FAQ_LIST
      : FAQ_LIST.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-10">
      {/* 1. Header Banner */}
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 p-8 sm:p-10 text-white shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-500/30">
            <BookOpen className="h-3.5 w-3.5" /> คู่มือการใช้งานออนไลน์และข้อสงสัยที่พบบ่อย
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            ทำความรู้จักและใช้งาน Momentra อย่างเต็มศักยภาพ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            คู่มือแนะนำการทำงานของระบบบริหารจัดการสินทรัพย์ดิจิทัลเชิงประวัติศาสตร์ (HDAM)
            และรวบรวมคำตอบสำหรับทุกคำถามสำคัญในการบริหารคลังจดหมายเหตุ
          </p>
        </div>
      </section>

      {/* 2. How It Works (4 Core Pillars) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-5 w-5 text-rose-900" /> กลไกการทำงานหลักของระบบ (How It Works)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-3">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1. ผูกกับวันเวลาเกิดจริง (Event Date)</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              ไม่ว่าจะอัปโหลดไฟล์เมื่อใด ทุกชิ้นข้อมูลจะถูกผูกกับวันเวลาของเหตุการณ์จริงเสมอ รองรับปี พ.ศ. และ ค.ศ.
              พร้อมความไม่แน่นอนของวันเวลาในอดีต (ปี, เดือน, วัน, ประมาณการ)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-3">
              <Search className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">2. ตัดคำและขยายคำพ้อง (ICU & Synonyms)</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              ภาษาไทยที่เขียนติดกันจะถูกตัดคำด้วย V8 ICU Segmenter และขยายคำพ้องประวัติศาสตร์อัตโนมัติ
              ทำให้ค้นหาคำโบราณ คำย่อ พระนาม หรือปีศักราช ได้ผลลัพธ์ที่ตรงจุด
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">3. ตรวจสอบความสมบูรณ์ (Digital Fixity)</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              สินทรัพย์ภาพถ่าย วิดีโอ และเอกสารทุกชิ้น มีรหัส SHA-256 Checksum ตรวจสอบความถูกต้อง
              ป้องกันไฟล์เสียหาย แยกสิทธิ์ข้อมูลตาม Workspace และรองรับการสำรองข้อมูล (Backup) ได้ตลอดเวลา
            </p>
          </div>
        </div>
      </section>

      {/* 3. FAQ Section with Category Filter */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">คำถามที่พบบ่อย (Frequently Asked Questions)</h2>
            <p className="text-xs text-slate-500">รวมคำตอบของข้อสงสัยในการใช้งานระบบ Momentra</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === c.id
                    ? 'bg-rose-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Component */}
        <FaqAccordion items={filteredItems} />
      </section>
    </div>
  );
}
