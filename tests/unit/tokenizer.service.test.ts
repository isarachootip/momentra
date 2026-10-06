import { describe, it, expect } from 'vitest';
import { tokenizerService } from '../../src/modules/search/tokenizer.service.js';

describe('TokenizerService (Unit)', () => {
  it('should segment Thai historical phrases correctly', () => {
    const tokens = tokenizerService.tokenize('การเปลี่ยนแปลงการปกครอง 2475');
    expect(tokens).toContain('การ');
    expect(tokens).toContain('เปลี่ยนแปลง');
    expect(tokens).toContain('ปกครอง');
    expect(tokens).toContain('2475');
  });

  it('should segment long royal titles without error', () => {
    const tokens = tokenizerService.tokenize('พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว');
    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens).toContain('พระบาท');
    expect(tokens).toContain('สมเด็จ');
    expect(tokens).toContain('จุลจอมเกล้า');
  });

  it('should segment English words and punctuation properly', () => {
    const tokens = tokenizerService.tokenize('Historical Digital Asset Management (HDAM)');
    expect(tokens).toEqual(['Historical', 'Digital', 'Asset', 'Management', 'HDAM']);
  });

  it('should handle mixed Thai and English queries', () => {
    const tokens = tokenizerService.tokenize('บันทึกสนธิสัญญา Bowring Treaty พ.ศ. 2398');
    expect(tokens).toContain('บันทึก');
    expect(tokens).toContain('สนธิ');
    expect(tokens).toContain('สัญญา');
    expect(tokens).toContain('Bowring');
    expect(tokens).toContain('Treaty');
    expect(tokens).toContain('2398');
  });

  it('should strip special tsquery characters in buildTsQuery', () => {
    const query = tokenizerService.buildTsQuery("เอกสาร & 'ลับมาก' | (2475)!");
    expect(query).not.toBeNull();
    expect(query).not.toContain('& &');
    expect(query).not.toContain('!');
    expect(query).not.toContain('(');
    expect(query).not.toContain(')');
    expect(query?.endsWith(':*')).toBe(true);
  });

  it('should return null for empty or whitespace-only inputs', () => {
    expect(tokenizerService.buildTsQuery('')).toBeNull();
    expect(tokenizerService.buildTsQuery('    ')).toBeNull();
    expect(tokenizerService.buildTsQuery('...,,,')).toBeNull();
  });
});
