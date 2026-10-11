'use client';

import React, { useState } from 'react';
import type { PlatformUser } from '@/lib/user-store';
import { X, UserPlus, Shield, Globe } from 'lucide-react';

interface CreatePlatformUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: Omit<PlatformUser, 'id' | 'joinedAt'>) => void;
}

export function CreatePlatformUserModal({
  isOpen,
  onClose,
  onCreate,
}: CreatePlatformUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageName, setPageName] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'contributor' | 'viewer'>('owner');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !username) return;
    onCreate({
      fullName,
      email,
      username: username.toLowerCase().trim(),
      pageSlug: (pageSlug || username).toLowerCase().trim(),
      pageName: pageName || `คลังประวัติศาสตร์ ${fullName}`,
      role,
      status: 'active',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">เพิ่มสมาชิก & เปิดเพจใหม่ (SysAdmin)</h3>
              <p className="text-[11px] text-slate-500">สร้างบัญชีผู้ใช้และมอบหมายเพจในระบบ Momentra</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">ชื่อ-นามสกุล สมาชิก</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น ดร. มานพ พิทักษ์ธรรม"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">อีเมล (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="drmum@momentra.app"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Username ล็อกอิน</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (!pageSlug) setPageSlug(e.target.value);
                }}
                placeholder="drmum"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">เพจ / คลังที่สังกัด (Page Slug)</label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white">
              <span className="bg-slate-50 px-3 text-xs text-slate-500 font-mono select-none">momentra.online/</span>
              <input
                type="text"
                required
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="drmum"
                className="w-full px-2 py-2 text-xs font-semibold text-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">ระดับสิทธิ์ (Page Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'contributor' | 'viewer')}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            >
              <option value="owner">👑 เจ้าของเพจ (Page Owner)</option>
              <option value="admin">🛡️ ผู้ดูแลเพจ (Page Admin - ช่วยบริหารเพจ)</option>
              <option value="contributor">✍️ ผู้ช่วยลงเนื้อหา (Page Editor / Contributor)</option>
              <option value="viewer">👁️ ผู้อ่านข้อมูล (Page Viewer)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 shadow-xs"
            >
              สร้างบัญชี & เปิดเพจ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
