'use client';

import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield } from 'lucide-react';
import type { WorkspaceRole } from '@/types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: 'admin' | 'contributor' | 'viewer') => Promise<void>;
}

export function InviteModal({ isOpen, onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'contributor' | 'viewer'>('contributor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onInvite(email, role);
      setEmail('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชิญสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">เชิญสมาชิกเข้าร่วม Workspace</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              อีเมลของสมาชิก (Email)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@organization.org"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ระดับสิทธิ์ (Role Assignment)
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'contributor' | 'viewer')}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs focus:border-rose-800 focus:outline-hidden bg-white"
              >
                <option value="admin">ผู้ดูแล (Admin) - จัดการสมาชิกและเนื้อหาทั้งหมด</option>
                <option value="contributor">ผู้ร่วมจัดเก็บ (Contributor) - เพิ่มและแก้ไขข้อมูล/ไฟล์ได้</option>
                <option value="viewer">ผู้อ่าน (Viewer) - ดูและค้นหาข้อมูลอย่างเดียว</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'กำลังส่งคำเชิญ...' : 'ยืนยันการเชิญ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
