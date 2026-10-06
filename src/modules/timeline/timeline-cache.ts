import type { TimelineResponse } from './timeline.types.js';

interface CacheEntry {
  data: TimelineResponse;
  expiresAt: number;
}

export class TimelineCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtlMs: number;
  private readonly maxSize: number;

  constructor(ttlSeconds = 60, maxSize = 200) {
    this.defaultTtlMs = ttlSeconds * 1000;
    this.maxSize = maxSize;
  }

  get(key: string): TimelineResponse | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: TimelineResponse, ttlSeconds?: number): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  buildKey(params: {
    workspaceId?: string | undefined;
    from: string;
    to: string;
    granularity: string;
    calendar: string;
    tags?: string[] | undefined;
  }): string {
    const tagPart = params.tags?.sort().join(',') || '';
    return `${params.workspaceId || 'global'}:${params.from}:${params.to}:${params.granularity}:${params.calendar}:${tagPart}`;
  }
}

export const timelineCache = new TimelineCache();
