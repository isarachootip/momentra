import { describe, it, expect } from 'vitest';
import { synonymService } from '../../src/modules/search/synonym.service.js';

describe('SynonymService (Unit)', () => {
  it('should expand monarch aliases (e.g. ร.5)', () => {
    const synonyms = synonymService.getSynonyms('ร.5');
    expect(synonyms).toContain('รัชกาลที่ 5');
    expect(synonyms).toContain('จุฬาลงกรณ์');
  });

  it('should expand Siamese revolution year 2475 to 1932', () => {
    const synonyms = synonymService.getSynonyms('2475');
    expect(synonyms).toContain('1932');
    expect(synonyms).toContain('อภิวัฒน์');
  });

  it('should return empty array for words without registered synonyms', () => {
    const synonyms = synonymService.getSynonyms('unknownwordxyz');
    expect(synonyms).toEqual([]);
  });

  it('should build an expanded tsquery combining original token with OR synonyms', () => {
    const query = synonymService.buildExpandedQuery(['ร.5', 'พระราชหัตถเลขา']);
    expect(query).not.toBeNull();
    expect(query).toContain('|');
    expect(query).toContain('พระราชหัตถเลขา:*');
  });
});
