'use client';

import React, { useState, useEffect } from 'react';
import type { WorkspaceMember, WorkspaceSummary, WorkspaceRole } from '@/types';
import { MemberTable } from './components/member-table';
import { InviteModal } from './components/invite-modal';
import { EditMemberModal } from './components/edit-member-modal';
import { WorkspaceSelector } from './components/workspace-selector';
import { INITIAL_WORKSPACES, INITIAL_MEMBERS } from './components/mock-data';
import { Users, Search, ShieldCheck } from 'lucide-react';
import { getCurrentUser, saveCurrentUser, updateCurrentUserPassword, subscribeToUser } from '@/lib/user-store';

export default function MembersPage() {
  const currentUser = getCurrentUser();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(INITIAL_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('11111111-1111-1111-1111-111111111111');
  const [members, setMembers] = useState<WorkspaceMember[]>(() =>
    INITIAL_MEMBERS.map((m) =>
      m.role === 'owner'
        ? {
            ...m,
            full_name: currentUser.fullName || m.full_name,
            email: currentUser.email || m.email,
            avatar_url: currentUser.avatarUrl,
          }
        : m
    )
  );

  const [search, setSearch] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);

  useEffect(() => {
    return subscribeToUser((user) => {
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === user.id
            ? { ...m, full_name: user.fullName, email: user.email, avatar_url: user.avatarUrl }
            : m
        )
      );
    });
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (email: string, role: 'admin' | 'contributor' | 'viewer') => {
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

  const handleSaveMember = async (payload: {
    user_id: string;
    full_name: string;
    email: string;
    username?: string;
    role: WorkspaceRole;
    newPassword?: string;
  }) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === payload.user_id
          ? { ...m, full_name: payload.full_name, email: payload.email, role: payload.role }
          : m
      )
    );

    if (payload.user_id === currentUser.id) {
      saveCurrentUser({
        fullName: payload.full_name,
        email: payload.email,
        ...(payload.username ? { username: payload.username } : {}),
      });
      if (payload.newPassword) {
        updateCurrentUserPassword(payload.newPassword);
      }
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceSelector
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onChangeWorkspace={setActiveWorkspaceId}
        onOpenInvite={() => setIsInviteOpen(true)}
      />

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

      <MemberTable
        members={filteredMembers}
        currentUserId={currentUser.id}
        currentUserRole={activeWorkspace?.role}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
        onEditMember={(m) => setEditingMember(m)}
      />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
          <ShieldCheck className="h-4 w-4 text-rose-800" />
          <span>การแบ่งระดับสิทธิ์ตามมาตรฐานจดหมายเหตุ (Momentra RBAC)</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          • <strong>Owner:</strong> มีอำนาจสูงสุด สามารถจัดการบัญชี รหัสผ่าน จัดการสมาชิกและลบ Workspace ได้ | 
          • <strong>Admin:</strong> เชิญสมาชิก จัดการสิทธิ์ และกู้คืนไฟล์จากถังขยะได้ | 
          • <strong>Contributor:</strong> สามารถอัปโหลด เพิ่ม และแก้ไขเนื้อหาจดหมายเหตุได้ | 
          • <strong>Viewer:</strong> ค้นหาและดูไทม์ไลน์ได้เพียงอย่างเดียว
        </p>
      </div>

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        isCurrentUser={editingMember?.user_id === currentUser.id}
        onSave={handleSaveMember}
      />
    </div>
  );
}
