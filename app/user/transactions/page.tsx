"use client";

import Image from "next/image";
import { Plus, Search, Check, X, Bell, Eye, ChevronDown, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback, Fragment } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useConnectedAccounts, useUnreconciledTransactions, useConnectedInstitution, useReconcileTransaction } from "@/hooks/useTransactions";
import { createPlaidLinkToken, exchangePlaidPublicToken, getPlaidTransactions, simulatePlaidIncoming } from "@/lib/api/transactionApi";
// Table is implemented inline to avoid dependency on shared DataTable component

interface Transaction {
  id: number;
  amount: string;
  status: "Matched" | "Needs Review";
  date: string;
  description: string;
  payer: string;
}

interface Tenant {
  id: number;
  tenantId?: string;
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
      date: "01/09/2025",
      description: "FPI JACK LEAH 119AV RENT",
      payer: "Jack Leah",
      amount: "£1200",
      status: "Matched",
    }
  ];

  const statusColors: Record<string, string> = {
    Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
    "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
  };

  const matchColors: Record<string, string> = {
    Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
    "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
  };
 
  // Format dates for display as DD/MM/YYYY
  function formatDate(input: any): string {
    if (!input) return "-";
    const d = new Date(input);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  

  // Fetch unreconciled transactions from API (keep the full query so we can refetch)
  const unreconciledQuery = useUnreconciledTransactions();
  const unreconciledRes = unreconciledQuery.data;
  const txLoading = unreconciledQuery.isLoading;
  const apiDocs = unreconciledRes?.data?.docs ?? [];
  const apiRows = apiDocs.map((d: any, i: number) => ({
    id: i + 1,
    date: d.transaction?.date ? formatDate(d.transaction.date) : "-",
    description: d.transaction?.description || d.transaction?.reference || "",
    payer: (d.transaction?.payerName || "").toString().trim() || "—",
    amount: typeof d.transaction?.amount === "number" ? `£${d.transaction.amount}` : String(d.transaction?.amount ?? ""),
    status: d.matchStatus === "matched" ? "Matched" : "Needs Review",
    raw: d,
  }));

  // Prefer API-backed rows. If none returned, show an empty list (no dummy/sample transactions).
  const displayTransactions: Transaction[] = apiRows.length > 0 ? apiRows : [];

  const filteredDisplay = displayTransactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.payer.toLowerCase().includes(search.toLowerCase()) ||
      t.amount.toLowerCase().includes(search.toLowerCase())
  );

  // Sample tenants shown in the modal (UI-only)
  const [tenantCandidates, setTenantCandidates] = useState<Tenant[]>([
    { id: 1, name: "Jack Leah", property: "119 The Avenue – R3", rent: "£1200", status: "Unpaid", lastPayment: "2025-08-01", transactions: [
      { month: "2025-09", rent: "£1200", amountPaid: "£1200", paidDate: "2025-09-01", status: "Paid" },
      { month: "2025-08", rent: "£1200", amountPaid: "£0", paidDate: null, status: "Unpaid" },
      { month: "2025-07", rent: "£1200", amountPaid: "£600", paidDate: "2025-07-20", status: "Partial" },
    ] as TenantTxn[] }
  ]);

  

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [pendingReconcile, setPendingReconcile] = useState<{ tenant: Tenant; transactionId: string } | null>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
    accountName?: string;
  } | null>(null);

  const reconcileMutation = useReconcileTransaction();

  const connectedAccountsQuery = useConnectedAccounts(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectedInstitution, setConnectedInstitution] = useState<string | null>(null);
  const [connectedInstitutionId, setConnectedInstitutionId] = useState<string | null>(null);
  const [syncingAccounts, setSyncingAccounts] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const connectedInstitutionQuery = useConnectedInstitution(true);

  async function handleAccountSync(acc: any) {
    const accountId = acc?.accountId || acc?.id || String(acc?.name || Date.now());
    const accountName = acc?.name || accountId;
    try {
      setSyncingAccounts((prev) => (prev.includes(accountId) ? prev : [...prev, accountId]));
      const res = await getPlaidTransactions({ accountId });
      try {
        await unreconciledQuery.refetch();
      } catch (e) {
        console.warn("Failed to refetch unreconciled transactions", e);
      }
      const inserted = res?.saved?.inserted ?? res?.data?.saved?.inserted;
      const detail =
        typeof inserted === "number" && inserted > 0
          ? `${inserted} new transaction${inserted === 1 ? "" : "s"} imported.`
          : "Your bank feed is up to date.";
      setSyncFeedback({
        type: "success",
        title: "Bank feed synced",
        message: detail,
        accountName,
      });
    } catch (err: any) {
      console.error("Failed to fetch Plaid transactions", err);
      const msg = err?.response?.data?.message || err?.message || "Could not sync transactions from your bank.";
      setSyncFeedback({
        type: "error",
        title: "Sync failed",
        message: msg,
        accountName,
      });
    } finally {
      setSyncingAccounts((prev) => prev.filter((id) => id !== accountId));
    }
  }

  const onPlaidSuccess = useCallback(
    async (public_token: string | null, metadata: any) => {
      if (!public_token) return;
      try {
        setConnecting(true);
        const res = await exchangePlaidPublicToken({
          public_token,
          institution: metadata?.institution || null,
        });
        try {
          await connectedInstitutionQuery.refetch();
        } catch (e) {}
        try {
          await connectedAccountsQuery.refetch();
        } catch (e) {}
        try {
          await unreconciledQuery.refetch();
        } catch (e) {}
        const inserted = res?.data?.saved?.inserted ?? res?.saved?.inserted;
        const detail =
          typeof inserted === "number" && inserted > 0
            ? `${inserted} incoming payment${inserted === 1 ? "" : "s"} imported for reconcile.`
            : "Bank connected. Use Sync Bank Feed if transactions are still loading.";
        setSyncFeedback({
          type: "success",
          title: "Bank connected",
          message: detail,
          accountName: metadata?.institution?.name,
        });
      } catch (err: any) {
        console.error("Plaid exchange failed", err);
        setSyncFeedback({
          type: "error",
          title: "Bank connect failed",
          message: err?.response?.data?.message || err?.message || "Could not complete Plaid connection.",
        });
      } finally {
        setConnecting(false);
        setLinkToken(null);
      }
    },
    [connectedAccountsQuery, connectedInstitutionQuery, unreconciledQuery]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: () => {
      setConnecting(false);
    },
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  async function startPlaidConnect() {
    try {
      setConnecting(true);
      const res = await createPlaidLinkToken();
      const token = res?.data?.link_token;
      if (!token) {
        throw new Error("No link_token returned");
      }
      setLinkToken(token);
    } catch (err: any) {
      console.error(err);
      setConnecting(false);
      alert(err?.response?.data?.error || err?.message || "Failed to start Plaid Link. Check PLAID_CLIENT_ID and PLAID_SECRET.");
    }
  }

  // when backend returns connected institution, update local state
  useEffect(() => {
    try {
      const payload = connectedInstitutionQuery.data;
      const inst = payload?.data || null;
      if (inst) {
        setConnectedInstitutionId(inst.id || inst._id || null);
        setConnectedInstitution(inst.name || inst.id || null);
      }
    } catch (e) {
      // ignore
    }
  }, [connectedInstitutionQuery.data]);

  // Determine candidate tenants for the modal.
  // - If `selectedTransaction.raw` exists (API-backed), use its tenant info or an empty list when none found.
  // - If there's no `raw` (local/sample transaction), fall back to `tenantCandidates` for demo purposes.
  const effectiveCandidates: Tenant[] = (() => {
    if (!selectedTransaction) return tenantCandidates;
    const raw = (selectedTransaction as any).raw;
    if (raw) {
      const rawTenants = raw.tenant;
      if (!rawTenants) return [];
      const arr = Array.isArray(rawTenants) ? rawTenants : [rawTenants];
      if (arr.length === 0) return [];
      return arr.map((c: any, i: number) => ({
        id: i + 1,
        tenantId: c._id ? String(c._id) : undefined,
        name: Array.isArray(c.tenantName) ? (c.tenantName[0] || c.tenantName.join(", ")) : (c.tenantName || c.tenantName?.name || ""),
        property: c.property || c.propertyAddress || "",
        rent: typeof c.rent === "number" ? `£${c.rent}` : String(c.rent || ""),
        status: "Unpaid",
        transactions: c.rentHistory ? (c.rentHistory.map((rh: any) => ({ month: rh.month, rent: rh.amountDue ?? rh.amount, amountPaid: rh.amountPaid ?? 0, paidDate: rh.paidOn ?? null, status: rh.status ?? 'Unpaid' }))) : [],
      }));
    }
    return tenantCandidates;
  })();

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
    // If API provided a raw matchStatus, prefer that authoritative result
    const raw = (tx as any).raw;
    if (raw && raw.matchStatus) {
      return raw.matchStatus === "matched" ? "Matched" : "Needs Review";
    }

    const txDesc = tx.description.toLowerCase();
    const tenantName = tenant.name.toLowerCase();
    // require tenant name to be present in description and exact amount match
    const nameMatch = txDesc.includes(tenantName);
    const amountMatch = tx.amount === tenant.rent;
    return nameMatch && amountMatch ? "Matched" : "Needs Review";
  }
  function computeMatchReason(tx: Transaction | null, tenant: Tenant): string {
    if (!tx) return "No transaction selected";
    const raw = (tx as any).raw;
    if (raw && raw.matchReason) {
      return String(raw.matchReason);
    }

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
    const anyMatched = effectiveCandidates.some((c) => computeMatchStatus(tx, c) === "Matched");
    return anyMatched ? "Matched" : "Needs Review";
  }

  // Derived list for display in the modal, with filters and sorting (UI-only)
  const filteredCandidates = effectiveCandidates.filter((c) => {
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

  function getTransactionIdFromSelected(): string | null {
    const raw = selectedTransaction?.raw;
    const txId = raw?.transaction?.transactionId;
    return txId ? String(txId) : null;
  }

  function requestReconcile(tenant: Tenant) {
    const transactionId = getTransactionIdFromSelected();
    if (!tenant.tenantId || !transactionId) {
      setReconcileError("Missing tenant or transaction id — cannot reconcile.");
      return;
    }
    setReconcileError(null);
    setPendingReconcile({ tenant, transactionId });
  }

  async function confirmReconcile() {
    if (!pendingReconcile) return;
    const { tenant, transactionId } = pendingReconcile;
    if (!tenant.tenantId) {
      setReconcileError("Tenant id is missing.");
      return;
    }
    setReconcileError(null);
    reconcileMutation.mutate(
      { tenantId: tenant.tenantId, transactionId },
      {
        onSuccess: async () => {
          setPendingReconcile(null);
          setViewModalOpen(false);
          setSelectedTransaction(null);
          try {
            await unreconciledQuery.refetch();
          } catch (e) {
            console.warn("Failed to refetch unreconciled transactions", e);
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to reconcile transaction.";
          setReconcileError(msg);
        },
      }
    );
  }

 

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Transactions</h1>

      </div>
      {connectedInstitution && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-900/10 border border-emerald-700 text-emerald-300 flex items-center justify-between">
          <div>Bank connected: <span className="font-medium text-emerald-200">{connectedInstitution}</span></div>
          <div className="text-xs text-gray-400">Connected now</div>
        </div>
      )}
      {/* View Modal: show transaction details and candidate tenants (UI-only) */}
      {viewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center md:p-6">
          <div className="my-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Transaction — {selectedTransaction.description}</h3>
                <p className="text-sm text-gray-400">
                  Date: {selectedTransaction.date} • Payer: {selectedTransaction.payer || "—"} • Amount: {selectedTransaction.amount}
                </p>
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
                    {/* <th className="py-3 px-4 text-xs">Last Payment</th>
                    <th className="py-3 px-4 text-xs">Status</th> */}
                    <th className="py-3 px-4 text-xs">Match</th>
                    <th className="py-3 px-4 text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">No tenants found for this transaction.</td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((c) => {
                      const isOpen = expandedCandidates.includes(c.id);
                      return (
                        <Fragment key={c.id}>
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
                                <button
                                  onClick={() => requestReconcile(c)}
                                  disabled={!c.tenantId || !getTransactionIdFromSelected() || reconcileMutation.isPending}
                                  className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-3 py-1 rounded-full text-xs hover:bg-emerald-900/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Accept</span>
                                </button>

                                {/* <button onClick={() => rejectCandidate(selectedTransaction!.id, c.id)} className="flex items-center gap-2 bg-[#0b0b0b] border border-[#111] text-gray-300 px-3 py-1 rounded-full text-xs hover:bg-white/5 transition">
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button> */}
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
                                          <td className="py-2 px-3 text-gray-300">{tr.paidDate ? formatDate(tr.paidDate) : '—'}</td>
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
                        </Fragment>
                      );
                    })
                  )}
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

            {reconcileError && (
              <div className="mt-3 text-sm text-rose-400">{reconcileError}</div>
            )}

            <div className="mt-4 flex items-center justify-end">
              <button onClick={() => { setViewModalOpen(false); setSelectedTransaction(null); setReconcileError(null); }} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Bank sync feedback modal */}
      {syncFeedback && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center md:p-6">
          <div className="my-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              {syncFeedback.type === "success" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-lg font-semibold">{syncFeedback.title}</h3>
                {syncFeedback.accountName && (
                  <p className="text-sm text-gray-400 mt-0.5">{syncFeedback.accountName}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">{syncFeedback.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setSyncFeedback(null)}
                className={`px-4 py-2 rounded-full text-sm hover:brightness-105 ${
                  syncFeedback.type === "success"
                    ? "bg-emerald-600 text-black"
                    : "border border-[#2A2A2A] text-gray-300 hover:bg-white/5"
                }`}
              >
                {syncFeedback.type === "success" ? "Done" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile confirmation modal */}
      {pendingReconcile && selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center md:p-6">
          <div className="my-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Confirm reconciliation</h3>
            <p className="text-sm text-gray-400 mb-4">
              Apply this bank transaction to <span className="text-white font-medium">{pendingReconcile.tenant.name}</span>&apos;s oldest unpaid rent?
            </p>
            <div className="bg-[#050505] border border-[#111] rounded-lg p-3 mb-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Transaction</span>
                <span className="text-right max-w-[60%] truncate">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Amount</span>
                <span>{selectedTransaction.amount}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Date</span>
                <span>{selectedTransaction.date}</span>
              </div>
              <div className="border-t border-[#1a1a1a] my-2" />
              <div className="flex justify-between text-sm text-gray-300">
                <span>Tenant</span>
                <span>{pendingReconcile.tenant.name}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Property</span>
                <span className="text-right max-w-[60%] truncate">{pendingReconcile.tenant.property || "—"}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Rent</span>
                <span>{pendingReconcile.tenant.rent}</span>
              </div>
            </div>
            {reconcileError && (
              <p className="text-sm text-rose-400 mb-3">{reconcileError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setPendingReconcile(null); setReconcileError(null); }}
                disabled={reconcileMutation.isPending}
                className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReconcile}
                disabled={reconcileMutation.isPending}
                className="px-4 py-2 rounded-full bg-emerald-600 text-black text-sm hover:brightness-105 disabled:opacity-50"
              >
                {reconcileMutation.isPending ? "Reconciling…" : "Confirm"}
              </button>
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
    <button
      onClick={startPlaidConnect}
      disabled={connecting}
      className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-4 py-2 rounded-full text-sm hover:bg-emerald-900/5 transition disabled:opacity-50"
    >
      <Plus className="w-4 h-4 text-emerald-400" />
      <span>{connecting ? "Connecting…" : connectedInstitution ? "Reconnect bank" : "Connect bank"}</span>
    </button>

    {/* Sync Bank Feed */}
    <button
      onClick={async () => {
        try {
          setShowAccountsModal(true);
          await connectedAccountsQuery.refetch();
        } catch (err) {
          console.error('Failed to fetch connected accounts', err);
        }
      }}
      className="bg-transparent text-emerald-400 text-sm border border-emerald-600 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition"
    >
      Sync Bank Feed
    </button>

    {connectedInstitutionQuery.data?.sandbox && connectedInstitution && (
      <button
        onClick={async () => {
          try {
            setSimulating(true);
            const res = await simulatePlaidIncoming({ amount: 1200, description: "RENT JACK LEAH" });
            await unreconciledQuery.refetch();
            const inserted = res?.data?.saved?.inserted ?? 0;
            setSyncFeedback({
              type: res?.data?.created || inserted > 0 ? "success" : "error",
              title: res?.data?.created ? "Sandbox payment created" : "Webhook fired",
              message:
                res?.data?.warning ||
                (inserted > 0
                  ? `${inserted} incoming payment${inserted === 1 ? "" : "s"} saved for reconcile.`
                  : "Webhook was fired. If nothing appeared, reconnect with user_transactions_dynamic."),
            });
          } catch (err: any) {
            setSyncFeedback({
              type: "error",
              title: "Sandbox simulate failed",
              message: err?.response?.data?.message || err?.message || "Could not create a test payment.",
            });
          } finally {
            setSimulating(false);
          }
        }}
        disabled={simulating}
        className="bg-transparent text-amber-400 text-sm border border-amber-600 rounded-full px-4 py-2 hover:bg-amber-900/5 transition disabled:opacity-50"
      >
        {simulating ? "Simulating…" : "Simulate rent payment"}
      </button>
    )}

  </div>

</div>


      {/* Connected Accounts Modal */}
      {showAccountsModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center md:p-6">
          <div className="my-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Connected Accounts</h3>
                <p className="text-sm text-gray-400">Accounts synced from your bank</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-400">{connectedAccountsQuery.isFetching ? 'Loading…' : ''}</div>
                <button onClick={() => setShowAccountsModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {connectedAccountsQuery.isError && (
                <div className="text-rose-400">Failed to load connected accounts.</div>
              )}

              {!connectedAccountsQuery.data && !connectedAccountsQuery.isFetching && (
                <div className="text-sm text-gray-400">No accounts found. Use Connect Open Banking first.</div>
              )}

              {(connectedAccountsQuery.data?.data ?? []).map((acc: any) => (
                <div key={acc.accountId} className="flex items-center gap-4 p-3 bg-[#050505] border border-[#111] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{acc.name || acc.accountId}</div>
                    <div className="text-xs text-gray-400 truncate">{acc.accountId}</div>
                    <div className="text-xs text-gray-500 mt-1">{acc.currency || acc.type || acc.accountType}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-gray-400">{acc.type}</div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleAccountSync(acc)} disabled={syncingAccounts.includes(acc.accountId)} className="px-3 py-1 rounded-full bg-amber-600 text-black text-xs hover:brightness-105 disabled:opacity-60">
                        {syncingAccounts.includes(acc.accountId) ? 'Syncing…' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowAccountsModal(false)} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Close</button>
            </div>
          </div>
        </div>
      )}


      {/* Table (inlined - same UI as DataTable) */}
      <div className="w-full overflow-x-auto rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a]">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tl-2xl">Date</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Description</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Payer</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Amount</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Status</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tr-2xl text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredDisplay.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">No transactions found.</td>
              </tr>
            ) : (
              filteredDisplay.map((t) => {
                const overall = (t as any).status ? (t as any).status : computeTransactionOverallStatus(t as any);
                return (
                  <tr key={t.id} className="border-t border-[#151515] hover:bg-[#0e0e0e] transition">
                    <td className="py-4 px-6 text-gray-300 text-sm">{t.date}</td>
                    <td className="py-4 px-6 text-gray-300 text-sm max-w-[200px] truncate" title={t.description}>{t.description}</td>
                    <td className="py-4 px-6 text-gray-300 text-sm">{t.payer}</td>
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

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
