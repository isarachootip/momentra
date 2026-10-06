import type { CalendarStandard, TimelineGranularity } from './timeline.types.js';

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const ENGLISH_MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class CalendarConverter {
  toBuddhistYear(ceYear: number): number {
    return ceYear + 543;
  }

  toCommonEraYear(beYear: number): number {
    return beYear - 543;
  }

  formatItemDate(
    date: Date,
    precision: 'year' | 'month' | 'day' | 'datetime',
    isCirca: boolean
  ): { display_be: string; display_ce: string } {
    const ceYear = date.getUTCFullYear();
    const beYear = this.toBuddhistYear(ceYear);
    const monthIndex = date.getUTCMonth();
    const day = date.getUTCDate();

    const circaTh = isCirca ? 'ประมาณ ' : '';
    const circaEn = isCirca ? 'circa ' : '';

    if (precision === 'year') {
      return {
        display_be: `${circaTh}พ.ศ. ${beYear}`,
        display_ce: `${circaEn}${ceYear}`,
      };
    }

    if (precision === 'month') {
      return {
        display_be: `${circaTh}${THAI_MONTHS_FULL[monthIndex]} ${beYear}`,
        display_ce: `${circaEn}${ENGLISH_MONTHS_FULL[monthIndex]} ${ceYear}`,
      };
    }

    // day or datetime
    return {
      display_be: `${circaTh}${day} ${THAI_MONTHS_FULL[monthIndex]} ${beYear}`,
      display_ce: `${circaEn}${day} ${ENGLISH_MONTHS_FULL[monthIndex]} ${ceYear}`,
    };
  }

  formatBucketLabel(
    bucketKey: string,
    granularity: TimelineGranularity,
    calendar: CalendarStandard
  ): string {
    if (granularity === 'decade') {
      const ceDecade = parseInt(bucketKey, 10);
      const beDecade = Math.floor(this.toBuddhistYear(ceDecade) / 10) * 10;
      return calendar === 'be'
        ? `ทศวรรษ ${beDecade}s (${ceDecade}s)`
        : `${ceDecade}s (ทศวรรษ ${beDecade}s)`;
    }

    if (granularity === 'year') {
      const ceYear = parseInt(bucketKey, 10);
      const beYear = this.toBuddhistYear(ceYear);
      return calendar === 'be'
        ? `พ.ศ. ${beYear} (${ceYear})`
        : `${ceYear} (พ.ศ. ${beYear})`;
    }

    if (granularity === 'month') {
      const parts = bucketKey.split('-');
      const ceYear = parseInt(parts[0] || '0', 10);
      const beYear = this.toBuddhistYear(ceYear);
      const monthIdx = parseInt(parts[1] || '1', 10) - 1;
      const thMonth = THAI_MONTHS_FULL[monthIdx] || '';
      const enMonth = ENGLISH_MONTHS_FULL[monthIdx] || '';
      return calendar === 'be'
        ? `${thMonth} ${beYear} (${enMonth} ${ceYear})`
        : `${enMonth} ${ceYear} (${thMonth} ${beYear})`;
    }

    // day
    const parts = bucketKey.split('-');
    const ceYear = parseInt(parts[0] || '0', 10);
    const beYear = this.toBuddhistYear(ceYear);
    const monthIdx = parseInt(parts[1] || '1', 10) - 1;
    const day = parseInt(parts[2] || '1', 10);
    const thMonth = THAI_MONTHS_FULL[monthIdx] || '';
    const enMonth = ENGLISH_MONTHS_FULL[monthIdx] || '';
    return calendar === 'be'
      ? `${day} ${thMonth} ${beYear} (${day} ${enMonth} ${ceYear})`
      : `${day} ${enMonth} ${ceYear} (${day} ${thMonth} ${beYear})`;
  }
}

export const calendarConverter = new CalendarConverter();
