'use client';

import React from 'react';
import type { PublicProfileInfo } from '@/types/personal-hub';
import { Eye, Shield, Sparkles, UserCheck } from 'lucide-react';

interface HubHeaderProps {
  profile: PublicProfileInfo;
  isOwner: boolean;
  isPreviewAsVisitor: boolean;
  onToggleVisitorPreview: () => void;
}

export function HubHeader({
  profile,
  isOwner,
  isPreviewAsVisitor,
  onToggleVisitorPreview,
}: HubHeaderProps) {
  const tierName = profile.planCode === 'organization' ? 'Organization' : profile.planCode === 'pro' ? 'Pro Member' : 'Free Starter';
  const tierBadgeColor = profile.planCode === 'organization' ? 'bg-purple-100 text-purple-900 border-purple-200' : profile.planCode === 'pro' ? 'bg-amber-100 text-amber-900 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="space-y-4">
      {/* Owner Preview Toolbar */}
      {isOwner && (
        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white shadow-md">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>คุณกำลังดูในฐานะ: <strong>{isPreviewAsVisitor ? 'ผู้เยี่ยมชมทั่วไป (Visitor)' : 'เจ้าของบัญชี (Owner)'}</strong></span>
          </div>
          <button
            onClick={onToggleVisitorPreview}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
              isPreviewAsVisitor
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            {isPreviewAsVisitor ? 'สลับกลับโหมดเจ้าของ' : 'ดูแบบผู้เยี่ยมชม'}
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={profile.fullName}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-rose-50 shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-xs">
            <span className="flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">{profile.fullName}</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${tierBadgeColor}`}>
              <Sparkles className="h-3 w-3" />
              {tierName}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">@{profile.username}</div>
          {profile.pageBio && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {profile.pageBio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
