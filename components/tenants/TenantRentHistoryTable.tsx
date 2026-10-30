"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getDepositPayment, getRentEntryPayment } from "@/lib/api/tenantsApi";
import BankStatementCell from "@/components/tenants/BankStatementCell";
import {
  RENT_STATUS_COLORS,
  buildBankStatementTxsByHistoryIndex,
  buildPaymentPieceRoleMap,
  buildPaymentTotalsByGroup,
  buildRunningBalancesFromPaymentHistory,
  computeLandlordDisplayBalance,
  formatRentMoney,
  getOriginatingPaymentsForMonth,
  getPaymentPieces,
  getVisibleRentHistory,
  hasRecordedPayment,
  isDueDayChangeLineItem,
  isFirstMoveInPaymentEntry,
  resolveRowDisplayBalance,
} from "@/lib/rentHistoryDisplay";

type Props = {
  tenantId?: string | null;
  rentHistory?: any[];
  tenant?: any;
  loading?: boolean;
  /** Admin / super-admin: no edit, remove, or record-payment controls. */
  readOnly?: boolean;
  /** Optional title shown above the summary strip */
  title?: string | null;
};

export default function TenantRentHistoryTable({
  tenantId,
  rentHistory = [],
  tenant,
  loading = false,
  readOnly = true,
  title = null,
}: Props) {
  const history = Array.isArray(rentHistory) ? rentHistory : [];
  const paymentPieceRoles = useMemo(() => buildPaymentPieceRoleMap(history), [history]);
  const paymentTotalsByGroup = useMemo(() => buildPaymentTotalsByGroup(history), [history]);
  const bankStatementByIndex = useMemo(
    () => buildBankStatementTxsByHistoryIndex(history),
    [history]
  );
  const runningBalancesByIndex = useMemo(
    () => buildRunningBalancesFromPaymentHistory(history, bankStatementByIndex, paymentPieceRoles),
    [history, bankStatementByIndex, paymentPieceRoles]
  );

  const depositAmount = Number(tenant?.depositAmount) || 0;
  const depositPaidDate = tenant?.depositPaidDate || tenant?.depositStartDate || null;
  const monthlyRent = Number(tenant?.rent) || 0;
  const rentFrequency = tenant?.rentFrequency === "weekly" ? "Weekly rent" : "Monthly rent";
  const moveInDate = tenant?.moveInDate || null;
  const moveOutDate = tenant?.moveOutDate || null;
  const isArchived = Boolean(tenant?.archived);
  const room = tenant?.room ? String(tenant.room).trim() : "";
  const propertyLabel = [tenant?.property, room].filter(Boolean).join(" · ");
  const displayBalance = computeLandlordDisplayBalance(tenant || { rentHistory: history });
  const balanceLabel =
    Math.abs(displayBalance) < 0.005
      ? "Settled"
      : displayBalance > 0
        ? "In credit"
        : "Underpaid";
  const balanceClass =
    Math.abs(displayBalance) < 0.005
      ? "border-gray-800 bg-[#0a0a0a] text-gray-300"
      : displayBalance > 0
        ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-200"
        : "border-rose-800/50 bg-rose-950/30 text-rose-200";

  const [paymentReview, setPaymentReview] = useState<{
    index: number;
    entry: any;
    loading: boolean;
    linkedTransactions: any[];
    paymentHistory: any[];
    paymentMethod: string;
  } | null>(null);

  const [depositReview, setDepositReview] = useState<{
    loading: boolean;
    depositAmount: number;
    depositPaidDate: any;
    transaction: any | null;
    transactions?: any[];
    allocatedTotal?: number;
    error?: string | null;
  } | null>(null);

  const openPaymentReview = async (index: number, entry: any) => {
    if (!hasRecordedPayment(entry)) return;
    setPaymentReview({
      index,
      entry,
      loading: true,
      linkedTransactions: [],
      paymentHistory: getPaymentPieces(entry),
      paymentMethod: entry.paymentMethod || "none",
    });
    if (!tenantId) {
      setPaymentReview((prev) => (prev ? { ...prev, loading: false } : prev));
      return;
    }
    try {
      const res = await getRentEntryPayment(tenantId, { index });
      const data = res?.data || {};
      setPaymentReview({
        index: data.index ?? index,
        entry: data.entry || entry,
        loading: false,
        linkedTransactions: Array.isArray(data.linkedTransactions) ? data.linkedTransactions : [],
        paymentHistory: Array.isArray(data.paymentHistory)
          ? data.paymentHistory
          : getPaymentPieces(data.entry || entry),
        paymentMethod: data.paymentMethod || entry.paymentMethod || "none",
      });
    } catch {
      setPaymentReview((prev) => (prev ? { ...prev, loading: false } : prev));
    }
  };

  const openDepositReview = async () => {
    if (!(depositAmount > 0)) return;
    setDepositReview({
      loading: true,
      depositAmount,
      depositPaidDate,
      transaction: null,
      transactions: [],
      error: null,
    });
    if (!tenantId) {
      setDepositReview((prev) =>
        prev ? { ...prev, loading: false, error: "Tenant id missing" } : prev
      );
      return;
    }
    try {
      const res = await getDepositPayment(tenantId);
      const data = res?.data || {};
      const txs = Array.isArray(data.transactions)
        ? data.transactions
        : data.transaction
          ? [data.transaction]
          : [];
      setDepositReview({
        loading: false,
        depositAmount: Number(data.depositAmount) || depositAmount,
        depositPaidDate: data.depositPaidDate || depositPaidDate,
        transaction: txs[0] || null,
        transactions: txs,
        allocatedTotal: Number(data.allocatedTotal) || undefined,
        error: null,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "No linked bank transaction — this deposit was recorded manually.";
      setDepositReview({
        loading: false,
        depositAmount,
        depositPaidDate,
        transaction: null,
        transactions: [],
        error: msg,
      });
    }
  };

  const showLeaseStrip =
    Boolean(title) ||
    monthlyRent > 0 ||
    depositAmount > 0 ||
    Boolean(moveInDate) ||
    Boolean(moveOutDate) ||
    Boolean(propertyLabel);

  return (
    <>
      {showLeaseStrip && (
        <div className="mb-4 space-y-3">
          {(propertyLabel || moveInDate || moveOutDate || title) && (
            <div>
              {title ? (
                <div className="mb-1 text-sm font-medium text-gray-200">{title}</div>
              ) : null}
              {(propertyLabel || moveInDate || (isArchived && moveOutDate)) && (
                <p className="text-xs sm:text-sm text-gray-400">
                  {propertyLabel}
                  {propertyLabel && moveInDate ? " · " : ""}
                  {moveInDate ? `Moved in ${formatDate(moveInDate)}` : ""}
                  {isArchived && moveOutDate
                    ? `${propertyLabel || moveInDate ? " · " : ""}Tenancy ended ${formatDate(moveOutDate)}`
                    : ""}
                </p>
              )}
            </div>
          )}

          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${balanceClass}`}
          >
            <div>
              <p className="text-[11px] uppercase tracking-wide opacity-70">Current balance</p>
              <p className="text-sm font-medium">{balanceLabel}</p>
            </div>
            <p className="text-lg font-semibold tabular-nums">
              {formatRentMoney(Math.abs(displayBalance))}
            </p>
          </div>

          <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
              {monthlyRent > 0 && (
                <p>
                  {rentFrequency}{" "}
                  <span className="font-medium text-gray-200">
                    {formatRentMoney(monthlyRent)}
                  </span>
                </p>
              )}
              {depositAmount > 0 && (
                <p className="flex flex-wrap items-center gap-2">
                  Deposit held{" "}
                  <span className="font-medium text-gray-200">
                    {formatRentMoney(depositAmount)}
                  </span>
                  {depositPaidDate && (
                    <span className="text-gray-500">
                      (paid {formatDate(depositPaidDate)})
                    </span>
                  )}
                  {tenantId ? (
                    <button
                      type="button"
                      onClick={() => openDepositReview()}
                      className="rounded-full border border-sky-900/80 px-2.5 py-0.5 text-[11px] text-sky-300 hover:bg-sky-950/40"
                      title="See the bank transaction linked to this deposit"
                    >
                      View bank payment
                    </button>
                  ) : null}
                </p>
              )}
              {moveInDate && (
                <p>
                  Move-in{" "}
                  <span className="font-medium text-gray-200">{formatDate(moveInDate)}</span>
                </p>
              )}
              {moveOutDate && (
                <p>
                  Tenancy ended{" "}
                  <span className="font-medium text-gray-200">{formatDate(moveOutDate)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-gray-800/80 bg-[#0c0c0c] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
              <th className="whitespace-nowrap px-4 py-3 text-xs">Amount Due</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Amount Paid</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Payment history</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Due Date</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Balance</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Actions</th>
              <th className="whitespace-nowrap px-4 py-3 text-xs">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Loading rent history…
                </td>
              </tr>
            ) : (
              (() => {
                const visibleHistory = getVisibleRentHistory(history);
                if (!visibleHistory.length) {
                  return (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No rent history found for this tenant.
                      </td>
                    </tr>
                  );
                }

                return visibleHistory.map(({ entry, index }: { entry: any; index: number }) => {
                  const kind = String(entry?.kind || "rent");
                  const isAdjustment = kind === "discount" || kind === "refund";
                  const isChargeLike = kind === "charge" || kind === "transition";
                  const isFirstPayment = !isAdjustment && isFirstMoveInPaymentEntry(entry, tenant);
                  const lineItems = Array.isArray(entry?.lineItems) ? entry.lineItems : [];
                  const remaining =
                    (Number(entry.amountDue ?? entry.rent) || 0) - (Number(entry.amountPaid) || 0);
                  const recorded = !isAdjustment && hasRecordedPayment(entry);
                  const statusLabel = String(entry.status || "unpaid");
                  const statusKey =
                    statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);
                  const dueDisplay = isAdjustment
                    ? -(Number(entry.adjustmentAmount) || 0)
                    : Number(entry.amountDue ?? entry.rent) || 0;

                  return (
                    <tr
                      key={entry._id || `${kind}-${index}`}
                      className={`border-t border-[#151515] hover:bg-[#0e0e0e] ${recorded ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (recorded) openPaymentReview(index, entry);
                      }}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                        <div className="tabular-nums">{formatRentMoney(dueDisplay)}</div>
                        {(() => {
                          const dueDayExtras = lineItems.filter(isDueDayChangeLineItem);
                          if (!dueDayExtras.length || isAdjustment) return null;
                          const extraTotal = dueDayExtras.reduce(
                            (s: number, li: any) => s + (Number(li?.amount) || 0),
                            0
                          );
                          const baseRent = Math.round((dueDisplay - extraTotal) * 100) / 100;
                          return (
                            <div className="mt-0.5 text-[11px] text-amber-400/90">
                              {formatRentMoney(baseRent)} rent + {formatRentMoney(extraTotal)}{" "}
                              extra days
                            </div>
                          );
                        })()}
                        {lineItems.map((item: any, i: number) => {
                          const itemAmt = Number(item?.amount) || 0;
                          if (!(itemAmt > 0)) return null;
                          const itemType = String(item?.type || "charge");
                          const sign = itemType === "charge" ? "+" : "−";
                          const isDueDayAdj = isDueDayChangeLineItem(item);
                          return (
                            <div
                              key={item?._id || i}
                              className={`mt-0.5 text-[11px] ${
                                isDueDayAdj ? "text-amber-500/80" : "text-gray-500"
                              }`}
                            >
                              {sign}
                              {formatRentMoney(itemAmt)}
                              {item?.label ? ` · ${item.label}` : ""}
                            </div>
                          );
                        })}
                        {!isFirstPayment &&
                          lineItems.length === 0 &&
                          (isChargeLike || isAdjustment) && (
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              {entry.label || kind}
                            </div>
                          )}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 ${
                          !isAdjustment && remaining > 0 ? "text-rose-400" : "text-gray-300"
                        }`}
                      >
                        {isAdjustment ? "—" : formatRentMoney(Number(entry.amountPaid) || 0)}
                      </td>
                      <td className="min-w-[7rem] px-4 py-3 align-top">
                        {isAdjustment ? (
                          <span className="text-sm text-gray-500">—</span>
                        ) : (
                          <BankStatementCell txs={bankStatementByIndex.get(index) || []} />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                        {formatDate(entry.dueDate || entry.month)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${
                            RENT_STATUS_COLORS[statusKey] || "bg-gray-800 text-gray-400"
                          }`}
                        >
                          {statusKey}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-top">
                        {(() => {
                          if (isAdjustment) {
                            return <span className="text-sm text-gray-500">—</span>;
                          }
                          const bal = resolveRowDisplayBalance(
                            runningBalancesByIndex.get(index) ?? 0
                          );
                          if (Math.abs(bal) < 0.005) {
                            return <span className="text-sm text-gray-400">Settled</span>;
                          }
                          if (bal > 0) {
                            return (
                              <div>
                                <span className="block tabular-nums text-sm font-medium text-emerald-300">
                                  {formatRentMoney(bal)}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-emerald-400/80">
                                  In credit
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div>
                              <span className="block tabular-nums text-sm font-medium text-rose-300">
                                {formatRentMoney(Math.abs(bal))}
                              </span>
                              <span className="mt-0.5 block text-[11px] text-rose-400/80">
                                Arrears
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {isAdjustment ? (
                          <span className="text-xs text-gray-500">—</span>
                        ) : recorded &&
                          entry.paymentMethod &&
                          entry.paymentMethod !== "none" ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPaymentReview(index, entry);
                            }}
                            className="rounded-full border border-[#2A2A2A] px-3 py-1 text-xs text-gray-300 hover:bg-white/5"
                          >
                            {entry.paymentMethod}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="min-w-[12rem] px-4 py-3 align-top">
                        {(() => {
                          if (isAdjustment) {
                            return <span className="text-sm text-gray-500">—</span>;
                          }
                          const totalPaid = Number(entry.amountPaid) || 0;
                          const pieces = getPaymentPieces(entry);
                          const originating = getOriginatingPaymentsForMonth(
                            entry,
                            index,
                            paymentPieceRoles,
                            paymentTotalsByGroup
                          );
                          const creditOnly =
                            totalPaid > 0 && originating.length === 0 && pieces.length > 0;

                          if ((totalPaid <= 0 && !creditOnly) || !recorded) {
                            return <span className="text-sm text-gray-500">—</span>;
                          }

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentReview(index, entry);
                              }}
                              className="inline-flex items-center rounded-lg border border-gray-700 bg-[#141414] px-2.5 py-1 text-xs font-medium text-sky-300 transition hover:border-sky-500/50 hover:text-sky-200"
                              title="View payment details"
                            >
                              Details
                            </button>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                });
              })()
            )}
          </tbody>
        </table>
      </div>

      {paymentReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-[#0c0c0c] p-5 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold">Payment details</h4>
                <p className="text-xs text-gray-400">
                  Due {formatDate(paymentReview.entry?.dueDate || paymentReview.entry?.month)}
                  {paymentReview.paymentMethod && paymentReview.paymentMethod !== "none"
                    ? ` · ${paymentReview.paymentMethod}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentReview(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
                <div className="text-xs text-gray-500">Amount due</div>
                <div className="mt-1 tabular-nums text-gray-200">
                  {formatRentMoney(
                    Number(paymentReview.entry?.amountDue ?? paymentReview.entry?.rent) || 0
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-[#1a1a1a] bg-[#080808] p-3">
                <div className="text-xs text-gray-500">Amount paid</div>
                <div className="mt-1 tabular-nums text-gray-200">
                  {formatRentMoney(Number(paymentReview.entry?.amountPaid) || 0)}
                </div>
              </div>
            </div>

            {paymentReview.loading ? (
              <div className="py-6 text-center text-sm text-gray-400">Loading breakdown…</div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Payment history
                </div>
                {(paymentReview.paymentHistory || []).length === 0 ? (
                  <div className="text-sm text-gray-400">No payment pieces recorded.</div>
                ) : (
                  <div className="space-y-2">
                    {paymentReview.paymentHistory.map((p: any, i: number) => {
                      const rentAmt = Number(p.amount) || 0;
                      const depAmt = Number(p.depositAllocated) || 0;
                      const bankAmt = Number(p.bankAmount) || 0;
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-[#151515] bg-[#080808] px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-gray-300">
                              {p.paidOn ? formatDate(p.paidOn) : "—"}
                              {p.method ? ` · ${p.method}` : ""}
                            </div>
                            <div className="tabular-nums text-gray-200">
                              {formatRentMoney(bankAmt > 0 ? bankAmt : rentAmt + depAmt)}
                            </div>
                          </div>
                          {(depAmt > 0.001 || rentAmt > 0.001) && (
                            <div className="mt-1 text-[11px] text-sky-400/90">
                              {depAmt > 0.001 ? `${formatRentMoney(depAmt)} deposit` : ""}
                              {depAmt > 0.001 && rentAmt > 0.001 ? " · " : ""}
                              {rentAmt > 0.001 ? `${formatRentMoney(rentAmt)} rent` : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(paymentReview.linkedTransactions || []).length > 0 && (
                  <div className="pt-2">
                    <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                      Linked bank transactions
                    </div>
                    <div className="space-y-2">
                      {paymentReview.linkedTransactions.map((tx: any, i: number) => {
                        const depAmt = Number(tx.depositAllocated) || 0;
                        const rentAmt = Number(tx.allocatedAmount) || 0;
                        return (
                          <div
                            key={tx._id || tx.transactionId || i}
                            className="rounded-lg border border-[#151515] bg-[#080808] px-3 py-2 text-sm"
                          >
                            <div className="flex justify-between gap-3 text-gray-200">
                              <span className="font-medium">
                                {tx.payerName || tx.reference || tx.description || "Bank payment"}
                              </span>
                              <span className="tabular-nums">
                                {formatRentMoney(
                                  Number(tx.bankAmount ?? tx.amount) || 0
                                )}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              {tx.date ? formatDateTime(tx.date) : "—"}
                              {tx.reference ? ` · Ref ${tx.reference}` : ""}
                            </div>
                            {(depAmt > 0.001 || rentAmt > 0.001) && (
                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-gray-400">
                                {depAmt > 0.001 && (
                                  <span>
                                    Applied to deposit{" "}
                                    <span className="tabular-nums text-sky-300">
                                      {formatRentMoney(depAmt)}
                                    </span>
                                  </span>
                                )}
                                {rentAmt > 0.001 && (
                                  <span>
                                    Applied to rent{" "}
                                    <span className="tabular-nums text-gray-300">
                                      {formatRentMoney(rentAmt)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setPaymentReview(null)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {depositReview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Deposit bank payment</h3>
                <p className="text-sm text-gray-400">
                  Linked to deposit held ·{" "}
                  {depositReview.depositPaidDate
                    ? `paid ${formatDate(depositReview.depositPaidDate)}`
                    : "date not set"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDepositReview(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 space-y-2 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Deposit held</span>
                <span className="tabular-nums font-medium text-gray-100">
                  {formatRentMoney(depositReview.depositAmount)}
                </span>
              </div>
            </div>

            {depositReview.loading ? (
              <p className="mb-4 text-sm text-gray-500">Loading linked bank transaction…</p>
            ) : (depositReview.transactions?.length || depositReview.transaction) ? (
              <div className="mb-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                  Linked bank transaction
                  {(depositReview.transactions?.length || 0) > 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {(depositReview.transactions?.length
                    ? depositReview.transactions
                    : [depositReview.transaction]
                  ).map((tx: any, i: number) => (
                    <div
                      key={String(tx?._id || i)}
                      className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-3 text-sm"
                    >
                      <div className="flex justify-between gap-3 text-gray-200">
                        <span className="font-medium">
                          {tx?.payerName || tx?.description || "Bank payment"}
                        </span>
                        <span className="tabular-nums">
                          {formatRentMoney(
                            Math.abs(Number(tx?.bankAmount ?? tx?.amount) || 0)
                          )}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDateTime(tx?.date)}
                        {tx?.description ? ` · ${tx.description}` : ""}
                        {tx?.reference ? ` · Ref ${tx.reference}` : ""}
                      </div>
                      <div className="mt-2 flex justify-between gap-3 text-[12px] text-gray-400">
                        <span>Applied to deposit</span>
                        <span className="tabular-nums text-sky-300">
                          {formatRentMoney(
                            Number(tx?.allocatedAmount) ||
                              Math.abs(Number(tx?.bankAmount ?? tx?.amount) || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mb-4 rounded-lg border border-[#1a1a1a] px-3 py-3 text-sm text-gray-500">
                {depositReview.error ||
                  "No linked bank transaction — this deposit was recorded manually."}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDepositReview(null)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
