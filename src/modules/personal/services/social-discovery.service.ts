import { env } from '../../../config/env.js';

export type DiscoveryPlatformCategory = 'facebook_instagram' | 'youtube' | 'tiktok' | 'other';

export interface SocialCandidateItem {
  id: string;
  title: string;
  url: string;
  snippet: string;
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'other';
  authorName?: string | undefined;
  thumbnailUrl?: string | undefined;
}

export interface DiscoveryRequest {
  fullName: string;
  category?: DiscoveryPlatformCategory | undefined;
  keywords?: string | undefined;
}

export class SocialDiscoveryService {
  public buildQuery(fullName: string, category: DiscoveryPlatformCategory = 'youtube', keywords?: string): string {
    const cleanName = fullName.trim();
    const extra = keywords ? ` ${keywords.trim()}` : '';

    switch (category) {
      case 'facebook_instagram':
        return `(site:facebook.com OR site:instagram.com) "${cleanName}"${extra}`;
      case 'youtube':
        return `site:youtube.com "${cleanName}"${extra}`;
      case 'tiktok':
        return `site:tiktok.com "${cleanName}"${extra}`;
      case 'other':
      default:
        return `"${cleanName}" -site:facebook.com -site:instagram.com -site:youtube.com -site:tiktok.com${extra}`;
    }
  }

  public detectPlatformFromUrl(url: string): 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'other' {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
    if (lower.includes('instagram.com')) return 'instagram';
    return 'other';
  }

  public generateMockResults(fullName: string, category: DiscoveryPlatformCategory): SocialCandidateItem[] {
    const clean = fullName.trim();
    if (category === 'youtube') {
      return [
        {
          id: 'yt-1',
          title: `${clean} - สัมภาษณ์พิเศษ: จุดเริ่มต้นและแรงบันดาลใจ`,
          url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
          snippet: `รับชมบทสัมภาษณ์เรื่องราวชีวิตและเส้นทางประวัติศาสตร์ของ ${clean}`,
          platform: 'youtube',
          authorName: 'Momentra Channel',
          thumbnailUrl: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=400&q=80',
        },
        {
          id: 'yt-2',
          title: `บันทึกภาพเหตุการณ์สำคัญกับ ${clean}`,
          url: `https://www.youtube.com/watch?v=jNQXAC9IVRw`,
          snippet: `ไฮไลต์ผลงานและความสำเร็จตลอดช่วงเวลาที่ผ่านมาของ ${clean}`,
          platform: 'youtube',
          authorName: 'Archive Spotlight',
          thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
        },
      ];
    }

    if (category === 'tiktok') {
      return [
        {
          id: 'tt-1',
          title: `เรื่องราว 1 นาทีกับ ${clean}`,
          url: `https://www.tiktok.com/@momentra/video/7100000000000000000`,
          snippet: `เรื่องเล่าสั้นๆ และข้อคิดจากชีวิตของ ${clean}`,
          platform: 'tiktok',
          authorName: `@${clean.toLowerCase().replace(/\s+/g, '')}`,
        },
      ];
    }

    if (category === 'facebook_instagram') {
      return [
        {
          id: 'fb-1',
          title: `ภาพกิจกรรมและความทรงจำ: ${clean}`,
          url: `https://www.facebook.com/momentra.official/posts/101`,
          snippet: `ภาพบรรยากาศงานเฉลิมฉลองและก้าวสำคัญของ ${clean}`,
          platform: 'facebook',
        },
        {
          id: 'ig-1',
          title: `Instagram Post by ${clean}`,
          url: `https://www.instagram.com/p/Cxyz1234/`,
          snippet: `บันทึกภาพช่วงเวลาพิเศษผ่านเลนส์กล้องของ ${clean}`,
          platform: 'instagram',
        },
      ];
    }

    return [
      {
        id: 'web-1',
        title: `บทความชีวประวัติและผลงาน: ${clean}`,
        url: `https://example.com/biography/${encodeURIComponent(clean)}`,
        snippet: `สรุปเส้นทางการทำงานและไทม์ไลน์ความสำเร็จของ ${clean}`,
        platform: 'other',
      },
    ];
  }

  public async search(
    req: DiscoveryRequest,
    fetchFn: typeof fetch = fetch
  ): Promise<SocialCandidateItem[]> {
    const category = req.category ?? 'youtube';
    const query = this.buildQuery(req.fullName, category, req.keywords);

    if (!env.SERP_API_KEY) {
      return this.generateMockResults(req.fullName, category);
    }

    try {
      const res = await fetchFn('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': env.SERP_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10 }),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return this.generateMockResults(req.fullName, category);
      }

      const data = (await res.json()) as {
        organic?: Array<{ title: string; link: string; snippet: string; imageUrl?: string }>;
      };

      if (!data.organic || data.organic.length === 0) {
        return this.generateMockResults(req.fullName, category);
      }

      return data.organic.map((item, idx) => ({
        id: `serp-${idx}`,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        platform: this.detectPlatformFromUrl(item.link),
        thumbnailUrl: item.imageUrl,
      }));
    } catch {
      return this.generateMockResults(req.fullName, category);
    }
  }
}

export const socialDiscoveryService = new SocialDiscoveryService();
