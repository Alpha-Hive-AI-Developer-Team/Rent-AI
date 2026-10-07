/** Mirror of backend annual daily proration for due-day change previews. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365;

function toUtcDateOnly(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function floorMoney(n: number) {
  return Math.floor((Number(n) || 0) * 100 + 1e-9) / 100;
}

function roundMoney(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function daysBetweenUtc(start: Date, end: Date) {
  const a = toUtcDateOnly(start).getTime();
  const b = toUtcDateOnly(end).getTime();
  return Math.max(0, Math.round((b - a) / MS_PER_DAY));
}

function clampDueDay(dueOn: number, year: number, monthIndex: number) {
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  let day = Number(dueOn);
  if (!Number.isInteger(day) || day < 1 || day > 31) day = 1;
  return Math.min(Math.max(day, 1), daysInMonth);
}

export function dueDateForMonth(year: number, monthIndex: number, dueOn: number) {
  return new Date(Date.UTC(year, monthIndex, clampDueDay(dueOn, year, monthIndex)));
}

export function firstDueOnOrAfter(fromDate: Date, dueOn: number) {
  const from = toUtcDateOnly(fromDate);
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const candidate = dueDateForMonth(y, m, dueOn);
  if (candidate.getTime() >= from.getTime()) return candidate;
  const nextM = m + 1;
  const nextY = y + Math.floor(nextM / 12);
  return dueDateForMonth(nextY, nextM % 12, dueOn);
}

export function nextDueDateAfter(dueDate: Date, dueOn: number) {
  const d = toUtcDateOnly(dueDate);
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;
  if (m > 11) {
    m = 0;
    y += 1;
  }
  return dueDateForMonth(y, m, dueOn);
}

export function annualDailyRate(monthlyRent: number) {
  return ((Number(monthlyRent) || 0) * 12) / DAYS_PER_YEAR;
}

export function prorateStubAmount(monthlyRent: number, from: Date, to: Date) {
  const stubDays = daysBetweenUtc(from, to);
  if (stubDays <= 0) return 0;
  return floorMoney(annualDailyRate(monthlyRent) * stubDays);
}

export type DueDayTransitionPreview = {
  firstNewDue: Date;
  monthlyRent: number;
  extraDays: number;
  extraAmount: number;
  totalAmount: number;
  hasExtraDays: boolean;
  extraLabel: string;
};

export function computeDueDayTransitionPreview(
  monthlyRent: number,
  effectiveFrom: Date | string,
  newDueOn: number
): DueDayTransitionPreview {
  const effective =
    typeof effectiveFrom === "string"
      ? toUtcDateOnly(new Date(`${effectiveFrom}T00:00:00.000Z`))
      : toUtcDateOnly(effectiveFrom);
  const firstNewDue = firstDueOnOrAfter(effective, newDueOn);
  const monthly = roundMoney(monthlyRent);
  const extraDays = daysBetweenUtc(effective, firstNewDue);
  const extraAmount = prorateStubAmount(monthly, effective, firstNewDue);
  const totalAmount = roundMoney(monthly + extraAmount);
  const dayPart = Number.isInteger(Number(newDueOn)) ? ` → ${newDueOn}` : "";
  const extraLabel =
    extraDays > 0
      ? `Extra days (${extraDays} day${extraDays === 1 ? "" : "s"}${dayPart})`
      : `Due day change${dayPart}`;
  return {
    firstNewDue,
    monthlyRent: monthly,
    extraDays,
    extraAmount,
    totalAmount,
    hasExtraDays: extraAmount > 0 && extraDays > 0,
    extraLabel,
  };
}

function dueOnAtDate(tenant: any, date: Date) {
  const base = Number(tenant?.dueOn) || 1;
  const monthStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
  const rows = Array.isArray(tenant?.dueOnSchedule) ? [...tenant.dueOnSchedule] : [];
  let applicable = base;
  const sorted = rows
    .map((row: any) => {
      const d = row?.effectiveFrom ? new Date(row.effectiveFrom) : null;
      if (!d || Number.isNaN(d.getTime())) return null;
      return {
        ms: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1),
        dueOn: Number(row.dueOn),
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.ms - b.ms) as { ms: number; dueOn: number }[];
  for (const row of sorted) {
    if (
      row.ms <= monthStart &&
      Number.isInteger(row.dueOn) &&
      row.dueOn >= 1 &&
      row.dueOn <= 31
    ) {
      applicable = row.dueOn;
    } else if (row.ms > monthStart) break;
  }
  return applicable;
}

/** Default effectiveFrom: earliest unpaid due, else day after last paid period ends (next old due). */
export function defaultEffectiveFromForDueDayChange(tenant: any): string {
  const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
  const unpaid = history
    .filter((h: any) => {
      const kind = h?.kind || "rent";
      if (kind !== "rent" && kind !== "transition") return false;
      const rem = (Number(h?.amountDue) || 0) - (Number(h?.amountPaid) || 0);
      return rem > 0.001 && h?.dueDate;
    })
    .map((h: any) => toUtcDateOnly(new Date(h.dueDate)))
    .sort((a: Date, b: Date) => a.getTime() - b.getTime());
  if (unpaid.length) {
    const d = unpaid[0];
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  const paid = history
    .filter((h: any) => {
      const kind = h?.kind || "rent";
      if (kind !== "rent") return false;
      return (Number(h?.amountPaid) || 0) > 0 && h?.dueDate;
    })
    .map((h: any) => toUtcDateOnly(new Date(h.dueDate)))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime());
  if (paid.length) {
    const dayAtPaid = dueOnAtDate(tenant, paid[0]);
    const next = nextDueDateAfter(paid[0], dayAtPaid);
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  }
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

export function isDueDayChangeLineItem(item: any) {
  return /extra days|due day/i.test(String(item?.label || ""));
}
