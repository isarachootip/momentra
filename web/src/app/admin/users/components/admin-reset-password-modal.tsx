'use client';

import React, { useState, useEffect } from 'react';
import type { PlatformUser } from '@/lib/user-store';
import { X, KeyRound, Eye, EyeOff, Copy, Check, ShieldAlert } from 'lucide-react';

interface AdminResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PlatformUser | null;
  onReset: (userId: string, newPass: string) => void;
}

export function AdminResetPasswordModal({
  isOpen,
  onClose,
  user,
  onReset,
}: AdminResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleGenerate = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    onReset(user.id, newPassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">SysAdmin Master Password Reset</h3>
              <p className="text-[11px] text-slate-500">รีเซ็ตรหัสผ่านให้สมาชิก: {user.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
          <div>อีเมลบัญชี: <strong className="text-slate-900">{user.email}</strong></div>
          <div className="text-[11px] text-slate-500 mt-0.5">สังกัดเพจ: momentra.online/{user.pageSlug}</div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">กำหนดรหัสผ่านใหม่</label>
              <button
                type="button"
                onClick={handleGenerate}
                className="text-[11px] font-bold text-rose-800 hover:text-rose-900"
              >
                🎲 สุ่มรหัสผ่านปลอดภัย
              </button>
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="พิมพ์รหัสผ่านใหม่ หรือกดสุ่มรหัสผ่าน"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-16 text-xs focus:border-rose-800 focus:outline-hidden"
              />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                {newPassword && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-md p-1 text-slate-400 hover:text-slate-700"
                    title="คัดลอกรหัสผ่าน"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={newPassword.length < 6}
              className="rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              บันทึกรหัสผ่านใหม่
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
