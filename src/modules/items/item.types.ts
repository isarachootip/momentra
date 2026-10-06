export type ItemType = 'asset' | 'link' | 'note' | 'event';
export type DatePrecision = 'year' | 'month' | 'day' | 'datetime';
export type Visibility = 'private' | 'workspace' | 'public';

export interface ItemResponse {
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
  location?: Record<string, unknown> | null;
  dublin_core?: Record<string, unknown>;
  visibility?: Visibility;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
