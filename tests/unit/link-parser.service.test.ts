import { describe, it, expect, vi } from 'vitest';
import { LinkParserService } from '../../src/modules/personal/services/link-parser.service.js';

describe('LinkParserService', () => {
  const service = new LinkParserService();

  it('should detect social platforms correctly', () => {
    expect(service.detectPlatform('www.youtube.com')).toBe('youtube');
    expect(service.detectPlatform('youtu.be')).toBe('youtube');
    expect(service.detectPlatform('www.tiktok.com')).toBe('tiktok');
    expect(service.detectPlatform('facebook.com')).toBe('facebook');
    expect(service.detectPlatform('www.instagram.com')).toBe('instagram');
    expect(service.detectPlatform('example.com')).toBe('other');
  });

  it('should parse OpenGraph and Twitter meta tags', () => {
    const html = `
      <html>
        <head>
          <title>Default Page Title</title>
          <meta property="og:title" content="OpenGraph Title" />
          <meta property="og:description" content="A brief summary of life events." />
          <meta property="og:image" content="https://example.com/thumb.jpg" />
          <meta property="article:published_time" content="2024-05-12T10:00:00Z" />
        </head>
      </html>
    `;
    const meta = service.parseMetaTags(html);
    expect(meta['og:title']).toBe('OpenGraph Title');
    expect(meta['og:description']).toBe('A brief summary of life events.');
    expect(meta['og:image']).toBe('https://example.com/thumb.jpg');
    expect(meta['article:published_time']).toBe('2024-05-12T10:00:00Z');
  });

  it('should extract HTML title as fallback', () => {
    const html = '<html><head><title>My Historical Story</title></head></html>';
    expect(service.extractHtmlTitle(html)).toBe('My Historical Story');
  });

  it('should normalize event date correctly', () => {
    const res1 = service.normalizeEventDate('2023-11-20T14:30:00Z');
    expect(res1.date).toBe('2023-11-20');
    expect(res1.precision).toBe('day');

    const res2 = service.normalizeEventDate(null);
    expect(res2.date).toBeNull();
  });

  it('should build safe YouTube embed player', () => {
    const embed = service.buildSafeEmbedHtml('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(embed).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(embed).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"');
  });

  it('should parse a YouTube link with mocked oEmbed', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('youtube.com/oembed')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            title: 'Never Gonna Give You Up',
            author_name: 'Rick Astley',
            thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: async () => '<html><head><title>Rick Astley</title></head></html>',
      });
    });

    const parsed = await service.parseLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ', mockFetch as unknown as typeof fetch);
    expect(parsed.platform).toBe('youtube');
    expect(parsed.title).toBe('Never Gonna Give You Up');
    expect(parsed.authorName).toBe('Rick Astley');
    expect(parsed.embedHtml).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });
});
