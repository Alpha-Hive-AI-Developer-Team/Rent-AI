import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBankStatementTxsByHistoryIndex,
  buildPaymentPieceRoleMap,
  buildRunningBalancesFromPaymentHistory,
  resolveRowDisplayBalance,
} from "./rentHistoryDisplay.ts";

test("overpay then empty month rolls credit down by rent due", () => {
  const history = [
    {
      kind: "rent",
      amountDue: 500,
      amountPaid: 1500,
      dueDate: "2026-01-01",
      linkedPayments: [
        {
          amount: 500,
          bankAmount: 1500,
          transactionId: "tx-1",
          paidOn: "2026-01-05",
          method: "bank",
        },
      ],
    },
    {
      kind: "rent",
      amountDue: 500,
      amountPaid: 500,
      dueDate: "2026-02-01",
      linkedPayments: [
        {
          amount: 500,
          bankAmount: 1500,
          transactionId: "tx-1",
          paidOn: "2026-01-05",
          method: "bank",
        },
      ],
    },
  ];

  const roles = buildPaymentPieceRoleMap(history);
  const bankByIndex = buildBankStatementTxsByHistoryIndex(history);
  const balances = buildRunningBalancesFromPaymentHistory(history, bankByIndex, roles);

  // Month 1: £1500 received − £500 due = £1000 credit
  assert.equal(balances.get(0), 1000);
  // Month 2: no new payment in Payment history (same tx already shown on month 1),
  // £1000 − £500 due = £500 credit
  assert.equal(bankByIndex.get(1)?.length || 0, 0);
  assert.equal(balances.get(1), 500);
});

test("resolveRowDisplayBalance no longer parks overall on last row", () => {
  assert.equal(resolveRowDisplayBalance(118.77, { isLastVisibleRentRow: true, overallBalance: 1068.77 }), 118.77);
  assert.equal(resolveRowDisplayBalance(500), 500);
});

test("deposit portion is not counted as rent credit", () => {
  const history = [
    {
      kind: "rent",
      amountDue: 499.72,
      amountPaid: 499.72,
      dueDate: "2026-04-15",
      linkedPayments: [
        {
          amount: 499.72,
          depositAllocated: 150,
          bankAmount: 649.72,
          transactionId: "tx-dep",
          paidOn: "2026-04-09",
          method: "bank",
        },
      ],
    },
    {
      kind: "rent",
      amountDue: 950,
      amountPaid: 950,
      dueDate: "2026-05-01",
      linkedPayments: [
        {
          amount: 950,
          bankAmount: 950,
          transactionId: "tx-may",
          paidOn: "2026-05-01",
          method: "bank",
        },
      ],
    },
  ];

  const roles = buildPaymentPieceRoleMap(history);
  const bankByIndex = buildBankStatementTxsByHistoryIndex(history);
  const balances = buildRunningBalancesFromPaymentHistory(history, bankByIndex, roles);

  // £649.72 bank − £150 deposit − £499.72 due = £0 (not £150 credit)
  assert.equal(balances.get(0), 0);
  // £950 − £950 due = still settled
  assert.equal(balances.get(1), 0);
});
