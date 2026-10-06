import type { ItemResponse } from '../items/item.types.js';

export type TimelineGranularity = 'decade' | 'year' | 'month' | 'day';
export type CalendarStandard = 'be' | 'ce';

export interface TimelineBucketItem extends ItemResponse {
  display_date_be: string;
  display_date_ce: string;
}

export interface TimelineBucket {
  bucket_key: string;
  display_label: string;
  count: number;
  items: TimelineBucketItem[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  target_date_start: string;
  target_date_end: string;
  color: string;
  description?: string | null;
}

export interface TimelineResponse {
  granularity: TimelineGranularity;
  calendar: CalendarStandard;
  buckets: TimelineBucket[];
  milestones: MilestoneItem[];
}

export interface TimelineQueryParams {
  from: string;
  to: string;
  granularity: TimelineGranularity;
  calendar: CalendarStandard;
  tag_ids?: string[] | undefined;
  workspaceId?: string | undefined;
}
