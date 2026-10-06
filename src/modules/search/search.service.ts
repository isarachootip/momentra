import { searchRepository } from './search.repository.js';
import { tokenizerService } from './tokenizer.service.js';
import { synonymService } from './synonym.service.js';
import type { SearchQueryParams, SearchResponse } from './search.types.js';

export class SearchService {
  async search(params: SearchQueryParams): Promise<SearchResponse> {
    // 1. Detect if from_year or to_year are in Buddhist Era (e.g., 2475) and convert to C.E.
    const normalizedParams: SearchQueryParams = { ...params };
    if (normalizedParams.from_year && normalizedParams.from_year > 2400) {
      normalizedParams.from_year = normalizedParams.from_year - 543;
    }
    if (normalizedParams.to_year && normalizedParams.to_year > 2400) {
      normalizedParams.to_year = normalizedParams.to_year - 543;
    }

    // 2. Tokenize and expand query
    let tsQueryString: string | null = null;
    if (normalizedParams.q && normalizedParams.q.trim().length > 0) {
      const tokens = tokenizerService.tokenize(normalizedParams.q);
      tsQueryString = synonymService.buildExpandedQuery(tokens);
    }

    // 3. Execute repository search
    const { results, totalHits, facets } = await searchRepository.executeSearch(
      normalizedParams,
      tsQueryString
    );

    // 4. Enrich results with dual calendar display dates
    const enrichedResults = results.map((item) => {
      const startDate = new Date(item.event_start);
      const ceYear = startDate.getUTCFullYear();
      const beYear = ceYear + 543;

      const circaPrefix = item.is_circa ? 'ประมาณ ' : '';
      const circaEnPrefix = item.is_circa ? 'Circa ' : '';

      return {
        ...item,
        display_date_be: `${circaPrefix}พ.ศ. ${beYear}`,
        display_date_ce: `${circaEnPrefix}${ceYear}`,
      };
    });

    return {
      results: enrichedResults,
      total_hits: totalHits,
      facets,
      next_cursor: null,
    };
  }
}

export const searchService = new SearchService();
