import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineCache } from '../../src/modules/timeline/timeline-cache.js';
import type { TimelineResponse } from '../../src/modules/timeline/timeline.types.js';

describe('TimelineCache (Unit)', () => {
  let cache: TimelineCache;

  beforeEach(() => {
    cache = new TimelineCache(1, 5); // 1 second TTL, max size 5
  });

  const dummyData: TimelineResponse = {
    granularity: 'year',
    calendar: 'be',
    buckets: [],
    milestones: [],
  };

  it('should store and retrieve data within TTL', () => {
    cache.set('key-1', dummyData);
    const retrieved = cache.get('key-1');
    expect(retrieved).toEqual(dummyData);
  });

  it('should return null for expired cache keys', async () => {
    cache.set('key-expire', dummyData, 0.05); // 50ms TTL
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get('key-expire')).toBeNull();
  });

  it('should evict oldest key when reaching max size', () => {
    for (let i = 1; i <= 6; i++) {
      cache.set(`key-${i}`, dummyData);
    }
    expect(cache.get('key-1')).toBeNull(); // Evicted
    expect(cache.get('key-6')).not.toBeNull();
  });

  it('should build consistent and deterministic cache keys', () => {
    const key1 = cache.buildKey({
      workspaceId: 'ws-1',
      from: '1930',
      to: '1940',
      granularity: 'decade',
      calendar: 'be',
      tags: ['tag-b', 'tag-a'],
    });

    const key2 = cache.buildKey({
      workspaceId: 'ws-1',
      from: '1930',
      to: '1940',
      granularity: 'decade',
      calendar: 'be',
      tags: ['tag-a', 'tag-b'],
    });

    expect(key1).toBe(key2);
  });
});
