'use client';

import React, { useState } from 'react';
import {
  getPlatformUsers,
  createPlatformUser,
  togglePlatformUserStatus,
  adminResetUserPassword,
  type PlatformUser,
} from '@/lib/user-store';
import { AdminUserTable } from './components/admin-user-table';
import { AdminResetPasswordModal } from './components/admin-reset-password-modal';
import { CreatePlatformUserModal } from './components/create-platform-user-modal';
import { ShieldCheck, UserPlus, Users, Search, Globe, AlertTriangle } from 'lucide-react';

export default function SysAdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(getPlatformUsers());
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<PlatformUser | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.pageSlug.toLowerCase().includes(search.toLowerCase());
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const handleCreate = (newUser: Omit<PlatformUser, 'id' | 'joinedAt'>) => {
    createPlatformUser(newUser);
    setUsers(getPlatformUsers());
  };

  const handleToggleStatus = (userId: string) => {
    togglePlatformUserStatus(userId);
    setUsers(getPlatformUsers());
  };

  const handleResetPassword = (userId: string, newPass: string) => {
    adminResetUserPassword(userId, newPass);
    alert('บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว');
  };

  const totalPages = new Set(users.map((u) => u.pageSlug)).size;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-xs border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-900 border border-rose-200">
              <ShieldCheck className="h-3.5 w-3.5" /> SysAdmin Control Center
            </span>
            <span className="text-xs text-slate-500">แพลตฟอร์ม Momentra</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            ระบบจัดการผู้ใช้งานและสิทธิ์ทั้งระบบ (Platform User Management)
          </h1>
          <p className="text-xs text-slate-600">
            ผู้ดูแลระบบสูงสุด: <strong>คุณสำราญ ศักดี</strong> | บริหารจัดการ User & Password ของสมาชิกทุกเพจ
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ เพิ่มสมาชิก & เปิดเพจใหม่</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-slate-400" /> สมาชิกทั้งหมด
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{users.length} ท่าน</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-rose-800" /> เพจในแพลตฟอร์ม
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalPages} เพจ</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 text-emerald-700">
            🟢 ใช้งานปกติ (Active)
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">{activeCount} ท่าน</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" /> ถูกระงับสิทธิ์
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">{suspendedCount} ท่าน</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, หรือ @username เพจ..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-700 focus:border-rose-800"
        >
          <option value="all">บทบาททั้งหมด (All Roles)</option>
          <option value="sysadmin">SysAdmin (ผู้ดูแลระบบสูงสุด)</option>
          <option value="owner">Page Owner (เจ้าของเพจ)</option>
          <option value="admin">Page Admin (ผู้ดูแลเพจ)</option>
          <option value="contributor">Page Editor (ผู้ช่วยลงเนื้อหา)</option>
          <option value="viewer">Page Viewer (ผู้อ่าน)</option>
        </select>
      </div>

      {/* User Table */}
      <AdminUserTable
        users={filteredUsers}
        onOpenResetPassword={(u) => setResetTargetUser(u)}
        onToggleStatus={handleToggleStatus}
      />

      <CreatePlatformUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <AdminResetPasswordModal
        isOpen={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        user={resetTargetUser}
        onReset={handleResetPassword}
      />
    </div>
  );
}
