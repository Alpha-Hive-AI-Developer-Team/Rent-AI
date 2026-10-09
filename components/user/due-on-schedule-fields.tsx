"use client";

import { Plus, X } from "lucide-react";

export type RentFrequency = "monthly" | "weekly";

export type DueOnAdjustmentRow = {
  id: string;
  startMonth: string; // YYYY-MM
  dueOn: string; // monthly "1"–"31" | weekly "0"–"6"
};

export const WEEKDAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export function weekdayLabel(dueOn: number | string): string {
  const day = Number(dueOn);
  return WEEKDAY_OPTIONS.find((w) => w.value === day)?.label ?? String(dueOn);
}

export function dueOnScheduleFromTenant(tenant: any): {
  baseDueOn: number;
  adjustments: DueOnAdjustmentRow[];
} {
  const weekly = String(tenant?.rentFrequency || "").toLowerCase() === "weekly";
  const baseDueOn = Number(tenant?.dueOn);
  const safeBase = weekly
    ? Number.isInteger(baseDueOn) && baseDueOn >= 0 && baseDueOn <= 6
      ? baseDueOn
      : 1
    : Number.isInteger(baseDueOn) && baseDueOn >= 1 && baseDueOn <= 31
      ? baseDueOn
      : 1;

  const adjustments = Array.isArray(tenant?.dueOnSchedule)
    ? tenant.dueOnSchedule
        .map((row: any, i: number) => {
          const d = row?.effectiveFrom ? new Date(row.effectiveFrom) : null;
          if (!d || Number.isNaN(d.getTime())) return null;
          const startMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          const day = Number(row.dueOn);
          if (weekly) {
            if (!Number.isInteger(day) || day < 0 || day > 6) return null;
          } else if (!Number.isInteger(day) || day < 1 || day > 31) {
            return null;
          }
          return {
            id: String(row._id || `due-${i}-${startMonth}`),
            startMonth,
            dueOn: String(day),
          };
        })
        .filter(Boolean)
    : [];
  return { baseDueOn: safeBase, adjustments: adjustments as DueOnAdjustmentRow[] };
}

export function buildDueOnSchedulePayload(
  adjustments: DueOnAdjustmentRow[],
  frequency: RentFrequency = "monthly"
) {
  const weekly = frequency === "weekly";
  return (adjustments || [])
    .filter((a) => {
      if (!a.startMonth) return false;
      const day = Number(a.dueOn);
      if (!Number.isInteger(day)) return false;
      return weekly ? day >= 0 && day <= 6 : day >= 1 && day <= 31;
    })
    .map((a) => ({
      effectiveFrom: `${a.startMonth}-01`,
      dueOn: Number(a.dueOn),
    }));
}

/** Effective due day as of a date (mirrors backend getCurrentDueOn). */
export function getCurrentDueOnFromTenant(tenant: any, asOf: Date = new Date()) {
  const weekly = String(tenant?.rentFrequency || "").toLowerCase() === "weekly";
  const base = Number(tenant?.dueOn);
  const safeBase = weekly
    ? Number.isInteger(base) && base >= 0 && base <= 6
      ? base
      : 1
    : Number.isInteger(base) && base >= 1 && base <= 31
      ? base
      : 1;
  const monthStart = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 1);
  const rows = Array.isArray(tenant?.dueOnSchedule) ? tenant.dueOnSchedule : [];
  let applicable: number | null = null;
  const sorted = [...rows]
    .map((row) => {
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
    const ok = weekly
      ? Number.isInteger(row.dueOn) && row.dueOn >= 0 && row.dueOn <= 6
      : Number.isInteger(row.dueOn) && row.dueOn >= 1 && row.dueOn <= 31;
    if (row.ms <= monthStart && ok) {
      applicable = row.dueOn;
    } else if (row.ms > monthStart) break;
  }
  return applicable ?? safeBase;
}

type Props = {
  baseDueOn: number;
  onBaseDueOnChange: (value: number) => void;
  adjustments: DueOnAdjustmentRow[];
  onAdjustmentsChange: (rows: DueOnAdjustmentRow[]) => void;
  disabled?: boolean;
  labelClass?: string;
  inputClass?: string;
  /** Hide base select when parent already renders Rent due day */
  hideBaseDueOn?: boolean;
  maxDueDay?: number;
  /** monthly = day of month 1–31; weekly = weekday 0–6 */
  frequency?: RentFrequency;
};

function newId() {
  return `due-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function DueOnScheduleFields({
  baseDueOn,
  onBaseDueOnChange,
  adjustments,
  onAdjustmentsChange,
  disabled = false,
  labelClass = "mb-1 block text-sm text-gray-200",
  inputClass = "w-full rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-gray-100 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50",
  hideBaseDueOn = false,
  maxDueDay = 31,
  frequency = "monthly",
}: Props) {
  const weekly = frequency === "weekly";
  const max = Math.min(31, Math.max(1, maxDueDay || 31));
  const dayOptions = weekly
    ? WEEKDAY_OPTIONS
    : Array.from({ length: max }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

  const addRow = () => {
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const defaultDue = weekly ? String(baseDueOn >= 0 && baseDueOn <= 6 ? baseDueOn : 1) : String(Math.min(17, max));
    onAdjustmentsChange([
      ...adjustments,
      { id: newId(), startMonth, dueOn: defaultDue },
    ]);
  };

  const updateRow = (id: string, patch: Partial<DueOnAdjustmentRow>) => {
    onAdjustmentsChange(
      adjustments.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (id: string) => {
    onAdjustmentsChange(adjustments.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-3">
      {!hideBaseDueOn && (
        <div>
          <label className={labelClass}>
            {weekly ? "Rent due day of week" : "Rent due day"}
          </label>
          <select
            value={baseDueOn}
            onChange={(e) => onBaseDueOnChange(Number(e.target.value))}
            disabled={disabled}
            className={inputClass}
          >
            {dayOptions.map((day) => (
              <option key={day.value} value={day.value} className="bg-[#111] text-gray-100">
                {day.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <label className={labelClass + " mb-0"}>Due day adjustments</label>
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
            ? "Optional — change the due weekday from a month onward (bridge days are prorated)."
            : "Optional — change the due day from a month onward (transition month is prorated)."}
        </p>

        {adjustments.length === 0 ? (
          !disabled && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              {weekly ? "Change due weekday from a month" : "Change due day from a month"}
            </button>
          )
        ) : (
          <div className="space-y-2">
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
                    aria-label={`Due day from month ${index + 1}`}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-gray-500">
                      {weekly ? "New weekday" : "New due day"}
                    </label>
                  )}
                  <select
                    value={row.dueOn}
                    onChange={(e) => updateRow(row.id, { dueOn: e.target.value })}
                    disabled={disabled}
                    className={inputClass}
                    aria-label={`New due day ${index + 1}`}
                  >
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value} className="bg-[#111] text-gray-100">
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-white/5 hover:text-rose-400"
                    aria-label="Remove due day change"
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
