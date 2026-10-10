'use client';

import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { updateCurrentUserPassword } from '@/lib/user-store';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'รหัสผ่านยืนยันไม่ตรงกัน', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      updateCurrentUserPassword(newPassword);
      setMessage({ text: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว', type: 'success' });
      setTimeout(() => {
        setNewPassword('');
        setConfirmPassword('');
        setMessage(null);
        onClose();
      }, 1200);
    } catch {
      setMessage({ text: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">เปลี่ยนรหัสผ่าน (Password)</h3>
              <p className="text-[11px] text-slate-500">กำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบ</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPassword ? 'ซ่อนรหัส' : 'แสดงรหัส'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">รหัสผ่านใหม่</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="ความยาวอย่างน้อย 8 ตัวอักษร"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">ยืนยันรหัสผ่านใหม่</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-rose-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-800 shadow-xs"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
