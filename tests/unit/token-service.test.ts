import { describe, it, expect } from 'vitest';
import { tokenService } from '../../src/core/security/token-service.js';

describe('TokenService', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const email = 'test@momentra.app';

  it('should generate valid access and refresh tokens', () => {
    const { tokens, refreshExpiresAt } = tokenService.generateTokenPair(userId, email);

    expect(tokens.token_type).toBe('Bearer');
    expect(tokens.expires_in).toBe(900);
    expect(tokens.access_token).toBeDefined();
    expect(tokens.refresh_token).toBeDefined();
    expect(refreshExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should verify a valid access token', () => {
    const { tokens } = tokenService.generateTokenPair(userId, email);
    const payload = tokenService.verifyJwt(tokens.access_token, 'access');

    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.type).toBe('access');
  });

  it('should verify a valid refresh token', () => {
    const { tokens } = tokenService.generateTokenPair(userId, email);
    const payload = tokenService.verifyJwt(tokens.refresh_token, 'refresh');

    expect(payload.sub).toBe(userId);
    expect(payload.email).toBe(email);
    expect(payload.type).toBe('refresh');
  });

  it('should reject a token with wrong expected type', () => {
    const { tokens } = tokenService.generateTokenPair(userId, email);
    expect(() => tokenService.verifyJwt(tokens.access_token, 'refresh')).toThrow(
      'Invalid token type: expected refresh'
    );
  });

  it('should reject a tampered token signature', () => {
    const { tokens } = tokenService.generateTokenPair(userId, email);
    const tampered = `${tokens.access_token.slice(0, -5)}abcde`;
    expect(() => tokenService.verifyJwt(tampered, 'access')).toThrow(
      'Invalid token signature'
    );
  });

  it('should reject a malformed token', () => {
    expect(() => tokenService.verifyJwt('invalid.token', 'access')).toThrow(
      'Malformed token'
    );
  });

  it('should correctly hash a token with SHA-256', () => {
    const hash1 = tokenService.hashToken('my-secret-token');
    const hash2 = tokenService.hashToken('my-secret-token');
    const hash3 = tokenService.hashToken('different-token');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });
});
