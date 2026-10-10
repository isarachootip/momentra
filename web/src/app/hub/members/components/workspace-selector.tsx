'use client';

import React from 'react';
import type { WorkspaceSummary } from '@/types';
import { Building, UserPlus } from 'lucide-react';

interface WorkspaceSelectorProps {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string;
  onChangeWorkspace: (id: string) => void;
  onOpenInvite: () => void;
}

export function WorkspaceSelector({
  workspaces,
  activeWorkspaceId,
  onChangeWorkspace,
  onOpenInvite,
}: WorkspaceSelectorProps) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
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
            onChange={(e) => onChangeWorkspace(e.target.value)}
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
        onClick={onOpenInvite}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
      >
        <UserPlus className="h-4 w-4" />
        <span>เชิญสมาชิกใหม่</span>
      </button>
    </div>
  );
}
