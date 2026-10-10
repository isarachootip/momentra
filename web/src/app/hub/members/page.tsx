'use client';

import React, { useState, useEffect } from 'react';
import type { WorkspaceMember, WorkspaceSummary, WorkspaceRole } from '@/types';
import { MemberTable } from './components/member-table';
import { InviteModal } from './components/invite-modal';
import { Users, UserPlus, Building, Search, ShieldCheck } from 'lucide-react';

export default function MembersPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'หอจดหมายเหตุแห่งชาติ (National Archives)',
      slug: 'national-archives',
      type: 'organization',
      role: 'owner',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'คลังประวัติศาสตร์ส่วนตัว (Personal)',
      slug: 'personal-archive',
      type: 'personal',
      role: 'owner',
    },
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    '11111111-1111-1111-1111-111111111111'
  );

  const [members, setMembers] = useState<WorkspaceMember[]>([
    {
      user_id: 'a1111111-1111-1111-1111-111111111111',
      email: 'somchai@momentra.app',
      full_name: 'สมชาย วิจิตรานันท์',
      avatar_url: null,
      role: 'owner',
      joined_at: '2026-01-15T08:00:00Z',
    },
    {
      user_id: 'b2222222-2222-2222-2222-222222222222',
      email: 'wanida@momentra.app',
      full_name: 'วนิดา ธนสารสิทธิ์',
      avatar_url: null,
      role: 'admin',
      joined_at: '2026-02-01T09:30:00Z',
    },
    {
      user_id: 'c3333333-3333-3333-3333-333333333333',
      email: 'pranote@momentra.app',
      full_name: 'ปราโมทย์ รัตนชัย',
      avatar_url: null,
      role: 'contributor',
      joined_at: '2026-03-10T14:15:00Z',
    },
    {
      user_id: 'd4444444-4444-4444-4444-444444444444',
      email: 'archivist.intern@momentra.app',
      full_name: 'กานต์ธิดา อัมพวา',
      avatar_url: null,
      role: 'viewer',
      joined_at: '2026-04-05T11:00:00Z',
    },
  ]);

  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (email: string, role: 'admin' | 'contributor' | 'viewer') => {
    // Add member locally or sync with API
    const newMember: WorkspaceMember = {
      user_id: `user-${Date.now()}`,
      email,
      full_name: email.split('@')[0] || 'New Member',
      avatar_url: null,
      role,
      joined_at: new Date().toISOString(),
    };
    setMembers((prev) => [...prev, newMember]);
  };

  const handleRoleChange = async (userId: string, newRole: WorkspaceRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveMember = async (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
  };

  return (
    <div className="space-y-6">
      {/* Workspace Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-900 border border-rose-100">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-rose-900">Workspace ปัจจุบัน</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                {activeWorkspace?.type}
              </span>
            </div>
            <select
              value={activeWorkspaceId}
              onChange={(e) => setActiveWorkspaceId(e.target.value)}
              className="mt-1 text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <UserPlus className="h-4 w-4" />
          <span>เชิญสมาชิกใหม่</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมลสมาชิก..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-rose-800 focus:outline-hidden"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Users className="h-4 w-4" />
          <span>สมาชิกทั้งหมด: <strong className="text-slate-900">{members.length}</strong> ท่าน</span>
        </div>
      </div>

      {/* Member Table */}
      <MemberTable
        members={filteredMembers}
        currentUserId="a1111111-1111-1111-1111-111111111111"
        currentUserRole={activeWorkspace?.role}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />

      {/* RBAC Info Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
          <ShieldCheck className="h-4 w-4 text-rose-800" />
          <span>การแบ่งระดับสิทธิ์ตามมาตรฐานจดหมายเหตุ (Momentra RBAC)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          • <strong>Owner:</strong> มีอำนาจสูงสุด สามารถจัดการสมาชิกและลบ Workspace ได้ | 
          • <strong>Admin:</strong> เชิญสมาชิก จัดการสิทธิ์ และกู้คืนไฟล์จากถังขยะได้ | 
          • <strong>Contributor:</strong> สามารถอัปโหลด เพิ่ม และแก้ไขเนื้อหาจดหมายเหตุได้ | 
          • <strong>Viewer:</strong> ค้นหาและดูไทม์ไลน์ได้เพียงอย่างเดียว
        </p>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}
