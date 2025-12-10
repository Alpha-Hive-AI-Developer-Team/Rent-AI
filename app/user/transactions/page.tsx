"use client";

import Image from "next/image";
import { Plus, Search, Check, X, Bell, Eye, ChevronDown, Info } from "lucide-react";
import { useState, useEffect } from "react";
// Table is implemented inline to avoid dependency on shared DataTable component

interface Transaction {
  id: number;
  amount: string;
  status: "Matched" | "Needs Review";
  date: string;
  description: string;
}

interface Tenant {
  id: number;
  name: string;
  property: string;
  rent: string;
  status: "Paid" | "Unpaid" | "Partial" | "Unknown";
  lastPayment?: string;
  transactions?: TenantTxn[];
}

interface TenantTxn {
  month: string;
  rent: string;
  amountPaid: string;
  paidDate?: string | null;
  status: "Paid" | "Unpaid" | "Partial";
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");

  const transactions: Transaction[] = [
    {
      id: 1,
      date: "2025-09-01",
      description: "FPI JACK LEAH 119AV RENT",
      amount: "£1200",
      status: "Matched",
    },
    {
      id: 2,
      date: "2025-09-02",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Needs Review",
    },
    {
      id: 3,
      date: "2025-09-05",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Needs Review",
    },
    {
      id: 4,
      date: "2025-09-06",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Matched",
    },
    {
      id: 5,
      date: "2025-09-07",
      description: "PAYMENT JACKIE LEAH 119AV RENT",
      amount: "£1200",
      status: "Matched",
    },
    {
      id: 6,
      date: "2025-09-08",
      description: "ACCT TRANS SAMUEL LEE MARKET LANE",
      amount: "£500",
      status: "Needs Review",
    },
    {
      id: 7,
      date: "2025-09-09",
      description: "ALICIA KEYS RENT 7 GARDEN ROAD",
      amount: "£1200",
      status: "Needs Review",
    },
  ];

  const statusColors: Record<Transaction["status"], string> = {
    Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
    "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
  };

  const matchColors: Record<"Matched" | "Needs Review", string> = {
    Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
    "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
  };

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.amount.toLowerCase().includes(search.toLowerCase())
  );

  // Sample tenants shown in the modal (UI-only)
  const [tenantCandidates, setTenantCandidates] = useState<Tenant[]>([
    { id: 1, name: "Jack Leah", property: "119 The Avenue – R3", rent: "£1200", status: "Unpaid", lastPayment: "2025-08-01", transactions: [
      { month: "2025-09", rent: "£1200", amountPaid: "£1200", paidDate: "2025-09-01", status: "Paid" },
      { month: "2025-08", rent: "£1200", amountPaid: "£0", paidDate: null, status: "Unpaid" },
      { month: "2025-07", rent: "£1200", amountPaid: "£600", paidDate: "2025-07-20", status: "Partial" },
    ] as TenantTxn[] },
    { id: 2, name: "Maria Gomez", property: "21 High Street – A1", rent: "£950", status: "Unpaid", lastPayment: "2025-07-20", transactions: [
      { month: "2025-07", rent: "£950", amountPaid: "£950", paidDate: "2025-07-20", status: "Paid" },
      { month: "2025-06", rent: "£950", amountPaid: "£0", paidDate: null, status: "Unpaid" },
    ] as TenantTxn[] },
    { id: 3, name: "Tom Rivers", property: "Flat 3B – 45 Lane", rent: "£700", status: "Partial", lastPayment: "2025-09-05", transactions: [
      { month: "2025-09", rent: "£700", amountPaid: "£350", paidDate: "2025-09-05", status: "Partial" },
    ] as TenantTxn[] },
    { id: 4, name: "Alicia Keys", property: "7 Garden Road – B2", rent: "£1200", status: "Unpaid", lastPayment: "2025-06-18", transactions: [
      { month: "2025-06", rent: "£1200", amountPaid: "£0", paidDate: null, status: "Unpaid" },
    ] as TenantTxn[] },
    { id: 5, name: "Jackie Leah", property: "119 The Avenue – R3", rent: "£1200", status: "Unpaid", lastPayment: "2025-08-01", transactions: [
      { month: "2025-08", rent: "£1200", amountPaid: "£1200", paidDate: "2025-08-01", status: "Paid" },
    ] as TenantTxn[] },
    { id: 6, name: "Samuel Lee", property: "22 Market Lane – C4", rent: "£500", status: "Unpaid", lastPayment: "2025-05-11", transactions: [
      { month: "2025-05", rent: "£500", amountPaid: "£500", paidDate: "2025-05-11", status: "Paid" },
    ] as TenantTxn[] },
  ]);

  // Track which transactions have been "reconciled" in the UI
  const [reconciled, setReconciled] = useState<number[]>([]);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Candidate filters / sorting (modal)
  const [candidateNameFilter, setCandidateNameFilter] = useState("");
  const [candidatePropertyFilter, setCandidatePropertyFilter] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "lastPayment" | "status" | "rent">("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatePageSize = 4;
  const [expandedCandidates, setExpandedCandidates] = useState<number[]>([]);

  function toggleCandidate(id: number) {
    setExpandedCandidates((prev) => (prev.includes(id) ? [] : [id]));
  }

  function openView(t: Transaction) {
    setSelectedTransaction(t);
    setViewModalOpen(true);
  }

  function computeMatchStatus(tx: Transaction | null, tenant: Tenant): "Matched" | "Needs Review" {
    if (!tx) return "Needs Review";
    const txDesc = tx.description.toLowerCase();
    const tenantName = tenant.name.toLowerCase();
    // require tenant name to be present in description and exact amount match
    const nameMatch = txDesc.includes(tenantName);
    const amountMatch = tx.amount === tenant.rent;
    return nameMatch && amountMatch ? "Matched" : "Needs Review";
  }

  function computeMatchReason(tx: Transaction | null, tenant: Tenant): string {
    if (!tx) return "No transaction selected";
    const txDesc = tx.description.toLowerCase();
    const tenantName = tenant.name.toLowerCase();
    const nameMatch = txDesc.includes(tenantName);
    const amountMatch = tx.amount === tenant.rent;
    if (nameMatch && amountMatch) return "Name and amount match.";
    if (nameMatch && !amountMatch) return "Name matches but amount differs.";
    if (!nameMatch && amountMatch) return "Amount matches but name not found in description.";
    return "No match: name not found and amount differs.";
  }

  function computeTransactionOverallStatus(tx: Transaction | null): "Matched" | "Needs Review" {
    if (!tx) return "Needs Review";
    const anyMatched = tenantCandidates.some((c) => computeMatchStatus(tx, c) === "Matched");
    return anyMatched ? "Matched" : "Needs Review";
  }

  // Derived list for display in the modal, with filters and sorting (UI-only)
  const filteredCandidates = tenantCandidates.filter((c) => {
    const nameOk = c.name.toLowerCase().includes(candidateNameFilter.toLowerCase());
    const propOk = c.property.toLowerCase().includes(candidatePropertyFilter.toLowerCase());
    return nameOk && propOk;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === "default") return 0;
    if (sortBy === "lastPayment") {
      const da = a.lastPayment ?? "";
      const db = b.lastPayment ?? "";
      if (da === db) return 0;
      return sortDir === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    }
    if (sortBy === "rent") {
      const pa = parseFloat(a.rent.replace(/[^0-9.-]+/g, "")) || 0;
      const pb = parseFloat(b.rent.replace(/[^0-9.-]+/g, "")) || 0;
      return sortDir === "asc" ? pa - pb : pb - pa;
    }
    if (sortBy === "status") {
      const order: Record<string, number> = { Paid: 1, Partial: 2, Unpaid: 3, Unknown: 4 };
      const oa = order[a.status] ?? 99;
      const ob = order[b.status] ?? 99;
      return sortDir === "asc" ? oa - ob : ob - oa;
    }
    return 0;
  });

  // keep page within bounds when filtered list changes
  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / candidatePageSize));
  useEffect(() => {
    if (candidatePage > totalPages) setCandidatePage(totalPages);
  }, [sortedCandidates.length, totalPages]);

  const paginatedCandidates = sortedCandidates.slice((candidatePage - 1) * candidatePageSize, candidatePage * candidatePageSize);

  function acceptCandidate(txId: number, tenantId: number) {
    // UI-only: mark tenant as Paid and mark transaction as reconciled
    setTenantCandidates((prev) => prev.map((c) => (c.id === tenantId ? { ...c, status: "Paid" } : c)));
    setReconciled((prev) => (prev.includes(txId) ? prev : [...prev, txId]));
  }

  function rejectCandidate(_txId: number, tenantId: number) {
    // UI-only: mark tenant as Needs Review (visually)
    setTenantCandidates((prev) => prev.map((c) => (c.id === tenantId ? { ...c, status: "Unknown" } : c)));
  }

  const columns = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    {
      key: "status",
      label: "Status",
      render: (t: Transaction) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[t.status]}`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (t: Transaction) => (
        <button onClick={() => openView(t)} className="flex items-center gap-2 bg-transparent border border-[#111] text-gray-200 px-3 py-1 rounded-full text-xs md:text-sm hover:bg-white/5 transition">
          <Eye className="w-3 h-3" />
          <span className="whitespace-nowrap">View</span>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Transactions</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-300" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </div>

          <Image
            src="/images/pexels.png"
            alt="User Avatar"
            width={36}
            height={36}
            className="rounded-full border border-gray-700"
          />
        </div>
      </div>
      {/* View Modal: show transaction details and candidate tenants (UI-only) */}
      {viewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-6xl bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl max-h-[80vh] overflow-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Transaction — {selectedTransaction.description}</h3>
                <p className="text-sm text-gray-400">Date: {selectedTransaction.date} • Amount: {selectedTransaction.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[computeTransactionOverallStatus(selectedTransaction)]}`}>{computeTransactionOverallStatus(selectedTransaction)}</span>
                <button onClick={() => { setViewModalOpen(false); setSelectedTransaction(null); }} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters + Sorting for candidate list (UI-only) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input value={candidateNameFilter} onChange={(e) => { setCandidateNameFilter(e.target.value); setCandidatePage(1); }} placeholder="Search tenant name..." className="w-full md:w-64 bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none" />
                <input value={candidatePropertyFilter} onChange={(e) => { setCandidatePropertyFilter(e.target.value); setCandidatePage(1); }} placeholder="Search property..." className="w-full md:w-64 bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none" />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Sort by</label>
                <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); setCandidatePage(1); }} className="bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 px-2 text-sm text-gray-200">
                  <option value="default">Default</option>
                  <option value="lastPayment">Last Payment</option>
                  <option value="status">Status</option>
                  <option value="rent">Rent</option>
                </select>
                <button onClick={() => { setSortDir((d) => (d === "asc" ? "desc" : "asc")); setCandidatePage(1); }} className="px-3 py-2 rounded-full border border-gray-800 text-sm text-gray-200">{sortDir === "asc" ? "↑" : "↓"}</button>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-lg bg-[#0B0B0B] border border-[#1a1a1a]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
                    <th className="py-3 px-4 text-xs">Tenant</th>
                    <th className="py-3 px-4 text-xs">Property</th>
                    <th className="py-3 px-4 text-xs">Rent</th>
                    <th className="py-3 px-4 text-xs">Last Payment</th>
                    <th className="py-3 px-4 text-xs">Status</th>
                    <th className="py-3 px-4 text-xs">Match</th>
                    <th className="py-3 px-4 text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCandidates.map((c) => {
                    const isOpen = expandedCandidates.includes(c.id);
                    return (
                      <>
                        <tr key={c.id} className="border-t border-[#151515] hover:bg-[#0e0e0e]">
                          <td className="py-3 px-4 text-gray-300">
                            <div className="flex items-center gap-3">
                              <button onClick={() => toggleCandidate(c.id)} className={`p-1 rounded-md text-gray-300 hover:bg-white/5 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <span>{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{c.property}</td>
                          <td className="py-3 px-4 text-gray-300">{c.rent}</td>
                          <td className="py-3 px-4 text-gray-300">{c.lastPayment ?? '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full border ${c.status === 'Paid' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-700' : c.status === 'Partial' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{c.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full border ${matchColors[computeMatchStatus(selectedTransaction, c)]}`}>{computeMatchStatus(selectedTransaction, c)}</span>
                              <div className="relative group inline-block">
                                <Info className="w-3 h-3 text-gray-400 group-hover:text-gray-200" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max bg-gray-800 text-xs text-gray-200 px-2 py-1 rounded opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap z-50">
                                  {computeMatchReason(selectedTransaction, c)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => acceptCandidate(selectedTransaction!.id, c.id)} className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-3 py-1 rounded-full text-xs hover:bg-emerald-900/5 transition">
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>

                              <button onClick={() => rejectCandidate(selectedTransaction!.id, c.id)} className="flex items-center gap-2 bg-[#0b0b0b] border border-[#111] text-gray-300 px-3 py-1 rounded-full text-xs hover:bg-white/5 transition">
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        <tr key={`details-${c.id}`} className="bg-[#060606]">
                          <td colSpan={7} className="p-0">
                            <div className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'}`}>
                              <div className="w-full overflow-x-auto rounded-lg bg-[#070707] border border-[#151515] p-3">
                                <div className="text-sm text-gray-400 mb-2">Previous transactions for {c.name}</div>
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="text-gray-400 text-left">
                                      <th className="py-2 px-3 text-xs">Month</th>
                                      <th className="py-2 px-3 text-xs">Rent</th>
                                      <th className="py-2 px-3 text-xs">Amount Paid</th>
                                      <th className="py-2 px-3 text-xs">Paid Date</th>
                                      <th className="py-2 px-3 text-xs">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(c.transactions ?? []).map((tr: any, i: number) => (
                                      <tr key={i} className="border-t border-[#111] hover:bg-[#0e0e0e]">
                                        <td className="py-2 px-3 text-gray-300">{tr.month}</td>
                                        <td className="py-2 px-3 text-gray-300">{tr.rent}</td>
                                        <td className={`py-2 px-3 ${tr.status === 'Unpaid' ? 'text-rose-400' : 'text-gray-300'}`}>{tr.amountPaid}</td>
                                        <td className="py-2 px-3 text-gray-300">{tr.paidDate ?? '—'}</td>
                                        <td className="py-2 px-3">
                                          <span className={`px-2 py-1 text-xs rounded-full border ${tr.status === 'Paid' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-700' : tr.status === 'Partial' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{tr.status}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls (UI-only) */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-400">Showing {(sortedCandidates.length === 0) ? 0 : ( (candidatePage - 1) * candidatePageSize + 1)}–{Math.min(candidatePage * candidatePageSize, sortedCandidates.length)} of {sortedCandidates.length}</div>
              <div className="flex items-center gap-2">
                <button disabled={candidatePage <= 1} onClick={() => setCandidatePage((p) => Math.max(1, p - 1))} className={`px-3 py-1 rounded-md border ${candidatePage <= 1 ? 'border-gray-700 text-gray-600' : 'border-gray-600 text-gray-200 hover:bg-white/5'}`}>Prev</button>
                <div className="text-sm text-gray-300">Page {candidatePage} / {totalPages}</div>
                <button disabled={candidatePage >= totalPages} onClick={() => setCandidatePage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded-md border ${candidatePage >= totalPages ? 'border-gray-700 text-gray-600' : 'border-gray-600 text-gray-200 hover:bg-white/5'}`}>Next</button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">This is UI-only: accepting marks the tenant as Paid locally and marks the transaction as Reconciled.</div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setViewModalOpen(false); setSelectedTransaction(null); }} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search (Left) + Buttons (Right) */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">

  {/* Search Left */}
  <div className="relative w-full sm:w-72">
    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
    />
  </div>

  {/* Buttons Right */}
  <div className="flex items-center gap-3">

    {/* Quick Action */}
    <button className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-4 py-2 rounded-full text-sm hover:bg-emerald-900/5 transition">
      <Plus className="w-4 h-4 text-emerald-400" />
      <span>Quick Action</span>
    </button>

    {/* Sync Bank Feed */}
    <button className="bg-transparent text-emerald-400 text-sm border border-emerald-600 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition">
      Sync Bank Feed
    </button>

  </div>

</div>


      {/* Table (inlined - same UI as DataTable) */}
      <div className="w-full overflow-x-auto rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a]">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tl-2xl">Date</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Description</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Amount</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Status</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tr-2xl text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => {
              const overall = computeTransactionOverallStatus(t);
              return (
                <tr key={t.id} className="border-t border-[#151515] hover:bg-[#0e0e0e] transition">
                  <td className="py-4 px-6 text-gray-300 text-sm">{t.date}</td>
                  <td className="py-4 px-6 text-gray-300 text-sm">{t.description}</td>
                  <td className="py-4 px-6 text-gray-300 text-sm">{t.amount}</td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    <span className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[overall]}`}>
                      {overall}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-gray-300">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openView(t)} className="flex items-center gap-2 bg-transparent border border-[#111] text-gray-200 px-3 py-1 rounded-full text-xs md:text-sm hover:bg-white/5 transition">
                        <Eye className="w-3 h-3" />
                        <span className="whitespace-nowrap">View</span>
                      </button>

                      {reconciled.includes(t.id) && (
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-900/20 text-emerald-400 border border-emerald-700">Reconciled</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
