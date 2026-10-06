import { describe, it, expect } from 'vitest';
import { resolveLocale, getErrorMessage, getSystemMessage } from '../../src/core/i18n/index.js';

describe('i18n Module', () => {
  it('should resolve Thai locale by default or when th is requested', () => {
    expect(resolveLocale()).toBe('th');
    expect(resolveLocale('th-TH,th;q=0.9')).toBe('th');
  });

  it('should resolve English locale when en header is provided', () => {
    expect(resolveLocale('en-US,en;q=0.8')).toBe('en');
    expect(resolveLocale('fr-FR,en;q=0.5')).toBe('en');
  });

  it('should return system messages in Thai and English', () => {
    expect(getSystemMessage('HEALTH_OK', 'th')).toBe('ระบบทำงานเป็นปกติ');
    expect(getSystemMessage('HEALTH_OK', 'en')).toBe('System is operating normally');
    expect(getSystemMessage('DB_CONNECTED', 'en')).toBe('Database connection healthy');
  });

  it('should return localized error messages', () => {
    expect(getErrorMessage('INVALID_CREDENTIALS', 'th')).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    expect(getErrorMessage('INVALID_CREDENTIALS', 'en')).toBe('Invalid email or password');
  });
});
