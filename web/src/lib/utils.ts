import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatBuddhistYear(ceYear: number): number {
  return ceYear + 543;
}

export function formatCommonEraYear(beYear: number): number {
  return beYear - 543;
}
