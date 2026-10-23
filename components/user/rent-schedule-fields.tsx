"use client";

import { Plus, X } from "lucide-react";

export type RentAdjustmentRow = {
  id: string;
  startMonth: string; // YYYY-MM
  amount: string;
};

function monthKeyFromDate(input: Date | string | null | undefined): string | null {
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}$/.test(input)) return input;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.slice(0, 7);
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(ym: string) {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym || "—";
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

function parseAmount(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Effective rent for a YYYY-MM from starting rent + adjustments. */
export function rentForMonth(
  baseRent: string | number,
  adjustments: RentAdjustmentRow[],
  monthYm: string
): number {
  const base = parseAmount(baseRent) ?? 0;
  const sorted = [...(adjustments || [])]
    .filter((a) => a.startMonth && parseAmount(a.amount) != null)
    .sort((a, b) => a.startMonth.localeCompare(b.startMonth));

  let applicable = base;
  for (const row of sorted) {
    if (row.startMonth <= monthYm) applicable = parseAmount(row.amount) ?? applicable;
    else break;
  }
  return applicable;
}

/** Current effective rent (as of today, UTC month). */
export function currentRentFromSchedule(
  baseRent: string | number,
  adjustments: RentAdjustmentRow[],
  asOf: Date = new Date()
): number {
  const ym = `${asOf.getUTCFullYear()}-${String(asOf.getUTCMonth() + 1).padStart(2, "0")}`;
  return rentForMonth(baseRent, adjustments, ym);
}

/**
 * Infer starting/base rent when older saves may have overwritten `rent` with the
 * current effective amount after an adjustment.
 */
function inferStartingRent(tenant: any, adjustments: RentAdjustmentRow[]): string {
  const stored =
    tenant?.rent != null && tenant?.rent !== "" ? String(tenant.rent) : "";
  if (!adjustments.length) return stored;

  const storedNum = parseAmount(stored);
  const latestAdj = [...adjustments].sort((a, b) =>
    b.startMonth.localeCompare(a.startMonth)
  )[0];
  const latestAmt = parseAmount(latestAdj?.amount);

  // If stored rent matches the latest adjustment, it was likely overwritten — recover
  // from the earliest rentHistory row before that adjustment (when available).
  if (
    storedNum != null &&
    latestAmt != null &&
    Math.abs(storedNum - latestAmt) < 0.0001 &&
    Array.isArray(tenant?.rentHistory)
  ) {
    const firstAdjMonth = [...adjustments]
      .map((a) => a.startMonth)
      .filter(Boolean)
      .sort()[0];
    const prior = (tenant.rentHistory as any[])
      .filter((h) => {
        const kind = h?.kind || "rent";
        if (kind !== "rent") return false;
        const mk = monthKeyFromDate(h?.month);
        return mk && firstAdjMonth && mk < firstAdjMonth;
      })
      .sort((a, b) => {
        const am = monthKeyFromDate(a.month) || "";
        const bm = monthKeyFromDate(b.month) || "";
        return am.localeCompare(bm);
      })[0];
    if (prior && Number(prior.amountDue) > 0) {
      return String(prior.amountDue);
    }
  }

  return stored;
}

export function scheduleFromTenant(tenant: any): {
  baseRent: string;
  currentRent: string;
  adjustments: RentAdjustmentRow[];
} {
  const adjustments = Array.isArray(tenant?.rentSchedule)
    ? tenant.rentSchedule
        .map((row: any, i: number) => {
          const d = row?.effectiveFrom ? new Date(row.effectiveFrom) : null;
          if (!d || Number.isNaN(d.getTime())) return null;
          const startMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          return {
            id: String(row._id || `adj-${i}-${startMonth}`),
            startMonth,
            amount: row.amount != null ? String(row.amount) : "",
          };
        })
        .filter(Boolean)
    : [];

  const baseRent = inferStartingRent(tenant, adjustments as RentAdjustmentRow[]);
  const current = currentRentFromSchedule(baseRent, adjustments as RentAdjustmentRow[]);

  return {
    baseRent,
    currentRent: String(current),
    adjustments: adjustments as RentAdjustmentRow[],
  };
}

/** Effective rent for list/detail display. */
export function effectiveRentAmount(tenant: any): number {
  const { baseRent, adjustments } = scheduleFromTenant(tenant);
  return currentRentFromSchedule(baseRent, adjustments);
}

export function buildRentSchedulePayload(adjustments: RentAdjustmentRow[]) {
  return (adjustments || [])
    .filter((a) => a.startMonth && a.amount !== "" && Number(a.amount) >= 0)
    .map((a) => ({
      effectiveFrom: `${a.startMonth}-01`,
      amount: Number(a.amount),
    }));
}

type Props = {
  baseRent: string;
  onBaseRentChange: (value: string) => void;
  adjustments: RentAdjustmentRow[];
  onAdjustmentsChange: (rows: RentAdjustmentRow[]) => void;
  disabled?: boolean;
  labelClass?: string;
  inputClass?: string;
  /** Hide base rent when parent already renders Monthly/Weekly rent field */
  hideBaseRent?: boolean;
  baseRentLabel?: string;
  /** monthly | weekly — affects labels only (schedule still month-keyed) */
  frequency?: "monthly" | "weekly";
  /** Optional move-in date (YYYY-MM-DD) for timeline labels */
  moveInDate?: string;
};

function sanitizeRent(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function newId() {
  return `adj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatGbp(n: number) {
  return `£${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function RentScheduleFields({
  baseRent,
  onBaseRentChange,
  adjustments,
  onAdjustmentsChange,
  disabled = false,
  labelClass = "mb-1 block text-sm text-gray-200",
  inputClass = "w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50",
  hideBaseRent = false,
  baseRentLabel,
  frequency = "monthly",
  moveInDate,
}: Props) {
  const weekly = frequency === "weekly";
  const unit = weekly ? "weekly" : "monthly";
  const hasAdjustments = (adjustments || []).length > 0;
  const current = currentRentFromSchedule(baseRent, adjustments);
  const starting = parseAmount(baseRent) ?? 0;
  const currentDiffers = hasAdjustments && Math.abs(current - starting) > 0.0001;

  const rentLabel =
    baseRentLabel ||
    (hasAdjustments
      ? weekly
        ? "Starting weekly rent (£)"
        : "Starting monthly rent (£)"
      : weekly
        ? "Weekly rent (£)"
        : "Monthly rent (£)");

  const moveInMonth = moveInDate ? monthKeyFromDate(moveInDate) : null;
  const sortedAdj = [...(adjustments || [])].sort((a, b) =>
    a.startMonth.localeCompare(b.startMonth)
  );

  const addRow = () => {
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onAdjustmentsChange([
      ...adjustments,
      { id: newId(), startMonth, amount: baseRent || "" },
    ]);
  };

  const updateRow = (id: string, patch: Partial<RentAdjustmentRow>) => {
    onAdjustmentsChange(
      adjustments.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (id: string) => {
    onAdjustmentsChange(adjustments.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Current effective rent — what applies now after adjustments */}
      {hasAdjustments && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-3">
          <p className="text-xs uppercase tracking-wide text-emerald-400/90">
            Current {unit} rent
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-white">{formatGbp(current)}</p>
          <p className="mt-1 text-xs text-gray-400">
            {currentDiffers
              ? `Started at ${formatGbp(starting)}${
                  moveInMonth ? ` (${formatMonthLabel(moveInMonth)})` : ""
                } · updated by the changes below`
              : `Same as starting rent · no net change yet`}
          </p>
        </div>
      )}

      {!hideBaseRent && (
        <div>
          <label className={labelClass}>{rentLabel}</label>
          <input
            value={baseRent}
            onChange={(e) => onBaseRentChange(sanitizeRent(e.target.value))}
            disabled={disabled}
            inputMode="decimal"
            className={inputClass}
            placeholder={weekly ? "e.g. 150" : "e.g. 850"}
          />
          {hasAdjustments ? (
            <p className="mt-1 text-xs text-gray-500">
              Rent from move-in until the first change below. Editing this updates
              all months before the first adjustment.
            </p>
          ) : null}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className={labelClass + " mb-0"}>Rent adjustments</label>
          {!disabled && adjustments.length > 0 && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add change
            </button>
          )}
        </div>
        <p className="mb-2 text-xs text-gray-500">
          {weekly
            ? "Optional — change weekly rent from a month onward (applies to dues in that month and later)."
            : "Optional — increase or decrease rent from a chosen month onward."}
        </p>

        {adjustments.length === 0 ? (
          !disabled && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Change rent from a month
            </button>
          )
        ) : (
          <div className="space-y-2">
            {/* Compact timeline so past → present is obvious */}
            <div className="rounded-lg border border-[#2A2A2A] bg-[#0a0a0a] px-3 py-2.5 text-xs text-gray-400">
              <p className="mb-1.5 text-[10px] uppercase tracking-wide text-gray-500">
                Rent over time
              </p>
              <ul className="space-y-1">
                <li className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    From{" "}
                    {moveInMonth ? formatMonthLabel(moveInMonth) : "move-in"}
                  </span>
                  <span className="font-medium text-gray-200">
                    {formatGbp(starting)}
                  </span>
                </li>
                {sortedAdj.map((row, index) => {
                  const prevAmount =
                    index === 0
                      ? starting
                      : parseAmount(sortedAdj[index - 1].amount) ?? starting;
                  const nextAmount = parseAmount(row.amount);
                  const delta =
                    nextAmount != null ? nextAmount - prevAmount : null;
                  const isCurrent =
                    row.startMonth <=
                    `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}` &&
                    (index === sortedAdj.length - 1 ||
                      sortedAdj[index + 1].startMonth >
                        `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-baseline justify-between gap-2"
                    >
                      <span>
                        From {formatMonthLabel(row.startMonth)}
                        {isCurrent ? (
                          <span className="ml-1.5 text-emerald-400">(current)</span>
                        ) : null}
                      </span>
                      <span className="font-medium text-gray-200">
                        {nextAmount != null ? formatGbp(nextAmount) : "—"}
                        {delta != null && Math.abs(delta) > 0.0001 ? (
                          <span
                            className={
                              delta > 0
                                ? "ml-1.5 text-amber-400"
                                : "ml-1.5 text-sky-400"
                            }
                          >
                            ({delta > 0 ? "+" : ""}
                            {formatGbp(delta)})
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {adjustments.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
              >
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-gray-500">From month</label>
                  )}
                  <input
                    type="month"
                    value={row.startMonth}
                    onChange={(e) => updateRow(row.id, { startMonth: e.target.value })}
                    disabled={disabled}
                    className={inputClass}
                    aria-label={`From month ${index + 1}`}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-gray-500">
                      {weekly ? "New weekly rent (£)" : "New rent (£)"}
                    </label>
                  )}
                  <input
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.id, { amount: sanitizeRent(e.target.value) })
                    }
                    disabled={disabled}
                    inputMode="decimal"
                    className={inputClass}
                    placeholder={weekly ? "e.g. 160" : "e.g. 910"}
                    aria-label={`New rent ${index + 1}`}
                  />
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-rose-400"
                    aria-label="Remove rent change"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="w-9" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
