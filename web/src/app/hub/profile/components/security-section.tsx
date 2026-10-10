'use client';

import React, { useState } from 'react';
import { KeyRound, Shield, Check, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { updateCurrentUserPassword } from '@/lib/user-store';

interface SecuritySectionProps {
  email: string;
  username: string;
}

export function SecuritySection({ email, username }: SecuritySectionProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!newPassword || newPassword.length < 8) {
      setMessage({ text: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'รหัสผ่านยืนยันไม่ตรงกัน', type: 'error' });
      return;
    }

    setIsUpdating(true);
    try {
      updateCurrentUserPassword(newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ text: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว', type: 'success' });
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs max-w-3xl mt-6">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="h-4 w-4 text-rose-800" /> ความปลอดภัย & รหัสผ่านสำหรับเจ้าของระบบ (Owner Security)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          จัดการรหัสผ่านและข้อมูลรับรองการเข้าใช้งาน Momentra
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block">บัญชีเจ้าของระบบ</span>
          <span className="font-semibold text-slate-900">{email}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Username ล็อกอิน</span>
          <span className="font-mono text-slate-900 font-semibold">@{username}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span>การเข้ารหัส Argon2id ปลอดภัย</span>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            รหัสผ่านใหม่ (New Password)
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="กำหนดรหัสผ่านใหม่ความยาวอย่างน้อย 8 ตัวอักษร"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            ยืนยันรหัสผ่านใหม่ (Confirm Password)
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="พิมพ์รหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
            required
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-rose-800 focus:outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            {isUpdating ? 'กำลังอัปเดตรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน (Update Password)'}
          </button>
        </div>
      </form>
    </div>
  );
}
