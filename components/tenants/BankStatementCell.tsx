"use client";

import { Info } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatRentMoney, type BankStatementTx } from "@/lib/rentHistoryDisplay";

type Props = {
  txs: BankStatementTx[];
  /** Use when the page has its own money formatter (defaults to formatRentMoney). */
  formatMoney?: (value: number) => string;
};

export default function BankStatementCell({ txs, formatMoney = formatRentMoney }: Props) {
  if (!txs.length) {
    return <span className="text-sm text-gray-500">—</span>;
  }

  const total = Math.round(txs.reduce((s, tx) => s + (Number(tx.amount) || 0), 0) * 100) / 100;

  return (
    <div className="flex items-center gap-1.5">
      <span className="tabular-nums text-sm font-medium text-gray-200">{formatMoney(total)}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0 rounded p-0.5 text-sky-400/90 hover:bg-sky-950/50 hover:text-sky-300"
            title="Payment history details"
            aria-label="Payment history details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-56 border-gray-800 bg-[#0c0c0c] p-3 text-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Payment history
          </p>
          <ul className="space-y-2">
            {txs.map((tx) => (
              <li key={tx.key} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="tabular-nums font-medium text-gray-200">
                  {formatMoney(tx.amount)}
                </span>
                <span className="shrink-0 text-[11px] text-gray-500">
                  {tx.paidOn ? formatDate(tx.paidOn) : "—"}
                </span>
              </li>
            ))}
          </ul>
          {txs.length > 1 ? (
            <p className="mt-2 border-t border-gray-800 pt-2 text-[11px] text-gray-500">
              {txs.length} payments · total {formatMoney(total)}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
