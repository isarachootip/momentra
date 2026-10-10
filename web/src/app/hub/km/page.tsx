'use client';

import React, { useState, useEffect } from 'react';
import type { KmItem, KmCategory, VisibilityMode } from '@/types/personal-hub';
import { HistoricalDatePicker } from '@/components/date-picker/historical-date-picker';
import type { HistoricalDateValue } from '@/components/date-picker/date-picker.types';
import { Plus, Trash2, Globe, Lock, BookOpen, AlertTriangle, X, Search } from 'lucide-react';

const INITIAL_KM: KmItem[] = [
  { id: '1', title: 'ประวัติการค้นพบตำราแพทย์โอสถพระนารายณ์', km_category: 'article', event_start: '1985-04-12T00:00:00Z', event_end: '1985-04-12T23:59:59Z', date_precision: 'day', is_circa: false, description: 'งานวิจัยเชิงลึกเกี่ยวกับสูตรยาไทยโบราณในสมัยกรุงศรีอยุธยา', visibility: 'public', is_public: true, link_url: 'https://drmum-research.org/narai-medicine', tags: ['ประวัติศาสตร์การแพทย์', 'อยุธยา'] },
  { id: '2', title: 'คลิปบรรยายพิเศษ: สมุนไพรไทยกับการบำบัดโรคยุคใหม่', km_category: 'video', event_start: '2021-08-20T00:00:00Z', event_end: '2021-08-20T23:59:59Z', date_precision: 'day', is_circa: false, description: 'การบรรยายวิชาการ ณ โรงพยาบาลศิริราช', visibility: 'public', is_public: true, link_url: 'https://youtube.com/watch?v=sample123', tags: ['สมุนไพร', 'บรรยาย'] },
  { id: '3', title: 'ภาพถ่ายใบลานบันทึกสูตรยาโบราณ วัดพระเชตุพน', km_category: 'image', event_start: '1932-06-24T00:00:00Z', event_end: '1932-06-24T23:59:59Z', date_precision: 'day', is_circa: true, description: 'ภาพถ่ายความละเอียดสูงจากหอสมุดแห่งชาติ', visibility: 'public', is_public: true, tags: ['ใบลาน', 'ภาพถ่ายโบราณ'] },
  { id: '4', title: 'บันทึกความจำส่วนบุคคล: แนวทางการวินิจฉัยโรคไม่ติดต่อเรื้อรัง', km_category: 'note', event_start: '2023-11-01T00:00:00Z', event_end: '2023-11-01T23:59:59Z', date_precision: 'month', is_circa: false, description: 'สรุปข้อคิดและสมมติฐานการวิจัยขั้นต้นที่ยังไม่เผยแพร่', visibility: 'private', is_public: false, tags: ['บันทึกส่วนตัว'] },
];

export default function HubKmPage() {
  const [items, setItems] = useState<KmItem[]>(INITIAL_KM);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [kmCategory, setKmCategory] = useState<KmCategory>('article');
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<VisibilityMode>('private');
  const [pickerVal, setPickerVal] = useState<HistoricalDateValue>({
    precision: 'day', isRange: false, isCirca: false,
    startBeYear: 2566, startCeYear: 2023, startMonth: 5, startDay: 15,
  });

  useEffect(() => {
    const saved = localStorage.getItem('momentra_hub_km');
    if (saved) { try { setItems(JSON.parse(saved)); } catch {} }
  }, []);

  const saveToStorage = (updated: KmItem[]) => {
    setItems(updated);
    localStorage.setItem('momentra_hub_km', JSON.stringify(updated));
  };

  const handleToggleVisibility = (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, visibility: (i.visibility === 'public' ? 'private' : 'public') as VisibilityMode, is_public: i.visibility !== 'public' } : i
    );
    saveToStorage(updated);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = items.filter((i) => i.id !== deleteTargetId);
    saveToStorage(updated);
    setDeleteTargetId(null);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    const dateStr = `${pickerVal.startCeYear}-${String(pickerVal.startMonth || 1).padStart(2, '0')}-${String(pickerVal.startDay || 1).padStart(2, '0')}T00:00:00Z`;
    const newItem: KmItem = {
      id: String(Date.now()),
      title: title.trim(),
      km_category: kmCategory,
      description: summary.trim(),
      link_url: url.trim() || null,
      event_start: dateStr,
      event_end: dateStr,
      date_precision: pickerVal.precision,
      is_circa: pickerVal.isCirca,
      visibility,
      is_public: visibility === 'public',
      tags,
    };
    saveToStorage([newItem, ...items]);
    setIsModalOpen(false);
    setTitle(''); setSummary(''); setUrl(''); setTagInput('');
  };

  const filtered = items.filter((item) => {
    const matchCat = categoryFilter === 'all' || item.km_category === categoryFilter;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อหรือเนื้อหา KM..." className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 w-56 focus:outline-none focus:border-rose-800" />
          </div>
          {['all', 'article', 'video', 'image', 'document', 'note'].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${categoryFilter === cat ? 'bg-rose-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {cat === 'all' ? 'ทั้งหมด' : cat === 'article' ? 'บทความ' : cat === 'video' ? 'วิดีโอ' : cat === 'image' ? 'รูปภาพ' : cat === 'document' ? 'เอกสาร' : 'บันทึก'}
            </button>
          ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors">
          <Plus className="h-4 w-4" /> เพิ่มรายการ KM
        </button>
      </div>

      {/* Items List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">ไม่พบรายการคลังความรู้ที่ตรงกับเงื่อนไข</div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-rose-50 text-rose-800 font-bold px-2 py-0.5 text-[10px] uppercase">{item.km_category}</span>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  {item.is_circa && <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">ประมาณการ</span>}
                </div>
                {item.description && <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span>📅 พ.ศ. {new Date(item.event_start).getUTCFullYear() + 543} (ค.ศ. {new Date(item.event_start).getUTCFullYear()})</span>
                  {item.tags?.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">#{t}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <button onClick={() => handleToggleVisibility(item.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${item.visibility === 'public' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {item.visibility === 'public' ? <Globe className="h-3 w-3 text-emerald-600" /> : <Lock className="h-3 w-3 text-slate-500" />}
                  <span>{item.visibility === 'public' ? 'สาธารณะ' : 'ส่วนตัว'}</span>
                </button>
                <button onClick={() => setDeleteTargetId(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3"><AlertTriangle className="h-6 w-6" /><h3 className="text-sm font-bold text-slate-900">ยืนยันการลบรายการ KM</h3></div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ระบบจะย้ายรายการนี้ไปยังถังขยะประวัติศาสตร์และซ่อนจากหน้าโปรไฟล์ทันที</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTargetId(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">ยกเลิก</button>
              <button onClick={handleDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><BookOpen className="h-4 w-4 text-rose-800" /> เพิ่มรายการคลังความรู้ (KM Item)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อบทความ / องค์ความรู้</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ตำรายาโบราณฉบับสมเด็จพระนารายณ์มหาราช" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทสื่อ</label>
                  <select value={kmCategory} onChange={(e) => setKmCategory(e.target.value as KmCategory)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                    <option value="article">บทความ (Article)</option>
                    <option value="video">วิดีโอ (Video)</option>
                    <option value="image">รูปภาพ (Image)</option>
                    <option value="document">เอกสาร (Document)</option>
                    <option value="note">บันทึก (Note)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL แหล่งอ้างอิงหรือไฟล์</label>
                  <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" />
                </div>
              </div>
              {/* Historical Date Picker integration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันเวลาเหตุการณ์จริง (Historical Event Date)</label>
                <HistoricalDatePicker value={pickerVal} onChange={setPickerVal} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">สรุปย่อ / บทคัดย่อ (Summary)</label>
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="คำอธิบายสรุปสั้นๆ..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">แท็ก (คั่นด้วยจุลภาค , )</label>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="การแพทย์, ประวัติศาสตร์, สมุนไพร" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">สถานะการมองเห็น</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="km_vis" checked={visibility === 'private'} onChange={() => setVisibility('private')} /> 🔒 ส่วนตัว (Private - ค่าเริ่มต้น)</label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="km_vis" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> 🌐 สาธารณะ (Public)</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">ยกเลิก</button>
                <button type="submit" className="rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800">บันทึกรายการ KM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
