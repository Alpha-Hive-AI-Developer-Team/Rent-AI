import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Display dates as MM/DD/YYYY everywhere (month/day/year).
 * Uses UTC calendar parts so date-only values (due dates, bank dates) do not shift by timezone.
 */
export function formatDate(input: any, empty = "—"): string {
  if (!input) return empty;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return empty;
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
