'use client';

import React from 'react';
import type { SocialLink } from '@/types/personal-hub';
import { ExternalLink, Youtube, Facebook, Instagram, Linkedin, Mail, Globe, Send, MessageCircle } from 'lucide-react';

interface HubLinksProps {
  officialLinks: SocialLink[];
  personalLinks: SocialLink[];
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'youtube': return <Youtube className="h-4 w-4 text-red-600" />;
    case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
    case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
    case 'linkedin': return <Linkedin className="h-4 w-4 text-sky-700" />;
    case 'email': return <Mail className="h-4 w-4 text-amber-600" />;
    case 'line': return <MessageCircle className="h-4 w-4 text-emerald-600" />;
    case 'x': return <Send className="h-4 w-4 text-slate-800" />;
    default: return <Globe className="h-4 w-4 text-slate-600" />;
  }
}

export function HubLinks({ officialLinks, personalLinks }: HubLinksProps) {
  if (officialLinks.length === 0 && personalLinks.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Official Channels */}
      {officialLinks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span className="text-base">🏛️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ช่องทางทางการ (Official Channels)</h3>
          </div>
          <div className="space-y-2">
            {officialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-rose-50/40 hover:border-rose-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-white p-2 shadow-xs border border-slate-100">
                    {getPlatformIcon(link.platform)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-rose-900 transition-colors">{link.label}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{link.platform}</div>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-800 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Personal Channels */}
      {personalLinks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <span className="text-base">👤</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ช่องทางส่วนตัว (Personal Channels)</h3>
          </div>
          <div className="space-y-2">
            {personalLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-sky-50/40 hover:border-sky-200 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-white p-2 shadow-xs border border-slate-100">
                    {getPlatformIcon(link.platform)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-sky-900 transition-colors">{link.label}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{link.platform}</div>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-sky-800 group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
