export class SynonymService {
  private readonly synonymGroups: ReadonlyArray<ReadonlySet<string>> = [
    new Set(['รูป', 'ภาพ', 'ภาพถ่าย', 'รูปถ่าย', 'ฟิล์มกระจก', 'photo', 'picture', 'image']),
    new Set(['เอกสาร', 'หนังสือ', 'บันทึก', 'จดหมายเหตุ', 'จดหมาย', 'document', 'manuscript', 'archive']),
    new Set(['แผนที่', 'แผนผัง', 'ผังเมือง', 'map', 'cartography']),
    new Set(['สนธิสัญญา', 'หนังสือสัญญา', 'ข้อตกลง', 'treaty', 'agreement']),
    new Set(['รัฐธรรมนูญ', 'ธรรมนูญการปกครอง', 'constitution']),
    new Set(['การเปลี่ยนแปลงการปกครอง', 'การอภิวัฒน์สยาม', '2475', '1932', 'revolution', 'อภิวัฒน์']),
    new Set(['สยาม', 'ประเทศไทย', 'ไทย', 'thailand', 'siam']),
    new Set(['ร.5', 'รัชกาลที่ 5', 'จุฬาลงกรณ์', 'พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว']),
  ];

  /**
   * Expands a word token into known historical/archival synonyms.
   */
  expandToken(token: string): string[] {
    const lower = token.toLowerCase();
    const result = new Set<string>([token]);

    for (const group of this.synonymGroups) {
      if (group.has(token) || group.has(lower)) {
        for (const synonym of group) {
          result.add(synonym);
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Retrieves strictly alternative synonyms for a given token.
   */
  getSynonyms(token: string): string[] {
    const expanded = this.expandToken(token);
    return expanded.filter((t) => t.toLowerCase() !== token.toLowerCase());
  }

  /**
   * Builds an expanded tsquery with OR operators for synonyms.
   * Ensures safe syntax for PostgreSQL to_tsquery (no unescaped spaces or invalid prefix operators).
   */
  buildExpandedQuery(tokens: string[]): string | null {
    if (tokens.length === 0) return null;

    const parts = tokens.map((token, idx) => {
      const isLast = idx === tokens.length - 1;
      const synonyms = this.expandToken(token);

      const formatted = synonyms
        .map((s) => {
          const cleanS = s.trim().replace(/[&|!():*'\\]/g, '');
          if (!cleanS) return null;
          if (cleanS.includes(' ')) {
            return `(${cleanS.split(/\s+/).join(' & ')})`;
          }
          return isLast ? `${cleanS}:*` : cleanS;
        })
        .filter((s): s is string => s !== null);

      if (formatted.length === 0) return token;
      if (formatted.length === 1) return formatted[0];
      return `(${formatted.join(' | ')})`;
    });

    const validParts = parts.filter(Boolean);
    return validParts.length > 0 ? validParts.join(' & ') : null;
  }
}

export const synonymService = new SynonymService();
