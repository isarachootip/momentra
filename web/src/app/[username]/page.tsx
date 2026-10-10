'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PublicProfileInfo, SocialLink, KmItem } from '@/types/personal-hub';
import { HubHeader } from '@/components/personal-hub/hub-header';
import { HubLinks } from '@/components/personal-hub/hub-links';
import { HubKmTimeline } from '@/components/personal-hub/hub-km-timeline';
import { Loader2, LogIn } from 'lucide-react';

const INITIAL_PROFILE: PublicProfileInfo = {
  username: 'samran',
  fullName: 'สำราญ ศักดี',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  pageBio: 'เจ้าของคลังประวัติศาสตร์และจดหมายเหตุดิจิทัลส่วนบุคคลและครอบครัว',
  pageTemplate: 'timeline',
  pageTheme: { theme: 'dark', accent: '#3b82f6' },
  planCode: 'pro',
  officialLinks: [
    { id: '1', platform: 'youtube', label: 'Samran Channel (Official)', url: 'https://youtube.com/@samran', link_group: 'official', visibility: 'public', sort_order: 1 },
    { id: '2', platform: 'website', label: 'คลังประวัติศาสตร์และจดหมายเหตุดิจิทัล', url: 'https://samran-archive.org', link_group: 'official', visibility: 'public', sort_order: 2 },
    { id: '3', platform: 'line', label: 'LINE Official Account', url: 'https://page.line.me/samran', link_group: 'official', visibility: 'public', sort_order: 3 },
  ],
  personalLinks: [
    { id: '4', platform: 'facebook', label: 'บันทึกส่วนตัว คุณสำราญ', url: 'https://facebook.com/samran.personal', link_group: 'personal', visibility: 'public', sort_order: 4 },
  ],
};

const INITIAL_KM_ITEMS: KmItem[] = [
  { id: '1', title: 'ประวัติการค้นพบตำราแพทย์โอสถพระนารายณ์', km_category: 'article', event_start: '1985-04-12T00:00:00Z', event_end: '1985-04-12T23:59:59Z', date_precision: 'day', is_circa: false, description: 'งานวิจัยเชิงลึกเกี่ยวกับสูตรยาไทยโบราณในสมัยกรุงศรีอยุธยา', visibility: 'public', is_public: true, link_url: 'https://samran-archive.org/narai-medicine', tags: ['ประวัติศาสตร์การแพทย์', 'อยุธยา'] },
  { id: '2', title: 'คลิปบรรยายพิเศษ: สมุนไพรไทยกับการบำบัดโรคยุคใหม่', km_category: 'video', event_start: '2021-08-20T00:00:00Z', event_end: '2021-08-20T23:59:59Z', date_precision: 'day', is_circa: false, description: 'การบรรยายวิชาการ ณ โรงพยาบาลศิริราช', visibility: 'public', is_public: true, link_url: 'https://youtube.com/watch?v=sample123', tags: ['สมุนไพร', 'บรรยาย'] },
  { id: '3', title: 'ภาพถ่ายใบลานบันทึกสูตรยาโบราณ วัดพระเชตุพน', km_category: 'image', event_start: '1932-06-24T00:00:00Z', event_end: '1932-06-24T23:59:59Z', date_precision: 'day', is_circa: true, description: 'ภาพถ่ายความละเอียดสูงจากหอสมุดแห่งชาติ', visibility: 'public', is_public: true, tags: ['ใบลาน', 'ภาพถ่ายโบราณ'] },
  { id: '4', title: 'บันทึกส่วนตัว: ความคิดเห็นเบื้องต้นต่อสูตรยาเทียบเคียง', km_category: 'note', event_start: '2024-01-10T00:00:00Z', event_end: '2024-01-10T23:59:59Z', date_precision: 'day', is_circa: false, description: 'บันทึกภายในสำหรับทีมวิจัย (Private)', visibility: 'private', is_public: false, tags: ['วิจัยภายใน'] },
];

export default function PublicHubPage() {
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username : 'samran';

  const [profile, setProfile] = useState<PublicProfileInfo>(INITIAL_PROFILE);
  const [kmItems, setKmItems] = useState<KmItem[]>(INITIAL_KM_ITEMS);
  const [isOwner, setIsOwner] = useState(false);
  const [isPreviewAsVisitor, setIsPreviewAsVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the current client is the logged-in owner of this profile
    const savedUser = localStorage.getItem('momentra_hub_username') || 'samran';
    const isClientOwner = savedUser.toLowerCase() === username.toLowerCase();
    setIsOwner(isClientOwner);

    // Sync profile custom settings from localStorage if matching
    if (isClientOwner) {
      const customName = localStorage.getItem('momentra_hub_fullname');
      const customBio = localStorage.getItem('momentra_hub_bio');
      const customAvatar = localStorage.getItem('momentra_hub_avatar');
      const customLinks = localStorage.getItem('momentra_hub_links');
      const customKm = localStorage.getItem('momentra_hub_km');

      if (customName || customBio || customAvatar) {
        setProfile((prev) => ({
          ...prev,
          fullName: customName || prev.fullName,
          pageBio: customBio !== null ? customBio : prev.pageBio,
          avatarUrl: customAvatar || prev.avatarUrl,
        }));
      }
      if (customLinks) {
        try {
          const parsed = JSON.parse(customLinks) as SocialLink[];
          setProfile((prev) => ({
            ...prev,
            officialLinks: parsed.filter((l) => l.link_group === 'official'),
            personalLinks: parsed.filter((l) => l.link_group === 'personal'),
          }));
        } catch {}
      }
      if (customKm) {
        try {
          setKmItems(JSON.parse(customKm));
        } catch {}
      }
    }

    setIsLoading(false);
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-900" />
      </div>
    );
  }

  // Filter items based on visitor vs owner view
  const isViewingAsVisitor = !isOwner || isPreviewAsVisitor;

  const visibleOfficialLinks = profile.officialLinks.filter(
    (l) => !isViewingAsVisitor || l.visibility === 'public'
  );
  const visiblePersonalLinks = profile.personalLinks.filter(
    (l) => !isViewingAsVisitor || l.visibility === 'public'
  );
  const visibleKmItems = kmItems.filter(
    (i) => !isViewingAsVisitor || (i.is_public && i.visibility === 'public')
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Public Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-900 text-[10px] text-white font-black">
            M
          </span>
          <span>Momentra Public Showcase</span>
        </Link>
        {isOwner ? (
          <Link
            href="/hub"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-rose-300 transition-colors border border-slate-700"
          >
            <span>จัดการ Hub Studio</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>เข้าสู่ระบบ (Sign In)</span>
          </Link>
        )}
      </div>

      {/* 1. Header with Visitor Preview Toggle */}
      <HubHeader
        profile={{ ...profile, username }}
        isOwner={isOwner}
        isPreviewAsVisitor={isPreviewAsVisitor}
        onToggleVisitorPreview={() => setIsPreviewAsVisitor(!isPreviewAsVisitor)}
      />

      {/* 2. Official and Personal Social Channels */}
      <HubLinks
        officialLinks={visibleOfficialLinks}
        personalLinks={visiblePersonalLinks}
      />

      {/* 3. Knowledge Management (KM) Timeline */}
      <HubKmTimeline items={visibleKmItems} />
    </div>
  );
}
