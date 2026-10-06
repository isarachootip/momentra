import type { ItemResponse } from '../items/item.types.js';

export interface FacetCount {
  key: string;
  count: number;
}

export interface SearchFacets {
  types: FacetCount[];
  tags: FacetCount[];
  years: FacetCount[];
}

export interface SearchResultItem extends ItemResponse {
  headline_title?: string;
  headline_description?: string;
  relevance_score?: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total_hits: number;
  facets: SearchFacets;
  next_cursor: string | null;
}

export interface SearchQueryParams {
  q?: string | undefined;
  type?: 'asset' | 'link' | 'note' | 'event' | undefined;
  tags?: string[] | undefined;
  from_year?: number | undefined;
  to_year?: number | undefined;
  circa?: boolean | undefined;
  sort?: 'event_date_asc' | 'event_date_desc' | 'created_at_desc' | 'relevance' | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
  workspaceId?: string | undefined;
}
