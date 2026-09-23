"use client";

import { Search, Plus, X, DollarSign, Pencil, Trash2, Link2, Check, Info, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";
import NewTenantModal from "@/components/user/new-tenant-modal";
import RentScheduleFields, {
  buildRentSchedulePayload,
  scheduleFromTenant,
  type RentAdjustmentRow,
} from "@/components/user/rent-schedule-fields";
import usePayByCash, {
  useAssignTenant,
  useEndTenancy,
  useTenants,
  useUnlinkLinkedPayer,
  useUnreconcileRent,
  useUpdateTenant,
} from "@/hooks/usetenants";
import { useReconcileTransaction } from "@/hooks/useTransactions";
import { getRentEntryPayment, getTenantById } from "@/lib/api/tenantsApi";
import { getTransactionsMatchingTenant } from "@/lib/api/transactionApi";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/redux/useAuthUser";

export default function TenantsPage() {
  /** True if char is a Unicode letter (works without regex `u` / `\p{L}`). */
  const isLetterChar = (ch: string) => {
    if (!ch) return false;
    // Most cased scripts: lower ≠ upper
    if (ch.toLowerCase() !== ch.toUpperCase()) return true;
    // Scripts without case (e.g. CJK): Letter category via unicode property when runtime allows
    try {
      return new RegExp("^\\p{L}$", "u").test(ch);
    } catch {
      return false;
    }
  };

  /** Letters, spaces, hyphens, apostrophes only — no digits or other symbols. */
  const sanitizeTenantNameInput = (value: string) =>
    Array.from(value)
      .filter((ch) => ch === " " || ch === "'" || ch === "-" || isLetterChar(ch))
      .join("");

  const isValidTenantName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed.length) return false;
    const parts = trimmed.split(/[\s'-]+/).filter(Boolean);
    if (parts.length === 0) return false;
    // Must not start/end with separator-only junk; full string only letters + allowed separators
    if (!/^[\s'-]*[^\s'-]+(?:[\s'-]+[^\s'-]+)*[\s'-]*$/.test(trimmed)) return false;
    return parts.every((part) => Array.from(part).every(isLetterChar));
  };

  const normalizeTenantNames = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((name) => (typeof name === "string" ? name.trim() : String(name)))
        .filter(Boolean);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }

    return [];
  };

  const getTenantDisplayName = (tenant: any) => {
    if (tenant?.tenancyStatus === "vacant") {
      const room = tenant?.room ? String(tenant.room).trim() : "Room";
      return `${room} (Vacant)`;
    }
    const names = normalizeTenantNames(tenant?.tenantName ?? tenant?.name);
    return names.length > 0 ? names.join(", ") : "Tenant";
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return "—";
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatMoney = (value: number) =>
    `£${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /** Positive = overpaid credit; negative = underpaid / owes. */
  const getBalanceSummary = (tenant: any) => {
    if (tenant?.tenancyStatus === "vacant") {
      return {
        label: "Vacant",
        amount: formatMoney(0),
        className: "border-amber-800/60 bg-amber-950/30 text-amber-300",
      };
    }
    const balance = Number(tenant?.currentBalance) || 0;

    if (balance > 0) {
      return {
        label: "Overpaid",
        amount: formatMoney(balance),
        className: "border-emerald-800/60 bg-emerald-950/40 text-emerald-300",
      };
    }

    if (balance < 0) {
      return {
        label: "Underpaid",
        amount: formatMoney(Math.abs(balance)),
        className: "border-rose-800/60 bg-rose-950/40 text-rose-300",
      };
    }

    return {
      label: "Settled",
      amount: formatMoney(0),
      className: "border-gray-700 bg-[#121212] text-gray-300",
    };
  };

  /** Remaining unpaid amount across rentHistory entries (or currentBalance on list DTO). */
  const getRemainingAmount = (tenant: any) => {
    if (tenant?.tenancyStatus === "vacant") return 0;
    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    if (history.length > 0) {
      return history.reduce((sum: number, entry: any) => {
        const due = Number(entry?.amountDue) || 0;
        const paid = Number(entry?.amountPaid) || 0;
        return sum + Math.max(0, due - paid);
      }, 0);
    }

    if (typeof tenant?.currentBalance === "number" && tenant.currentBalance < 0) {
      return Math.abs(tenant.currentBalance);
    }

    return 0;
  };

  /**
   * Derive display status from rentHistory (detail) or status/currentBalance (list DTO):
   * - Vacant when room has no occupant
   * - Paid when nothing is owed
   * - Unpaid / Partial only when at least one month still has remaining due
   */
  const getEffectiveStatus = (
    tenant: any
  ): { key: "Paid" | "Unpaid" | "Partial" | "Vacant"; label: string } => {
    if (tenant?.tenancyStatus === "vacant") {
      return { key: "Vacant", label: "Vacant" };
    }

    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    const remaining = getRemainingAmount(tenant);

    if (remaining <= 0) {
      return { key: "Paid", label: "Paid" };
    }

    if (history.length === 0) {
      const s = String(tenant?.status || "").toLowerCase();
      if (s === "partial") {
        return { key: "Partial", label: formatMoney(remaining) };
      }
      return { key: "Unpaid", label: formatMoney(remaining) };
    }

    const hasPartial = history.some((entry: any) => {
      const due = Number(entry?.amountDue) || 0;
      const paid = Number(entry?.amountPaid) || 0;
      const rem = Math.max(0, due - paid);
      return rem > 0 && (paid > 0 || String(entry?.status || "").toLowerCase() === "partial");
    });

    if (hasPartial) {
      return { key: "Partial", label: formatMoney(remaining) };
    }

    return { key: "Unpaid", label: formatMoney(remaining) };
  };

  const getStatusLabel = (tenant: any) => getEffectiveStatus(tenant).label;

  const getStatusColorKey = (tenant: any) => getEffectiveStatus(tenant).key;

  const getPropertyDisplay = (tenant: any) => {
    const address = tenant?.property || "";
    const room = tenant?.room ? String(tenant.room).trim() : "";
    if (address && room) return `${address} · ${room}`;
    return address || "—";
  };

  type TenantSortKey = "name" | "property" | "rent" | "status" | "lastPayment";
  const [search, setSearch] = useState("");
  const [tenantSortBy, setTenantSortBy] = useState<TenantSortKey>("name");
  const [tenantSortDir, setTenantSortDir] = useState<"asc" | "desc">("asc");
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pendingCash, setPendingCash] = useState<{
    index: number;
    entry: any;
    cashAmount: string;
  } | null>(null);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantNames, setEditTenantNames] = useState<string[]>([]);
  const [currentEditName, setCurrentEditName] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editMoveIn, setEditMoveIn] = useState("");
  const [editDueOn, setEditDueOn] = useState(1);
  const [editHasDeposit, setEditHasDeposit] = useState(false);
  const [editDeposit, setEditDeposit] = useState("");
  const [editRent, setEditRent] = useState("");
  const [editRentAdjustments, setEditRentAdjustments] = useState<RentAdjustmentRow[]>([]);
  const [editConfirmationOpen, setEditConfirmationOpen] = useState(false);
  const [endTenancyOpen, setEndTenancyOpen] = useState(false);
  const [paymentReview, setPaymentReview] = useState<{
    index: number;
    entry: any;
    loading: boolean;
    linkedTransactions: any[];
    paymentHistory: any[];
    paymentMethod: string;
  } | null>(null);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [matchingTxs, setMatchingTxs] = useState<any[]>([]);
  const [reconcileSearch, setReconcileSearch] = useState("");
  const [pendingBankReconcile, setPendingBankReconcile] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignRent, setAssignRent] = useState("");
  const [assignDueOn, setAssignDueOn] = useState(1);
  const [assignMoveIn, setAssignMoveIn] = useState("");
  const [assignHasDeposit, setAssignHasDeposit] = useState(false);
  const [assignDeposit, setAssignDeposit] = useState("");
  const [assignRentAdjustments, setAssignRentAdjustments] = useState<RentAdjustmentRow[]>([]);

  const { data, isLoading, isError } = useTenants();
  const payByCashMutation = usePayByCash();
  const updateTenantMutation = useUpdateTenant();
  const assignTenantMutation = useAssignTenant();
  const endTenancyMutation = useEndTenancy();
  const unreconcileMutation = useUnreconcileRent();
  const unlinkPayerMutation = useUnlinkLinkedPayer();
  const reconcileMutation = useReconcileTransaction();
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  const tenantsFromApi = data?.data ?? [];

  const statusColors: Record<string, string> = {
    Paid: "bg-green-900/40 text-green-400 border-green-700/60",
    Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
    Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
    Vacant: "bg-amber-900/40 text-amber-300 border-amber-700/60",
  };

  const toggleTenantSort = (key: TenantSortKey) => {
    if (tenantSortBy === key) {
      setTenantSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTenantSortBy(key);
      setTenantSortDir(key === "status" || key === "rent" ? "desc" : "asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = tenantsFromApi
      .filter((t: any) => t.tenancyStatus !== "vacant")
      .filter(
        (t: any) =>
          getTenantDisplayName(t).toLowerCase().includes(q) ||
          (t.property || "").toLowerCase().includes(q) ||
          (t.room || "").toLowerCase().includes(q) ||
          (t.propertyName || "").toLowerCase().includes(q)
      );

    const statusRank: Record<string, number> = {
      Unpaid: 0,
      Partial: 1,
      Paid: 2,
      Vacant: 3,
    };
    const dir = tenantSortDir === "asc" ? 1 : -1;

    return [...rows].sort((a: any, b: any) => {
      if (tenantSortBy === "name") {
        return (
          getTenantDisplayName(a).localeCompare(getTenantDisplayName(b), undefined, {
            sensitivity: "base",
          }) * dir
        );
      }
      if (tenantSortBy === "property") {
        return (
          getPropertyDisplay(a).localeCompare(getPropertyDisplay(b), undefined, {
            sensitivity: "base",
          }) * dir
        );
      }
      if (tenantSortBy === "rent") {
        const ar = Number(a.rent) || 0;
        const br = Number(b.rent) || 0;
        return (ar - br) * dir;
      }
      if (tenantSortBy === "status") {
        const rem = getRemainingAmount(a) - getRemainingAmount(b);
        if (rem !== 0) return rem * dir;
        const sa = statusRank[getEffectiveStatus(a).key] ?? 9;
        const sb = statusRank[getEffectiveStatus(b).key] ?? 9;
        return (sa - sb) * dir;
      }
      // lastPayment — missing dates sort last when asc, first when desc
      const da = a.lastPayment ? new Date(a.lastPayment).getTime() : NaN;
      const db = b.lastPayment ? new Date(b.lastPayment).getTime() : NaN;
      const aMissing = Number.isNaN(da);
      const bMissing = Number.isNaN(db);
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      return (da - db) * dir;
    });
  }, [tenantsFromApi, search, tenantSortBy, tenantSortDir]);

  const closeTransactionModal = () => {
    setTransactionModalOpen(false);
    setPendingCash(null);
    setSelectedTenant(null);
    setDetailLoading(false);
    setReconcileOpen(false);
    setMatchingTxs([]);
    setReconcileSearch("");
    setPendingBankReconcile(null);
    setPaymentReview(null);
  };

  const openTenantDetails = async (tenant: any) => {
    const id = tenant?._id || tenant?.id;
    setSelectedTenant(tenant);
    setPendingCash(null);
    setTransactionModalOpen(true);
    if (!id || tenant?.tenancyStatus === "vacant") return;
    // List payload omits rentHistory — load full tenant for the history modal
    setDetailLoading(true);
    try {
      const res = await getTenantById(String(id));
      const full = res?.data ?? res;
      if (full) setSelectedTenant(full);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load tenant details");
    } finally {
      setDetailLoading(false);
    }
  };

  const draftEditNames = [
    ...editTenantNames,
    ...(currentEditName.trim() ? [currentEditName.trim()] : []),
  ];

  const finalEditNames = Array.from(
    new Set(draftEditNames.map((name) => name.trim()).filter(Boolean))
  );

  const tenantHasPayments = (tenant: any) =>
    (Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : []).some((h: any) => {
      if (!h) return false;
      if ((Number(h.amountPaid) || 0) > 0) return true;
      if ((h.linkedTransactionIds || []).length > 0) return true;
      if ((h.linkedPayments || []).length > 0) return true;
      if (h.paymentMethod && h.paymentMethod !== "none") return true;
      return false;
    });

  const canEditScheduleFields = (tenant: any) =>
    Boolean(tenant) && tenant.tenancyStatus !== "vacant" && !tenantHasPayments(tenant);

  const showRoomEditField = (tenant: any) =>
    Boolean(tenant) &&
    (tenant.tenancyStatus === "vacant" ||
      Boolean(String(tenant.room || "").trim()) ||
      String(tenant.tenancyType || "").toLowerCase() === "hmo");

  const openEditTenantModal = () => {
    if (!selectedTenant) return;
    const isVacant = selectedTenant.tenancyStatus === "vacant";
    setEditTenantNames(isVacant ? [] : normalizeTenantNames(selectedTenant.tenantName));
    setCurrentEditName("");
    setEditRoom(String(selectedTenant.room || "").trim());
    setEditMoveIn(
      selectedTenant.moveInDate
        ? new Date(selectedTenant.moveInDate).toISOString().slice(0, 10)
        : ""
    );
    setEditDueOn(Number(selectedTenant.dueOn) || 1);
    const existingDeposit = Number(selectedTenant.depositAmount) || 0;
    setEditHasDeposit(existingDeposit > 0);
    setEditDeposit(existingDeposit > 0 ? String(existingDeposit) : "");
    const scheduleUi = scheduleFromTenant(selectedTenant);
    setEditRent(scheduleUi.baseRent);
    setEditRentAdjustments(scheduleUi.adjustments);
    setEditConfirmationOpen(false);
    setEditTenantOpen(true);
    setTransactionModalOpen(false);
  };

  const openAssignModal = () => {
    if (!selectedTenant || selectedTenant.tenancyStatus !== "vacant") return;
    setAssignName("");
    setAssignRent(
      selectedTenant.rent != null && Number(selectedTenant.rent) > 0
        ? String(selectedTenant.rent)
        : ""
    );
    setAssignDueOn(Number(selectedTenant.dueOn) || 1);
    setAssignMoveIn(new Date().toISOString().slice(0, 10));
    setAssignHasDeposit(false);
    setAssignDeposit("");
    setAssignRentAdjustments([]);
    setAssignOpen(true);
    setTransactionModalOpen(false);
  };

  const closeAssignModal = ({ reopenDetails = true }: { reopenDetails?: boolean } = {}) => {
    setAssignOpen(false);
    setAssignName("");
    setAssignRent("");
    setAssignDueOn(1);
    setAssignMoveIn("");
    setAssignHasDeposit(false);
    setAssignDeposit("");
    setAssignRentAdjustments([]);
    if (reopenDetails && selectedTenant) {
      setTransactionModalOpen(true);
    }
  };

  const confirmAssignTenant = () => {
    if (!selectedTenant) return;
    const name = sanitizeTenantNameInput(assignName).trim().replace(/\s+/g, " ");
    if (!isValidTenantName(name)) {
      toast.error("Enter a valid tenant name (letters only).");
      return;
    }
    const rentNum = Number(assignRent);
    if (!Number.isFinite(rentNum) || rentNum <= 0) {
      toast.error("Enter a positive monthly rent.");
      return;
    }
    if (!assignMoveIn) {
      toast.error("Select a move-in date.");
      return;
    }
    if (assignHasDeposit) {
      const dep = Number(assignDeposit);
      if (!Number.isFinite(dep) || dep <= 0) {
        toast.error("Enter the deposit amount, or uncheck Record deposit.");
        return;
      }
    }

    assignTenantMutation.mutate(
      {
        tenantId: selectedTenant._id,
        payload: {
          tenantName: [name],
          rent: rentNum,
          dueOn: assignDueOn,
          moveInDate: assignMoveIn,
          depositAmount: assignHasDeposit && Number(assignDeposit) > 0 ? Number(assignDeposit) : 0,
          rentSchedule: buildRentSchedulePayload(assignRentAdjustments),
        },
      },
      {
        onSuccess: (res) => {
          const updated = res?.data || null;
          setAssignOpen(false);
          if (updated) {
            setSelectedTenant(updated);
            setTransactionModalOpen(true);
          } else {
            setSelectedTenant(null);
          }
        },
      }
    );
  };

  const closeEditTenantModal = ({ reopenDetails = true }: { reopenDetails?: boolean } = {}) => {
    setEditTenantOpen(false);
    setEditConfirmationOpen(false);
    setEditTenantNames([]);
    setCurrentEditName("");
    setEditRoom("");
    setEditMoveIn("");
    setEditDueOn(1);
    setEditHasDeposit(false);
    setEditDeposit("");
    setEditRent("");
    setEditRentAdjustments([]);

    if (reopenDetails && selectedTenant) {
      setTransactionModalOpen(true);
    }
  };

  const addEditName = () => {
    const trimmedName = currentEditName.trim().replace(/\s+/g, " ");
    if (!trimmedName) return;
    if (!isValidTenantName(trimmedName)) {
      toast.error("Tenant names can only contain letters, spaces, hyphens, and apostrophes.");
      return;
    }
    setEditTenantNames((prev) => [...prev, trimmedName]);
    setCurrentEditName("");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    const isVacant = selectedTenant.tenancyStatus === "vacant";

    if (!isVacant) {
      if (finalEditNames.length === 0) {
        toast.error("Add at least one tenant name.");
        return;
      }
      if (finalEditNames.some((name) => !isValidTenantName(name))) {
        toast.error("Tenant names can only contain letters, spaces, hyphens, and apostrophes.");
        return;
      }
    }

    if (showRoomEditField(selectedTenant) && !editRoom.trim()) {
      toast.error("Room label is required.");
      return;
    }

    if (!isVacant && editHasDeposit) {
      const dep = Number(editDeposit);
      if (!Number.isFinite(dep) || dep <= 0) {
        toast.error("Enter the deposit amount, or uncheck Record deposit.");
        return;
      }
    }

    if (!isVacant) {
      const rentNum = Number(editRent);
      if (!Number.isFinite(rentNum) || rentNum <= 0) {
        toast.error("Enter a positive monthly rent.");
        return;
      }
      for (const adj of editRentAdjustments) {
        if (!adj.startMonth) {
          toast.error("Each rent change needs a start month.");
          return;
        }
        const amt = Number(adj.amount);
        if (!Number.isFinite(amt) || amt < 0) {
          toast.error("Each rent change needs a valid amount.");
          return;
        }
      }
    }

    setEditConfirmationOpen(true);
  };

  const confirmTenantEdit = () => {
    if (!selectedTenant) return;
    const isVacant = selectedTenant.tenancyStatus === "vacant";
    if (!isVacant && finalEditNames.length === 0) return;

    const payload: {
      tenantName?: string[];
      room?: string;
      moveInDate?: string | null;
      dueOn?: number;
      depositAmount?: number;
      rent?: number;
      rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
    } = {};
    if (!isVacant) payload.tenantName = finalEditNames;
    if (showRoomEditField(selectedTenant)) payload.room = editRoom.trim();
    if (canEditScheduleFields(selectedTenant)) {
      // Always send so backend can rebuild prorated unpaid schedule (stale history from older rules)
      payload.moveInDate = editMoveIn || null;
      payload.dueOn = editDueOn;
    }
    if (!isVacant) {
      const nextDeposit = editHasDeposit && Number(editDeposit) > 0 ? Number(editDeposit) : 0;
      const prevDeposit = Number(selectedTenant.depositAmount) || 0;
      if (nextDeposit !== prevDeposit) {
        payload.depositAmount = nextDeposit;
      }
      const nextRent = Number(editRent);
      const prevRent = Number(selectedTenant.rent) || 0;
      const nextSchedule = buildRentSchedulePayload(editRentAdjustments);
      const prevSchedule = buildRentSchedulePayload(scheduleFromTenant(selectedTenant).adjustments);
      if (Math.abs(nextRent - prevRent) > 0.0001) {
        payload.rent = nextRent;
      }
      if (JSON.stringify(nextSchedule) !== JSON.stringify(prevSchedule)) {
        payload.rentSchedule = nextSchedule;
        if (payload.rent === undefined) payload.rent = nextRent;
      }
    }

    updateTenantMutation.mutate(
      {
        tenantId: selectedTenant._id,
        payload,
      },
      {
        onSuccess: (res) => {
          const updatedTenant = res?.data ?? selectedTenant;
          setSelectedTenant(updatedTenant);
          closeEditTenantModal({ reopenDetails: false });
          setTransactionModalOpen(true);
        },
        onError: () => {
          setEditConfirmationOpen(false);
        },
      }
    );
  };

  const openEndTenancyModal = () => {
    if (!selectedTenant) return;
    setEndTenancyOpen(true);
  };

  const confirmEndTenancy = () => {
    if (!selectedTenant) return;
    endTenancyMutation.mutate(
      { tenantId: selectedTenant._id },
      {
        onSuccess: () => {
          setEndTenancyOpen(false);
          closeTransactionModal();
        },
      }
    );
  };

  const hasRecordedPayment = (entry: any) => {
    const paid = Number(entry?.amountPaid) || 0;
    const method = String(entry?.paymentMethod || "none").toLowerCase();
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    return paid > 0 || method === "bank" || method === "cash" || pieces.length > 0;
  };

  /** Per-payment pieces (full or partial) with their own paidOn dates. */
  const getPaymentPieces = (entry: any) => {
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    return pieces.filter((p: any) => (Number(p?.amount) || 0) > 0);
  };

  const openPaymentReview = async (index: number, entry: any) => {
    if (!selectedTenant || !hasRecordedPayment(entry)) return;
    setPaymentReview({
      index,
      entry,
      loading: true,
      linkedTransactions: [],
      paymentHistory: getPaymentPieces(entry),
      paymentMethod: entry.paymentMethod || "none",
    });
    try {
      const res = await getRentEntryPayment(selectedTenant._id, { index });
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not load payment details");
      setPaymentReview(null);
    }
  };

  const confirmReversePayment = () => {
    if (!selectedTenant || !paymentReview) return;
    unreconcileMutation.mutate(
      {
        tenantId: selectedTenant._id,
        payload: { index: paymentReview.index },
      },
      {
        onSuccess: (res) => {
          const updatedTenant = res?.data?.tenant || null;
          if (updatedTenant) setSelectedTenant(updatedTenant);
          setPaymentReview(null);
        },
      }
    );
  };

  const openReconcilePanel = async () => {
    if (!selectedTenant) return;

    setReconcileOpen(true);
    setReconcileLoading(true);
    setMatchingTxs([]);
    setReconcileSearch("");
    try {
      const res = await getTransactionsMatchingTenant(selectedTenant._id);
      const docs = res?.data?.docs ?? [];
      setMatchingTxs(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not load matching transactions");
      setReconcileOpen(false);
    } finally {
      setReconcileLoading(false);
    }
  };

  const formatMatchReason = (reason: string | null | undefined) => {
    if (!reason) return "Needs review";
    const map: Record<string, string> = {
      amount_exact_and_name: "Name + exact amount",
      amount_exact_total_arrears_and_name: "Name + clears all arrears",
      amount_gte_and_name: "Name + amount covers due",
      amount_partial_and_name: "Name + partial amount",
      name_only: "Name match only",
      ambiguous_name_match: "Ambiguous tenant name",
      amount_exact_no_name: "Exact amount (no name match)",
      amount_exact_total_no_name: "Exact total arrears (no name)",
      amount_equals_rent_no_name: "Equals rent (no name match)",
      amount_gte_no_name: "Amount covers due (no name)",
      amount_gte_rent_no_name: "Amount ≥ rent (no name)",
    };
    return map[reason] || reason.replace(/_/g, " ");
  };

  const confirmBankReconcile = () => {
    if (!selectedTenant || !pendingBankReconcile) return;
    const transactionId = pendingBankReconcile.transaction?.transactionId || pendingBankReconcile.transactionId;
    if (!transactionId) {
      toast.error("Missing transaction id");
      return;
    }

    reconcileMutation.mutate(
      { tenantId: selectedTenant._id, transactionId },
      {
        onSuccess: (res: any) => {
          const updatedTenant = res?.data?.tenant || res?.tenant || null;
          if (updatedTenant) setSelectedTenant(updatedTenant);
          setPendingBankReconcile(null);
          setMatchingTxs((prev) =>
            prev.filter(
              (row) =>
                (row.transaction?.transactionId || row.transactionId) !== transactionId
            )
          );
          qc.invalidateQueries({ queryKey: ["tenants", userId] });
          toast.success("Transaction reconciled");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to reconcile");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">Tenants</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full sm:w-72 md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-800 bg-[#0c0c0c] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
        </div>

        <button
          onClick={() => setNewTenantOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700 bg-transparent px-4 py-2 text-emerald-400 transition hover:bg-emerald-900/5 sm:w-auto md:ml-auto"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span className="text-sm">Add Tenant</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-[#1a1a1a] bg-[#0B0B0B]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
              {(
                [
                  { key: "name" as TenantSortKey, label: "Tenant Name", className: "rounded-tl-2xl" },
                  { key: "property" as TenantSortKey, label: "Property", className: "" },
                  { key: "rent" as TenantSortKey, label: "Rent", className: "" },
                  { key: "status" as TenantSortKey, label: "Status", className: "" },
                  { key: "lastPayment" as TenantSortKey, label: "Last Payment", className: "rounded-tr-2xl" },
                ] as const
              ).map((col) => {
                const active = tenantSortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-xs font-medium whitespace-nowrap md:text-sm ${col.className}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTenantSort(col.key)}
                      className={`inline-flex items-center gap-1.5 transition hover:text-gray-200 ${
                        active ? "text-gray-100" : "text-gray-400"
                      }`}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      {active ? (
                        tenantSortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <span className="inline-flex flex-col leading-none opacity-40">
                          <ArrowUp className="h-2.5 w-2.5" />
                          <ArrowDown className="-mt-0.5 h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Loading tenants...</td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-rose-400">Failed to load tenants.</td>
              </tr>
            )}

            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">No tenants found.</td>
              </tr>
            )}

            {!isLoading && !isError && filtered.map((tenant: any) => (
              <tr
                key={tenant._id}
                onClick={() => openTenantDetails(tenant)}
                className="cursor-pointer border-t border-[#151515] transition hover:bg-[#0e0e0e]"
              >
                <td className="px-6 py-4 text-sm text-gray-300">{getTenantDisplayName(tenant)}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{getPropertyDisplay(tenant)}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{typeof tenant.rent === "number" ? formatMoney(tenant.rent) : tenant.rent}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${statusColors[getStatusColorKey(tenant) as keyof typeof statusColors] || "bg-gray-800 text-gray-400"}`}>
                    {getStatusLabel(tenant)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{formatDate(tenant.lastPayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactionModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center md:p-6">
          <div style={{
          scrollbarWidth: 'none',
          }} className="my-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedTenant.tenancyStatus === "vacant"
                    ? `${selectedTenant.room || "Room"} — Vacant`
                    : `${getTenantDisplayName(selectedTenant)} — Transaction History`}
                </h3>
                <p className="text-sm text-gray-400">
                  {getPropertyDisplay(selectedTenant)}
                  {selectedTenant.tenancyStatus !== "vacant" && selectedTenant.moveInDate
                    ? ` · Moved in ${formatDate(selectedTenant.moveInDate)}`
                    : ""}
                </p>
              </div>
              <button onClick={closeTransactionModal} className="shrink-0 text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedTenant.tenancyStatus === "vacant" ? (
              <div className="mb-4 rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-4 text-sm text-amber-100/90">
                This room is vacant — no rent schedule yet. Assign a tenant when someone moves in.
                {Number(selectedTenant.rent) > 0 && (
                  <p className="mt-2 text-amber-200/80">
                    Expected rent: {formatMoney(Number(selectedTenant.rent))}
                  </p>
                )}
              </div>
            ) : (
              <>
            {(() => {
              const balance = getBalanceSummary(selectedTenant);
              return (
                <div className={`mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${balance.className}`}>
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-70">Current balance</p>
                    <p className="text-sm font-medium">{balance.label}</p>
                  </div>
                  <p className="text-lg font-semibold">{balance.amount}</p>
                </div>
              );
            })()}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                <p>
                  Monthly rent{" "}
                  <span className="font-medium text-gray-200">
                    {formatMoney(Number(selectedTenant.rent) || 0)}
                  </span>
                </p>
                {Number(selectedTenant.depositAmount) > 0 && (
                  <p>
                    Deposit held{" "}
                    <span className="font-medium text-gray-200">
                      {formatMoney(Number(selectedTenant.depositAmount))}
                    </span>
                  </p>
                )}
              </div>
              {getRemainingAmount(selectedTenant) > 0 && (
                <button
                  type="button"
                  onClick={openReconcilePanel}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-800 px-4 py-2 text-sm text-sky-300 hover:bg-sky-950/40"
                >
                  <Link2 className="h-4 w-4" />
                  Reconcile
                </button>
              )}
            </div>

            {Array.isArray(selectedTenant.linkedPayers) && selectedTenant.linkedPayers.length > 0 && (
              <div className="mb-4 rounded-xl border border-[#1a1a1a] bg-[#0B0B0B] px-4 py-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Linked bank payers</p>
                <p className="mb-3 text-xs text-gray-500">
                  Future payments from these bank identities auto-reconcile with this tenant. Unlink to stop that.
                </p>
                <div className="space-y-2">
                  {selectedTenant.linkedPayers.map((payer: any) => {
                    const payerId = String(payer._id || payer.id || "");
                    const label =
                      payer.displayName ||
                      payer.normalizedName ||
                      payer.iban ||
                      (payer.bacsAccount
                        ? `BACS ${payer.bacsAccount}${payer.bacsSortCode ? ` / ${payer.bacsSortCode}` : ""}`
                        : "Linked payer");
                    const metaParts = [
                      payer.counterpartyEntityId ? `ID ${String(payer.counterpartyEntityId).slice(0, 10)}…` : null,
                      payer.iban ? `IBAN ${payer.iban}` : null,
                      payer.bacsAccount
                        ? `Acc ${payer.bacsAccount}${payer.bacsSortCode ? ` · ${payer.bacsSortCode}` : ""}`
                        : null,
                      payer.lastSeenAt ? `Seen ${formatDate(payer.lastSeenAt)}` : null,
                    ].filter(Boolean);
                    return (
                      <div
                        key={payerId || label}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-gray-200" title={label}>
                            {label}
                          </p>
                          {metaParts.length > 0 && (
                            <p className="truncate text-[11px] text-gray-500">{metaParts.join(" · ")}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!payerId || unlinkPayerMutation.isPending}
                          onClick={() => {
                            if (!payerId || !selectedTenant?._id) return;
                            unlinkPayerMutation.mutate(
                              { tenantId: selectedTenant._id, payerId },
                              {
                                onSuccess: (res) => {
                                  const updated = res?.data;
                                  if (updated) setSelectedTenant(updated);
                                  else {
                                    setSelectedTenant((prev: any) =>
                                      prev
                                        ? {
                                            ...prev,
                                            linkedPayers: (prev.linkedPayers || []).filter(
                                              (p: any) => String(p._id || p.id) !== payerId
                                            ),
                                          }
                                        : prev
                                    );
                                  }
                                },
                              }
                            );
                          }}
                          className="shrink-0 rounded-full border border-rose-800/70 px-3 py-1 text-xs text-rose-300 hover:bg-rose-950/40 disabled:opacity-50"
                        >
                          Unlink
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              </>
            )}

            <div className="w-full overflow-x-auto rounded-lg border border-[#1a1a1a] bg-[#0B0B0B]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
                    <th className="px-4 py-3 text-xs">Amount Due</th>
                    <th className="px-4 py-3 text-xs">Amount Paid</th>
                    <th className="px-4 py-3 text-xs">Payment history</th>
                    <th className="px-4 py-3 text-xs">Due Date</th>
                    <th className="px-4 py-3 text-xs">Status</th>
                    <th className="px-4 py-3 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (detailLoading) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            Loading rent history…
                          </td>
                        </tr>
                      );
                    }

                    const visibleHistory = (selectedTenant.rentHistory || [])
                      .map((entry: any, index: number) => ({ entry, index }))
                      .filter(({ entry }: { entry: any }) => {
                        const due = Number(entry?.amountDue) || 0;
                        const paid = Number(entry?.amountPaid) || 0;
                        // Hide empty prorated rows (e.g. move-in on due day → £0 due)
                        if (due === 0 && paid === 0) return false;
                        return true;
                      });

                    if (!visibleHistory.length) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No rent history found for this tenant.
                          </td>
                        </tr>
                      );
                    }

                    return visibleHistory.map(({ entry, index }: { entry: any; index: number }) => {
                      const remaining =
                        (Number(entry.amountDue) || 0) - (Number(entry.amountPaid) || 0);
                      const recorded = hasRecordedPayment(entry);
                      return (
                      <tr
                        key={entry._id || index}
                        className={`border-t border-[#151515] hover:bg-[#0e0e0e] ${recorded ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (recorded) openPaymentReview(index, entry);
                        }}
                      >
                        <td className="px-4 py-3 text-gray-300">{formatMoney(Number(entry.amountDue) || 0)}</td>
                        <td className={`px-4 py-3 ${remaining > 0 ? "text-rose-400" : "text-gray-300"}`}>
                          {formatMoney(Number(entry.amountPaid) || 0)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {(() => {
                            const pieces = getPaymentPieces(entry);
                            if (pieces.length === 0) {
                              return (
                                <span className="text-sm text-gray-500">
                                  {entry.paidOn ? formatDate(entry.paidOn) : "—"}
                                </span>
                              );
                            }
                            return (
                              <ul className="min-w-[8.5rem] space-y-1.5">
                                {pieces.map((p: any, pi: number) => (
                                  <li
                                    key={pi}
                                    className="flex items-baseline justify-between gap-3 text-sm"
                                  >
                                    <span className="shrink-0 text-gray-200">
                                      {formatDate(p.paidOn)}
                                    </span>
                                    <span className="tabular-nums text-gray-400">
                                      {formatMoney(Number(p.amount) || 0)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(entry.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs ${statusColors[(entry.status || "").charAt(0).toUpperCase() + (entry.status || "").slice(1) as keyof typeof statusColors] || "bg-gray-800 text-gray-400"}`}>
                            {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {remaining > 0 ? (
                            <div className="flex flex-col items-start gap-1">
                              {entry.paymentMethod && entry.paymentMethod !== "none" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPaymentReview(index, entry);
                                  }}
                                  className="text-xs text-sky-400 underline-offset-2 hover:underline"
                                >
                                  {entry.paymentMethod} · view
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rem = Math.max(
                                    0,
                                    (Number(entry.amountDue) || 0) - (Number(entry.amountPaid) || 0)
                                  );
                                  setPendingCash({
                                    index,
                                    entry,
                                    cashAmount: String(rem),
                                  });
                                }}
                                className="flex items-center gap-2 rounded-full border border-amber-700 px-3 py-1 text-xs text-amber-400 hover:bg-amber-900/5"
                              >
                                <DollarSign className="h-4 w-4" />
                                Pay By Cash
                              </button>
                            </div>
                          ) : recorded && entry.paymentMethod && entry.paymentMethod !== "none" ? (
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
                      </tr>
                      );
                    });
                  })()}
                </tbody>
           
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {selectedTenant.tenancyStatus === "vacant" ? (
                  <>
                    <button
                      onClick={openAssignModal}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
                    >
                      <Plus className="h-4 w-4" />
                      Assign tenant
                    </button>
                    <button
                      onClick={openEditTenantModal}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit room
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openEditTenantModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit tenant
                  </button>
                )}
                <button
                  onClick={openEndTenancyModal}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-800 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                  {selectedTenant.tenancyStatus === "vacant" ? "Remove room" : "Remove tenant"}
                </button>
              </div>

              <div className="flex justify-end">
                <button onClick={closeTransactionModal} className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reconcileOpen && selectedTenant && (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-black/60 p-4 md:items-center md:p-6">
          <div
            style={{ scrollbarWidth: "none" }}
            className="my-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  {getTenantDisplayName(selectedTenant)} — Reconcile
                </h3>
                <p className="text-sm text-gray-400">
                  {getPropertyDisplay(selectedTenant)} · name matches (incl. ambiguous) first, then amount-only
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReconcileOpen(false);
                  setReconcileSearch("");
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={reconcileSearch}
                  onChange={(e) => setReconcileSearch(e.target.value)}
                  placeholder="Search payer, description, amount..."
                  className="w-full rounded-lg border border-gray-800 bg-[#0c0c0c] py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-lg border border-[#1a1a1a] bg-[#0B0B0B]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
                    <th className="px-4 py-3 text-xs">Date</th>
                    <th className="px-4 py-3 text-xs">Payer</th>
                    <th className="px-4 py-3 text-xs">Amount</th>
                    <th className="px-4 py-3 text-xs">Match</th>
                    <th className="px-4 py-3 text-right text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reconcileLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Loading matching transactions…
                      </td>
                    </tr>
                  ) : (() => {
                    const q = reconcileSearch.trim().toLowerCase();
                    const filteredRows = !q
                      ? matchingTxs
                      : matchingTxs.filter((row) => {
                          const tx = row.transaction || row;
                          const payer = String(tx.payerName || "").toLowerCase();
                          const desc = String(tx.description || tx.reference || "").toLowerCase();
                          const amount = String(tx.amount ?? "");
                          const reason = String(row.matchReason || "").toLowerCase();
                          const reasonLabel = formatMatchReason(row.matchReason).toLowerCase();
                          return (
                            payer.includes(q) ||
                            desc.includes(q) ||
                            amount.includes(q) ||
                            reason.includes(q) ||
                            reasonLabel.includes(q)
                          );
                        });

                    if (matchingTxs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No suggested bank transactions for this tenant.
                          </td>
                        </tr>
                      );
                    }

                    if (filteredRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400">
                            No transactions match your search.
                          </td>
                        </tr>
                      );
                    }

                    return filteredRows.map((row) => {
                      const tx = row.transaction || row;
                      const isMatched = row.matchStatus === "matched";
                      const matchLabel = isMatched ? "Matched" : "Needs Review";
                      const matchColors: Record<string, string> = {
                        Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
                        "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
                      };
                      return (
                        <tr key={tx._id || tx.transactionId} className="border-t border-[#151515] hover:bg-[#0e0e0e]">
                          <td className="px-4 py-3 text-gray-300">{formatDate(tx.date)}</td>
                          <td className="px-4 py-3 text-gray-300">
                            <div className="max-w-[220px] truncate" title={tx.payerName || tx.description || ""}>
                              {tx.payerName || tx.description || "—"}
                            </div>
                            {row.nameMatch ? (
                              <div className="mt-0.5 text-[10px] text-sky-400/80">Name match</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{formatMoney(Number(tx.amount) || 0)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${matchColors[matchLabel]}`}>
                                {matchLabel}
                              </span>
                              <div className="group relative inline-block">
                                <Info className="h-3 w-3 text-gray-400 group-hover:text-gray-200" />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 whitespace-normal rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                  {formatMatchReason(row.matchReason)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 text-[10px] text-gray-500">
                              {formatMatchReason(row.matchReason)}
                              {row.nameMatch ? " · name" : ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setPendingBankReconcile(row)}
                              disabled={reconcileMutation.isPending}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-transparent px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-900/5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" />
                              <span>Accept</span>
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setReconcileOpen(false);
                  setReconcileSearch("");
                }}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingBankReconcile && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm reconciliation</h3>
            <p className="mb-3 text-sm text-gray-400">
              Apply{" "}
              <span className="text-gray-200">
                {formatMoney(Number(pendingBankReconcile.transaction?.amount ?? pendingBankReconcile.amount) || 0)}
              </span>{" "}
              from{" "}
              <span className="text-gray-200">
                {pendingBankReconcile.transaction?.payerName ||
                  pendingBankReconcile.payerName ||
                  pendingBankReconcile.transaction?.description ||
                  "this transaction"}
              </span>{" "}
              to <span className="text-gray-200">{getTenantDisplayName(selectedTenant)}</span>?
            </p>
            <p className="mb-4 text-xs text-gray-500">
              {formatMatchReason(pendingBankReconcile.matchReason)}. Clears oldest unpaid / partial months first;
              leftover rolls to the next month.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingBankReconcile(null)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                disabled={reconcileMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBankReconcile}
                disabled={reconcileMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/40 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/60 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                {reconcileMutation.isPending ? "Applying..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentReview && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div
            style={{ scrollbarWidth: "none" }}
            className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Payment details</h3>
                <p className="text-sm text-gray-400">
                  {formatDate(paymentReview.entry?.month)} · {String(paymentReview.paymentMethod || "none")}
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

            <div className="mb-4 space-y-2 rounded-lg border border-[#111] bg-[#050505] p-3 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Amount due</span>
                <span>{formatMoney(Number(paymentReview.entry?.amountDue) || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Amount paid</span>
                <span>{formatMoney(Number(paymentReview.entry?.amountPaid) || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Latest paid on</span>
                <span>{formatDate(paymentReview.entry?.paidOn)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Method</span>
                <span className="capitalize">{paymentReview.paymentMethod || "—"}</span>
              </div>
            </div>

            {paymentReview.loading ? (
              <p className="mb-4 text-sm text-gray-500">Loading linked bank transaction…</p>
            ) : paymentReview.paymentMethod === "bank" ||
              (paymentReview.linkedTransactions?.length ?? 0) > 0 ? (
              <div className="mb-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                  Linked bank transaction
                  {paymentReview.linkedTransactions.length > 1 ? "s" : ""}
                </p>
                {paymentReview.linkedTransactions.length === 0 ? (
                  <p className="rounded-lg border border-[#1a1a1a] px-3 py-3 text-sm text-gray-500">
                    No linked bank transaction found for this month (it may have been cleared already).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paymentReview.linkedTransactions.map((tx: any) => {
                      const bankAmount = Math.abs(Number(tx.bankAmount ?? tx.amount) || 0);
                      const allocated =
                        tx.allocatedAmount != null && Number.isFinite(Number(tx.allocatedAmount))
                          ? Number(tx.allocatedAmount)
                          : null;
                      return (
                        <div
                          key={tx._id || tx.transactionId}
                          className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-3 text-sm"
                        >
                          <div className="flex justify-between gap-3 text-gray-200">
                            <span className="font-medium">
                              {tx.payerName || tx.description || "Bank payment"}
                            </span>
                            <span>{formatMoney(allocated != null ? allocated : bankAmount)}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDate(tx.date)}
                            {allocated != null && allocated < bankAmount - 0.001
                              ? ` · applied to this month of ${formatMoney(bankAmount)} bank payment`
                              : bankAmount
                                ? ` · bank ${formatMoney(bankAmount)}`
                                : ""}
                            {tx.description ? ` · ${tx.description}` : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-gray-500">
                  Each payment piece keeps its own bank date. Leftover from a payment rolls to the next unpaid month
                  (oldest first) — only the amount used for this month is shown above.
                </p>
              </div>
            ) : (
              <p className="mb-4 text-sm text-gray-400">
                This month includes <strong className="text-gray-200">cash</strong> payment(s). Reversing clears this
                month so you can re-enter cash or leave it for bank match.
              </p>
            )}

            <p className="mb-4 text-xs text-gray-500">
              Reverse undoes this month&apos;s bank payment(s). Linked bank transactions are fully released back to
              the Transactions list (including any split used on other months), and the balance is recalculated.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentReview(null)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                disabled={unreconcileMutation.isPending}
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmReversePayment}
                disabled={unreconcileMutation.isPending}
                className="rounded-full border border-rose-700 bg-rose-900/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-900/60 disabled:opacity-60"
              >
                {unreconcileMutation.isPending ? "Reversing..." : "Reverse payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingCash && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm Cash Payment</h3>
            <p className="mb-4 text-sm text-gray-400">
              Enter how much was paid in <strong>cash</strong> (full remaining or a partial amount).
            </p>

            <div className="mb-4 rounded-lg border border-[#111] bg-[#050505] p-3">
              <div className="flex justify-between text-sm text-gray-300">
                <div>Month</div>
                <div>{formatDate(pendingCash.entry.month)}</div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <div>Amount Due</div>
                <div>{formatMoney(Number(pendingCash.entry.amountDue) || 0)}</div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <div>Already Paid</div>
                <div>{formatMoney(Number(pendingCash.entry.amountPaid) || 0)}</div>
              </div>
              <div className="mt-1 flex justify-between border-t border-[#1a1a1a] pt-2 text-sm font-medium text-amber-300">
                <div>Remaining to pay</div>
                <div>
                  {formatMoney(
                    Math.max(
                      0,
                      (Number(pendingCash.entry.amountDue) || 0) - (Number(pendingCash.entry.amountPaid) || 0)
                    )
                  )}
                </div>
              </div>
            </div>

            <label className="mb-1 block text-sm text-gray-300">Cash amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={pendingCash.cashAmount}
              onChange={(e) =>
                setPendingCash((prev) => (prev ? { ...prev, cashAmount: e.target.value } : prev))
              }
              className="mb-4 w-full rounded-lg border border-gray-800 bg-[#050505] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-700"
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setPendingCash(null)} className="rounded-full border px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  const remaining = Math.max(
                    0,
                    (Number(pendingCash.entry.amountDue) || 0) - (Number(pendingCash.entry.amountPaid) || 0)
                  );
                  const amount = Number(pendingCash.cashAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    toast.error("Enter a valid cash amount");
                    return;
                  }
                  if (amount > remaining + 0.001) {
                    toast.error("Amount cannot exceed remaining due");
                    return;
                  }

                  const payload: any = { index: pendingCash.index, amount };
                  if (pendingCash.entry.month) {
                    payload.month = new Date(pendingCash.entry.month).toISOString();
                  }

                  payByCashMutation.mutate(
                    { tenantId: selectedTenant._id, payload },
                    {
                      onSuccess: (res) => {
                        setPendingCash(null);
                        const updatedTenant = res?.data?.tenant || res?.tenant || null;
                        if (updatedTenant) setSelectedTenant(updatedTenant);
                      },
                    }
                  );
                }}
                className="rounded-full bg-amber-600 px-4 py-2 text-sm text-black hover:brightness-105"
              >
                Confirm Cash
              </button>
            </div>
          </div>
        </div>
      )}

      {endTenancyOpen && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">
              {selectedTenant.tenancyStatus === "vacant" ? "Remove vacant room?" : "Remove tenant?"}
            </h3>
            <p className="mb-3 text-sm text-gray-400">
              <span className="text-gray-200">{getTenantDisplayName(selectedTenant)}</span> will be removed from your
              active tenants list for <span className="text-gray-200">{getPropertyDisplay(selectedTenant)}</span>.
            </p>
            <p className="mb-5 text-sm text-gray-500">
              {selectedTenant.tenancyStatus === "vacant"
                ? "This vacant placeholder will be closed."
                : "Payment and occupancy history are kept so you can later see who lived at this property."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEndTenancyOpen(false)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                disabled={endTenancyMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEndTenancy}
                disabled={endTenancyMutation.isPending}
                className="rounded-full border border-rose-700 bg-rose-900/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-900/60 disabled:opacity-60"
              >
                {endTenancyMutation.isPending ? "Removing..." : "Remove tenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && selectedTenant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assign tenant</h3>
                <p className="text-sm text-gray-400">{getPropertyDisplay(selectedTenant)}</p>
              </div>
              <button onClick={() => closeAssignModal()} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-gray-200">Tenant name</label>
                <input
                  value={assignName}
                  onChange={(e) => setAssignName(sanitizeTenantNameInput(e.target.value))}
                  placeholder="e.g. John Smith"
                  className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-200">Monthly rent (£)</label>
                <input
                  value={assignRent}
                  onChange={(e) => setAssignRent(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="e.g. 650"
                  className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-200">Move-in date</label>
                <input
                  type="date"
                  value={assignMoveIn}
                  onChange={(e) => {
                    const moveIn = e.target.value;
                    setAssignMoveIn(moveIn);
                    if (moveIn && /^\d{4}-\d{2}-\d{2}$/.test(moveIn)) {
                      const [y, m] = moveIn.split("-").map(Number);
                      const maxDay = new Date(y, m, 0).getDate();
                      setAssignDueOn((d) => Math.min(d, maxDay));
                    }
                  }}
                  className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-200">Due day</label>
                <select
                  value={assignDueOn}
                  onChange={(e) => setAssignDueOn(Number(e.target.value) || 1)}
                  className="w-full rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-gray-100 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700"
                >
                  {(() => {
                    let max = 31;
                    if (assignMoveIn && /^\d{4}-\d{2}-\d{2}$/.test(assignMoveIn)) {
                      const [y, m] = assignMoveIn.split("-").map(Number);
                      max = new Date(y, m, 0).getDate();
                    }
                    return Array.from({ length: max }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day} className="bg-[#111] text-gray-100">
                        {day}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <RentScheduleFields
                baseRent={assignRent}
                onBaseRentChange={setAssignRent}
                adjustments={assignRentAdjustments}
                onAdjustmentsChange={setAssignRentAdjustments}
                hideBaseRent
              />
            </div>

            <div className="mt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={assignHasDeposit}
                  onChange={(e) => {
                    setAssignHasDeposit(e.target.checked);
                    if (!e.target.checked) setAssignDeposit("");
                  }}
                  className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                />
                Record deposit
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Optional — saved for records only. Does not affect rent or balance.
              </p>
              {assignHasDeposit && (
                <div className="mt-2">
                  <label className="mb-1 block text-sm text-gray-200">Deposit amount (£)</label>
                  <input
                    value={assignDeposit}
                    onChange={(e) => setAssignDeposit(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 780"
                    className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => closeAssignModal()}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAssignTenant}
                disabled={assignTenantMutation.isPending}
                className="rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510] disabled:opacity-50"
              >
                {assignTenantMutation.isPending ? "Assigning..." : "Assign tenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTenantOpen && selectedTenant && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedTenant.tenancyStatus === "vacant" ? "Edit room" : "Edit tenant"}
                </h3>
                <p className="text-sm text-gray-400">{getPropertyDisplay(selectedTenant)}</p>
              </div>
              <button onClick={() => closeEditTenantModal()} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <label className="mb-1 block text-sm text-gray-200">Tenant name(s)</label>
                  <div className="mb-2 flex gap-2">
                    <input
                      value={currentEditName}
                      onChange={(e) => setCurrentEditName(sanitizeTenantNameInput(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEditName();
                        }
                      }}
                      className="flex-1 rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      placeholder="Type a name and press Enter or click Add"
                    />
                    <button
                      type="button"
                      onClick={addEditName}
                      className="rounded-full border border-emerald-700 px-3 py-2 text-sm text-emerald-300 hover:bg-[#0b1510]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editTenantNames.map((name, index) => (
                      <div key={`${name}-${index}`} className="flex items-center gap-2 rounded-full border border-[#222] bg-[#0b0b0b] px-3 py-1 text-sm">
                        <span className="text-gray-200">{name}</span>
                        <button
                          type="button"
                          onClick={() => setEditTenantNames((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-gray-400 hover:text-white"
                          aria-label={`Remove ${name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {editTenantNames.length === 0 && !currentEditName.trim() && (
                    <p className="mt-2 text-xs text-amber-400">Add at least one tenant name before saving.</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Letters only — numbers and special characters are not allowed.</p>
                </div>
              )}

              {showRoomEditField(selectedTenant) && (
                <div>
                  <label className="mb-1 block text-sm text-gray-200">Room</label>
                  <input
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    placeholder="e.g. Room 3"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must be unique on this property among active and vacant units.</p>
                </div>
              )}

              {selectedTenant.tenancyStatus !== "vacant" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-200">Move-in date</label>
                    <input
                      type="date"
                      value={editMoveIn}
                      onChange={(e) => {
                        const next = e.target.value;
                        setEditMoveIn(next);
                        if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) {
                          const [y, m] = next.split("-").map(Number);
                          const maxDay = new Date(y, m, 0).getDate();
                          setEditDueOn((d) => Math.min(d, maxDay));
                        }
                      }}
                      disabled={!canEditScheduleFields(selectedTenant)}
                      className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-200">Due day</label>
                    <select
                      value={editDueOn}
                      onChange={(e) => setEditDueOn(Number(e.target.value) || 1)}
                      disabled={!canEditScheduleFields(selectedTenant)}
                      className="w-full rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-gray-100 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {(() => {
                        let max = 31;
                        if (editMoveIn && /^\d{4}-\d{2}-\d{2}$/.test(editMoveIn)) {
                          const [y, m] = editMoveIn.split("-").map(Number);
                          max = new Date(y, m, 0).getDate();
                        }
                        return Array.from({ length: max }, (_, i) => i + 1).map((day) => (
                          <option key={day} value={day} className="bg-[#111] text-gray-100">
                            {day}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                  {!canEditScheduleFields(selectedTenant) ? (
                    <p className="text-xs text-amber-400 sm:col-span-2">
                      Move-in and due day are locked after payments are recorded.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 sm:col-span-2">
                      Changing either rebuilds the unpaid rent schedule (including first-month pro-rata).
                    </p>
                  )}
                </div>
              )}

              {selectedTenant.tenancyStatus !== "vacant" && (
                <RentScheduleFields
                  baseRent={editRent}
                  onBaseRentChange={setEditRent}
                  adjustments={editRentAdjustments}
                  onAdjustmentsChange={setEditRentAdjustments}
                />
              )}

              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={editHasDeposit}
                      onChange={(e) => {
                        setEditHasDeposit(e.target.checked);
                        if (!e.target.checked) setEditDeposit("");
                      }}
                      className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                    />
                    Record deposit
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional — records only; does not change rent due or balance.
                  </p>
                  {editHasDeposit && (
                    <div className="mt-2">
                      <label className="mb-1 block text-sm text-gray-200">Deposit amount (£)</label>
                      <input
                        value={editDeposit}
                        onChange={(e) => setEditDeposit(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="e.g. 780"
                        className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => closeEditTenantModal()}
                  className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    selectedTenant.tenancyStatus !== "vacant"
                      ? finalEditNames.length === 0
                      : !editRoom.trim()
                  }
                  className="rounded-full border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editConfirmationOpen && selectedTenant && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Confirm tenant update</h3>
            <p className="mb-4 text-sm text-gray-400">
              Save these changes for <span className="text-white">{getPropertyDisplay(selectedTenant)}</span>?
            </p>

            <div className="mb-4 space-y-3 rounded-lg border border-[#111] bg-[#050505] p-3">
              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Updated names</p>
                  <div className="flex flex-wrap gap-2">
                    {finalEditNames.map((name) => (
                      <span key={name} className="rounded-full border border-[#222] bg-[#0b0b0b] px-3 py-1 text-sm text-gray-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {showRoomEditField(selectedTenant) && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Room</p>
                  <p className="text-sm text-gray-200">{editRoom.trim()}</p>
                </div>
              )}
              {canEditScheduleFields(selectedTenant) && (
                <>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Move-in</p>
                    <p className="text-sm text-gray-200">{editMoveIn || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Due day</p>
                    <p className="text-sm text-gray-200">{editDueOn}</p>
                  </div>
                </>
              )}
              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Monthly rent</p>
                  <p className="text-sm text-gray-200">
                    £{Number(editRent || 0).toFixed(2)}
                    {editRentAdjustments.length > 0
                      ? ` · ${editRentAdjustments.length} change${editRentAdjustments.length === 1 ? "" : "s"}`
                      : ""}
                  </p>
                  {editRentAdjustments.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                      {editRentAdjustments.map((a) => (
                        <li key={a.id}>
                          From {a.startMonth}: £{Number(a.amount || 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Deposit</p>
                  <p className="text-sm text-gray-200">
                    {editHasDeposit && Number(editDeposit) > 0
                      ? `£${Number(editDeposit).toFixed(2)}`
                      : "None"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditConfirmationOpen(false)}
                className="rounded-full border px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Back
              </button>
              <button
                type="button"
                onClick={confirmTenantEdit}
                disabled={updateTenantMutation.isPending}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updateTenantMutation.isPending ? "Saving..." : "Confirm edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewTenantModal open={newTenantOpen} onClose={() => setNewTenantOpen(false)} />
    </div>
  );
}
