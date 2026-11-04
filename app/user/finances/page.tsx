"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Trash2, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { useTenants } from "@/hooks/usetenants";
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useIncomeSummary,
} from "@/hooks/useAdmin";
import { formatDate, formatPropertyAddress } from "@/lib/utils";

function money(n: number) {
  return `£${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FinancesPage() {
  const { data: tenantsResp, isLoading, isError } = useTenants({ archived: "exclude" });
  const tenants: any[] = Array.isArray(tenantsResp?.data)
    ? tenantsResp.data
    : Array.isArray(tenantsResp)
      ? tenantsResp
      : [];

  const addressGroups = useMemo(() => {
    const byAddress = new Map<string, { address: string; postcode: string; count: number }>();
    for (const t of tenants) {
      const address = String(t?.property || t?.propertyName || "").trim() || "Unknown address";
      const postcode = String(t?.postcode || "").trim();
      const existing = byAddress.get(address);
      if (existing) {
        existing.count += 1;
        if (!existing.postcode && postcode) existing.postcode = postcode;
      } else {
        byAddress.set(address, { address, postcode, count: 1 });
      }
    }
    return Array.from(byAddress.values())
      .map((g) => ({
        ...g,
        displayAddress: formatPropertyAddress(g.address, g.postcode) || g.address,
      }))
      .sort((a, b) =>
        a.displayAddress.localeCompare(b.displayAddress, undefined, { sensitivity: "base" })
      );
  }, [tenants]);

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  useEffect(() => {
    if (!addressGroups.length) {
      setSelectedAddress(null);
      return;
    }
    if (!selectedAddress || !addressGroups.some((g) => g.address === selectedAddress)) {
      setSelectedAddress(addressGroups[0].address);
    }
  }, [addressGroups, selectedAddress]);

  const selectedGroup = useMemo(
    () => addressGroups.find((g) => g.address === selectedAddress) || null,
    [addressGroups, selectedAddress]
  );

  const expenseAddress = selectedGroup?.address || "";
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();
  const { data: expensesResp } = useExpenses({
    address: expenseAddress || undefined,
    page: 1,
    limit: 100,
  });
  const { data: incomeSummaryResp } = useIncomeSummary({
    address: expenseAddress || "",
  });

  const addExpense = () => {
    const amt = Number(String(newExpenseAmount).replace(/[^0-9.-]+/g, "")) || 0;
    const desc = String(newExpenseDesc || "").trim();
    if (!desc || amt <= 0) {
      toast.error("Provide a description and positive amount.");
      return;
    }
    if (!expenseAddress) {
      toast.error("Select an address before adding an expense.");
      return;
    }
    createExpenseMutation.mutate(
      { address: expenseAddress, description: desc, amount: amt },
      {
        onSuccess: () => {
          setNewExpenseDesc("");
          setNewExpenseAmount("");
          toast.success("Expense saved and totals updated.");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to add expense");
        },
      }
    );
  };

  const removeExpense = (id: string) => {
    if (!id) return;
    setDeletingExpenseId(id);
    deleteExpenseMutation.mutate(id, {
      onSuccess: () => toast.success("Expense removed."),
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to remove expense");
      },
      onSettled: () => setDeletingExpenseId(null),
    });
  };

  const gross = Number(incomeSummaryResp?.data?.grossIncome || 0);
  const totalExpenses = Number(incomeSummaryResp?.data?.totalExpenses || 0);
  const net = Number(incomeSummaryResp?.data?.netIncome || gross - totalExpenses);
  const expenses: any[] = Array.isArray(expensesResp?.data) ? expensesResp.data : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#0a0a0a] min-h-screen text-white space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Finances</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Track gross income, property expenses, and net income by address
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-h-[28rem] overflow-hidden rounded-2xl border border-gray-800/80 bg-[#111] md:grid-cols-12 shadow-xl">
        <div className="border-b border-gray-800/80 md:col-span-4 md:border-b-0 md:border-r md:border-gray-800/80">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 bg-[#0c0c0c] border-b border-gray-800/60">
            Portfolio Properties
          </div>
          <div className="max-h-[35vh] space-y-2 overflow-y-auto px-3 py-3 md:max-h-[min(70vh,36rem)] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
              <div className="px-2 py-8 text-center text-sm text-gray-500">Loading…</div>
            ) : isError ? (
              <div className="px-2 py-8 text-center text-sm text-rose-400">Failed to load properties.</div>
            ) : addressGroups.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-gray-500">No properties found.</div>
            ) : (
              addressGroups.map((group) => {
                const selected = selectedGroup?.address === group.address;
                return (
                  <button
                    key={group.address}
                    type="button"
                    onClick={() => setSelectedAddress(group.address)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-[#027A48] bg-[#027A48]/15 text-white"
                        : "border-gray-800/80 bg-[#161616] text-gray-300 hover:border-gray-700 hover:text-white"
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-medium text-gray-100 truncate">
                      {group.displayAddress}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {group.count} tenant{group.count === 1 ? "" : "s"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 md:col-span-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {!selectedGroup ? (
            <div className="rounded-xl border border-gray-800 bg-[#161616] px-4 py-10 text-center text-gray-400 text-sm">
              Select a property to view finances.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-2 pb-3 border-b border-gray-800/60">
                <h4 className="text-base font-semibold text-gray-100 truncate flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {selectedGroup.displayAddress}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Income and expenses for this property
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                  <div className="text-[11px] text-gray-400 font-medium">Total Gross Income</div>
                  <div className="mt-1 text-sm sm:text-base font-bold text-white tabular-nums">
                    {money(gross)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                  <div className="text-[11px] text-gray-400 font-medium">Total Expenses</div>
                  <div className="mt-1 text-sm sm:text-base font-bold text-rose-400 tabular-nums">
                    {money(totalExpenses)}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                  <div className="text-[11px] text-gray-400 font-medium">Net Income</div>
                  <div className="mt-1 text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                    {money(net)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800/80 bg-[#161616] p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Record Property Expense
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Expense description..."
                    value={newExpenseDesc}
                    onChange={(e) => setNewExpenseDesc(e.target.value)}
                    className="flex-1 bg-[#0c0c0c] border border-gray-800 text-xs sm:text-sm text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#027A48]"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Amount (e.g. 120.00)"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-gray-800 text-xs sm:text-sm text-white sm:w-44 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#027A48]"
                  />
                  <button
                    type="button"
                    onClick={addExpense}
                    disabled={createExpenseMutation.isPending}
                    className="bg-[#027A48] hover:bg-[#02653d] disabled:opacity-60 text-white text-xs sm:text-sm font-medium rounded-xl px-5 py-2.5 transition active:scale-95"
                  >
                    {createExpenseMutation.isPending ? "Adding…" : "Add"}
                  </button>
                </div>

                {expenses.length > 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-gray-400 font-medium">Expenses Log</div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {expenses.map((ex: any, i: number) => {
                        const id = String(ex._id || "");
                        const busy = deletingExpenseId === id && deleteExpenseMutation.isPending;
                        return (
                          <div
                            key={id || i}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-800/70 bg-[#0c0c0c] px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-gray-200">{ex.description}</div>
                              {ex.date ? (
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  {formatDate(ex.date)}
                                </div>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="tabular-nums font-semibold text-rose-400">
                                {money(Number(ex.amount || 0))}
                              </div>
                              <button
                                type="button"
                                title="Remove expense"
                                aria-label="Remove expense"
                                disabled={!id || busy}
                                onClick={() => removeExpense(id)}
                                className="rounded-lg border border-gray-800 p-1.5 text-gray-400 hover:text-rose-400 hover:border-rose-800/60 disabled:opacity-50 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 pt-1">No expenses recorded for this property yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
