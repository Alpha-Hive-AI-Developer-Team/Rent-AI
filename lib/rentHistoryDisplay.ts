import { isDueDayChangeLineItem } from "@/lib/dueDayChange";

export type PaymentPieceRole = "payment" | "credit" | "cover";

export const RENT_STATUS_COLORS: Record<string, string> = {
  Paid: "bg-green-900/40 text-green-400 border-green-700/60",
  Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
  Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
  Applied: "bg-violet-900/40 text-violet-300 border-violet-700/60",
  Vacant: "bg-amber-900/40 text-amber-300 border-amber-700/60",
  Archived: "bg-gray-800/60 text-gray-300 border-gray-600",
};

export function formatRentMoney(value: number) {
  return `£${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function toUtcDayMs(value: any): number | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function hasRecordedPayment(entry: any) {
  const paid = Number(entry?.amountPaid) || 0;
  const method = String(entry?.paymentMethod || "none").toLowerCase();
  const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
  return paid > 0 || method === "bank" || method === "cash" || pieces.length > 0;
}

export function getPaymentPieces(entry: any) {
  const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
  return pieces.filter((p: any) => (Number(p?.amount) || 0) > 0);
}

export function isFirstMoveInPaymentEntry(entry: any, tenant?: any) {
  if (!entry) return false;
  const label = String(entry.label || "").toLowerCase();
  if (label === "first payment" || label.includes("first payment")) return true;
  const pieces = Array.isArray(entry.linkedPayments) ? entry.linkedPayments : [];
  if (
    pieces.some((p: any) =>
      String(p?.note || "")
        .toLowerCase()
        .includes("first move-in")
    )
  ) {
    return true;
  }
  const moveInMs = toUtcDayMs(tenant?.moveInDate);
  const dueMs = toUtcDayMs(entry?.dueDate);
  if (
    moveInMs != null &&
    dueMs != null &&
    moveInMs === dueMs &&
    (Number(entry.amountPaid) || 0) > 0 &&
    (!entry.kind || entry.kind === "rent")
  ) {
    return true;
  }
  return false;
}

export function getPaymentPieceGroupKey(piece: any, historyIndex: number, pieceIndex: number) {
  const txId = piece?.transactionId;
  if (txId != null && String(txId).trim() !== "") return `tx:${String(txId)}`;
  // Manual cash/bank payment split across months (same id on every piece).
  const groupId = piece?.paymentGroupId;
  if (groupId != null && String(groupId).trim() !== "") return `grp:${String(groupId)}`;
  return `solo:${historyIndex}:${pieceIndex}`;
}

export function buildPaymentPieceRoleMap(rentHistory: any[]) {
  const history = Array.isArray(rentHistory) ? rentHistory : [];
  const roles = new Map<string, PaymentPieceRole>();
  const groups = new Map<
    string,
    { historyIndex: number; pieceIndex: number; dueMs: number | null; paidMs: number | null }[]
  >();

  history.forEach((entry: any, historyIndex: number) => {
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    const dueMs = toUtcDayMs(entry?.dueDate ?? entry?.month);
    pieces.forEach((piece: any, pieceIndex: number) => {
      const amt = Number(piece?.amount) || 0;
      const depositPart = Number(piece?.depositAllocated) || 0;
      if (amt <= 0 && depositPart <= 0) return;
      const key = getPaymentPieceGroupKey(piece, historyIndex, pieceIndex);
      const list = groups.get(key) || [];
      list.push({
        historyIndex,
        pieceIndex,
        dueMs,
        paidMs: toUtcDayMs(piece?.paidOn),
      });
      groups.set(key, list);
    });
  });

  groups.forEach((list) => {
    list.sort((a, b) => {
      const dueA = a.dueMs ?? Number.POSITIVE_INFINITY;
      const dueB = b.dueMs ?? Number.POSITIVE_INFINITY;
      if (dueA !== dueB) return dueA - dueB;
      if (a.historyIndex !== b.historyIndex) return a.historyIndex - b.historyIndex;
      return a.pieceIndex - b.pieceIndex;
    });

    list.forEach((item, i) => {
      const mapKey = `${item.historyIndex}:${item.pieceIndex}`;
      if (i > 0) {
        roles.set(mapKey, "credit");
        return;
      }
      const late = item.paidMs != null && item.dueMs != null && item.paidMs > item.dueMs;
      roles.set(mapKey, late ? "cover" : "payment");
    });
  });

  return roles;
}

export function getPaymentPieceRole(
  roleMap: Map<string, PaymentPieceRole> | null | undefined,
  historyIndex: number,
  pieceIndex: number
): PaymentPieceRole {
  return roleMap?.get(`${historyIndex}:${pieceIndex}`) || "payment";
}

export function buildPaymentTotalsByGroup(rentHistory: any[]) {
  const history = Array.isArray(rentHistory) ? rentHistory : [];
  const totals = new Map<
    string,
    {
      amount: number;
      paidOn: any;
      method: string;
      depositAllocated: number;
      rentApplied: number;
      hasBankAmount: boolean;
    }
  >();

  history.forEach((entry: any, historyIndex: number) => {
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    pieces.forEach((piece: any, pieceIndex: number) => {
      const amt = Number(piece?.amount) || 0;
      const depositPart = Number(piece?.depositAllocated) || 0;
      if (amt <= 0 && depositPart <= 0) return;
      const key = getPaymentPieceGroupKey(piece, historyIndex, pieceIndex);
      const bankAmt = Number(piece?.bankAmount) || 0;
      const prev = totals.get(key);
      if (!prev) {
        totals.set(key, {
          amount: bankAmt > 0 ? bankAmt : Math.round((amt + depositPart) * 100) / 100,
          paidOn: piece.paidOn || null,
          method: String(piece.method || (piece.transactionId ? "bank" : "cash")),
          depositAllocated: depositPart,
          rentApplied: amt,
          hasBankAmount: bankAmt > 0,
        });
        return;
      }
      prev.rentApplied = Math.round((prev.rentApplied + amt) * 100) / 100;
      if (bankAmt > 0) {
        prev.amount = Math.max(prev.amount, bankAmt);
        prev.hasBankAmount = true;
      } else if (!prev.hasBankAmount) {
        prev.amount =
          Math.round((prev.rentApplied + Math.max(prev.depositAllocated, depositPart)) * 100) / 100;
      }
      if (depositPart > prev.depositAllocated) prev.depositAllocated = depositPart;
      const prevMs = toUtcDayMs(prev.paidOn);
      const nextMs = toUtcDayMs(piece.paidOn);
      if (prevMs == null || (nextMs != null && nextMs < prevMs)) {
        prev.paidOn = piece.paidOn;
      }
    });
  });

  return totals;
}

export function getOriginatingPaymentsForMonth(
  entry: any,
  historyIndex: number,
  roleMap: Map<string, PaymentPieceRole>,
  paymentTotals: Map<
    string,
    {
      amount: number;
      paidOn: any;
      method: string;
      depositAllocated: number;
      rentApplied: number;
      hasBankAmount: boolean;
    }
  >
) {
  const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
  const byKey = new Map<
    string,
    {
      key: string;
      amount: number;
      appliedThisMonth: number;
      rentAppliedTotal: number;
      depositAllocated: number;
      paidOn: any;
      method: string;
      role: PaymentPieceRole;
      transactionId: any;
    }
  >();

  pieces.forEach((piece: any, pieceIndex: number) => {
    const applied = Number(piece?.amount) || 0;
    const depositPart = Number(piece?.depositAllocated) || 0;
    if (applied <= 0 && depositPart <= 0) return;
    const role = getPaymentPieceRole(roleMap, historyIndex, pieceIndex);
    if (role === "credit") return;

    const key = getPaymentPieceGroupKey(piece, historyIndex, pieceIndex);
    if (byKey.has(key)) {
      const row = byKey.get(key)!;
      row.appliedThisMonth = Math.round((row.appliedThisMonth + applied) * 100) / 100;
      return;
    }

    const totals = paymentTotals.get(key);
    byKey.set(key, {
      key,
      amount: totals?.amount ?? Math.round((applied + depositPart) * 100) / 100,
      appliedThisMonth: applied,
      rentAppliedTotal: totals?.rentApplied ?? applied,
      depositAllocated: totals?.depositAllocated ?? depositPart,
      paidOn: totals?.paidOn ?? piece.paidOn ?? null,
      method: totals?.method ?? String(piece.method || (piece.transactionId ? "bank" : "cash")),
      role,
      transactionId: piece.transactionId || null,
    });
  });

  return Array.from(byKey.values()).sort((a, b) => {
    const da = toUtcDayMs(a.paidOn) ?? 0;
    const db = toUtcDayMs(b.paidOn) ?? 0;
    if (da !== db) return da - db;
    return a.amount - b.amount;
  });
}

export function buildRunningBalancesByIndex(
  rentHistory: any[],
  roleMap: Map<string, PaymentPieceRole>,
  paymentTotals: Map<
    string,
    {
      amount: number;
      paidOn: any;
      method: string;
      depositAllocated: number;
      rentApplied: number;
      hasBankAmount: boolean;
    }
  >
) {
  const history = Array.isArray(rentHistory) ? rentHistory : [];
  const ordered = history
    .map((entry: any, index: number) => ({ entry, index }))
    .sort((a, b) => {
      const da = toUtcDayMs(a.entry?.dueDate ?? a.entry?.month) ?? Number.POSITIVE_INFINITY;
      const db = toUtcDayMs(b.entry?.dueDate ?? b.entry?.month) ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return a.index - b.index;
    });

  const balances = new Map<number, number>();
  const countedPaymentKeys = new Set<string>();
  let rentIn = 0;
  let dues = 0;

  for (const { entry, index } of ordered) {
    const kind = String(entry?.kind || "rent");
    if (kind !== "discount" && kind !== "refund") {
      dues = Math.round((dues + (Number(entry?.amountDue) || 0)) * 100) / 100;
    }

    const originating = getOriginatingPaymentsForMonth(entry, index, roleMap, paymentTotals);
    for (const row of originating) {
      if (countedPaymentKeys.has(row.key)) continue;
      countedPaymentKeys.add(row.key);
      const bankOrCash = Number(row.amount) || 0;
      const depositPart = Number(row.depositAllocated) || 0;
      rentIn = Math.round((rentIn + Math.max(0, bankOrCash - depositPart)) * 100) / 100;
    }

    balances.set(index, Math.round((rentIn - dues) * 100) / 100);
  }
  return balances;
}

/** Same visibility rules as landlord rent history table. */
export function getVisibleRentHistory(rentHistory: any[]) {
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return (Array.isArray(rentHistory) ? rentHistory : [])
    .map((entry: any, index: number) => ({ entry, index }))
    .filter(({ entry }: { entry: any }) => {
      const kind = String(entry?.kind || "rent");
      const due = Number(entry?.amountDue ?? entry?.rent) || 0;
      const paid = Number(entry?.amountPaid) || 0;
      const adj = Number(entry?.adjustmentAmount) || 0;
      if (kind === "discount" || kind === "refund") {
        return adj > 0 || due !== 0 || paid !== 0;
      }
      if (due === 0 && paid === 0) return false;
      const dueMs = toUtcDayMs(entry?.dueDate ?? entry?.month);
      if (dueMs != null && dueMs > todayMs) return false;
      return true;
    });
}

/** Last visible rent/charge row index (skips discount/refund audit rows). */
export function getLastVisibleRentHistoryIndex(
  visibleHistory: { entry: any; index: number }[]
): number | null {
  for (let i = visibleHistory.length - 1; i >= 0; i--) {
    const kind = String(visibleHistory[i]?.entry?.kind || "rent");
    if (kind !== "discount" && kind !== "refund") {
      return visibleHistory[i].index;
    }
  }
  return null;
}

/**
 * Banner / landlord-facing balance from history + optional stored currentBalance
 * (which may include unallocated reconciled bank leftovers).
 */
export function computeLandlordDisplayBalance(tenant: any): number {
  const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
  if (history.length === 0) return Number(tenant?.currentBalance) || 0;

  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  let dueUnpaid = 0;
  let dueThroughToday = 0;
  let paidVisible = 0;
  let futurePrepaid = 0;

  history.forEach((entry: any) => {
    const due = Number(entry?.amountDue ?? entry?.rent) || 0;
    const paid = Number(entry?.amountPaid) || 0;
    const dueMs = toUtcDayMs(entry?.dueDate ?? entry?.month);
    const isFuture = dueMs != null && dueMs > todayMs;
    if (isFuture) {
      futurePrepaid += paid;
      return;
    }
    dueThroughToday += due;
    dueUnpaid += Math.max(0, due - paid);
    paidVisible += paid;
  });
  dueUnpaid = Math.round(dueUnpaid * 100) / 100;
  paidVisible = Math.round(paidVisible * 100) / 100;
  futurePrepaid = Math.round(futurePrepaid * 100) / 100;
  const historyCredit =
    Math.round((paidVisible - dueThroughToday + futurePrepaid) * 100) / 100;

  const stored = Number(tenant?.currentBalance);

  if (dueUnpaid > 0) {
    const netFromHistory = Math.round((-dueUnpaid + futurePrepaid) * 100) / 100;
    if (Number.isFinite(stored) && stored > netFromHistory + 0.001) {
      return Math.round(stored * 100) / 100;
    }
    return netFromHistory;
  }

  if (Number.isFinite(stored) && stored > historyCredit + 0.001) {
    return Math.round(stored * 100) / 100;
  }

  return historyCredit > 0 ? historyCredit : 0;
}

/**
 * Balance column value for a rent row.
 * Intermediate rows keep the running month balance.
 * The last visible rent row parks the full remaining credit (unallocated bank
 * leftovers + prepaid on hidden future months) so surplus isn't stuck only in
 * the banner when only a few months exist on the ledger.
 */
export function resolveRowDisplayBalance(
  runningBalance: number,
  options: {
    isLastVisibleRentRow: boolean;
    overallBalance: number;
  }
): number {
  const running = Math.round((Number(runningBalance) || 0) * 100) / 100;
  if (!options.isLastVisibleRentRow) return running;
  const overall = Math.round((Number(options.overallBalance) || 0) * 100) / 100;
  if (overall > running + 0.001) return overall;
  return running;
}

/**
 * Calendar YYYY-MM (UTC) for bucketing bank statement txs onto rent rows.
 * Display-only — independent of FIFO / payment-history attribution.
 */
export function calendarMonthKey(value: any): string | null {
  const ms = toUtcDayMs(value);
  if (ms == null) return null;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** True when `value` is the last calendar day of its UTC month (30 or 31, etc.). */
export function isLastDayOfUtcMonth(value: any): boolean {
  const ms = toUtcDayMs(value);
  if (ms == null) return false;
  const d = new Date(ms);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return d.getUTCDate() === lastDay;
}

/** 1st of the UTC month after `value` — used to correct last-day timezone skew. */
export function nextUtcMonthFirst(value: any): Date | null {
  const ms = toUtcDayMs(value);
  if (ms == null) return null;
  const d = new Date(ms);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

function isBankStatementPiece(piece: any): boolean {
  if (piece?.transactionId != null && String(piece.transactionId).trim() !== "") return true;
  return String(piece?.method || "").toLowerCase() === "bank";
}

export type BankStatementTx = {
  key: string;
  amount: number;
  paidOn: any;
};

type BankStatementRentRow = { index: number; monthKey: string; dueMs: number };

/**
 * Prior rent rows (due before `beforeMs`) are settled without counting `paymentKey`.
 * Used so a last-day UTC payment that actually paid an earlier month stays on that month.
 */
function priorRentsSettledExcludingPayment(
  history: any[],
  rentRows: BankStatementRentRow[],
  beforeMs: number,
  paymentKey: string
): boolean {
  for (const row of rentRows) {
    if (row.dueMs >= beforeMs) continue;
    const entry = history[row.index];
    const due = Number(entry?.amountDue ?? entry?.rent) || 0;
    if (due <= 0) continue;
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    let paidExcluding = 0;
    pieces.forEach((piece: any, pieceIndex: number) => {
      const pieceKey = getPaymentPieceGroupKey(piece, row.index, pieceIndex);
      if (pieceKey === paymentKey) return;
      paidExcluding += Number(piece?.amount) || 0;
    });
    if (paidExcluding + 0.001 < due) return false;
  }
  return true;
}

/**
 * Display-only map: rentHistory index → unique bank txs shown like a bank app
 * (full statement amount + paid date), bucketed by calendar month of `paidOn`.
 *
 * Rules (do not affect reconciliation):
 * - Two April bank payments → both on the April rent row
 * - Pay in February → February row
 * - Pay before the first rent month (e.g. 31 Mar when move-in is 1 Apr) → first rent row
 * - Last day of month (30/31) when prior rents are already settled → next month as 1st
 *   (UTC timezone skew: landlord paid 1 Nov, bank/server stored 31 Oct)
 * - Each bank payment appears once (deduped by transaction / payment group)
 */
export function buildBankStatementTxsByHistoryIndex(
  rentHistory: any[]
): Map<number, BankStatementTx[]> {
  const history = Array.isArray(rentHistory) ? rentHistory : [];

  const unique = new Map<string, { amount: number; paidOn: any }>();
  history.forEach((entry: any, historyIndex: number) => {
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    pieces.forEach((piece: any, pieceIndex: number) => {
      if (!isBankStatementPiece(piece)) return;
      const amt = Number(piece?.amount) || 0;
      const depositPart = Number(piece?.depositAllocated) || 0;
      const bankAmt = Number(piece?.bankAmount) || 0;
      if (amt <= 0 && depositPart <= 0 && bankAmt <= 0) return;
      const key = getPaymentPieceGroupKey(piece, historyIndex, pieceIndex);
      const amount = bankAmt > 0 ? bankAmt : Math.round((amt + depositPart) * 100) / 100;
      const prev = unique.get(key);
      if (!prev) {
        unique.set(key, { amount, paidOn: piece.paidOn || null });
        return;
      }
      if (bankAmt > 0) prev.amount = Math.max(prev.amount, bankAmt);
      const prevMs = toUtcDayMs(prev.paidOn);
      const nextMs = toUtcDayMs(piece.paidOn);
      if (prevMs == null || (nextMs != null && nextMs < prevMs)) {
        prev.paidOn = piece.paidOn;
      }
    });
  });

  const rentRows: BankStatementRentRow[] = [];
  history.forEach((entry: any, index: number) => {
    const kind = String(entry?.kind || "rent");
    if (kind === "discount" || kind === "refund") return;
    const dueRaw = entry?.dueDate ?? entry?.month;
    const monthKey = calendarMonthKey(dueRaw);
    const dueMs = toUtcDayMs(dueRaw);
    if (!monthKey || dueMs == null) return;
    rentRows.push({ index, monthKey, dueMs });
  });
  rentRows.sort((a, b) => a.dueMs - b.dueMs || a.index - b.index);

  const firstRent = rentRows[0] || null;
  const byMonth = new Map<string, BankStatementRentRow[]>();
  for (const row of rentRows) {
    const list = byMonth.get(row.monthKey) || [];
    list.push(row);
    byMonth.set(row.monthKey, list);
  }

  const result = new Map<number, BankStatementTx[]>();
  const assign = (historyIndex: number, tx: BankStatementTx) => {
    const list = result.get(historyIndex) || [];
    list.push(tx);
    result.set(historyIndex, list);
  };

  unique.forEach(({ amount, paidOn }, key) => {
    let effectivePaidOn = paidOn;
    let payMonth = calendarMonthKey(paidOn);
    let payMs = toUtcDayMs(paidOn);

    // UTC skew: last day of month + prior rents already settled → treat as 1st of next month
    if (isLastDayOfUtcMonth(paidOn)) {
      const nextFirst = nextUtcMonthFirst(paidOn);
      const nextMs = nextFirst ? toUtcDayMs(nextFirst) : null;
      if (
        nextFirst &&
        nextMs != null &&
        priorRentsSettledExcludingPayment(history, rentRows, nextMs, key)
      ) {
        effectivePaidOn = nextFirst.toISOString();
        payMonth = calendarMonthKey(nextFirst);
        payMs = nextMs;
      }
    }

    let targetIndex: number | null = null;

    if (payMonth && byMonth.has(payMonth)) {
      const candidates = [...(byMonth.get(payMonth) || [])];
      if (payMs != null && candidates.length > 1) {
        candidates.sort(
          (a, b) =>
            Math.abs(a.dueMs - payMs) - Math.abs(b.dueMs - payMs) || a.dueMs - b.dueMs
        );
      }
      targetIndex = candidates[0]?.index ?? null;
    } else if (firstRent && payMs != null && payMs < firstRent.dueMs) {
      // e.g. paid 31 Mar, first rent / move-in 1 Apr — no March row
      targetIndex = firstRent.index;
    } else if (payMonth && firstRent && payMonth < firstRent.monthKey) {
      targetIndex = firstRent.index;
    } else if (payMs != null && rentRows.length > 0) {
      const next = rentRows.find((r) => r.dueMs >= payMs);
      const prev = [...rentRows].reverse().find((r) => r.dueMs <= payMs);
      targetIndex = (next ?? prev)?.index ?? null;
    }

    if (targetIndex == null) return;
    assign(targetIndex, { key, amount, paidOn: effectivePaidOn });
  });

  result.forEach((list) => {
    list.sort((a, b) => (toUtcDayMs(a.paidOn) ?? 0) - (toUtcDayMs(b.paidOn) ?? 0));
  });

  return result;
}

export { isDueDayChangeLineItem };
