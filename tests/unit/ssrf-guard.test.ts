import { describe, it, expect } from 'vitest';
import { assertSafeUrl } from '../../src/core/security/ssrf-guard.js';

describe('SSRF Guard Security Helper', () => {
  it('should accept valid public URLs', async () => {
    const safeUrl1 = await assertSafeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(safeUrl1.hostname).toBe('www.youtube.com');

    const safeUrl2 = await assertSafeUrl('https://www.tiktok.com/@tiktok/video/123456');
    expect(safeUrl2.hostname).toBe('www.tiktok.com');
  });

  it('should reject invalid or non-http protocols', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow('Only HTTP and HTTPS are supported');
    await expect(assertSafeUrl('ftp://ftp.example.com/file.txt')).rejects.toThrow('Only HTTP and HTTPS are supported');
    await expect(assertSafeUrl('javascript:alert(1)')).rejects.toThrow();
    await expect(assertSafeUrl('not a url')).rejects.toThrow('malformed or invalid');
  });

  it('should reject localhost and loopback hostnames', async () => {
    await expect(assertSafeUrl('http://localhost:3000')).rejects.toThrow('local or internal network');
    await expect(assertSafeUrl('http://sub.localhost:8080')).rejects.toThrow('local or internal network');
    await expect(assertSafeUrl('http://server.local/api')).rejects.toThrow('local or internal network');
    await expect(assertSafeUrl('http://service.internal/secret')).rejects.toThrow('local or internal network');
  });

  it('should reject direct private IPv4 addresses', async () => {
    // 127.0.0.1
    await expect(assertSafeUrl('http://127.0.0.1/admin')).rejects.toThrow('private or internal IP');
    // 10.x.x.x
    await expect(assertSafeUrl('http://10.0.0.1/config')).rejects.toThrow('private or internal IP');
    // 172.16.x.x
    await expect(assertSafeUrl('http://172.16.0.10:8000')).rejects.toThrow('private or internal IP');
    // 192.168.x.x
    await expect(assertSafeUrl('http://192.168.1.1/setup')).rejects.toThrow('private or internal IP');
    // Cloud Metadata 169.254.169.254
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow('private or internal IP');
  });

  it('should reject direct IPv6 loopback addresses', async () => {
    await expect(assertSafeUrl('http://[::1]:8080/')).rejects.toThrow('private or internal IP');
  });
});
