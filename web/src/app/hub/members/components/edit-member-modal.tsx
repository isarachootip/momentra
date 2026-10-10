'use client';

import React, { useState, useEffect } from 'react';
import type { WorkspaceMember, WorkspaceRole } from '@/types';
import { X, UserCheck, Shield, AlertCircle } from 'lucide-react';
import { MemberPasswordFields } from './member-password-fields';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: WorkspaceMember | null;
  isCurrentUser: boolean;
  onSave: (payload: {
    user_id: string;
    full_name: string;
    email: string;
    username?: string;
    role: WorkspaceRole;
    newPassword?: string;
  }) => Promise<void>;
}

export function EditMemberModal({ isOpen, onClose, member, isCurrentUser, onSave }: EditMemberModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('contributor');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name);
      setEmail(member.email);
      setUsername(member.email.split('@')[0] || '');
      setRole(member.role);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError('กรุณากรอกชื่อและอีเมลให้ครบถ้วน');
      return;
    }
    if (newPassword) {
      if (newPassword.length < 8) {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('รหัสผ่านยืนยันไม่ตรงกัน');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSave({
        user_id: member.user_id,
        full_name: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        role,
        newPassword: newPassword ? newPassword : undefined,
      });
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = member.role === 'owner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isOwner ? 'จัดการบัญชีและรหัสผ่านเจ้าของ (Owner)' : 'แก้ไขข้อมูลสมาชิก'}
              </h3>
              <p className="text-[11px] text-slate-500">ปรับปรุงข้อมูลส่วนตัว บทบาท และรหัสผ่าน</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">ชื่อ-นามสกุล (Full Name)</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">อีเมล (Email)</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-800 focus:outline-hidden"
              placeholder="e.g. samran"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">ระดับสิทธิ์ (Role)</label>
            <div className="mt-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <select
                disabled={isOwner}
                value={role}
                onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs disabled:bg-slate-100 disabled:text-slate-500"
              >
                {isOwner && <option value="owner">เจ้าของ (Owner)</option>}
                <option value="admin">ผู้ดูแล (Admin)</option>
                <option value="contributor">ผู้ร่วมจัดเก็บ (Contributor)</option>
                <option value="viewer">ผู้อ่าน (Viewer)</option>
              </select>
            </div>
          </div>

          <MemberPasswordFields
            newPassword={newPassword}
            onChangeNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            onChangeConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword(!showPassword)}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-rose-900 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 shadow-xs transition-colors"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล & รหัสผ่าน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
