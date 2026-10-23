"use client";

import Image from "next/image";
import { Plus, Search, Check, X, Bell, ChevronDown, Info, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, CreditCard, RefreshCw, Zap } from "lucide-react";
import { useState, useEffect, useCallback, Fragment } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useConnectedAccounts, useUnreconciledTransactions, useConnectedInstitution, useReconcileTransaction, useAutoMatchTransactions, useClassifyTransaction, useClassifiedTransactions } from "@/hooks/useTransactions";
import { createPlaidLinkToken, exchangePlaidPublicToken, getPlaidTransactions, simulatePlaidIncoming } from "@/lib/api/transactionApi";
import { getTenantById } from "@/lib/api/tenantsApi";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import TenantRentHistoryTable from "@/components/tenants/TenantRentHistoryTable";
// Table is implemented inline to avoid dependency on shared DataTable component

interface Transaction {
  id: number | string;
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
  /** Full tenant rentHistory — same columns as Tenants → Transaction History */
  rentHistory?: any[];
  rawTenant?: any;
  transactions?: TenantTxn[];
}

interface TenantTxn {
  month: string;
  rent: string;
  amountPaid: string;
  paidDate?: string | null;
  paymentPieces?: { paidOn?: any; amount: number; method?: string }[];
  status: "Paid" | "Unpaid" | "Partial";
}

type TxSortKey = "date" | "amount" | "payer" | "status";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [txSortBy, setTxSortBy] = useState<TxSortKey>("date");
  const [txSortDir, setTxSortDir] = useState<"asc" | "desc">("desc");
  const pageSize = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleSort = (key: TxSortKey) => {
    if (txSortBy === key) {
      setTxSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTxSortBy(key);
      setTxSortDir(key === "date" || key === "status" ? "desc" : "asc");
    }
    setPage(1);
  };

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
    Matched: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    "Needs Review": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };

  const statusDots: Record<string, string> = {
    Matched: "bg-emerald-400",
    "Needs Review": "bg-amber-400",
  };

  const matchColors: Record<string, string> = {
    Matched: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    "Needs Review": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };
 
  // Fetch unreconciled transactions from API (keep the full query so we can refetch)
  const [txListTab, setTxListTab] = useState<"rent" | "deposit">("rent");
  const [depositPage, setDepositPage] = useState(1);
  const unreconciledQuery = useUnreconciledTransactions({
    page,
    limit: pageSize,
    search: searchQuery || undefined,
    sortBy: txSortBy,
    sortDir: txSortDir,
  });
  const classifiedQuery = useClassifiedTransactions({
    classification: "deposit",
    page: depositPage,
    limit: pageSize,
    enabled: txListTab === "deposit",
  });
  const unreconciledRes = unreconciledQuery.data;
  const txLoading = unreconciledQuery.isLoading;
  const apiDocs = unreconciledRes?.data?.docs ?? [];
  const total = Number(unreconciledRes?.data?.total) || 0;
  const totalPages = Math.max(1, Number(unreconciledRes?.data?.totalPages) || 1);
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(page * pageSize, total);

  const depositDocs = classifiedQuery.data?.data?.docs ?? [];
  const depositTotal = Number(classifiedQuery.data?.data?.total) || 0;
  const depositTotalPages = Math.max(1, Number(classifiedQuery.data?.data?.totalPages) || 1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const apiRows = apiDocs.map((d: any, i: number) => ({
    id: d.transaction?.transactionId || d.transaction?._id || `${page}-${i}`,
    date: d.transaction?.date ? formatDate(d.transaction.date) : "-",
    description: d.transaction?.description || d.transaction?.reference || "",
    payer: (d.transaction?.payerName || "").toString().trim() || "—",
    amount: typeof d.transaction?.amount === "number" ? `£${d.transaction.amount}` : String(d.transaction?.amount ?? ""),
    status: d.matchStatus === "matched" ? "Matched" : "Needs Review",
    raw: d,
  }));

  // Prefer API-backed rows. If none returned, show an empty list (no dummy/sample transactions).
  const displayTransactions: Transaction[] = apiRows.length > 0 ? apiRows : [];
  const filteredDisplay = displayTransactions;

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
  const classifyMutation = useClassifyTransaction();
  const [pendingClassify, setPendingClassify] = useState<{
    transactionId: string;
    tenantId?: string | null;
    tenantName?: string;
  } | null>(null);
  const autoMatchMutation = useAutoMatchTransactions();

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
      return arr.map((c: any, i: number) => {
        const history = Array.isArray(c.rentHistory) ? [...c.rentHistory] : [];
        history.sort((a: any, b: any) => new Date(a?.month || 0).getTime() - new Date(b?.month || 0).getTime());
        const formatMoney = (value: any) =>
          `£${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const normalizeStatus = (s: any): "Paid" | "Unpaid" | "Partial" => {
          const v = String(s || "unpaid").toLowerCase();
          if (v === "paid") return "Paid";
          if (v === "partial") return "Partial";
          return "Unpaid";
        };
        const room = c.room ? String(c.room).trim() : "";
        const propertyLabel = room && c.property ? `${c.property} · ${room}` : c.property || c.propertyAddress || "";

        const visibleHistory = history.filter((rh: any) => {
          const due = Number(rh?.amountDue ?? rh?.amount ?? 0) || 0;
          const paid = Number(rh?.amountPaid ?? 0) || 0;
          // Hide empty prorated rows (e.g. move-in on due day → £0 due)
          return !(due === 0 && paid === 0);
        });

        return {
          id: i + 1,
          tenantId: c._id ? String(c._id) : undefined,
          name: Array.isArray(c.tenantName)
            ? c.tenantName.filter(Boolean).join(", ")
            : c.tenantName || c.tenantName?.name || "",
          property: propertyLabel,
          rent: typeof c.rent === "number" ? formatMoney(c.rent) : String(c.rent || ""),
          status: "Unpaid" as const,
          rentHistory: history,
          rawTenant: c,
          transactions: visibleHistory.map((rh: any) => {
            const pieces = Array.isArray(rh.linkedPayments)
              ? rh.linkedPayments.filter((p: any) => (Number(p?.amount) || 0) > 0)
              : [];
            return {
              month: formatDate(rh.month),
              rent: formatMoney(rh.amountDue ?? rh.amount ?? 0),
              amountPaid: formatMoney(rh.amountPaid ?? 0),
              paidDate: rh.paidOn ?? null,
              paymentPieces: pieces.map((p: any) => ({
                paidOn: p.paidOn ?? null,
                amount: Number(p.amount) || 0,
                method: p.method || (p.transactionId ? "bank" : "cash"),
              })),
              status: normalizeStatus(rh.status),
            };
          }),
        };
      });
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
  /** Full tenant docs loaded on expand (match API only returns thin unpaid history). */
  const [fullTenantById, setFullTenantById] = useState<
    Record<string, { loading: boolean; data: any | null; error?: string | null }>
  >({});

  async function loadFullTenantHistory(tenantId: string) {
    if (!tenantId) return;
    const existing = fullTenantById[tenantId];
    if (existing?.data || existing?.loading) return;
    setFullTenantById((prev) => ({
      ...prev,
      [tenantId]: { loading: true, data: null, error: null },
    }));
    try {
      const res = await getTenantById(tenantId);
      const data = res?.data ?? res;
      setFullTenantById((prev) => ({
        ...prev,
        [tenantId]: { loading: false, data, error: null },
      }));
    } catch (err: any) {
      setFullTenantById((prev) => ({
        ...prev,
        [tenantId]: {
          loading: false,
          data: null,
          error: err?.response?.data?.message || err?.message || "Failed to load history",
        },
      }));
    }
  }

  function toggleCandidate(id: number, tenantId?: string) {
    setExpandedCandidates((prev) => {
      const closing = prev.includes(id);
      if (closing) return [];
      return [id];
    });
    if (tenantId) loadFullTenantHistory(tenantId);
  }

  function openView(t: Transaction) {
    setSelectedTransaction(t);
    setViewModalOpen(true);
    setExpandedCandidates([]);
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
  const candidateTotalPages = Math.max(1, Math.ceil(sortedCandidates.length / candidatePageSize));
  useEffect(() => {
    if (candidatePage > candidateTotalPages) setCandidatePage(candidateTotalPages);
  }, [sortedCandidates.length, candidateTotalPages]);

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

  function requestMarkAsDeposit(tenant?: Tenant | null) {
    const transactionId = getTransactionIdFromSelected();
    if (!transactionId) {
      setReconcileError("Missing transaction id — cannot classify.");
      return;
    }
    if (!tenant?.tenantId) {
      setReconcileError("Pick a tenant with the Deposit button so the deposit can be recorded on that tenancy.");
      toast.error("Choose a tenant’s Deposit button — deposit must be linked to a tenant.");
      return;
    }
    setReconcileError(null);
    setPendingClassify({
      transactionId,
      tenantId: tenant.tenantId,
      tenantName: tenant.name,
    });
  }

  async function confirmMarkAsDeposit() {
    if (!pendingClassify?.tenantId) return;
    classifyMutation.mutate(
      {
        transactionId: pendingClassify.transactionId,
        classification: "deposit",
        tenantId: pendingClassify.tenantId,
      },
      {
        onSuccess: async () => {
          toast.success("Deposit recorded on tenant and removed from rent queue");
          setPendingClassify(null);
          setViewModalOpen(false);
          setSelectedTransaction(null);
          try {
            await unreconciledQuery.refetch();
            await classifiedQuery.refetch();
          } catch (e) {
            console.warn("Failed to refetch transactions", e);
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Failed to mark as deposit.";
          setReconcileError(msg);
          toast.error(msg);
        },
      }
    );
  }

  function restoreDepositTransaction(transactionId: string) {
    if (!transactionId) return;
    classifyMutation.mutate(
      { transactionId, classification: "none" },
      {
        onSuccess: async () => {
          toast.success("Deposit cleared — transaction is back in the rent queue");
          try {
            await classifiedQuery.refetch();
            await unreconciledQuery.refetch();
          } catch (e) {
            console.warn("Failed to refetch transactions", e);
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Failed to restore transaction.");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wide uppercase mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Bank Reconciliation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review incoming bank payments, reconcile rent ledgers, and manage security deposits.
          </p>
        </div>

        {connectedInstitution && (
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#111111] border border-emerald-500/30 text-xs shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-gray-400">Bank connected:</span>
            <span className="font-semibold text-emerald-300">{connectedInstitution}</span>
          </div>
        )}
      </div>

      {/* View Modal: show transaction details and candidate tenants */}
      {viewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="my-auto max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-800/80 bg-[#111111] p-5 sm:p-6 text-white shadow-2xl no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-gray-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {selectedTransaction.description}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border ${statusColors[computeTransactionOverallStatus(selectedTransaction)]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDots[computeTransactionOverallStatus(selectedTransaction)] || "bg-gray-400"}`} />
                    {computeTransactionOverallStatus(selectedTransaction)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400">
                  Date: <span className="text-gray-200">{selectedTransaction.date}</span> • Payer: <span className="text-gray-200 font-medium">{selectedTransaction.payer || "—"}</span> • Amount: <span className="text-emerald-400 font-semibold">{selectedTransaction.amount}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => { setViewModalOpen(false); setSelectedTransaction(null); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters + Sorting for candidate list */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-500" />
                  <input
                    value={candidateNameFilter}
                    onChange={(e) => { setCandidateNameFilter(e.target.value); setCandidatePage(1); }}
                    placeholder="Search tenant name..."
                    className="w-full sm:w-56 bg-[#0c0c0c] border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-700"
                  />
                </div>
                <input
                  value={candidatePropertyFilter}
                  onChange={(e) => { setCandidatePropertyFilter(e.target.value); setCandidatePage(1); }}
                  placeholder="Search property..."
                  className="w-full sm:w-56 bg-[#0c0c0c] border border-gray-800 rounded-xl py-2 px-3 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-700"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <label className="text-xs text-gray-400 whitespace-nowrap">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setCandidatePage(1); }}
                  className="bg-[#0c0c0c] border border-gray-800 rounded-xl py-1.5 px-3 text-xs text-gray-200 focus:outline-none focus:border-gray-700"
                >
                  <option value="default">Default</option>
                  <option value="lastPayment">Last Payment</option>
                  <option value="status">Status</option>
                  <option value="rent">Rent</option>
                </select>
                <button
                  type="button"
                  onClick={() => { setSortDir((d) => (d === "asc" ? "desc" : "asc")); setCandidatePage(1); }}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-800 text-xs text-gray-200 hover:bg-gray-800/60 transition"
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl bg-[#0c0c0c] border border-gray-800/80 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-gray-400 text-left bg-[#141414] border-b border-gray-800">
                    <th className="py-3 px-4 font-medium text-xs">Tenant</th>
                    <th className="py-3 px-4 font-medium text-xs">Property</th>
                    <th className="py-3 px-4 font-medium text-xs">Rent</th>
                    <th className="py-3 px-4 font-medium text-xs">Match</th>
                    <th className="py-3 px-4 font-medium text-xs text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                        No candidate tenants match the criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((c) => {
                      const isOpen = expandedCandidates.includes(c.id);
                      const mStatus = computeMatchStatus(selectedTransaction, c);
                      return (
                        <Fragment key={c.id}>
                          <tr className="border-t border-gray-800/60 hover:bg-white/[0.02] transition">
                            <td className="py-3 px-4 text-gray-200">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleCandidate(c.id, c.tenantId)}
                                  className={`p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <span className="font-medium text-white">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{c.property}</td>
                            <td className="py-3 px-4 text-emerald-400 font-semibold">{c.rent}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border ${matchColors[mStatus]}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusDots[mStatus] || "bg-gray-400"}`} />
                                  {mStatus}
                                </span>
                                <div className="relative group inline-block">
                                  <Info className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-200 cursor-pointer" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 border border-gray-700 text-xs text-gray-200 p-2 rounded-lg opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 z-50 shadow-xl whitespace-normal">
                                    {computeMatchReason(selectedTransaction, c)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => requestReconcile(c)}
                                  disabled={!c.tenantId || !getTransactionIdFromSelected() || reconcileMutation.isPending}
                                  className="inline-flex items-center gap-1.5 bg-[#027A48] hover:bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => requestMarkAsDeposit(c)}
                                  disabled={!c.tenantId || !getTransactionIdFromSelected() || classifyMutation.isPending}
                                  className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Exclude from rent — this is a security deposit"
                                >
                                  <span>Deposit</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          <tr key={`details-${c.id}`} className="bg-[#080808]">
                            <td colSpan={5} className="p-0">
                              <div
                                className={`overflow-hidden transition-all duration-300 ease-out ${
                                  isOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
                                }`}
                              >
                                <div className="max-h-[640px] overflow-y-auto p-4 border-t border-gray-800/40 space-y-3">
                                  <div className="text-xs font-medium text-gray-400">
                                    Transaction history for {c.name}
                                  </div>
                                  {(() => {
                                    const tid = c.tenantId ? String(c.tenantId) : "";
                                    const full = tid ? fullTenantById[tid] : null;
                                    if (tid && (full?.loading || !full)) {
                                      return (
                                        <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] py-8 text-center text-xs text-gray-400">
                                          Loading full rent history…
                                        </div>
                                      );
                                    }
                                    if (full?.error) {
                                      return (
                                        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 py-6 text-center text-xs text-rose-300">
                                          {full.error}
                                        </div>
                                      );
                                    }
                                    const tenantDoc =
                                      full?.data ||
                                      c.rawTenant || {
                                        rentHistory: c.rentHistory,
                                        rent: c.rent,
                                      };
                                    const history = Array.isArray(tenantDoc?.rentHistory)
                                      ? tenantDoc.rentHistory
                                      : c.rentHistory || [];
                                    if (!history.length) {
                                      return (
                                        <div className="rounded-xl border border-gray-800 bg-[#0d0d0d] py-6 text-center text-xs text-gray-500">
                                          No rent history for this tenant.
                                        </div>
                                      );
                                    }
                                    return (
                                      <TenantRentHistoryTable
                                        tenantId={tid || c.tenantId}
                                        rentHistory={history}
                                        tenant={tenantDoc}
                                        readOnly
                                      />
                                    );
                                  })()}
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

            {/* Pagination controls inside Candidate Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-gray-400">
                Showing {sortedCandidates.length === 0 ? 0 : (candidatePage - 1) * candidatePageSize + 1}–{Math.min(candidatePage * candidatePageSize, sortedCandidates.length)} of {sortedCandidates.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={candidatePage <= 1}
                  onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg border border-gray-800 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>
                <div className="text-xs text-gray-400">
                  Page <span className="text-white font-medium">{candidatePage}</span> of {candidateTotalPages}
                </div>
                <button
                  type="button"
                  disabled={candidatePage >= candidateTotalPages}
                  onClick={() => setCandidatePage((p) => Math.min(candidateTotalPages, p + 1))}
                  className="px-3 py-1 rounded-lg border border-gray-800 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>

            {reconcileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {reconcileError}
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => { setViewModalOpen(false); setSelectedTransaction(null); setReconcileError(null); }}
                className="px-5 py-2 rounded-full border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-gray-800/60 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank sync feedback modal */}
      {syncFeedback && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              {syncFeedback.type === "success" ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
              )}
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">{syncFeedback.title}</h3>
                {syncFeedback.accountName && (
                  <p className="text-xs text-gray-400">{syncFeedback.accountName}</p>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{syncFeedback.message}</p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSyncFeedback(null)}
                className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                  syncFeedback.type === "success"
                    ? "bg-[#027A48] hover:bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                    : "border border-gray-800 text-gray-300 hover:bg-gray-800/60"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-6 text-white shadow-2xl space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Confirm Reconciliation</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Apply this bank transaction to <span className="text-emerald-300 font-semibold">{pendingReconcile.tenant.name}</span>&apos;s oldest unpaid rent ledger?
              </p>
            </div>

            <div className="bg-[#0c0c0c] border border-gray-800/80 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Transaction</span>
                <span className="text-right text-gray-200 max-w-[60%] truncate font-medium">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Amount</span>
                <span className="text-emerald-400 font-bold">{selectedTransaction.amount}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Date</span>
                <span className="text-gray-200">{selectedTransaction.date}</span>
              </div>
              <div className="border-t border-gray-800/80 my-2" />
              <div className="flex justify-between text-gray-400">
                <span>Tenant</span>
                <span className="text-gray-200 font-medium">{pendingReconcile.tenant.name}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Property</span>
                <span className="text-right text-gray-300 max-w-[60%] truncate">{pendingReconcile.tenant.property || "—"}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Monthly Rent</span>
                <span className="text-gray-200 font-medium">{pendingReconcile.tenant.rent}</span>
              </div>
            </div>

            {reconcileError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">{reconcileError}</p>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => { setPendingReconcile(null); setReconcileError(null); }}
                disabled={reconcileMutation.isPending}
                className="px-4 py-2 rounded-full border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-gray-800/60 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReconcile}
                disabled={reconcileMutation.isPending}
                className="px-5 py-2 rounded-full bg-[#027A48] hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium disabled:opacity-50 transition shadow-md shadow-emerald-950/40"
              >
                {reconcileMutation.isPending ? "Reconciling…" : "Confirm Reconcile"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as deposit confirmation */}
      {pendingClassify && selectedTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#111111] p-6 text-white shadow-2xl space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">Mark as Deposit</h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Record this bank payment as security deposit for <span className="text-amber-300 font-semibold">{pendingClassify.tenantName}</span>. It will be removed from the rent queue and stored on the tenancy.
              </p>
            </div>

            <div className="bg-[#0c0c0c] border border-gray-800/80 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Transaction</span>
                <span className="text-right text-gray-200 max-w-[60%] truncate font-medium">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Amount</span>
                <span className="text-amber-400 font-bold">{selectedTransaction.amount}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Date</span>
                <span className="text-gray-200">{selectedTransaction.date}</span>
              </div>
            </div>

            {reconcileError && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">{reconcileError}</p>}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPendingClassify(null);
                  setReconcileError(null);
                }}
                disabled={classifyMutation.isPending}
                className="px-4 py-2 rounded-full border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-gray-800/60 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkAsDeposit}
                disabled={classifyMutation.isPending}
                className="px-5 py-2 rounded-full border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs sm:text-sm font-medium disabled:opacity-50 transition"
              >
                {classifyMutation.isPending ? "Saving…" : "Confirm Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Modal */}
      {showAccountsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#111111] p-5 sm:p-6 text-white shadow-2xl no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Connected Bank Accounts</h3>
                <p className="text-xs sm:text-sm text-gray-400">Accounts synced from your Open Banking feed</p>
              </div>
              <div className="flex items-center gap-2">
                {connectedAccountsQuery.isFetching && (
                  <span className="text-xs text-emerald-400 animate-pulse">Syncing…</span>
                )}
                <button
                  type="button"
                  onClick={() => setShowAccountsModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {connectedAccountsQuery.isError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  Failed to load connected accounts.
                </div>
              )}

              {!connectedAccountsQuery.isFetching &&
                !connectedAccountsQuery.isError &&
                (connectedAccountsQuery.data?.data ?? []).length === 0 && (
                <div className="text-xs sm:text-sm text-gray-400 py-6 text-center">
                  {connectedInstitution
                    ? `No accounts found for ${connectedInstitution}. Try Reconnect bank, then open Sync Bank Feed again.`
                    : "No accounts found. Connect a bank first."}
                </div>
              )}

              {(connectedAccountsQuery.data?.data ?? []).map((acc: any) => (
                <div key={acc.accountId} className="flex items-center justify-between gap-3 p-3.5 bg-[#0c0c0c] border border-gray-800/80 rounded-xl hover:border-gray-700/80 transition">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-white truncate">{acc.name || acc.accountId}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{acc.accountId}</div>
                    <div className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">{acc.currency || acc.type || acc.accountType}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAccountSync(acc)}
                      disabled={syncingAccounts.includes(acc.accountId)}
                      className="px-3.5 py-1.5 rounded-full bg-[#027A48] hover:bg-emerald-600 text-white text-xs font-medium transition disabled:opacity-60 shadow-sm"
                    >
                      {syncingAccounts.includes(acc.accountId) ? 'Syncing…' : 'Sync Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAccountsModal(false)}
                className="px-5 py-2 rounded-full border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-gray-800/60 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search (Left) + Actions (Right) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by payer, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-gray-800/80 rounded-xl py-2.5 pl-10 pr-3 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-700 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={startPlaidConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 bg-[#027A48] hover:bg-[#027A48]/90 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{connecting ? "Connecting…" : connectedInstitution ? "Reconnect bank" : "Connect bank"}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                setShowAccountsModal(true);
                await connectedAccountsQuery.refetch();
              } catch (err) {
                console.error('Failed to fetch connected accounts', err);
              }
            }}
            className="inline-flex items-center gap-2 bg-[#111111] border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sync Feed</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await autoMatchMutation.mutateAsync();
                const data = res?.data ?? res;
                const scanned = Number(data?.scanned) || 0;
                const appliedCount = Number(data?.applied) || 0;
                const reason = data?.reason;
                const ambiguous = Number(data?.skippedAmbiguous) || 0;
                const failures = Number(data?.applyFailures) || 0;
                const failHint =
                  Array.isArray(data?.applyErrors) && data.applyErrors.length
                    ? ` (${data.applyErrors[0]})`
                    : "";
                setSyncFeedback({
                  type: "success",
                  title: "Auto-Reconcile finished",
                  message:
                    appliedCount > 0
                      ? `Reconciled ${appliedCount} payment${appliedCount === 1 ? "" : "s"} via linked bank payer fingerprint${appliedCount === 1 ? "" : "s"}.`
                      : reason === "no_linked_payers"
                        ? "No linked bank payers yet. Accept a match on a tenant once to save a fingerprint, then Auto-Reconcile will apply future payments from that payer."
                        : failures > 0
                          ? `Found linked-payer matches but ${failures} could not be applied${failHint}.`
                          : ambiguous > 0
                            ? `Checked ${scanned} transaction${scanned === 1 ? "" : "s"} — ${ambiguous} matched more than one tenant’s linked payer (needs manual Accept).`
                            : scanned > 0
                              ? `Checked ${scanned} transaction${scanned === 1 ? "" : "s"} against saved fingerprints — none uniquely matched a linked payer with unpaid rent.`
                              : "No unreconciled transactions matched a saved linked payer fingerprint.",
                });
              } catch (err: any) {
                setSyncFeedback({
                  type: "error",
                  title: "Auto-Reconcile Transactions failed",
                  message: err?.response?.data?.message || err?.message || "Could not auto-reconcile transactions.",
                });
              }
            }}
            disabled={autoMatchMutation.isPending || total === 0}
            className="inline-flex items-center gap-2 bg-[#111111] border border-sky-500/30 hover:border-sky-500/60 text-sky-300 hover:text-sky-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 text-sky-400 ${autoMatchMutation.isPending ? "animate-spin" : ""}`} />
            <span>{autoMatchMutation.isPending ? "Matching…" : "Auto-Reconcile"}</span>
          </button>

          {connectedInstitutionQuery.data?.sandbox && connectedInstitution && (
            <button
              type="button"
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
              className="inline-flex items-center gap-2 bg-[#111111] border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition disabled:opacity-50"
            >
              <span>{simulating ? "Simulating…" : "Simulate Rent"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setTxListTab("rent")}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-medium border transition-all duration-200 flex items-center gap-2 ${
            txListTab === "rent"
              ? "bg-[#027A48] border-emerald-500 text-white shadow-md shadow-emerald-950/40"
              : "bg-[#111111] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
          }`}
        >
          <span>Needs rent match</span>
          {total > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              txListTab === "rent" ? "bg-emerald-800/80 text-emerald-100" : "bg-gray-800 text-gray-400"
            }`}>
              {total}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTxListTab("deposit")}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-medium border transition-all duration-200 flex items-center gap-2 ${
            txListTab === "deposit"
              ? "bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-md shadow-amber-950/40"
              : "bg-[#111111] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
          }`}
        >
          <span>Marked as deposit</span>
          {depositTotal > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              txListTab === "deposit" ? "bg-amber-500/30 text-amber-200" : "bg-gray-800 text-gray-400"
            }`}>
              {depositTotal}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Card View (< sm) */}
      <div className="sm:hidden space-y-3">
        {txListTab === "deposit" ? (
          classifiedQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400 bg-[#111111] rounded-2xl border border-gray-800/80">
              Loading deposit transactions…
            </div>
          ) : depositDocs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 bg-[#111111] rounded-2xl border border-gray-800/80">
              No bank payments marked as deposit.
            </div>
          ) : (
            depositDocs.map((row: any, i: number) => {
              const tx = row.transaction || {};
              const tenant = row.tenant;
              const txId = String(tx.transactionId || "");
              return (
                <div key={txId || i} className="p-4 rounded-2xl bg-[#111111] border border-gray-800/80 shadow-md space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{tx.payerName || "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{tx.date ? formatDate(tx.date) : "—"}</p>
                    </div>
                    <span className="text-base font-bold text-amber-400 tabular-nums">
                      {typeof tx.amount === "number" ? `£${tx.amount}` : String(tx.amount ?? "—")}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0a0a0a] border border-gray-800/60 text-xs text-gray-300">
                    <span className="text-gray-500 block">Assigned Tenant:</span>
                    <span className="font-medium text-white">{tenant?.tenantName || "—"}</span>
                    {tenant?.property && (
                      <span className="block text-gray-400 text-[11px] mt-0.5">{tenant.property}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => restoreDepositTransaction(txId)}
                    disabled={!txId || classifyMutation.isPending}
                    className="w-full py-2 rounded-xl border border-sky-800/60 bg-sky-950/20 text-xs text-sky-300 font-medium hover:bg-sky-950/50 transition disabled:opacity-50"
                  >
                    Restore to rent queue
                  </button>
                </div>
              );
            })
          )
        ) : (
          txLoading && filteredDisplay.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 bg-[#111111] rounded-2xl border border-gray-800/80">
              Loading transactions…
            </div>
          ) : filteredDisplay.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400 bg-[#111111] rounded-2xl border border-gray-800/80">
              {searchQuery
                ? `No unreconciled transactions match “${searchQuery}”.`
                : "No unreconciled transactions. Reconciled payments are on each tenant’s history."}
            </div>
          ) : (
            filteredDisplay.map((t) => {
              const overall = (t as any).status ? (t as any).status : computeTransactionOverallStatus(t as any);
              return (
                <div
                  key={t.id}
                  onClick={() => openView(t)}
                  className="p-4 rounded-2xl bg-[#111111] border border-gray-800/80 shadow-md space-y-2.5 active:scale-[0.99] transition cursor-pointer hover:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{t.payer}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{t.description}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full border ${statusColors[overall]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[overall] || "bg-gray-400"}`} />
                      {overall}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-800/60 text-xs">
                    <span className="text-gray-400">{t.date}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-emerald-400 tabular-nums">{t.amount}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block w-full overflow-x-auto rounded-2xl bg-[#111111] border border-gray-800/80 shadow-xl no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {txListTab === "deposit" ? (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-400 text-left bg-[#0c0c0c] border-b border-gray-800">
                <th className="py-4 px-6 font-medium text-xs md:text-sm">Date</th>
                <th className="py-4 px-6 font-medium text-xs md:text-sm">Payer</th>
                <th className="py-4 px-6 font-medium text-xs md:text-sm">Amount</th>
                <th className="py-4 px-6 font-medium text-xs md:text-sm">Tenant</th>
                <th className="py-4 px-6 font-medium text-xs md:text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {classifiedQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Loading deposit transactions…
                  </td>
                </tr>
              ) : depositDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No bank payments marked as deposit.
                  </td>
                </tr>
              ) : (
                depositDocs.map((row: any, i: number) => {
                  const tx = row.transaction || {};
                  const tenant = row.tenant;
                  const txId = String(tx.transactionId || "");
                  return (
                    <tr key={txId || i} className="border-t border-gray-800/60 hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        {tx.date ? formatDate(tx.date) : "—"}
                      </td>
                      <td className="py-4 px-6 text-gray-200 font-medium text-sm">{tx.payerName || "—"}</td>
                      <td className="py-4 px-6 text-amber-400 font-semibold text-sm tabular-nums">
                        {typeof tx.amount === "number" ? `£${tx.amount}` : String(tx.amount ?? "—")}
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        <span className="font-medium text-white">{tenant?.tenantName || "—"}</span>
                        {tenant?.property ? (
                          <span className="block text-xs text-gray-500 mt-0.5">{tenant.property}</span>
                        ) : null}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => restoreDepositTransaction(txId)}
                          disabled={!txId || classifyMutation.isPending}
                          className="rounded-full border border-sky-800/80 bg-sky-950/20 px-3.5 py-1.5 text-xs text-sky-300 font-medium hover:bg-sky-950/50 disabled:opacity-50 transition"
                        >
                          Restore to rent queue
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-400 text-left bg-[#0c0c0c] border-b border-gray-800">
                {(
                  [
                    { key: "date" as TxSortKey, label: "Date" },
                    { key: "payer" as TxSortKey, label: "Payer" },
                    { key: "amount" as TxSortKey, label: "Amount" },
                    { key: "status" as TxSortKey, label: "Status" },
                  ] as const
                ).map((col) => {
                  const active = txSortBy === col.key;
                  return (
                    <th
                      key={col.key}
                      className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1.5 hover:text-gray-200 transition ${
                          active ? "text-gray-100 font-semibold" : "text-gray-400"
                        }`}
                        aria-label={`Sort by ${col.label}`}
                      >
                        <span>{col.label}</span>
                        {active ? (
                          txSortDir === "asc" ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                          )
                        ) : (
                          <span className="inline-flex flex-col leading-none opacity-40">
                            <ArrowUp className="w-2.5 h-2.5" />
                            <ArrowDown className="w-2.5 h-2.5 -mt-0.5" />
                          </span>
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {txLoading && filteredDisplay.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Loading transactions…
                  </td>
                </tr>
              ) : filteredDisplay.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    {searchQuery
                      ? `No unreconciled transactions match “${searchQuery}”.`
                      : "No unreconciled transactions. Reconciled payments are on each tenant’s history."}
                  </td>
                </tr>
              ) : (
                filteredDisplay.map((t) => {
                  const overall = (t as any).status ? (t as any).status : computeTransactionOverallStatus(t as any);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openView(t)}
                      className="cursor-pointer border-t border-gray-800/60 hover:bg-white/[0.02] transition"
                    >
                      <td className="py-4 px-6 text-gray-300 text-sm">{t.date}</td>
                      <td className="py-4 px-6 text-gray-200 font-medium text-sm">
                        <div>{t.payer}</div>
                        {t.description && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{t.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-emerald-400 font-semibold text-sm tabular-nums">{t.amount}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border ${statusColors[overall]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDots[overall] || "bg-gray-400"}`} />
                          {overall}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {txListTab === "deposit" ? (
        depositTotal > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-xs sm:text-sm text-gray-400">
              Showing {depositDocs.length} of {depositTotal} deposit transaction
              {depositTotal === 1 ? "" : "s"}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDepositPage((prev) => Math.max(1, prev - 1))}
                disabled={depositPage <= 1 || classifiedQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 px-4 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs sm:text-sm text-gray-400 px-1">
                Page <span className="text-white font-medium">{depositPage}</span> of {depositTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setDepositPage((prev) => Math.min(depositTotalPages, prev + 1))}
                disabled={depositPage >= depositTotalPages || classifiedQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 px-4 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      ) : (
        total > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-xs sm:text-sm text-gray-400">
              Showing {startIndex} to {endIndex} of {total} transactions
              {unreconciledQuery.isFetching && !txLoading ? " · Updating…" : ""}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || unreconciledQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 px-4 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs sm:text-sm text-gray-400 px-1">
                Page <span className="text-white font-medium">{page}</span> of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || unreconciledQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 px-4 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

