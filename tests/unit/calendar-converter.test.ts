import { describe, it, expect } from 'vitest';
import { calendarConverter } from '../../src/modules/timeline/calendar-converter.js';

describe('CalendarConverter (Unit)', () => {
  it('should accurately convert between B.E. and C.E. years', () => {
    expect(calendarConverter.toBuddhistYear(1932)).toBe(2475);
    expect(calendarConverter.toBuddhistYear(1782)).toBe(2325);
    expect(calendarConverter.toCommonEraYear(2475)).toBe(1932);
    expect(calendarConverter.toCommonEraYear(2325)).toBe(1782);
  });

  it('should format dates with year precision', () => {
    const date = new Date('1932-06-24T00:00:00Z');
    const res = calendarConverter.formatItemDate(date, 'year', false);
    expect(res.display_be).toBe('พ.ศ. 2475');
    expect(res.display_ce).toBe('1932');
  });

  it('should format dates with month precision', () => {
    const date = new Date('1932-06-24T00:00:00Z');
    const res = calendarConverter.formatItemDate(date, 'month', false);
    expect(res.display_be).toBe('มิถุนายน 2475');
    expect(res.display_ce).toBe('June 1932');
  });

  it('should format dates with day precision and circa badge', () => {
    const date = new Date('1932-06-24T00:00:00Z');
    const res = calendarConverter.formatItemDate(date, 'day', true);
    expect(res.display_be).toBe('ประมาณ 24 มิถุนายน 2475');
    expect(res.display_ce).toBe('circa 24 June 1932');
  });

  it('should generate decade bucket labels for B.E. and C.E.', () => {
    const beLabel = calendarConverter.formatBucketLabel('1930', 'decade', 'be');
    expect(beLabel).toBe('ทศวรรษ 2470s (1930s)');

    const ceLabel = calendarConverter.formatBucketLabel('1930', 'decade', 'ce');
    expect(ceLabel).toBe('1930s (ทศวรรษ 2470s)');
  });

  it('should generate year bucket labels for B.E. and C.E.', () => {
    const beLabel = calendarConverter.formatBucketLabel('1932', 'year', 'be');
    expect(beLabel).toBe('พ.ศ. 2475 (1932)');

    const ceLabel = calendarConverter.formatBucketLabel('1932', 'year', 'ce');
    expect(ceLabel).toBe('1932 (พ.ศ. 2475)');
  });

  it('should generate month and day bucket labels', () => {
    const monthLabel = calendarConverter.formatBucketLabel('1932-06', 'month', 'be');
    expect(monthLabel).toBe('มิถุนายน 2475 (June 1932)');

    const dayLabel = calendarConverter.formatBucketLabel('1932-06-24', 'day', 'be');
    expect(dayLabel).toBe('24 มิถุนายน 2475 (24 June 1932)');
  });
});
