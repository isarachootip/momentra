'use client';

import React, { useState, useEffect } from 'react';
import type { CalendarStandard, Milestone, TimelineBucket, TimelineGranularity, TimelineItem } from '@/types';
import { TimelineControls } from './timeline-controls';
import { MilestoneBanner } from './milestone-banner';
import { BucketCard } from './bucket-card';
import { Loader2, CalendarX, X, Clock, ExternalLink } from 'lucide-react';

interface TimelineCanvasProps {
  initialFrom?: string;
  initialTo?: string;
}

export function TimelineCanvas({
  initialFrom = '1930-01-01T00:00:00Z',
  initialTo = '1945-12-31T23:59:59Z',
}: TimelineCanvasProps) {
  const [granularity, setGranularity] = useState<TimelineGranularity>('year');
  const [calendar, setCalendar] = useState<CalendarStandard>('be');
  const [range, setRange] = useState({ from: initialFrom, to: initialTo });
  const [buckets, setBuckets] = useState<TimelineBucket[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          from: range.from,
          to: range.to,
          granularity,
          calendar,
        });

        const res = await fetch(`/api/v1/timeline?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setBuckets(data.buckets || []);
          setMilestones(data.milestones || []);
        }
      } catch (err) {
        console.error('Failed to load timeline:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimeline();
  }, [range, granularity, calendar]);

  return (
    <div className="w-full">
      {/* 1. Viewport Controls */}
      <TimelineControls
        granularity={granularity}
        calendar={calendar}
        onGranularityChange={setGranularity}
        onCalendarChange={setCalendar}
        onQuickJump={setRange}
      />

      {/* 2. Milestones */}
      <MilestoneBanner milestones={milestones} />

      {/* 3. Timeline Viewport */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-rose-900" />
        </div>
      ) : buckets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <CalendarX className="h-10 w-10 text-slate-400 mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">ไม่พบรายการในช่วงเวลานี้</h3>
          <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนมาตราส่วน หรือขยายช่วงปีในการแสดงผล</p>
        </div>
      ) : (
        <div className="mt-4">
          {buckets.map((bucket) => (
            <BucketCard
              key={bucket.bucket_key}
              bucket={bucket}
              onItemClick={setSelectedItem}
            />
          ))}
        </div>
      )}

      {/* 4. Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="capitalize rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {selectedItem.type}
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedItem.title}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-900">
                <Clock className="h-3.5 w-3.5" />
                <span>{selectedItem.display_date_be}</span>
                {selectedItem.display_date_ce && (
                  <span className="text-slate-400">({selectedItem.display_date_ce})</span>
                )}
              </div>
              {selectedItem.description && (
                <p className="mt-4 text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
                  {selectedItem.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
