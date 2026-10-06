import type { HistoricalDateValue } from './date-picker.types';

export const THAI_MONTHS = [
  { value: 1, name: 'มกราคม', abbr: 'ม.ค.' },
  { value: 2, name: 'กุมภาพันธ์', abbr: 'ก.พ.' },
  { value: 3, name: 'มีนาคม', abbr: 'มี.ค.' },
  { value: 4, name: 'เมษายน', abbr: 'เม.ย.' },
  { value: 5, name: 'พฤษภาคม', abbr: 'พ.ค.' },
  { value: 6, name: 'มิถุนายน', abbr: 'มิ.ย.' },
  { value: 7, name: 'กรกฎาคม', abbr: 'ก.ค.' },
  { value: 8, name: 'สิงหาคม', abbr: 'ส.ค.' },
  { value: 9, name: 'กันยายน', abbr: 'ก.ย.' },
  { value: 10, name: 'ตุลาคม', abbr: 'ต.ค.' },
  { value: 11, name: 'พฤศจิกายน', abbr: 'พ.ย.' },
  { value: 12, name: 'ธันวาคม', abbr: 'ธ.ค.' },
];

export function beToCe(beYear: number): number {
  return beYear - 543;
}

export function ceToBe(ceYear: number): number {
  return ceYear + 543;
}

export function formatPreview(val: HistoricalDateValue): string {
  const circa = val.isCirca ? 'ประมาณ ' : '';
  const monthName = val.startMonth ? THAI_MONTHS[val.startMonth - 1]?.name : '';

  let startLabel = '';
  if (val.precision === 'year') {
    startLabel = `พ.ศ. ${val.startBeYear} (${val.startCeYear})`;
  } else if (val.precision === 'month') {
    startLabel = `${monthName} ${val.startBeYear} (${val.startCeYear})`;
  } else if (val.precision === 'day') {
    startLabel = `${val.startDay ?? 1} ${monthName} ${val.startBeYear} (${val.startCeYear})`;
  } else {
    startLabel = `${val.startDay ?? 1} ${monthName} ${val.startBeYear} เวลา ${val.startTime ?? '00:00'} น.`;
  }

  if (!val.isRange) {
    return `${circa}${startLabel}`;
  }

  const endMonthName = val.endMonth ? THAI_MONTHS[val.endMonth - 1]?.name : '';
  let endLabel = '';
  if (val.precision === 'year') {
    endLabel = `พ.ศ. ${val.endBeYear ?? val.startBeYear}`;
  } else if (val.precision === 'month') {
    endLabel = `${endMonthName} ${val.endBeYear ?? val.startBeYear}`;
  } else {
    endLabel = `${val.endDay ?? 1} ${endMonthName} ${val.endBeYear ?? val.startBeYear}`;
  }

  return `${circa}${startLabel} — ${endLabel}`;
}

export function validateRange(val: HistoricalDateValue): { isValid: boolean; error?: string } {
  if (!val.isRange) return { isValid: true };

  const startYear = val.startCeYear;
  const endYear = val.endCeYear ?? val.startCeYear;

  if (endYear < startYear) {
    return { isValid: false, error: 'ปีสิ้นสุดต้องไม่น้อยกว่าปีเริ่มต้น' };
  }

  if (val.precision !== 'year' && endYear === startYear) {
    const startM = val.startMonth ?? 1;
    const endM = val.endMonth ?? 1;
    if (endM < startM) {
      return { isValid: false, error: 'เดือนสิ้นสุดต้องไม่น้อยกว่าเดือนเริ่มต้น' };
    }
    if (val.precision !== 'month' && endM === startM) {
      const startD = val.startDay ?? 1;
      const endD = val.endDay ?? 1;
      if (endD < startD) {
        return { isValid: false, error: 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น' };
      }
    }
  }

  return { isValid: true };
}
