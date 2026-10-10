import net from 'node:net';
import dns from 'node:dns/promises';
import { ValidationError } from '../errors/app-error.js';

/**
 * Checks whether an IPv4 address falls within private, loopback, or link-local ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  if (net.isIP(ip) !== 4) return false;

  const parts = ip.split('.').map(Number);
  const [b0, b1] = parts;
  if (b0 === undefined || b1 === undefined) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;
  // 0.0.0.0/8 (Broadcast/Current network)
  if (b0 === 0) return true;
  // 10.0.0.0/8 (RFC 1918 Private)
  if (b0 === 10) return true;
  // 172.16.0.0/12 (RFC 1918 Private: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  // 192.168.0.0/16 (RFC 1918 Private)
  if (b0 === 192 && b1 === 168) return true;
  // 169.254.0.0/16 (Link-local & AWS/GCP Cloud Metadata)
  if (b0 === 169 && b1 === 254) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is loopback, unique local, or link-local.
 */
function isPrivateIPv6(ip: string): boolean {
  if (net.isIP(ip) !== 6) return false;

  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  // Unique local addresses fc00::/7
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local addresses fe80::/10
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb')
  ) {
    return true;
  }

  return false;
}

/**
 * Asserts that the provided URL is safe from SSRF attacks.
 * Verifies protocols (HTTP/HTTPS only) and ensures destination is not loopback/private/metadata.
 */
export async function assertSafeUrl(urlString: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new ValidationError('The provided URL is malformed or invalid.');
  }

  // 1. Enforce HTTP/HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ValidationError(
      `Protocol "${parsed.protocol}" is not allowed. Only HTTP and HTTPS are supported.`
    );
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // 2. Reject obvious localhost / loopback names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    throw new ValidationError(
      'Access to local or internal network hostnames is prohibited.'
    );
  }

  // 3. Check if hostname is direct IP literal
  if (isPrivateIPv4(hostname) || isPrivateIPv6(hostname)) {
    throw new ValidationError(
      'Direct requests to private or internal IP addresses are prohibited.'
    );
  }

  // 4. Resolve DNS to verify underlying IP addresses for domain names
  if (net.isIP(hostname) === 0) {
    try {
      const lookupResults = await dns.lookup(hostname, { all: true });
      for (const record of lookupResults) {
        if (record.family === 4 && isPrivateIPv4(record.address)) {
          throw new ValidationError(
            `Hostname "${hostname}" resolves to a restricted private IP (${record.address}).`
          );
        }
        if (record.family === 6 && isPrivateIPv6(record.address)) {
          throw new ValidationError(
            `Hostname "${hostname}" resolves to a restricted private IPv6 address.`
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof ValidationError) throw err;
      throw new ValidationError(`Could not resolve hostname "${hostname}".`);
    }
  }

  return parsed;
}
