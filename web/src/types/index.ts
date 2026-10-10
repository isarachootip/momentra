export type CalendarStandard = 'be' | 'ce';
export type DatePrecision = 'year' | 'month' | 'day' | 'datetime';
export type TimelineGranularity = 'decade' | 'year' | 'month' | 'day';
export type ItemType = 'asset' | 'link' | 'note' | 'event';

export interface TimelineItem {
  id: string;
  workspace_id: string;
  type: ItemType;
  title: string;
  description: string | null;
  event_start: string;
  event_end: string;
  date_precision: DatePrecision;
  is_circa: boolean;
  sort_key: string | number;
  display_date_be?: string;
  display_date_ce?: string;
  dublin_core?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface TimelineBucket {
  bucket_key: string;
  display_label: string;
  count: number;
  items: TimelineItem[];
}

export interface Milestone {
  id: string;
  title: string;
  target_date_start: string;
  target_date_end: string;
  color: string;
  description?: string | null;
}

export interface FacetCount {
  key: string;
  count: number;
}

export interface SearchFacets {
  types: FacetCount[];
  tags: FacetCount[];
  years: FacetCount[];
}

export interface SearchResultItem extends TimelineItem {
  headline_title?: string;
  headline_description?: string;
  relevance_score?: number;
}

export type WorkspaceRole = 'owner' | 'admin' | 'contributor' | 'viewer';

export interface WorkspaceMember {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: WorkspaceRole;
  joined_at: string;
}

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  type: 'personal' | 'organization';
  role?: WorkspaceRole;
}
