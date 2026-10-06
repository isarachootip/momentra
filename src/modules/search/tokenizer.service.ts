export class TokenizerService {
  private thaiSegmenter: Intl.Segmenter;

  constructor() {
    this.thaiSegmenter = new Intl.Segmenter('th', { granularity: 'word' });
  }

  /**
   * Tokenizes mixed Thai and English text into word tokens using V8 ICU Segmenter.
   */
  tokenize(text: string): string[] {
    if (!text || text.trim().length === 0) return [];

    const cleaned = text.trim();
    const segments = Array.from(this.thaiSegmenter.segment(cleaned));

    const tokens: string[] = [];
    for (const seg of segments) {
      if (!seg.isWordLike) continue;
      const word = seg.segment.trim();
      // Filter out single punctuation or empty tokens
      if (word.length > 0 && !/^[\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(word)) {
        tokens.push(word);
      }
    }

    return tokens;
  }

  /**
   * Builds a safe PostgreSQL tsquery string from raw user input.
   * e.g., "การเปลี่ยนแปลง 2475" -> "การ & เปลี่ยนแปลง & 2475:*"
   */
  buildTsQuery(text: string): string | null {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return null;

    // Sanitize tokens from any special tsquery operators
    const sanitized = tokens
      .map((t) => t.replace(/[&|!():*'\\]/g, ''))
      .filter((t) => t.length > 0);

    if (sanitized.length === 0) return null;

    // Last token gets prefix matching (:*) for autocomplete experience
    const queryParts = sanitized.map((t, idx) => {
      return idx === sanitized.length - 1 ? `${t}:*` : t;
    });

    return queryParts.join(' & ');
  }
}

export const tokenizerService = new TokenizerService();
