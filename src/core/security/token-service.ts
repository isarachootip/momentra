import { createHmac, createHash, randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import type { JwtPayload, AuthTokens } from '../../modules/auth/auth.types.js';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

export class TokenService {
  private readonly secret = env.JWT_SECRET;
  private readonly accessExpiresSec = 15 * 60; // 15 mins
  private readonly refreshExpiresSec = env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60;

  generateTokenPair(userId: string, email: string): { tokens: AuthTokens; refreshExpiresAt: Date } {
    const now = Math.floor(Date.now() / 1000);
    const accessExp = now + this.accessExpiresSec;
    const refreshExp = now + this.refreshExpiresSec;

    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
      jti: randomUUID(),
      iat: now,
      exp: accessExp,
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
      jti: randomUUID(),
      iat: now,
      exp: refreshExp,
    };

    const accessToken = this.signJwt(accessPayload);
    const refreshToken = this.signJwt(refreshPayload);

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: this.accessExpiresSec,
      },
      refreshExpiresAt: new Date(refreshExp * 1000),
    };
  }

  verifyJwt(token: string, expectedType?: 'access' | 'refresh'): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSig = this.createSignature(`${headerB64}.${payloadB64}`);

    if (signatureB64 !== expectedSig) {
      throw new Error('Invalid token signature');
    }

    const payloadJson = base64UrlDecode(payloadB64!);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    if (expectedType && payload.type !== expectedType) {
      throw new Error(`Invalid token type: expected ${expectedType}`);
    }

    return payload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private signJwt(payload: JwtPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signatureB64 = this.createSignature(`${headerB64}.${payloadB64}`);
    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  private createSignature(input: string): string {
    return createHmac('sha256', this.secret)
      .update(input)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

export const tokenService = new TokenService();
