import { timelineRepository } from './timeline.repository.js';
import { timelineCache } from './timeline-cache.js';
import { calendarConverter } from './calendar-converter.js';
import type {
  TimelineQueryParams,
  TimelineResponse,
  TimelineBucket,
  TimelineBucketItem,
  TimelineGranularity,
} from './timeline.types.js';

export class TimelineService {
  async getTimeline(params: TimelineQueryParams): Promise<TimelineResponse> {
    const cacheKey = timelineCache.buildKey({
      workspaceId: params.workspaceId,
      from: params.from,
      to: params.to,
      granularity: params.granularity,
      calendar: params.calendar,
      tags: params.tag_ids,
    });

    const cached = timelineCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [rawItems, milestones] = await Promise.all([
      timelineRepository.fetchItemsForRange(
        params.workspaceId,
        params.from,
        params.to,
        params.tag_ids
      ),
      timelineRepository.fetchMilestonesForRange(
        params.workspaceId,
        params.from,
        params.to
      ),
    ]);

    // Group items into buckets
    const bucketMap = new Map<string, TimelineBucketItem[]>();

    for (const item of rawItems) {
      const itemDate = new Date(item.event_start);
      const bucketKey = this.getBucketKey(itemDate, params.granularity);

      const { display_be, display_ce } = calendarConverter.formatItemDate(
        itemDate,
        item.date_precision,
        item.is_circa
      );

      const bucketItem: TimelineBucketItem = {
        ...item,
        display_date_be: display_be,
        display_date_ce: display_ce,
      };

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, []);
      }
      bucketMap.get(bucketKey)!.push(bucketItem);
    }

    // Convert map to sorted buckets array
    const sortedKeys = Array.from(bucketMap.keys()).sort();
    const buckets: TimelineBucket[] = sortedKeys.map((key) => {
      const items = bucketMap.get(key) || [];
      return {
        bucket_key: key,
        display_label: calendarConverter.formatBucketLabel(
          key,
          params.granularity,
          params.calendar
        ),
        count: items.length,
        items,
      };
    });

    const response: TimelineResponse = {
      granularity: params.granularity,
      calendar: params.calendar,
      buckets,
      milestones,
    };

    timelineCache.set(cacheKey, response);
    return response;
  }

  private getBucketKey(date: Date, granularity: TimelineGranularity): string {
    const year = date.getUTCFullYear();
    if (granularity === 'decade') {
      const decade = Math.floor(year / 10) * 10;
      return `${decade}`;
    }
    if (granularity === 'year') {
      return `${year}`;
    }
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    if (granularity === 'month') {
      return `${year}-${month}`;
    }
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const timelineService = new TimelineService();
