/**
 * Mirror backend rentObligation.util first-period (prorated stub) math
 * so the UI can show the exact amount to clear on move-in.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;

function roundMoney(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function parseIsoDay(input: string | null | undefined): Date | null {
  const raw = String(input || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function toIsoDay(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function clampDueDay(dueOn: number, year: number, monthIndex: number) {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  let day = Number(dueOn);
  if (!Number.isInteger(day) || day < 1 || day > 31) day = 1;
  return Math.min(Math.max(day, 1), daysInMonth);
}

function dueDateForMonth(year: number, monthIndex: number, dueOn: number) {
  return new Date(Date.UTC(year, monthIndex, clampDueDay(dueOn, year, monthIndex)));
}

function firstDueOnOrAfter(fromDate: Date, dueOn: number) {
  const y = fromDate.getUTCFullYear();
  const m = fromDate.getUTCMonth();
  const candidate = dueDateForMonth(y, m, dueOn);
  if (candidate.getTime() >= fromDate.getTime()) return candidate;
  const nextM = m + 1;
  const nextY = y + Math.floor(nextM / 12);
  return dueDateForMonth(nextY, nextM % 12, dueOn);
}

function daysBetweenUtc(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
}

function annualDailyRate(monthlyRent: number) {
  return ((Number(monthlyRent) || 0) * 12) / DAYS_PER_YEAR;
}

function prorateStubAmount(monthlyRent: number, moveIn: Date, firstDue: Date) {
  const stubDays = daysBetweenUtc(moveIn, firstDue);
  if (stubDays <= 0) return 0;
  return roundMoney(annualDailyRate(monthlyRent) * stubDays);
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rentForMonth(
  baseRent: number,
  asOf: Date,
  schedule?: Array<{ effectiveFrom: string; amount: number }> | null
) {
  let applicable: number | null = null;
  const rows = Array.isArray(schedule) ? schedule : [];
  for (const row of rows) {
    const from = parseIsoDay(row.effectiveFrom);
    if (!from) continue;
    if (from.getTime() <= asOf.getTime()) applicable = Number(row.amount);
    else break;
  }
  if (applicable != null && Number.isFinite(applicable)) return Math.max(0, applicable);
  return Math.max(0, Number(baseRent) || 0);
}

export type FirstPeriodDueInfo = {
  amount: number;
  days: number;
  moveInIso: string;
  firstDueIso: string;
  isProrated: boolean;
  monthlyRent: number;
  summary: string;
};

/**
 * Amount needed to clear the first rent obligation created at move-in:
 * - mid-cycle move-in → prorated stub (move-in → first due day)
 * - move-in on due day → full monthly rent for that due
 */
export function computeFirstPeriodDue(opts: {
  monthlyRent: number | string;
  moveInDate?: string | null;
  dueOn?: number | string;
  rentSchedule?: Array<{ effectiveFrom: string; amount: number }> | null;
}): FirstPeriodDueInfo | null {
  const moveIn = parseIsoDay(opts.moveInDate || "");
  if (!moveIn) return null;

  let dueOn = Number(opts.dueOn);
  if (!Number.isInteger(dueOn) || dueOn < 1 || dueOn > 31) dueOn = 1;

  const firstDue = firstDueOnOrAfter(moveIn, dueOn);
  const monthly = rentForMonth(Number(opts.monthlyRent) || 0, firstDue, opts.rentSchedule);
  const stubDays = daysBetweenUtc(moveIn, firstDue);

  if (stubDays > 0) {
    const amount = prorateStubAmount(monthly, moveIn, firstDue);
    if (!(amount > 0)) return null;
    return {
      amount,
      days: stubDays,
      moveInIso: toIsoDay(moveIn),
      firstDueIso: toIsoDay(firstDue),
      isProrated: true,
      monthlyRent: monthly,
      summary: `${stubDays} day${stubDays === 1 ? "" : "s"} from move-in to first due (${toIsoDay(firstDue).split("-").reverse().join("/")}) at £${monthly.toFixed(2)}/mo`,
    };
  }

  // Move-in on due day: first obligation is a full month
  if (!(monthly > 0)) return null;
  return {
    amount: roundMoney(monthly),
    days: 0,
    moveInIso: toIsoDay(moveIn),
    firstDueIso: toIsoDay(firstDue),
    isProrated: false,
    monthlyRent: monthly,
    summary: `Full month from due day ${dueOn} (£${monthly.toFixed(2)})`,
  };
}

/** Penny difference between entered amount and exact first-period due. */
export function firstPaymentDifference(entered: string | number, due: number) {
  const n = Number(entered);
  if (!Number.isFinite(n) || !(due > 0)) return null;
  return roundMoney(due - n);
}
