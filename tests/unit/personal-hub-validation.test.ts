import { describe, it, expect } from 'vitest';
import {
  updateProfileSchema,
  createSocialLinkSchema,
  createKmItemSchema,
} from '../../src/modules/personal/schemas/personal-hub.schema.js';

describe('Personal Hub Validation Schemas (Unit)', () => {
  describe('Username validation', () => {
    it('should accept valid usernames (lowercase, numbers, underscore, hyphen)', () => {
      const validUsernames = ['drmum', 'john_doe', 'user-123', 'somchai_hdam', 'archivist-2026'];
      for (const u of validUsernames) {
        const res = updateProfileSchema.safeParse({ username: u });
        expect(res.success).toBe(true);
      }
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'DrMum', // Uppercase
        'user@domain', // Special chars
        'user.name', // Dot
        'user name', // Space
        'ab', // Too short (< 3)
        'a'.repeat(31), // Too long (> 30)
      ];
      for (const u of invalidUsernames) {
        const res = updateProfileSchema.safeParse({ username: u });
        expect(res.success).toBe(false);
      }
    });
  });

  describe('Social link validation', () => {
    it('should accept valid social link with official/personal grouping', () => {
      const res = createSocialLinkSchema.safeParse({
        platform: 'youtube',
        label: 'ช่องทางการ YouTube',
        url: 'https://youtube.com/@drmum',
        linkGroup: 'official',
        visibility: 'public',
      });
      expect(res.success).toBe(true);
    });

    it('should reject empty label or URL', () => {
      const res1 = createSocialLinkSchema.safeParse({
        platform: 'facebook',
        label: '   ',
        url: 'https://facebook.com',
      });
      expect(res1.success).toBe(false);

      const res2 = createSocialLinkSchema.safeParse({
        platform: 'facebook',
        label: 'Facebook',
        url: '   ',
      });
      expect(res2.success).toBe(false);
    });
  });

  describe('KM Item validation', () => {
    it('should accept valid KM item with category and date', () => {
      const res = createKmItemSchema.safeParse({
        title: 'ประวัติศาสตร์การแพทย์แผนไทย',
        kmCategory: 'article',
        eventDate: '2023-05-12',
        datePrecision: 'day',
        isCirca: false,
        summary: 'บันทึกสำคัญเกี่ยวกับตำรายาโบราณ',
        visibility: 'public',
      });
      expect(res.success).toBe(true);
    });

    it('should default visibility to private and category to note', () => {
      const res = createKmItemSchema.safeParse({
        title: 'บันทึกส่วนตัว',
        eventDate: '2024',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.visibility).toBe('private');
        expect(res.data.kmCategory).toBe('note');
      }
    });
  });
});
