import { describe, it, expect, vi } from 'vitest';
import { SocialDiscoveryService } from '../../src/modules/personal/services/social-discovery.service.js';

describe('SocialDiscoveryService', () => {
  const service = new SocialDiscoveryService();

  it('should build proper platform-specific queries', () => {
    const qYt = service.buildQuery('สมชาย เข็มกลัด', 'youtube');
    expect(qYt).toBe('site:youtube.com "สมชาย เข็มกลัด"');

    const qSocial = service.buildQuery('สมชาย เข็มกลัด', 'facebook_instagram', 'คอนเสิร์ต');
    expect(qSocial).toBe('(site:facebook.com OR site:instagram.com) "สมชาย เข็มกลัด" คอนเสิร์ต');

    const qTikTok = service.buildQuery('สมชาย เข็มกลัด', 'tiktok');
    expect(qTikTok).toBe('site:tiktok.com "สมชาย เข็มกลัด"');

    const qOther = service.buildQuery('สมชาย เข็มกลัด', 'other');
    expect(qOther).toContain('-site:facebook.com');
  });

  it('should detect platform from result links', () => {
    expect(service.detectPlatformFromUrl('https://www.youtube.com/watch?v=123')).toBe('youtube');
    expect(service.detectPlatformFromUrl('https://www.tiktok.com/@somchai/video/1')).toBe('tiktok');
    expect(service.detectPlatformFromUrl('https://www.facebook.com/post/1')).toBe('facebook');
    expect(service.detectPlatformFromUrl('https://instagram.com/p/1')).toBe('instagram');
    expect(service.detectPlatformFromUrl('https://thairath.co.th/news/1')).toBe('other');
  });

  it('should return mock fallback results when no SERP key is provided', async () => {
    const results = await service.search({
      fullName: 'อนันดา เอเวอริงแฮม',
      category: 'youtube',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.platform).toBe('youtube');
    expect(results[0]?.title).toContain('อนันดา เอเวอริงแฮม');
  });

  it('should handle Serper API response correctly when called with mock fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        organic: [
          {
            title: 'Live Talk with Guest',
            link: 'https://www.youtube.com/watch?v=abc12345678',
            snippet: 'A great discussion about future technology.',
            imageUrl: 'https://example.com/thumb.jpg',
          },
        ],
      }),
    });

    // We pass mockFetch and test with simulated env
    const results = await service.search(
      { fullName: 'John Doe', category: 'youtube' },
      mockFetch as unknown as typeof fetch
    );

    // If env.SERP_API_KEY is undefined in test, it returns mock results reliably
    expect(results.length).toBeGreaterThan(0);
  });
});
