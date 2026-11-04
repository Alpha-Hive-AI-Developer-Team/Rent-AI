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
  if (iso) {
    return isValidIsoDate(iso[0]) ? iso[0] : "";
  }
  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (!dmy) return "";
  const dd = Number(dmy[1]);
  const mm = Number(dmy[2]);
  const yyyy = Number(dmy[3]);
  if (!Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy)) return "";
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  if (yyyy < 1970 || yyyy > 2100) return "";
  const daysInMonth = new Date(Date.UTC(yyyy, mm, 0)).getUTCDate();
  if (dd > daysInMonth) return "";
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** True for a real calendar `yyyy-mm-dd` within 1970–2100. */
export function isValidIsoDate(input: string | null | undefined): boolean {
  const raw = String(input || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!Number.isInteger(yyyy) || !Number.isInteger(mm) || !Number.isInteger(dd)) return false;
  if (yyyy < 1970 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const daysInMonth = new Date(Date.UTC(yyyy, mm, 0)).getUTCDate();
  if (dd > daysInMonth) return false;
  return true;
}

const MONEY_MAX = 1_000_000;

/**
 * Sanitize typed money (rent/deposit). Digits + one `.`, max 2 decimals.
 * Returns "" for empty; never returns negatives or letters.
 */
export function sanitizeMoneyInput(value: string): string {
  let next = String(value || "").replace(/[^0-9.]/g, "");
  const firstDot = next.indexOf(".");
  if (firstDot !== -1) {
    next =
      next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    const [whole, frac = ""] = next.split(".");
    next = `${whole}.${frac.slice(0, 2)}`;
  }
  // Strip leading zeros unless "0" / "0.xx"
  if (/^0\d/.test(next)) next = next.replace(/^0+/, "") || "0";
  return next;
}

/**
 * Parse a positive money amount. Returns null if empty/invalid/out of range.
 * @param opts.allowZero when true, 0 is accepted (e.g. rent adjustments).
 */
export function parsePositiveMoney(
  value: string | number | null | undefined,
  opts?: { allowZero?: boolean; max?: number }
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const max = opts?.max ?? MONEY_MAX;
  if (n > max) return null;
  if (opts?.allowZero) {
    if (n < 0) return null;
  } else if (n <= 0) {
    return null;
  }
  return n;
}

/**
 * Street address + postcode (skips duplicate if postcode is already in the address).
 * Optionally appends room with a middot separator.
 */
export function formatPropertyAddress(
  property?: string | null,
  postcode?: string | null,
  room?: string | null
): string {
  const address = String(property || "").trim();
  const pc = String(postcode || "").trim();
  let line = address;
  if (pc) {
    if (!address) line = pc;
    else if (!address.toLowerCase().includes(pc.toLowerCase())) line = `${address}, ${pc}`;
  }
  const r = String(room || "").trim();
  if (line && r) return `${line} · ${r}`;
  return line || r || "";
}
