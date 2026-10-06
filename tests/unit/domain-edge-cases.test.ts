import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { createHash } from 'node:crypto';

describe('Domain-Specific Historical Edge Cases (Phase 8 QA)', () => {
  // 1. Pre-1900 Historical Dates & ISO Timestamps
  describe('Pre-1900 Historical Dates Handling', () => {
    it('should correctly parse and sort dates prior to C.E. 1900', () => {
      const bowringTreatyDate = new Date('1855-04-18T00:00:00.000Z');
      const rattanakosinFoundationDate = new Date('1782-04-21T00:00:00.000Z');
      const modernDate = new Date('2026-10-05T00:00:00.000Z');

      expect(bowringTreatyDate.getUTCFullYear()).toBe(1855);
      expect(rattanakosinFoundationDate.getUTCFullYear()).toBe(1782);

      // Verify Chronological Sort Order
      const dates = [modernDate, bowringTreatyDate, rattanakosinFoundationDate];
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

      expect(sorted[0]?.getUTCFullYear()).toBe(1782);
      expect(sorted[1]?.getUTCFullYear()).toBe(1855);
      expect(sorted[2]?.getUTCFullYear()).toBe(2026);
    });
  });

  // 2. Calendar Misconfiguration Detection (B.E. entered as C.E.)
  describe('Calendar Misconfiguration Detector', () => {
    function detectProbableBEasCE(year: number): { isSuspicious: boolean; suggestedCE?: number } {
      const currentCE = new Date().getUTCFullYear();
      // If year is between 2400 and 2600, user likely typed Buddhist Era (พ.ศ.)
      if (year >= 2400 && year <= 2600 && year > currentCE + 50) {
        return {
          isSuspicious: true,
          suggestedCE: year - 543,
        };
      }
      return { isSuspicious: false };
    }

    it('should detect when user inputs B.E. 2475 into a C.E. year field', () => {
      const result = detectProbableBEasCE(2475);
      expect(result.isSuspicious).toBe(true);
      expect(result.suggestedCE).toBe(1932);
    });

    it('should not flag valid modern or historical C.E. years', () => {
      expect(detectProbableBEasCE(1932).isSuspicious).toBe(false);
      expect(detectProbableBEasCE(2026).isSuspicious).toBe(false);
      expect(detectProbableBEasCE(1782).isSuspicious).toBe(false);
    });
  });

  // 3. Rejection of event_end < event_start
  describe('Event Date Range Constraint Validator', () => {
    const itemDateRangeSchema = z
      .object({
        event_start: z.string().datetime(),
        event_end: z.string().datetime(),
      })
      .refine(
        (data) => new Date(data.event_end).getTime() >= new Date(data.event_start).getTime(),
        {
          message: 'The event_end date cannot precede event_start',
          path: ['event_end'],
        }
      );

    it('should reject when event_end is before event_start', () => {
      const invalidPayload = {
        event_start: '1932-06-24T05:00:00Z',
        event_end: '1932-06-23T05:00:00Z', // 1 day earlier!
      };

      const result = itemDateRangeSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'The event_end date cannot precede event_start'
        );
      }
    });

    it('should accept when event_end equals or exceeds event_start', () => {
      const validPayload = {
        event_start: '1932-06-24T05:00:00Z',
        event_end: '1932-06-24T18:00:00Z',
      };
      const result = itemDateRangeSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  // 4. Thai Unicode Filename Normalization
  describe('Thai Unicode Filename Normalization & Sanitization', () => {
    it('should normalize complex Thai filenames with combining tone marks to NFC', () => {
      const complexThaiName = 'พระราชพิธีพุทธาภิเษก_สมเด็จพระพุฒาจารย์(โต)_พ.ศ.๒๔๑๕.pdf';
      const normalizedNFC = complexThaiName.normalize('NFC');
      const normalizedNFD = complexThaiName.normalize('NFD');

      // NFC should preserve visual and linguistic integrity
      expect(normalizedNFC).toBe(complexThaiName);
      expect(normalizedNFC.normalize('NFC')).toBe(normalizedNFD.normalize('NFC'));
    });
  });

  // 5. Canonical URL Normalization
  describe('Canonical URL Normalization for Duplicate Prevention', () => {
    function normalizeHistoricalUrl(inputUrl: string): string {
      const parsed = new URL(inputUrl);
      parsed.protocol = parsed.protocol.toLowerCase();
      parsed.hostname = parsed.hostname.toLowerCase();

      // Strip common marketing and tracking query parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      for (const param of trackingParams) {
        parsed.searchParams.delete(param);
      }

      // Remove trailing slash from pathname if length > 1
      if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.slice(0, -1);
      }

      return parsed.toString();
    }

    it('should normalize different variations of the same URL to an identical canonical form', () => {
      const url1 = 'https://digital.nlt.go.th/archive/srikrung/';
      const url2 = 'https://digital.nlt.go.th/archive/srikrung?utm_source=facebook&utm_medium=cpc';
      const url3 = 'HTTPS://DIGITAL.NLT.GO.TH/archive/srikrung';

      const norm1 = normalizeHistoricalUrl(url1);
      const norm2 = normalizeHistoricalUrl(url2);
      const norm3 = normalizeHistoricalUrl(url3);

      expect(norm1).toBe('https://digital.nlt.go.th/archive/srikrung');
      expect(norm1).toBe(norm2);
      expect(norm1).toBe(norm3);
    });
  });

  // 6. SHA-256 Collision & Deduplication Verification
  describe('SHA-256 Checksum Deduplication Integrity', () => {
    it('should produce identical checksums for identical binary buffers regardless of filename', () => {
      const binaryContent = Buffer.from('Historical Manuscript Binary Stream Data 1932');
      const hash1 = createHash('sha256').update(binaryContent).digest('hex');
      const hash2 = createHash('sha256').update(binaryContent).digest('hex');
      const hash3 = createHash('sha256').update(Buffer.from('Different data')).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toHaveLength(64);
    });
  });
});
