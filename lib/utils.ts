import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Display dates as DD/MM/YYYY everywhere (day/month/year).
 * Uses UTC calendar parts so date-only values (due dates, bank dates) do not shift by timezone.
 */
export function formatDate(input: any, empty = "—"): string {
  if (!input) return empty;
  // Prefer plain calendar strings so we never shift by timezone
  if (typeof input === "string") {
    const isoDay = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDay) return `${isoDay[3]}/${isoDay[2]}/${isoDay[1]}`;
    const dmy = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      const dd = dmy[1].padStart(2, "0");
      const mm = dmy[2].padStart(2, "0");
      return `${dd}/${mm}/${dmy[3]}`;
    }
  }
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return empty;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Date + time for payment breakdowns (UTC).
 * Bank feeds are often date-only → midnight UTC (00:00).
 */
export function formatDateTime(input: any, empty = "—"): string {
  if (!input) return empty;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return empty;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

/** Convert ISO `yyyy-mm-dd` (or Date) → `dd/mm/yyyy` for inputs. */
export function isoToDmy(input: string | Date | null | undefined): string {
  if (!input) return "";
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const formatted = formatDate(input, "");
  return formatted === "—" ? "" : formatted;
}

/**
 * Parse `dd/mm/yyyy` (or `yyyy-mm-dd`) → ISO `yyyy-mm-dd`.
 * Returns "" if empty/invalid.
 */
export function dmyToIso(input: string | null | undefined): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!dmy) return "";
  const dd = Number(dmy[1]);
  const mm = Number(dmy[2]);
  const yyyy = Number(dmy[3]);
  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return "";
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const daysInMonth = new Date(Date.UTC(yyyy, mm, 0)).getUTCDate();
  if (dd > daysInMonth) return "";
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}
