"use client";

import { Plus, X } from "lucide-react";

export type RentAdjustmentRow = {
  id: string;
  startMonth: string; // YYYY-MM
  amount: string;
};

export function scheduleFromTenant(tenant: any): {
  baseRent: string;
  adjustments: RentAdjustmentRow[];
} {
  const baseRent =
    tenant?.rent != null && tenant?.rent !== ""
      ? String(tenant.rent)
      : "";
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
  return { baseRent, adjustments: adjustments as RentAdjustmentRow[] };
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
  /** Hide base rent when parent already renders Monthly rent field */
  hideBaseRent?: boolean;
  baseRentLabel?: string;
};

function sanitizeRent(value: string) {
  return value.replace(/[^0-9.]/g, "");
}

function newId() {
  return `adj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
  baseRentLabel = "Monthly rent (£)",
}: Props) {
  const addRow = () => {
    const now = new Date();
    const startMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onAdjustmentsChange([
      ...adjustments,
      { id: newId(), startMonth, amount: "" },
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
      {!hideBaseRent && (
        <div>
          <label className={labelClass}>{baseRentLabel}</label>
          <input
            value={baseRent}
            onChange={(e) => onBaseRentChange(sanitizeRent(e.target.value))}
            disabled={disabled}
            inputMode="decimal"
            className={inputClass}
            placeholder="e.g. 1000"
          />
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
          Optional. Each change applies from that month until the next one.
        </p>

        {adjustments.length === 0 ? (
          !disabled && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add a rent change
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
                    aria-label={`From month ${index + 1}`}
                  />
                </div>
                <div>
                  {index === 0 && (
                    <label className="mb-1 block text-xs text-gray-500">New rent (£)</label>
                  )}
                  <input
                    value={row.amount}
                    onChange={(e) =>
                      updateRow(row.id, { amount: sanitizeRent(e.target.value) })
                    }
                    disabled={disabled}
                    inputMode="decimal"
                    className={inputClass}
                    placeholder="e.g. 1200"
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
