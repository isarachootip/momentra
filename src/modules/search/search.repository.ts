import { pool } from '../../db/pool.js';
import type { SearchQueryParams, SearchResultItem, SearchFacets } from './search.types.js';

export class SearchRepository {
  async executeSearch(
    params: SearchQueryParams,
    tsQueryString: string | null
  ): Promise<{ results: SearchResultItem[]; totalHits: number; facets: SearchFacets }> {
    const values: unknown[] = [];
    let paramIdx = 1;

    // Conditions
    const conditions: string[] = ['deleted_at IS NULL'];

    if (params.workspaceId) {
      conditions.push(`workspace_id = $${paramIdx++}`);
      values.push(params.workspaceId);
    }

    if (params.type) {
      conditions.push(`type = $${paramIdx++}`);
      values.push(params.type);
    }

    if (params.circa !== undefined) {
      conditions.push(`is_circa = $${paramIdx++}`);
      values.push(params.circa);
    }

    // Date range filtering (GiST range overlap &&)
    if (params.from_year || params.to_year) {
      const fromYear = params.from_year ?? 1;
      const toYear = params.to_year ?? 9999;
      const fromDate = `${fromYear}-01-01T00:00:00Z`;
      const toDate = `${toYear}-12-31T23:59:59Z`;
      conditions.push(`event_time_range && tstzrange($${paramIdx++}, $${paramIdx++}, '[]')`);
      values.push(fromDate, toDate);
    }

    // Text search condition (Hybrid FTS + Trigram Substring for non-spaced Thai)
    let rankExpr = '1.0';
    let headlineExpr = "COALESCE(description, '')";
    if (tsQueryString) {
      const qParam = paramIdx++;
      values.push(tsQueryString);
      const likeParam = paramIdx++;
      values.push(`%${params.q ?? ''}%`);
      conditions.push(
        `(search_vector @@ to_tsquery('simple', $${qParam}) OR title ILIKE $${likeParam} OR description ILIKE $${likeParam} OR dublin_core::text ILIKE $${likeParam} OR location::text ILIKE $${likeParam} OR id IN (SELECT ie.item_id FROM item_entities ie JOIN entities e ON ie.entity_id = e.id WHERE e.name ILIKE $${likeParam}))`
      );
      rankExpr = `(CASE WHEN title ILIKE $${likeParam} THEN 3.0 ELSE 1.0 END)`;
      headlineExpr = `COALESCE(description, title)`;
    }

    const whereClause = conditions.join(' AND ');

    // 1. Query Results
    const limit = params.limit ?? 20;
    const query = `
      SELECT 
        id, workspace_id, type, title, description,
        event_start, event_end, date_precision, is_circa, sort_key,
        dublin_core, created_at, updated_at,
        ${rankExpr} AS relevance_score,
        ${headlineExpr} AS headline_description
      FROM items
      WHERE ${whereClause}
      ORDER BY ${params.sort === 'relevance' && tsQueryString ? 'relevance_score DESC' : 'event_start ASC'}
      LIMIT $${paramIdx++};
    `;
    const whereParams = [...values];
    values.push(limit);

    const resultPromise = pool.query<SearchResultItem>(query, values);

    // 2. Query Facets (Types and Years)
    const facetQuery = `
      SELECT 
        type,
        EXTRACT(YEAR FROM event_start)::TEXT AS year,
        COUNT(*) AS count
      FROM items
      WHERE ${whereClause}
      GROUP BY GROUPING SETS ((type), (EXTRACT(YEAR FROM event_start)));
    `;

    const [searchRes, facetRes] = await Promise.all([
      resultPromise,
      pool.query<{ type: string | null; year: string | null; count: string }>(facetQuery, whereParams).catch(() => ({ rows: [] })),
    ]);

    const facets: SearchFacets = {
      types: [],
      tags: [],
      years: [],
    };

    for (const row of facetRes.rows) {
      if (row.type) {
        facets.types.push({ key: row.type, count: parseInt(row.count, 10) });
      } else if (row.year) {
        facets.years.push({ key: row.year, count: parseInt(row.count, 10) });
      }
    }

    return {
      results: searchRes.rows,
      totalHits: searchRes.rows.length,
      facets,
    };
  }
}

export const searchRepository = new SearchRepository();
