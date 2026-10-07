"use client";

import { Plus, X } from "lucide-react";

export type DueOnAdjustmentRow = {
  id: string;
  startMonth: string; // YYYY-MM
  dueOn: string; // "1"–"31"
};

export function dueOnScheduleFromTenant(tenant: any): {
  baseDueOn: number;
  adjustments: DueOnAdjustmentRow[];
} {
  const baseDueOn = Number(tenant?.dueOn) || 1;
  const adjustments = Array.isArray(tenant?.dueOnSchedule)
    ? tenant.dueOnSchedule
        .map((row: any, i: number) => {
          const d = row?.effectiveFrom ? new Date(row.effectiveFrom) : null;
          if (!d || Number.isNaN(d.getTime())) return null;
          const startMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
          const day = Number(row.dueOn);
          if (!Number.isInteger(day) || day < 1 || day > 31) return null;
          return {
            id: String(row._id || `due-${i}-${startMonth}`),
            startMonth,
            dueOn: String(day),
          };
        })
        .filter(Boolean)
    : [];
  return { baseDueOn, adjustments: adjustments as DueOnAdjustmentRow[] };
}

export function buildDueOnSchedulePayload(adjustments: DueOnAdjustmentRow[]) {
  return (adjustments || [])
    .filter((a) => {
      if (!a.startMonth) return false;
      const day = Number(a.dueOn);
      return Number.isInteger(day) && day >= 1 && day <= 31;
    })
    .map((a) => ({
      effectiveFrom: `${a.startMonth}-01`,
      dueOn: Number(a.dueOn),
    }));
}

/** Effective due day as of a date (mirrors backend getCurrentDueOn). */
export function getCurrentDueOnFromTenant(tenant: any, asOf: Date = new Date()) {
  const base = Number(tenant?.dueOn) || 1;
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
    if (row.ms <= monthStart && Number.isInteger(row.dueOn) && row.dueOn >= 1 && row.dueOn <= 31) {
      applicable = row.dueOn;
    } else if (row.ms > monthStart) break;
  }
  return applicable ?? base;
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
}: Props) {
  const max = Math.min(31, Math.max(1, maxDueDay || 31));
  const dayOptions = Array.from({ length: max }, (_, i) => i + 1);

  const addRow = () => {
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onAdjustmentsChange([
      ...adjustments,
      { id: newId(), startMonth, dueOn: String(Math.min(17, max)) },
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
          <label className={labelClass}>Rent due day</label>
          <select
            value={baseDueOn}
            onChange={(e) => onBaseDueOnChange(Number(e.target.value) || 1)}
            disabled={disabled}
            className={inputClass}
          >
            {dayOptions.map((day) => (
              <option key={day} value={day} className="bg-[#111] text-gray-100">
                {day}
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
          Optional — change the due day from a month onward (transition month is prorated).
        </p>

        {adjustments.length === 0 ? (
          !disabled && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Change due day from a month
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
                    <label className="mb-1 block text-xs text-gray-500">New due day</label>
                  )}
                  <select
                    value={row.dueOn}
                    onChange={(e) => updateRow(row.id, { dueOn: e.target.value })}
                    disabled={disabled}
                    className={inputClass}
                    aria-label={`New due day ${index + 1}`}
                  >
                    {dayOptions.map((day) => (
                      <option key={day} value={day} className="bg-[#111] text-gray-100">
                        {day}
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
