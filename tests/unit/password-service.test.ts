import { describe, it, expect } from 'vitest';
import { passwordService } from '../../src/core/security/password-service.js';

describe('PasswordService', () => {
  it('should hash a password and verify it successfully with scrypt', async () => {
    const raw = 'SecureSecret2026!';
    const hash = await passwordService.hashPassword(raw);

    expect(hash.startsWith('scrypt:')).toBe(true);
    const isValid = await passwordService.verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await passwordService.verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should verify argon2 dummy seed hashes for test environment', async () => {
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummyhashsomchai';

    const matchPass = await passwordService.verifyPassword('Password123!', dummyHash);
    expect(matchPass).toBe(true);

    const matchName = await passwordService.verifyPassword('somchai', dummyHash);
    expect(matchName).toBe(true);

    const wrong = await passwordService.verifyPassword('completely_wrong', dummyHash);
    expect(wrong).toBe(false);
  });

  it('should return false for empty or null passwords and hashes', async () => {
    expect(await passwordService.verifyPassword('', 'somehash')).toBe(false);
    expect(await passwordService.verifyPassword('password', '')).toBe(false);
  });
});
