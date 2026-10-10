'use client';

import React, { useState, useEffect } from 'react';
import { User, Check, AlertCircle, Save, Globe } from 'lucide-react';
import { HubAvatarUploader } from '@/components/personal-hub/hub-avatar-uploader';
import { SecuritySection } from './components/security-section';
import { getCurrentUser, saveCurrentUser } from '@/lib/user-store';

export default function HubProfilePage() {
  const currentUser = getCurrentUser();
  const [username, setUsername] = useState(currentUser.username || 'samran');
  const [fullName, setFullName] = useState(currentUser.fullName || 'สำราญ ศักดี');
  const [pageBio, setPageBio] = useState('เจ้าของคลังประวัติศาสตร์และจดหมายเหตุดิจิทัลส่วนบุคคลและครอบครัว');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
  const [isPublished, setIsPublished] = useState(true);
  const [template, setTemplate] = useState<'timeline' | 'bento'>('timeline');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('momentra_hub_username');
    if (saved) setUsername(saved);
    const savedName = localStorage.getItem('momentra_hub_fullname');
    if (savedName) setFullName(savedName);
  }, []);

  const isValidUsername = /^[a-z0-9_-]{3,30}$/.test(username);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUsername) {
      setMessage({ text: 'Username ต้องเป็นตัวพิมพ์เล็ก ตัวเลข _ หรือ - ความยาว 3-30 ตัวอักษร', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      localStorage.setItem('momentra_hub_username', username);
      localStorage.setItem('momentra_hub_fullname', fullName);
      localStorage.setItem('momentra_hub_bio', pageBio);
      localStorage.setItem('momentra_hub_avatar', avatarUrl);
      localStorage.setItem('momentra_hub_published', String(isPublished));
      localStorage.setItem('momentra_hub_template', template);

      saveCurrentUser({
        fullName,
        username,
        avatarUrl,
      });

      setMessage({ text: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว', type: 'success' });
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs max-w-3xl">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-rose-800" /> ข้อมูลโปรไฟล์ & ตั้งค่า Username
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดชื่อผู้ใช้ ลิงก์ส่วนบุคคล และคำแนะนำตัวสำหรับหน้า Public Hub
          </p>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {message.type === 'success' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Username (ลิงก์หน้าโปรไฟล์ของคุณ)
            </label>
            <div className="mt-1.5 flex rounded-xl border border-slate-200 shadow-xs focus-within:border-rose-800 overflow-hidden">
              <span className="inline-flex items-center bg-slate-100 px-3.5 text-xs text-slate-500 font-mono select-none">
                momentra.online/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="samran"
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                required
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className={isValidUsername ? 'text-emerald-700' : 'text-rose-700'}>
                {isValidUsername ? '✓ รูปแบบ Username ถูกต้อง' : '⚠️ ใช้ได้เฉพาะตัวพิมพ์เล็ก a-z, ตัวเลข 0-9, _ และ - (3-30 ตัวอักษร)'}
              </span>
            </div>
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              ชื่อที่แสดง (Display Name)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
              required
            />
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              คำแนะนำตัว (Bio)
            </label>
            <textarea
              value={pageBio}
              onChange={(e) => setPageBio(e.target.value)}
              rows={3}
              maxLength={500}
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
            />
            <div className="mt-1 text-right text-[11px] text-slate-400">
              {pageBio.length} / 500 ตัวอักษร
            </div>
          </div>

          {/* Avatar Uploader Field */}
          <HubAvatarUploader avatarUrl={avatarUrl} onChange={setAvatarUrl} />

          {/* Published Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-600" /> สถานะการเผยแพร่ (Public Publishing)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เปิดให้คนภายนอกเข้าชมหน้า momentra.online/{username} ได้
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-300 peer-checked:bg-emerald-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"></div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !isValidUsername}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-800 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>

      {/* Owner Security & Password Management */}
      <SecuritySection email={currentUser.email} username={username} />
    </div>
  );
}
