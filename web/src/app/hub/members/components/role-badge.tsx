'use client';

import React from 'react';
import type { WorkspaceRole } from '@/types';
import { Shield, ShieldAlert, Edit3, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: WorkspaceRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  switch (role) {
    case 'owner':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
          <ShieldAlert className="h-3.5 w-3.5 text-purple-600" />
          <span>เจ้าของ (Owner)</span>
        </span>
      );
    case 'admin':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          <span>ผู้ดูแล (Admin)</span>
        </span>
      );
    case 'contributor':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
          <span>ผู้ร่วมจัดเก็บ (Contributor)</span>
        </span>
      );
    case 'viewer':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Eye className="h-3.5 w-3.5 text-slate-500" />
          <span>ผู้อ่าน (Viewer)</span>
        </span>
      );
  }
}
