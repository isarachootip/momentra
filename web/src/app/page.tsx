'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Search, Sparkles, Flag, ArrowRight, ShieldCheck, Database } from 'lucide-react';
import { HistoricalDatePicker } from '@/components/date-picker/historical-date-picker';
import type { HistoricalDateValue } from '@/components/date-picker/date-picker.types';

export default function HomePage() {
  const [pickerVal, setPickerVal] = useState<HistoricalDateValue>({
    precision: 'day',
    isRange: false,
    isCirca: false,
    startBeYear: 2475,
    startCeYear: 1932,
    startMonth: 6,
    startDay: 24,
  });

  return (
    <div className="space-y-10">
      {/* 1. Hero Introduction */}
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 border border-rose-500/30">
            <Sparkles className="h-3.5 w-3.5" /> ระบบจดหมายเหตุดิจิทัลแห่งยุคสมัย
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            ผูกทุกประวัติศาสตร์และสินทรัพย์ เข้ากับวันเวลาจริง
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Momentra (HDAM) จัดเก็บ ค้นหา และเรียบเรียงไทม์ไลน์ภาพถ่าย เอกสาร ลิงก์ และบันทึก
            พร้อมระบบปฏิทินสองมาตรฐาน พ.ศ. และ ค.ศ. รองรับความไม่แน่นอนของวันเวลาในอดีตอย่างแท้จริง
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              href="/timeline"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-colors"
            >
              <Clock className="h-4 w-4" /> ดูผังเวลาประวัติศาสตร์ (Timeline)
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-xs hover:bg-white/20 transition-colors"
            >
              <Search className="h-4 w-4" /> ค้นหาจดหมายเหตุ (Search)
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Core Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-4">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Timeline Engine</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            จัดเรียงตามเหตุการณ์จริง (`event_start`) ซูมดูได้ตั้งแต่ระดับทศวรรษ รายปี รายเดือน จนถึงรายวัน
            ด้วย GiST Index Sub-second performance
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-4">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Bilingual FTS & Synonyms</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            ตัดคำไทย-อังกฤษด้วย ICU Segmenter ขยายคำพ้องประวัติศาสตร์ (เช่น ร.5 ↔ จุฬาลงกรณ์, 2475 ↔ 1932)
            พร้อม Trigram Fuzzy typo-tolerance
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Multi-tenant & Digital Preservation</h3>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            แยกข้อมูลด้วย Workspace RLS, ตรวจสอบความถูกต้องของไฟล์ด้วย SHA-256 Checksum,
            มาตรฐาน Dublin Core และความปลอดภัยระดับสูง
          </p>
        </div>
      </section>

      {/* 3. Hero Feature Preview: Interactive Historical Date Picker */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              ทดลองใช้งาน Historical Date Picker
            </h2>
            <p className="text-xs text-slate-500">
              ส่วนประกอบสำคัญในการระบุวันเวลาที่มีความไม่แน่นอน (Date Precision & Circa) พร้อมคำนวณ พ.ศ. ⇄ ค.ศ. อัตโนมัติ
            </p>
          </div>
          <Link
            href="/date-picker"
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 hover:underline"
          >
            เปิดหน้าสาธิตเต็มรูปแบบ <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <HistoricalDatePicker value={pickerVal} onChange={setPickerVal} />
      </section>
    </div>
  );
}
