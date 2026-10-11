'use client';

import React from 'react';
import Link from 'next/link';
import type { PlatformUser } from '@/lib/user-store';
import { KeyRound, Shield, ExternalLink, Power, CheckCircle, Ban } from 'lucide-react';

interface AdminUserTableProps {
  users: PlatformUser[];
  onOpenResetPassword: (user: PlatformUser) => void;
  onToggleStatus: (userId: string) => void;
}

export function AdminUserTable({
  users,
  onOpenResetPassword,
  onToggleStatus,
}: AdminUserTableProps) {
  const getRoleBadge = (role: PlatformUser['role']) => {
    switch (role) {
      case 'sysadmin':
        return <span className="rounded-full bg-rose-100 text-rose-900 px-2.5 py-0.5 text-[11px] font-bold border border-rose-200">👑 SysAdmin (สูงสุด)</span>;
      case 'owner':
        return <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold border border-amber-200">👑 เจ้าของเพจ (Owner)</span>;
      case 'admin':
        return <span className="rounded-full bg-blue-100 text-blue-900 px-2.5 py-0.5 text-[11px] font-bold border border-blue-200">🛡️ ผู้ดูแลเพจ (Admin)</span>;
      case 'contributor':
        return <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-200">✍️ ผู้ช่วยลงเนื้อหา (Editor)</span>;
      default:
        return <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-[11px] font-medium border border-slate-200">👁️ ผู้อ่าน (Viewer)</span>;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">สมาชิก (User)</th>
              <th className="py-3.5 px-4">สังกัดเพจ (Page)</th>
              <th className="py-3.5 px-4">บทบาท (Role)</th>
              <th className="py-3.5 px-4">สถานะ (Status)</th>
              <th className="py-3.5 px-4 text-right">การจัดการโดย SysAdmin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((u) => {
              const isSelfSysAdmin = u.role === 'sysadmin';
              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 border border-slate-200 shrink-0">
                        {u.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.fullName}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <Link
                      href={`/${u.pageSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-900 hover:underline"
                    >
                      <span>@{u.pageSlug}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{u.pageName}</div>
                  </td>

                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                  <td className="py-3 px-4">
                    {u.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> ใช้งานปกติ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
                        <Ban className="h-3 w-3" /> ถูกระงับสิทธิ์
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenResetPassword(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-900 transition-colors"
                        title="รีเซ็ตรหัสผ่าน"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                        <span>รีเซ็ตรหัส</span>
                      </button>

                      {!isSelfSysAdmin && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u.id)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            u.status === 'active'
                              ? 'border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                          title={u.status === 'active' ? 'ระงับบัญชี' : 'ปลดระงับ'}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{u.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
