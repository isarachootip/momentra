'use client';

import React, { useState, useEffect } from 'react';
import type { SocialLink, SocialPlatform, VisibilityMode } from '@/types/personal-hub';
import { Plus, Trash2, ArrowUp, ArrowDown, Globe, Lock, Check, X, AlertTriangle } from 'lucide-react';

const DEFAULT_LINKS: SocialLink[] = [
  { id: '1', platform: 'youtube', label: 'Dr. Mum Health Channel (Official)', url: 'https://youtube.com/@drmum', link_group: 'official', visibility: 'public', sort_order: 1 },
  { id: '2', platform: 'website', label: 'สถาบันวิจัยการแพทย์ประวัติศาสตร์', url: 'https://drmum-research.org', link_group: 'official', visibility: 'public', sort_order: 2 },
  { id: '3', platform: 'line', label: 'LINE Official Account', url: 'https://page.line.me/drmum', link_group: 'official', visibility: 'public', sort_order: 3 },
  { id: '4', platform: 'facebook', label: 'บันทึกหมอหม่ำส่วนตัว', url: 'https://facebook.com/drmum.personal', link_group: 'personal', visibility: 'public', sort_order: 4 },
  { id: '5', platform: 'x', label: 'X / Twitter บันทึกความรู้รายวัน', url: 'https://x.com/drmum_daily', link_group: 'personal', visibility: 'private', sort_order: 5 },
];

export default function HubLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>(DEFAULT_LINKS);
  const [filterGroup, setFilterGroup] = useState<'all' | 'official' | 'personal'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form state
  const [platform, setPlatform] = useState<SocialPlatform>('youtube');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [linkGroup, setLinkGroup] = useState<'official' | 'personal'>('official');
  const [visibility, setVisibility] = useState<VisibilityMode>('private');

  useEffect(() => {
    const saved = localStorage.getItem('momentra_hub_links');
    if (saved) {
      try { setLinks(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveToStorage = (updated: SocialLink[]) => {
    setLinks(updated);
    localStorage.setItem('momentra_hub_links', JSON.stringify(updated));
  };

  const handleToggleVisibility = (id: string) => {
    const updated = links.map((l) =>
      l.id === id ? { ...l, visibility: (l.visibility === 'public' ? 'private' : 'public') as VisibilityMode } : l
    );
    saveToStorage(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const reordered = [...links];
    const temp = reordered[index]!;
    reordered[index] = reordered[targetIdx]!;
    reordered[targetIdx] = temp;
    saveToStorage(reordered);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    const updated = links.filter((l) => l.id !== deleteTargetId);
    saveToStorage(updated);
    setDeleteTargetId(null);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    const newLink: SocialLink = {
      id: String(Date.now()),
      platform,
      label: label.trim(),
      url: url.trim(),
      link_group: linkGroup,
      visibility,
      sort_order: links.length + 1,
    };
    saveToStorage([...links, newLink]);
    setIsModalOpen(false);
    setLabel('');
    setUrl('');
  };

  const displayedLinks = links.filter((l) => filterGroup === 'all' || l.link_group === filterGroup);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div className="flex gap-2">
          {(['all', 'official', 'personal'] as const).map((grp) => (
            <button
              key={grp}
              onClick={() => setFilterGroup(grp)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filterGroup === grp ? 'bg-rose-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {grp === 'all' ? 'ทั้งหมด' : grp === 'official' ? '🏛️ ทางการ (Official)' : '👤 ส่วนตัว (Personal)'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> เพิ่มช่องทางโซเชียล
        </button>
      </div>

      {/* Links List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {displayedLinks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">ไม่พบรายการลิงก์ในหมวดนี้</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedLinks.map((link, idx) => (
              <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                    <button onClick={() => handleMove(idx, 'down')} disabled={idx === links.length - 1} className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{link.label}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">{link.platform}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${link.link_group === 'official' ? 'bg-sky-50 text-sky-700' : 'bg-purple-50 text-purple-700'}`}>
                        {link.link_group === 'official' ? 'Official' : 'Personal'}
                      </span>
                    </div>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:underline mt-0.5 block truncate max-w-md">{link.url}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleVisibility(link.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      link.visibility === 'public' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {link.visibility === 'public' ? <Globe className="h-3 w-3 text-emerald-600" /> : <Lock className="h-3 w-3 text-slate-500" />}
                    <span>{link.visibility === 'public' ? 'สาธารณะ' : 'ส่วนตัว'}</span>
                  </button>

                  <button
                    onClick={() => setDeleteTargetId(link.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="ลบรายการ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-sm font-bold text-slate-900">ยืนยันการลบช่องทางโซเชียล</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การลบจะทำให้ลิงก์หายไปจากหน้า Public Hub ทันที
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTargetId(null)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">ยกเลิก</button>
              <button onClick={handleDelete} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">ยืนยันลบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">เพิ่มช่องทางโซเชียลใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">แพลตฟอร์ม</label>
                  <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                    {['facebook', 'instagram', 'tiktok', 'youtube', 'line', 'x', 'linkedin', 'website', 'email', 'other'].map((p) => (
                      <option key={p} value={p}>{p.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                  <select value={linkGroup} onChange={(e) => setLinkGroup(e.target.value as 'official' | 'personal')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900">
                    <option value="official">🏛️ ช่องทางทางการ (Official)</option>
                    <option value="personal">👤 ช่องทางส่วนตัว (Personal)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ป้ายชื่อ (Label)</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น YouTube บรรยายพิเศษ" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL ปลายทาง</label>
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">สถานะการมองเห็นเริ่มต้น</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="vis" checked={visibility === 'private'} onChange={() => setVisibility('private')} /> 🔒 ส่วนตัว (Private - ค่าเริ่มต้น)</label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="radio" name="vis" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> 🌐 สาธารณะ (Public)</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">ยกเลิก</button>
                <button type="submit" className="rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800">บันทึกช่องทาง</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
