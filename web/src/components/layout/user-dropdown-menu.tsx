'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import type { CurrentUser } from '@/lib/user-store';
import { User, KeyRound, Users, LogOut, Shield, ShieldCheck } from 'lucide-react';

interface UserDropdownMenuProps {
  user: CurrentUser;
  isOpen: boolean;
  onClose: () => void;
  onOpenPasswordModal: () => void;
  onLogout: () => void;
}

export function UserDropdownMenu({
  user,
  isOpen,
  onClose,
  onOpenPasswordModal,
  onLogout,
}: UserDropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isSysAdminUser = user.role === 'sysadmin';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header Info */}
      <div className="rounded-xl bg-slate-50 p-3 mb-1 border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-900 font-bold text-xs border border-rose-200 shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
            ) : (
              user.fullName.charAt(0) || 'ส'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-slate-900 truncate">{user.fullName}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 w-fit">
          <Shield className="h-3 w-3" />
          <span>{isSysAdminUser ? '👑 Platform SysAdmin (สูงสุด)' : 'เจ้าของเพจ (Page Owner)'}</span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-0.5 text-xs text-slate-700">
        {isSysAdminUser && (
          <Link
            href="/admin/users"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <ShieldCheck className="h-4 w-4 text-amber-700" />
            <span>SysAdmin Control Center</span>
          </Link>
        )}

        <Link
          href="/hub/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium hover:bg-slate-100 transition-colors"
        >
          <User className="h-4 w-4 text-slate-500" />
          <span>แก้ไขโปรไฟล์ส่วนตัว</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenPasswordModal();
          }}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium hover:bg-slate-100 transition-colors text-left"
        >
          <KeyRound className="h-4 w-4 text-rose-800" />
          <span>เปลี่ยนรหัสผ่าน (Password)</span>
        </button>

        <Link
          href="/hub/members"
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium hover:bg-slate-100 transition-colors"
        >
          <Users className="h-4 w-4 text-slate-500" />
          <span>จัดการสมาชิกในทีมเพจ</span>
        </Link>
      </div>

      <div className="my-1 border-t border-slate-100" />

      {/* Logout */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors text-left"
      >
        <LogOut className="h-4 w-4 text-rose-600" />
        <span>ออกจากระบบ (Logout)</span>
      </button>
    </div>
  );
}
