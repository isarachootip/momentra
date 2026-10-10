'use client';

import React from 'react';
import type { WorkspaceMember, WorkspaceRole } from '@/types';
import { RoleBadge } from './role-badge';
import { Trash2, ShieldCheck, MoreVertical } from 'lucide-react';

interface MemberTableProps {
  members: WorkspaceMember[];
  currentUserId?: string;
  currentUserRole?: WorkspaceRole;
  onRoleChange: (userId: string, newRole: WorkspaceRole) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}

export function MemberTable({
  members,
  currentUserId,
  currentUserRole,
  onRoleChange,
  onRemoveMember,
}: MemberTableProps) {
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const beYear = d.getFullYear() + 543;
      return `${d.getDate()}/${d.getMonth() + 1}/${beYear}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">สมาชิก (Member)</th>
              <th className="py-3.5 px-4">ระดับสิทธิ์ (Role)</th>
              <th className="py-3.5 px-4">วันที่เข้าร่วม</th>
              {canManage && <th className="py-3.5 px-4 text-right">การจัดการ</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {members.map((member) => {
              const isOwner = member.role === 'owner';
              const isSelf = member.user_id === currentUserId;
              const canEditThisMember =
                canManage &&
                (!isOwner || currentUserRole === 'owner') &&
                (currentUserRole === 'owner' || member.role !== 'admin' || isSelf);

              return (
                <tr key={member.user_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 border border-slate-200 shrink-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          member.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{member.full_name}</span>
                          {isSelf && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                              คุณ
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[11px]">{member.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <RoleBadge role={member.role} />
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {formatDate(member.joined_at)}
                  </td>

                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditThisMember && !isOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              onRoleChange(member.user_id, e.target.value as WorkspaceRole)
                            }
                            className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden"
                          >
                            {currentUserRole === 'owner' && <option value="owner">Owner</option>}
                            <option value="admin">Admin</option>
                            <option value="contributor">Contributor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : null}

                        {canEditThisMember && !isOwner && !isSelf && (
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการนำ ${member.full_name} ออกจาก Workspace ใช่หรือไม่?`)) {
                                onRemoveMember(member.user_id);
                              }
                            }}
                            title="นำสมาชิกออก"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
