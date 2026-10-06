"use client";

import DateInput from "@/components/ui/date-input";
import {
  computeFirstPeriodDue,
  firstPaymentDifference,
} from "@/lib/firstPeriodDue";
import { useMemo } from "react";

export type FirstPaymentMethod = "cash" | "bank" | "";

type Props = {
  monthlyRent: number | string;
  moveInDate?: string | null;
  dueOn?: number | string;
  rentSchedule?: Array<{ effectiveFrom: string; amount: number }> | null;
  amount: string;
  paymentDate: string;
  paymentMethod?: FirstPaymentMethod;
  onAmountChange: (value: string) => void;
  onPaymentDateChange: (iso: string) => void;
  onPaymentMethodChange?: (method: FirstPaymentMethod) => void;
  amountLabel?: string;
  className?: string;
  inputClassName?: string;
  dateInputClassName?: string;
};

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function FirstRentPaymentFields({
  monthlyRent,
  moveInDate,
  dueOn,
  rentSchedule,
  amount,
  paymentDate,
  paymentMethod = "",
  onAmountChange,
  onPaymentDateChange,
  onPaymentMethodChange,
  amountLabel = "Amount paid (£)",
  className = "rounded-xl border border-[#222] bg-[#0a0a0a] p-4",
  inputClassName = "w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700",
  dateInputClassName,
}: Props) {
  const dueInfo = useMemo(
    () =>
      computeFirstPeriodDue({
        monthlyRent,
        moveInDate,
        dueOn,
        rentSchedule,
      }),
    [monthlyRent, moveInDate, dueOn, rentSchedule]
  );

  const diff = dueInfo ? firstPaymentDifference(amount, dueInfo.amount) : null;
  const hasEntered = String(amount || "").trim() !== "" && Number(amount) > 0;
  const matchesExact = dueInfo && hasEntered && Math.abs(diff ?? 1) < 0.005;

  const fillExact = () => {
    if (!dueInfo) return;
    onAmountChange(dueInfo.amount.toFixed(2));
    if (!paymentDate && moveInDate) onPaymentDateChange(moveInDate);
  };

  return (
    <div className={className}>
      <p className="text-base font-medium text-gray-100">First rent payment</p>

      {dueInfo ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-base text-gray-300">
            Amount due:{" "}
            <span className="font-semibold tabular-nums text-white">{money(dueInfo.amount)}</span>
          </p>
          <button
            type="button"
            onClick={fillExact}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-black hover:brightness-110"
          >
            Use this amount
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">Add move-in date and rent first.</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-base text-gray-200">{amountLabel}</label>
          <input
            value={amount}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder={dueInfo ? dueInfo.amount.toFixed(2) : "0.00"}
            className={inputClassName}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-base text-gray-200">Payment date</label>
          <DateInput
            value={paymentDate}
            onChange={onPaymentDateChange}
            className={dateInputClassName || inputClassName}
          />
        </div>
      </div>

      {hasEntered && onPaymentMethodChange && (
        <div className="mt-4">
          <label className="mb-1.5 block text-base text-gray-200">Payment method</label>
          <div className="flex gap-2">
            {(["cash", "bank"] as const).map((method) => {
              const selected = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => onPaymentMethodChange(method)}
                  className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                    selected
                      ? "border-emerald-600 bg-emerald-600/15 text-emerald-300"
                      : "border-[#2A2A2A] text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            How was this first rent payment received?
          </p>
        </div>
      )}

      {dueInfo && hasEntered && !matchesExact && diff != null && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber-300">
          <span>
            {diff > 0 ? `Short by ${money(diff)}` : `Over by ${money(Math.abs(diff))}`}
          </span>
          <button
            type="button"
            onClick={fillExact}
            className="font-medium text-emerald-300 underline underline-offset-2"
          >
            Fix to {money(dueInfo.amount)}
          </button>
        </div>
      )}
    </div>
  );
}
