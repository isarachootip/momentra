import type { DatePrecision } from '@/types';

export interface HistoricalDateValue {
  precision: DatePrecision;
  isRange: boolean;
  isCirca: boolean;
  startBeYear: number;
  startCeYear: number;
  startMonth?: number;
  startDay?: number;
  startTime?: string;
  endBeYear?: number;
  endCeYear?: number;
  endMonth?: number;
  endDay?: number;
  endTime?: string;
}

export interface DatePickerProps {
  value: HistoricalDateValue;
  onChange: (value: HistoricalDateValue) => void;
  className?: string;
}
