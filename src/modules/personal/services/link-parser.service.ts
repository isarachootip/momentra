import { assertSafeUrl } from '../../../core/security/ssrf-guard.js';

export type PlatformType = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'other';

export interface ParsedLinkMetadata {
  url: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  platform: PlatformType;
  embedHtml: string | null;
  authorName: string | null;
  suggestedEventDate: string | null;
  datePrecision: 'year' | 'month' | 'day' | 'datetime';
}

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  html?: string;
  thumbnail_url?: string;
}

export class LinkParserService {
  public detectPlatform(hostname: string): PlatformType {
    const host = hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
    if (host.includes('instagram.com')) return 'instagram';
    return 'other';
  }

  public parseMetaTags(html: string): Record<string, string> {
    const metaMap: Record<string, string> = {};
    const metaRegex = /<meta\s+(?:[^>]*?\s+)?(?:name|property)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = metaRegex.exec(html)) !== null) {
      const key = match[1]?.toLowerCase();
      const val = match[2];
      if (key && val !== undefined) {
        metaMap[key] = val;
      }
    }
    return metaMap;
  }

  public extractHtmlTitle(html: string): string | null {
    const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
    return titleMatch?.[1]?.trim() ?? null;
  }

  public normalizeEventDate(dateString?: string | null): { date: string | null; precision: 'day' | 'year' } {
    if (!dateString) return { date: null, precision: 'year' };
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return { date: null, precision: 'year' };
    return { date: parsed.toISOString().split('T')[0] ?? null, precision: 'day' };
  }

  public buildSafeEmbedHtml(platform: PlatformType, url: string, oEmbedHtml?: string): string | null {
    if (platform === 'youtube') {
      const videoIdMatch = /(?:v=|\/embed\/|\/watch\?v=|youtu\.be\/|\/v\/)([\w-]{11})/.exec(url);
      if (videoIdMatch?.[1]) {
        const vid = videoIdMatch[1];
        return `<iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
      }
    }
    if (platform === 'tiktok' && oEmbedHtml) {
      return oEmbedHtml;
    }
    return oEmbedHtml ?? null;
  }

  public async parseLink(rawUrl: string, fetchFn: typeof fetch = fetch): Promise<ParsedLinkMetadata> {
    const safeUrl = await assertSafeUrl(rawUrl);
    const platform = this.detectPlatform(safeUrl.hostname);

    let oembed: OEmbedResponse | null = null;
    if (platform === 'youtube') {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(rawUrl)}&format=json`;
        const res = await fetchFn(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) oembed = (await res.json()) as OEmbedResponse;
      } catch {
        // Fallback to direct page parsing
      }
    } else if (platform === 'tiktok') {
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(rawUrl)}`;
        const res = await fetchFn(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) oembed = (await res.json()) as OEmbedResponse;
      } catch {
        // Fallback to direct page parsing
      }
    }

    let pageHtml = '';
    try {
      const res = await fetchFn(safeUrl.toString(), {
        headers: { 'User-Agent': 'MomentraBot/1.0 (+https://momentra.app)' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) pageHtml = await res.text();
    } catch {
      // Continue with oembed or minimal metadata
    }

    const meta = this.parseMetaTags(pageHtml);
    const title =
      oembed?.title ||
      meta['og:title'] ||
      meta['twitter:title'] ||
      this.extractHtmlTitle(pageHtml) ||
      safeUrl.hostname;

    const description = meta['og:description'] || meta['twitter:description'] || meta['description'] || null;
    const thumbnailUrl = oembed?.thumbnail_url || meta['og:image'] || meta['twitter:image'] || null;
    const authorName = oembed?.author_name || meta['author'] || meta['og:site_name'] || null;
    const rawDate = meta['article:published_time'] || meta['og:published_time'] || meta['date'] || null;
    const { date, precision } = this.normalizeEventDate(rawDate);
    const embedHtml = this.buildSafeEmbedHtml(platform, rawUrl, oembed?.html);

    return {
      url: safeUrl.toString(),
      title,
      description,
      thumbnailUrl,
      platform,
      embedHtml,
      authorName,
      suggestedEventDate: date,
      datePrecision: precision,
    };
  }
}

export const linkParserService = new LinkParserService();
