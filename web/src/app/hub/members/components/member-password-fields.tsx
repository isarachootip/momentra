'use client';

import React from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

interface MemberPasswordFieldsProps {
  newPassword: string;
  onChangeNewPassword: (val: string) => void;
  confirmPassword: string;
  onChangeConfirmPassword: (val: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
}

export function MemberPasswordFields({
  newPassword,
  onChangeNewPassword,
  confirmPassword,
  onChangeConfirmPassword,
  showPassword,
  onToggleShowPassword,
}: MemberPasswordFieldsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
        <span className="flex items-center gap-1.5 text-rose-900">
          <KeyRound className="h-3.5 w-3.5" /> กำหนด / เปลี่ยนรหัสผ่าน (Password)
        </span>
        <button
          type="button"
          onClick={onToggleShowPassword}
          className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPassword ? 'ซ่อน' : 'แสดง'}
        </button>
      </div>

      <div>
        <input
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => onChangeNewPassword(e.target.value)}
          placeholder="รหัสผ่านใหม่ (ว่างไว้ถ้าไม่ต้องการเปลี่ยน)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-rose-800 focus:outline-hidden"
        />
      </div>

      {newPassword && (
        <div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onChangeConfirmPassword(e.target.value)}
            placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-rose-800 focus:outline-hidden"
          />
          <p className="mt-1 text-[10px] text-slate-500">ความยาวอย่างน้อย 8 ตัวอักษร</p>
        </div>
      )}
    </div>
  );
}
