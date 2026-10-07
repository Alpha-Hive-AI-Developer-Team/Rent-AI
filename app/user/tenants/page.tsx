"use client";

import { Search, Plus, X, DollarSign, Pencil, Trash2, Link2, Check, Info, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Archive, ArchiveRestore } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import NewTenantModal from "@/components/user/new-tenant-modal";
import RentScheduleFields, {
  buildRentSchedulePayload,
  scheduleFromTenant,
  type RentAdjustmentRow,
} from "@/components/user/rent-schedule-fields";
import usePayByCash, {
  useAddTenantAdjustment,
  useUpdateTenantLineItem,
  useRemoveTenantLineItem,
  useAssignTenant,
  useEndTenancy,
  useArchiveTenant,
  useUnarchiveTenant,
  useTenants,
  useUnlinkLinkedPayer,
  useUnreconcileRent,
  useUpdateTenant,
} from "@/hooks/usetenants";
import { getRentEntryPayment, getTenantById } from "@/lib/api/tenantsApi";
import { autoMatchTransactionsForTenant, getTransactionsMatchingTenant } from "@/lib/api/transactionApi";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/redux/useAuthUser";
import { formatDate, formatDateTime } from "@/lib/utils";
import DateInput from "@/components/ui/date-input";

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

  const formatMoney = (value: number) =>
    `£${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const toUtcDayMs = (value: any) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };

  /** Classic balance: sum(paid - due) over all months. Positive = credit. */
  const getFacingBalanceFromHistory = (tenant: any) => {
    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    if (history.length === 0) return Number(tenant?.currentBalance) || 0;

    let balance = 0;
    for (const entry of history) {
      const due = Number(entry?.amountDue) || 0;
      const paid = Number(entry?.amountPaid) || 0;
      balance += paid - due;
    }

    return Math.round(balance * 100) / 100;
  };

  /**
   * Banner balance:
   * - Underpaid = remaining on months due through today
   * - In credit = overpay on those months + prepaid already on future months
   *   (future rows are hidden; prepaid surplus shows as green credit)
   * - Settled = 0
   * Also respect tenant.currentBalance when it includes unallocated bank leftovers.
   */
  const getLandlordDisplayBalance = (tenant: any) => {
    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    if (history.length === 0) return Number(tenant?.currentBalance) || 0;

    const now = new Date();
    const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    let dueUnpaid = 0;
    let dueThroughToday = 0;
    let paidVisible = 0;
    let futurePrepaid = 0;

    history.forEach((entry: any) => {
      const due = Number(entry?.amountDue) || 0;
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
    if (dueUnpaid > 0) return -dueUnpaid;

    paidVisible = Math.round(paidVisible * 100) / 100;
    futurePrepaid = Math.round(futurePrepaid * 100) / 100;
    const historyCredit =
      Math.round((paidVisible - dueThroughToday + futurePrepaid) * 100) / 100;

    // Backend currentBalance may include unallocated reconciled bank leftovers
    // (money paid but not yet attached because the next due row did not exist yet).
    const stored = Number(tenant?.currentBalance);
    if (Number.isFinite(stored) && stored > historyCredit + 0.001) {
      return Math.round(stored * 100) / 100;
    }

    return historyCredit > 0 ? historyCredit : 0;
  };

  const getBalanceSummary = (tenant: any) => {
    if (tenant?.tenancyStatus === "vacant") {
      return {
        label: "Vacant",
        amount: formatMoney(0),
        className: "border-amber-800/60 bg-amber-950/30 text-amber-300",
      };
    }
    const balance = getLandlordDisplayBalance(tenant);

    if (balance > 0) {
      return {
        label: "In credit",
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

  /** Remaining unpaid on months due today or earlier (future dues excluded from “owes now”). */
  const getRemainingAmount = (tenant: any) => {
    if (tenant?.tenancyStatus === "vacant") return 0;
    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    if (history.length > 0) {
      const now = new Date();
      const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      return history.reduce((sum: number, entry: any) => {
        const due = Number(entry?.amountDue) || 0;
        const paid = Number(entry?.amountPaid) || 0;
        const rem = Math.max(0, due - paid);
        if (rem <= 0) return sum;
        const dueMs = toUtcDayMs(entry?.dueDate ?? entry?.month);
        if (dueMs != null && dueMs > todayMs) return sum;
        return sum + rem;
      }, 0);
    }

    if (typeof tenant?.currentBalance === "number" && tenant.currentBalance < 0) {
      return Math.abs(tenant.currentBalance);
    }

    return 0;
  };

  /** Deposit still available to peel from a combined payment (mirrors auto-reconcile). */
  const getUnallocatedDepositAmount = (tenant: any) => {
    const depositAmt = Math.round((Number(tenant?.depositAmount) || 0) * 100) / 100;
    if (depositAmt <= 0) return 0;
    if (tenant?.depositTransactionId) return 0;
    const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
    for (const h of history) {
      for (const p of Array.isArray(h?.linkedPayments) ? h.linkedPayments : []) {
        if ((Number(p?.depositAllocated) || 0) > 0.001) return 0;
      }
    }
    return depositAmt;
  };

  /**
   * Derive display status from rentHistory (detail) or status/currentBalance (list DTO):
   * - Vacant when room has no occupant
   * - Paid when nothing is owed
   * - Unpaid / Partial only when at least one month still has remaining due
   */
  const getEffectiveStatus = (
    tenant: any
  ): { key: "Paid" | "Unpaid" | "Partial" | "Vacant" | "Archived"; label: string } => {
    if (tenant?.tenancyStatus === "vacant") {
      return { key: "Vacant", label: "Vacant" };
    }
    if (tenant?.archived) {
      return { key: "Archived", label: "Archived" };
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
    paymentMethod: "cash" | "bank";
  } | null>(null);
  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [editTenantNames, setEditTenantNames] = useState<string[]>([]);
  const [currentEditName, setCurrentEditName] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editMoveIn, setEditMoveIn] = useState("");
  const [editDueOn, setEditDueOn] = useState(1);
  const [editHasDeposit, setEditHasDeposit] = useState(false);
  const [editDeposit, setEditDeposit] = useState("");
  const [editDepositPaid, setEditDepositPaid] = useState("");
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
  const [reconcileSearchQuery, setReconcileSearchQuery] = useState("");
  const [reconcilePage, setReconcilePage] = useState(1);
  const [reconcileTotal, setReconcileTotal] = useState(0);
  const [reconcileTotalPages, setReconcileTotalPages] = useState(1);
  const reconcilePageSize = 20;
  const [pendingBankReconcile, setPendingBankReconcile] = useState<any | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignName, setAssignName] = useState("");
  const [assignRent, setAssignRent] = useState("");
  const [assignDueOn, setAssignDueOn] = useState(1);
  const [assignMoveIn, setAssignMoveIn] = useState("");
  const [assignHasDeposit, setAssignHasDeposit] = useState(false);
  const [assignDeposit, setAssignDeposit] = useState("");
  const [assignDepositPaid, setAssignDepositPaid] = useState("");
  const [assignRentAdjustments, setAssignRentAdjustments] = useState<RentAdjustmentRow[]>([]);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"charge" | "discount" | "refund">("charge");
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState("");
  const [adjustmentDescription, setAdjustmentDescription] = useState("");
  const [adjustmentMonthLink, setAdjustmentMonthLink] = useState("");
  /** When set, modal edits an existing folded line item instead of adding. */
  const [editingLineItem, setEditingLineItem] = useState<null | {
    rentEntryId: string;
    lineItemId: string;
    type: "charge" | "discount" | "refund";
    monthLabel: string;
  }>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [removeLineItemConfirm, setRemoveLineItemConfirm] = useState<null | {
    rentEntryId: string;
    lineItemId: string;
    itemType: string;
    label?: string;
  }>(null);

  const { data, isLoading, isError } = useTenants({
    archived: showArchived ? "only" : "exclude",
  });
  const payByCashMutation = usePayByCash();
  const updateTenantMutation = useUpdateTenant();
  const assignTenantMutation = useAssignTenant();
  const endTenancyMutation = useEndTenancy();
  const archiveTenantMutation = useArchiveTenant();
  const unarchiveTenantMutation = useUnarchiveTenant();
  const unreconcileMutation = useUnreconcileRent();
  const unlinkPayerMutation = useUnlinkLinkedPayer();
  const addAdjustmentMutation = useAddTenantAdjustment();
  const updateLineItemMutation = useUpdateTenantLineItem();
  const removeLineItemMutation = useRemoveTenantLineItem();
  const [applyingLinkedPayers, setApplyingLinkedPayers] = useState(false);
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  const tenantsFromApi = data?.data ?? [];

  const statusColors: Record<string, string> = {
    Paid: "bg-green-900/40 text-green-400 border-green-700/60",
    Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
    Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
    Applied: "bg-violet-900/40 text-violet-300 border-violet-700/60",
    Vacant: "bg-amber-900/40 text-amber-300 border-amber-700/60",
    Archived: "bg-gray-800/60 text-gray-300 border-gray-600",
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
      Archived: 4,
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
      if (full) {
        setSelectedTenant(full);
        // Keep list red-tag in sync with landlord-facing balance from detail
        qc.setQueryData(["tenants", userId], (prev: any) => {
          if (!prev?.data || !Array.isArray(prev.data)) return prev;
          return {
            ...prev,
            data: prev.data.map((row: any) => {
              if (String(row?._id || row?.id) !== String(id)) return row;
              return {
                ...row,
                currentBalance: full.currentBalance,
                status: full.status,
                lastPayment: full.lastPayment ?? row.lastPayment,
              };
            }),
          };
        });
      }
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
    setEditDepositPaid(
      selectedTenant.depositPaidDate
        ? new Date(selectedTenant.depositPaidDate).toISOString().slice(0, 10)
        : selectedTenant.depositStartDate
          ? new Date(selectedTenant.depositStartDate).toISOString().slice(0, 10)
          : ""
    );
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
    setAssignDepositPaid("");
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
    setAssignDepositPaid("");
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
      if (!assignDepositPaid) {
        toast.error("Enter the date the deposit was paid.");
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
          depositPaidDate:
            assignHasDeposit && Number(assignDeposit) > 0 ? assignDepositPaid || null : null,
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
    setEditDepositPaid("");
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
      if (!editDepositPaid) {
        toast.error("Enter the date the deposit was paid.");
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
      depositPaidDate?: string | null;
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
      const nextPaid = nextDeposit > 0 && editDepositPaid ? editDepositPaid : null;
      const prevPaid = selectedTenant.depositPaidDate
        ? new Date(selectedTenant.depositPaidDate).toISOString().slice(0, 10)
        : selectedTenant.depositStartDate
          ? new Date(selectedTenant.depositStartDate).toISOString().slice(0, 10)
          : null;
      if (nextDeposit !== prevDeposit || nextPaid !== prevPaid) {
        payload.depositAmount = nextDeposit;
        payload.depositPaidDate = nextPaid;
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

  const openArchiveConfirm = () => {
    if (!selectedTenant || selectedTenant.tenancyStatus === "vacant") return;
    setArchiveConfirmOpen(true);
  };

  const confirmArchiveTenant = () => {
    if (!selectedTenant?._id) return;
    archiveTenantMutation.mutate(
      { tenantId: selectedTenant._id },
      {
        onSuccess: () => {
          setArchiveConfirmOpen(false);
          setTransactionModalOpen(false);
          setSelectedTenant(null);
        },
      }
    );
  };

  const confirmRemoveLineItem = () => {
    if (!selectedTenant?._id || !removeLineItemConfirm) return;
    const { rentEntryId, lineItemId } = removeLineItemConfirm;
    removeLineItemMutation.mutate(
      {
        tenantId: selectedTenant._id,
        rentEntryId,
        lineItemId,
      },
      {
        onSuccess: (res) => {
          if (res?.data) setSelectedTenant(res.data);
          setRemoveLineItemConfirm(null);
        },
      }
    );
  };

  const confirmUnarchiveTenant = () => {
    if (!selectedTenant?._id) return;
    unarchiveTenantMutation.mutate(
      { tenantId: selectedTenant._id },
      {
        onSuccess: (res) => {
          const updated = res?.data;
          if (updated) setSelectedTenant(updated);
          else setSelectedTenant((prev: any) => (prev ? { ...prev, archived: false, archivedAt: null } : prev));
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

  /** True when this rent row was cleared by the move-in first payment. */
  const isFirstMoveInPaymentEntry = (entry: any, tenant: any = selectedTenant) => {
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
  };

  /** Per-payment pieces (full or partial) with their own paidOn dates. */
  const getPaymentPieces = (entry: any) => {
    const pieces = Array.isArray(entry?.linkedPayments) ? entry.linkedPayments : [];
    return pieces.filter((p: any) => (Number(p?.amount) || 0) > 0);
  };

  type PaymentPieceRole = "payment" | "credit" | "cover";

  const paymentPieceRoleMeta: Record<
    PaymentPieceRole,
    { label: string; className: string; title: string }
  > = {
    payment: {
      label: "Payment",
      className: "border-gray-700 bg-[#141414] text-gray-400",
      title: "Amount from this payment applied to this month",
    },
    credit: {
      label: "Credit",
      className: "border-sky-800/70 bg-sky-950/40 text-sky-300",
      title: "Leftover from an earlier overpayment applied to this month",
    },
    cover: {
      label: "Cover",
      className: "border-amber-800/70 bg-amber-950/40 text-amber-300",
      title: "Later payment covering a shortfall on this month",
    },
  };

  /** Stable key so the same bank payment can be tracked across months. */
  const getPaymentPieceGroupKey = (piece: any, historyIndex: number, pieceIndex: number) => {
    const txId = piece?.transactionId;
    if (txId != null && String(txId).trim() !== "") return `tx:${String(txId)}`;
    // Cash / legacy rows without a bank id are one-off (not split across months).
    return `solo:${historyIndex}:${pieceIndex}`;
  };

  /**
   * Classify each linkedPayments piece across rentHistory:
   * - payment: first month that received this bank/cash payment (on/before due)
   * - cover: first month, but paid after due (topping up / late)
   * - credit: later months receiving leftover from the same payment
   */
  const buildPaymentPieceRoleMap = (rentHistory: any[]) => {
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
        const late =
          item.paidMs != null && item.dueMs != null && item.paidMs > item.dueMs;
        roles.set(mapKey, late ? "cover" : "payment");
      });
    });

    return roles;
  };

  const getPaymentPieceRole = (
    roleMap: Map<string, PaymentPieceRole> | null | undefined,
    historyIndex: number,
    pieceIndex: number
  ): PaymentPieceRole => roleMap?.get(`${historyIndex}:${pieceIndex}`) || "payment";

  /**
   * Total received for each bank/cash payment across all months
   * (FIFO may split one bank tx; this restores the full payment amount).
   */
  const buildPaymentTotalsByGroup = (rentHistory: any[]) => {
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
        // Include deposit-only pieces (amount 0, depositAllocated > 0)
        if (amt <= 0 && depositPart <= 0) return;
        const key = getPaymentPieceGroupKey(piece, historyIndex, pieceIndex);
        const bankAmt = Number(piece?.bankAmount) || 0;
        const prev = totals.get(key);
        if (!prev) {
          totals.set(key, {
            // Prefer full bank/manual amount so Payment History matches the statement
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
          prev.amount = Math.round((prev.rentApplied + Math.max(prev.depositAllocated, depositPart)) * 100) / 100;
        }
        if (depositPart > prev.depositAllocated) prev.depositAllocated = depositPart;
        // Keep earliest paidOn
        const prevMs = toUtcDayMs(prev.paidOn);
        const nextMs = toUtcDayMs(piece.paidOn);
        if (prevMs == null || (nextMs != null && nextMs < prevMs)) {
          prev.paidOn = piece.paidOn;
        }
      });
    });

    return totals;
  };

  /**
   * Running credit/arrears after each history row (oldest due → newest).
   * = rent money received from payments that originated on/before this row
   *   (bank amount − deposit) − dues accrued through this row.
   * Example: £1000 − £200 deposit − £263.01 first due → £536.99 credit.
   */
  const buildRunningBalancesByIndex = (
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
  ) => {
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
      // Discount/refund audit rows don't change rent balance
      if (kind !== "discount" && kind !== "refund") {
        dues = Math.round((dues + (Number(entry?.amountDue) || 0)) * 100) / 100;
      }

      const originating = getOriginatingPaymentsForMonth(
        entry,
        index,
        roleMap,
        paymentTotals
      );
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
  };

  /**
   * Payments that *originated* on this month (not leftover credit from an earlier month).
   * Shows full bank/cash amounts so a £870 payment is not shown as £670 + £200.
   */
  const getOriginatingPaymentsForMonth = (
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
  ) => {
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
      // Credit = leftover from a payment that already counted on an earlier month
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
  };

  const paymentPieceRoles = buildPaymentPieceRoleMap(selectedTenant?.rentHistory || []);
  const paymentTotalsByGroup = buildPaymentTotalsByGroup(selectedTenant?.rentHistory || []);
  const runningBalancesByIndex = buildRunningBalancesByIndex(
    selectedTenant?.rentHistory || [],
    paymentPieceRoles,
    paymentTotalsByGroup
  );

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
    const tenantId = selectedTenant._id;
    unreconcileMutation.mutate(
      {
        tenantId,
        payload: { index: paymentReview.index },
      },
      {
        onSuccess: async (res) => {
          setPaymentReview(null);
          const updatedTenant = res?.data?.tenant || null;
          if (updatedTenant) {
            setSelectedTenant(updatedTenant);
            qc.setQueryData(["tenants", userId], (prev: any) => {
              if (!prev?.data || !Array.isArray(prev.data)) return prev;
              return {
                ...prev,
                data: prev.data.map((row: any) => {
                  if (String(row?._id || row?.id) !== String(tenantId)) return row;
                  return {
                    ...row,
                    currentBalance: updatedTenant.currentBalance,
                    status: updatedTenant.status,
                    lastPayment: updatedTenant.lastPayment ?? row.lastPayment,
                  };
                }),
              };
            });
          }
          // Reload full detail so history / banner match DB after reverse
          try {
            const fresh = await getTenantById(String(tenantId));
            const full = fresh?.data ?? fresh;
            if (full) setSelectedTenant(full);
          } catch {
            /* keep mutation response */
          }
        },
      }
    );
  };

  const loadReconcileTxs = useCallback(
    async ({
      tenantId,
      page = 1,
      search = "",
      showSpinner = true,
    }: {
      tenantId: string;
      page?: number;
      search?: string;
      showSpinner?: boolean;
    }) => {
      if (showSpinner) setReconcileLoading(true);
      try {
        const res = await getTransactionsMatchingTenant(tenantId, {
          page,
          limit: reconcilePageSize,
          search: search || undefined,
        });
        const docs = res?.data?.docs ?? [];
        setMatchingTxs(Array.isArray(docs) ? docs : []);
        setReconcileTotal(Number(res?.data?.total) || 0);
        setReconcileTotalPages(Math.max(1, Number(res?.data?.totalPages) || 1));
        setReconcilePage(Number(res?.data?.page) || page);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Could not load matching transactions");
        throw err;
      } finally {
        if (showSpinner) setReconcileLoading(false);
      }
    },
    [reconcilePageSize]
  );

  const openReconcilePanel = () => {
    if (!selectedTenant) return;
    setReconcileOpen(true);
    setMatchingTxs([]);
    setReconcileSearch("");
    setReconcileSearchQuery("");
    setReconcilePage(1);
    setReconcileTotal(0);
    setReconcileTotalPages(1);
  };

  const closeReconcilePanel = () => {
    setReconcileOpen(false);
    setReconcileSearch("");
    setReconcileSearchQuery("");
    setReconcilePage(1);
    setMatchingTxs([]);
  };

  useEffect(() => {
    if (!reconcileOpen) return;
    const timer = setTimeout(() => {
      const next = reconcileSearch.trim();
      setReconcileSearchQuery((prev) => {
        if (prev !== next) setReconcilePage(1);
        return next;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [reconcileSearch, reconcileOpen]);

  useEffect(() => {
    if (!reconcileOpen || !selectedTenant?._id) return;
    loadReconcileTxs({
      tenantId: selectedTenant._id,
      page: reconcilePage,
      search: reconcileSearchQuery,
    }).catch(() => {
      // Error toast is shown in loadReconcileTxs
    });
  }, [reconcileOpen, selectedTenant?._id, reconcilePage, reconcileSearchQuery, loadReconcileTxs]);

  const formatMatchReason = (reason: string | null | undefined) => {
    if (!reason) return "No automatic match";
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

  const applyLinkedPayerPaymentsForTenant = useCallback(
    async (tenantId: string, { silentEmpty = false }: { silentEmpty?: boolean } = {}) => {
      if (!tenantId || applyingLinkedPayers) return { applied: 0 };
      setApplyingLinkedPayers(true);
      try {
        const res = await autoMatchTransactionsForTenant(tenantId);
        const applied = Number(res?.data?.applied) || 0;
        if (applied > 0) {
          toast.success(
            `Applied ${applied} matched payment${applied === 1 ? "" : "s"} (oldest bank date first)`
          );
          try {
            const fresh = await getTenantById(tenantId);
            const tenant = fresh?.data || fresh;
            if (tenant) setSelectedTenant(tenant);
          } catch {
            /* ignore refresh errors */
          }
          qc.invalidateQueries({ queryKey: ["tenants", userId] });
          qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
        } else if (!silentEmpty) {
          toast.success(res?.message || "No matched payments left to apply");
        }
        return { applied };
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Failed to apply linked-payer payments");
        return { applied: 0 };
      } finally {
        setApplyingLinkedPayers(false);
      }
    },
    [applyingLinkedPayers, qc, userId]
  );

  const confirmBankReconcile = async () => {
    if (!selectedTenant || !pendingBankReconcile || applyingLinkedPayers) return;
    const transactionId =
      pendingBankReconcile.transaction?.transactionId || pendingBankReconcile.transactionId;
    if (!transactionId) {
      toast.error("Missing transaction id");
      return;
    }

    const tenantId = selectedTenant._id;
    setApplyingLinkedPayers(true);
    try {
      // Single oldest→newest pass. Include the clicked tx in that queue so Accepting
      // September never jumps ahead of an older April/deposit payment.
      const res = await autoMatchTransactionsForTenant(tenantId, {
        includeTransactionId: String(transactionId),
      });
      const applied = Number(res?.data?.applied) || 0;

      try {
        const fresh = await getTenantById(tenantId);
        const tenant = fresh?.data || fresh;
        if (tenant) setSelectedTenant(tenant);
      } catch {
        /* ignore */
      }

      setPendingBankReconcile(null);
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      toast.success(
        applied > 0
          ? `Applied ${applied} payment${applied === 1 ? "" : "s"} oldest bank date first`
          : "No payments applied"
      );
      loadReconcileTxs({
        tenantId,
        page: reconcilePage,
        search: reconcileSearchQuery,
        showSpinner: false,
      }).catch(() => {});
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to reconcile");
    } finally {
      setApplyingLinkedPayers(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">Tenants</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 md:max-w-xl">
          <div className="relative w-full sm:flex-1">
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
            type="button"
            onClick={() => {
              setShowArchived((v) => !v);
              setSelectedTenant(null);
              setTransactionModalOpen(false);
            }}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              showArchived
                ? "border-gray-500 bg-gray-800/60 text-gray-100"
                : "border-[#2A2A2A] text-gray-400 hover:border-gray-600 hover:text-gray-200"
            }`}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Viewing archived" : "Show archived"}
          </button>
        </div>

        {!showArchived && (
          <button
            onClick={() => setNewTenantOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-700 bg-transparent px-4 py-2 text-emerald-400 transition hover:bg-emerald-900/5 sm:w-auto md:ml-auto"
          >
            <Plus className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">Add Tenant</span>
          </button>
        )}
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
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  {showArchived ? "No archived tenants." : "No tenants found."}
                </td>
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
          }} className="my-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
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

            {selectedTenant.archived && (
              <div className="mb-4 rounded-xl border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-gray-300">
                This tenant is archived — no new rent months will be created until you unarchive them.
              </div>
            )}

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
                  <p className="flex flex-wrap items-center gap-2">
                    Deposit held{" "}
                    <span className="font-medium text-gray-200">
                      {formatMoney(Number(selectedTenant.depositAmount))}
                    </span>
                    {(selectedTenant.depositPaidDate || selectedTenant.depositStartDate) && (
                      <span className="text-gray-500">
                        {" "}
                        (paid{" "}
                        {formatDate(
                          selectedTenant.depositPaidDate || selectedTenant.depositStartDate
                        )}
                        )
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedTenant?._id) return;
                        updateTenantMutation.mutate(
                          {
                            tenantId: selectedTenant._id,
                            payload: { depositAmount: 0, depositPaidDate: null },
                          },
                          {
                            onSuccess: (res) => {
                              const updated = res?.data;
                              if (updated) setSelectedTenant(updated);
                              toast.success("Deposit cleared — linked bank tx restored to rent queue if any");
                            },
                          }
                        );
                      }}
                      disabled={updateTenantMutation.isPending}
                      className="ml-1 rounded-full border border-[#333] px-2 py-0.5 text-[11px] text-gray-400 hover:border-rose-800 hover:text-rose-300 disabled:opacity-50"
                    >
                      Clear deposit
                    </button>
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

            {selectedTenant.tenancyStatus !== "vacant" && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLineItem(null);
                    setAdjustmentType("charge");
                    setAdjustmentAmount("");
                    setAdjustmentDate(new Date().toISOString().slice(0, 10));
                    setAdjustmentDescription("");
                    setAdjustmentMonthLink("");
                    setAdjustmentOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-800 px-4 py-2 text-sm text-violet-300 hover:bg-violet-950/40"
                >
                  <Plus className="h-4 w-4" />
                  Add charge / discount
                </button>
              </div>
            )}

            {Array.isArray(selectedTenant.linkedPayers) && selectedTenant.linkedPayers.length > 0 && (
              <div className="mb-4 rounded-xl border border-[#1a1a1a] bg-[#0B0B0B] px-4 py-3">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-gray-500">Linked bank payers</p>
                    <p className="text-xs text-gray-500">
                      Linked by payer name (payment refs like “October-rent” are ignored). Future payments from this
                      name auto-reconcile here. Unlink to stop that.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={applyingLinkedPayers}
                    onClick={async () => {
                      await applyLinkedPayerPaymentsForTenant(selectedTenant._id);
                      if (reconcileOpen) {
                        loadReconcileTxs({
                          tenantId: selectedTenant._id,
                          page: reconcilePage,
                          search: reconcileSearchQuery,
                          showSpinner: false,
                        }).catch(() => {});
                      }
                    }}
                    className="shrink-0 rounded-full border border-sky-800 px-3 py-1 text-xs text-sky-300 hover:bg-sky-950/40 disabled:opacity-50"
                  >
                    {applyingLinkedPayers ? "Applying…" : "Apply matched (oldest first)"}
                  </button>
                </div>
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
                    <th className="px-4 py-3 text-xs">Balance</th>
                    <th className="px-4 py-3 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (detailLoading) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            Loading rent history…
                          </td>
                        </tr>
                      );
                    }

                    const now = new Date();
                    const todayMs = Date.UTC(
                      now.getUTCFullYear(),
                      now.getUTCMonth(),
                      now.getUTCDate()
                    );

                    const visibleHistory = (selectedTenant.rentHistory || [])
                      .map((entry: any, index: number) => ({ entry, index }))
                      .filter(({ entry }: { entry: any }) => {
                        const kind = String(entry?.kind || "rent");
                        const due = Number(entry?.amountDue) || 0;
                        const paid = Number(entry?.amountPaid) || 0;
                        const adj = Number(entry?.adjustmentAmount) || 0;
                        // Show applied discount/refund audit rows
                        if (kind === "discount" || kind === "refund") {
                          return adj > 0 || due !== 0 || paid !== 0;
                        }
                        // Hide empty prorated rows (e.g. move-in on due day → £0 due)
                        if (due === 0 && paid === 0) return false;
                        // Hide future due months — prepaid surplus shows as green credit above
                        const dueMs = toUtcDayMs(entry?.dueDate ?? entry?.month);
                        if (dueMs != null && dueMs > todayMs) return false;
                        return true;
                      });

                    if (!visibleHistory.length) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-400">
                            No rent history found for this tenant.
                          </td>
                        </tr>
                      );
                    }

                    return visibleHistory.map(({ entry, index }: { entry: any; index: number }) => {
                      const kind = String(entry?.kind || "rent");
                      const isAdjustment = kind === "discount" || kind === "refund";
                      const isChargeLike = kind === "charge" || kind === "transition";
                      const isFirstPayment = !isAdjustment && isFirstMoveInPaymentEntry(entry);
                      const lineItems = Array.isArray(entry?.lineItems) ? entry.lineItems : [];
                      const remaining =
                        (Number(entry.amountDue) || 0) - (Number(entry.amountPaid) || 0);
                      const recorded = !isAdjustment && hasRecordedPayment(entry);
                      const statusLabel = String(entry.status || "unpaid");
                      const statusKey =
                        statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);
                      const dueDisplay = isAdjustment
                        ? -(Number(entry.adjustmentAmount) || 0)
                        : Number(entry.amountDue) || 0;
                      return (
                      <tr
                        key={entry._id || `${kind}-${index}`}
                        className={`border-t border-[#151515] hover:bg-[#0e0e0e] ${recorded ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (recorded) openPaymentReview(index, entry);
                        }}
                      >
                        <td className="px-4 py-3 text-gray-300">
                          <div className="tabular-nums">{formatMoney(dueDisplay)}</div>
                          {/* {isFirstPayment && (
                            <span className="mt-1 inline-flex rounded-full border border-sky-800/70 bg-sky-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-300">
                              First payment
                            </span>
                          )} */}
                          {lineItems.map((item: any, i: number) => {
                            const itemAmt = Number(item?.amount) || 0;
                            if (!(itemAmt > 0)) return null;
                            const itemType = String(item?.type || "charge");
                            const sign = itemType === "charge" ? "+" : "−";
                            const lineItemId = item?._id ? String(item._id) : "";
                            const rentEntryId = entry?._id ? String(entry._id) : "";
                            return (
                              <div
                                key={lineItemId || i}
                                className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500"
                              >
                                <span>
                                  {sign}
                                  {formatMoney(itemAmt)}
                                  {item?.label ? ` · ${item.label}` : ""}
                                </span>
                                {lineItemId && rentEntryId && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      title="Edit"
                                      className="rounded p-0.5 text-gray-500 hover:bg-white/10 hover:text-sky-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const t = (["charge", "discount", "refund"].includes(itemType)
                                          ? itemType
                                          : "charge") as "charge" | "discount" | "refund";
                                        const rawDate = item?.date
                                          ? new Date(item.date).toISOString().slice(0, 10)
                                          : new Date().toISOString().slice(0, 10);
                                        const monthSrc = entry?.month || entry?.dueDate;
                                        let monthLabel = "";
                                        let monthLink = "";
                                        if (monthSrc) {
                                          const md = new Date(monthSrc);
                                          if (!Number.isNaN(md.getTime())) {
                                            monthLink = `${md.getUTCFullYear()}-${String(md.getUTCMonth() + 1).padStart(2, "0")}`;
                                            monthLabel = md.toLocaleString("en-GB", {
                                              month: "long",
                                              year: "numeric",
                                              timeZone: "UTC",
                                            });
                                          }
                                        }
                                        setEditingLineItem({
                                          rentEntryId,
                                          lineItemId,
                                          type: t,
                                          monthLabel: monthLabel || "this month",
                                        });
                                        setAdjustmentType(t);
                                        setAdjustmentAmount(String(itemAmt.toFixed(2)));
                                        setAdjustmentDate(rawDate);
                                        setAdjustmentDescription(String(item?.label || ""));
                                        setAdjustmentMonthLink(monthLink);
                                        setAdjustmentOpen(true);
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Remove"
                                      disabled={removeLineItemMutation.isPending}
                                      className="rounded p-0.5 text-gray-500 hover:bg-white/10 hover:text-rose-400 disabled:opacity-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRemoveLineItemConfirm({
                                          rentEntryId,
                                          lineItemId,
                                          itemType,
                                          label: item?.label ? String(item.label) : undefined,
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {!isFirstPayment && lineItems.length === 0 && (isChargeLike || isAdjustment) && (
                            <div className="mt-0.5 text-[11px] text-gray-500">
                              {entry.label || kind}
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 ${!isAdjustment && remaining > 0 ? "text-rose-400" : "text-gray-300"}`}>
                          {isAdjustment ? "—" : formatMoney(Number(entry.amountPaid) || 0)}
                        </td>
                        <td className="px-4 py-3 align-top">
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
                              totalPaid > 0 &&
                              originating.length === 0 &&
                              pieces.length > 0;

                            if (totalPaid <= 0 && !creditOnly) {
                              return <span className="text-sm text-gray-500">—</span>;
                            }

                            // Bank-primary: show the bank statement amount when a payment originated here.
                            const bankDisplay = originating.reduce(
                              (s, row) => s + (Number(row.amount) || 0),
                              0
                            );
                            const displayAmount =
                              originating.length > 0 && bankDisplay > 0 ? bankDisplay : totalPaid;
                            const depositPart = originating.reduce(
                              (s, row) => s + (Number(row.depositAllocated) || 0),
                              0
                            );
                            const rentFromBank = originating.reduce(
                              (s, row) => s + (Number(row.appliedThisMonth) || 0),
                              0
                            );

                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (recorded) openPaymentReview(index, entry);
                                }}
                                className={`text-left ${recorded ? "hover:opacity-90" : "cursor-default"}`}
                                title={
                                  pieces.length >= 1
                                    ? "Click to see bank payment breakdown"
                                    : recorded
                                      ? "Click for payment details"
                                      : undefined
                                }
                              >
                                <span className="block tabular-nums text-sm font-medium text-gray-200">
                                  {formatMoney(displayAmount)}
                                </span>
                                {originating.length > 0 && (depositPart > 0.001 || rentFromBank + 0.001 < displayAmount) ? (
                                  <span className="mt-0.5 block text-[11px] text-sky-400/90">
                                    {depositPart > 0.001
                                      ? `${formatMoney(depositPart)} deposit`
                                      : ""}
                                    {depositPart > 0.001 && rentFromBank > 0.001 ? " · " : ""}
                                    {rentFromBank > 0.001
                                      ? `${formatMoney(rentFromBank)} rent`
                                      : ""}
                                    {displayAmount - depositPart - rentFromBank > 0.001
                                      ? ` · ${formatMoney(displayAmount - depositPart - rentFromBank)} credit`
                                      : ""}
                                    {" · view"}
                                  </span>
                                ) : pieces.length >= 1 && !creditOnly ? (
                                  <span className="mt-0.5 block text-[11px] text-sky-400/90">
                                    {pieces.length} payment
                                    {pieces.length === 1 ? "" : "s"} · view breakdown
                                  </span>
                                ) : creditOnly ? (
                                  <span className="mt-0.5 block text-[11px] text-emerald-400/90">
                                    From earlier credit
                                  </span>
                                ) : entry.paidOn ? (
                                  <span className="mt-0.5 block text-[11px] text-gray-500">
                                    {formatDate(entry.paidOn)}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{formatDate(entry.dueDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-xs ${statusColors[statusKey as keyof typeof statusColors] || "bg-gray-800 text-gray-400"}`}>
                            {statusKey}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {(() => {
                            if (isAdjustment) {
                              return <span className="text-sm text-gray-500">—</span>;
                            }
                            const bal = runningBalancesByIndex.get(index) ?? 0;
                            if (Math.abs(bal) < 0.005) {
                              return (
                                <span className="text-sm text-gray-400">Settled</span>
                              );
                            }
                            if (bal > 0) {
                              return (
                                <div>
                                  <span className="block tabular-nums text-sm font-medium text-emerald-300">
                                    {formatMoney(bal)}
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
                                  {formatMoney(Math.abs(bal))}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-rose-400/80">
                                  Arrears
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          {isAdjustment ? (
                            <span className="text-xs text-gray-500">—</span>
                          ) : remaining > 0 ? (
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
                                  const depositOpen = getUnallocatedDepositAmount(selectedTenant);
                                  const suggested = Math.round((rem + depositOpen) * 100) / 100;
                                  setPendingCash({
                                    index,
                                    entry,
                                    cashAmount: String(suggested),
                                    paymentMethod: "cash",
                                  });
                                }}
                                className="flex items-center gap-2 rounded-full border border-amber-700 px-3 py-1 text-xs text-amber-400 hover:bg-amber-900/5"
                              >
                                <DollarSign className="h-4 w-4" />
                                Record payment
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
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
                {selectedTenant.tenancyStatus !== "vacant" &&
                  (selectedTenant.archived ? (
                    <button
                      type="button"
                      onClick={confirmUnarchiveTenant}
                      disabled={unarchiveTenantMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-800 px-4 py-2 text-sm text-sky-300 hover:bg-sky-950/40 disabled:opacity-50"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      {unarchiveTenantMutation.isPending ? "Restoring…" : "Unarchive"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openArchiveConfirm}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-600 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </button>
                  ))}
                <button
                  onClick={openEndTenancyModal}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-800 px-4 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                  {selectedTenant.tenancyStatus === "vacant" ? "Remove room" : "Remove "}
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
                  {getPropertyDisplay(selectedTenant)} · matched first, then other unreconciled
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={applyingLinkedPayers || reconcileLoading}
                  onClick={async () => {
                    await applyLinkedPayerPaymentsForTenant(selectedTenant._id);
                    loadReconcileTxs({
                      tenantId: selectedTenant._id,
                      page: reconcilePage,
                      search: reconcileSearchQuery,
                      showSpinner: false,
                    }).catch(() => {});
                  }}
                  className="rounded-full border border-sky-800 px-3 py-1.5 text-xs text-sky-300 hover:bg-sky-950/40 disabled:opacity-50"
                  title="Applies all Matched bank payments oldest first (e.g. 05/06 before later months)"
                >
                  {applyingLinkedPayers ? "Applying…" : "Apply matched (oldest first)"}
                </button>
                <button
                  type="button"
                  onClick={closeReconcilePanel}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                        Loading transactions…
                      </td>
                    </tr>
                  ) : matchingTxs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        {reconcileSearchQuery
                          ? `No unreconciled transactions match “${reconcileSearchQuery}”.`
                          : "No unreconciled bank transactions."}
                      </td>
                    </tr>
                  ) : (
                    matchingTxs.map((row) => {
                      const tx = row.transaction || row;
                      const isMatched = row.matchStatus === "matched";
                      const hasSuggestion = Boolean(row.matchStatus);
                      const matchLabel = isMatched
                        ? "Matched"
                        : hasSuggestion
                          ? "Needs Review"
                          : "Other";
                      const matchColors: Record<string, string> = {
                        Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
                        "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
                        Other: "bg-gray-900/40 text-gray-400 border-gray-700",
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
                              {hasSuggestion && (
                                <div className="group relative inline-block">
                                  <Info className="h-3 w-3 text-gray-400 group-hover:text-gray-200" />
                                  <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[240px] -translate-x-1/2 whitespace-normal rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                    {formatMatchReason(row.matchReason)}
                                  </div>
                                </div>
                              )}
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
                              disabled={applyingLinkedPayers}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-transparent px-3 py-1 text-xs text-emerald-400 transition hover:bg-emerald-900/5 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" />
                              <span>Accept</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {reconcileTotal > 0 && (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Showing{" "}
                  {Math.min((reconcilePage - 1) * reconcilePageSize + 1, reconcileTotal)} to{" "}
                  {Math.min(reconcilePage * reconcilePageSize, reconcileTotal)} of {reconcileTotal}{" "}
                  transactions
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReconcilePage((p) => Math.max(1, p - 1))}
                    disabled={reconcilePage <= 1 || reconcileLoading}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {reconcilePage} of {reconcileTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReconcilePage((p) => Math.min(reconcileTotalPages, p + 1))}
                    disabled={reconcilePage >= reconcileTotalPages || reconcileLoading}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeReconcilePanel}
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
              {formatMatchReason(pendingBankReconcile.matchReason)}. Any older matched bank payments are applied
              first (e.g. 05/06 before later dates), then this one; leftover rolls forward.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingBankReconcile(null)}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                disabled={applyingLinkedPayers}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBankReconcile}
                disabled={applyingLinkedPayers}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-700 bg-emerald-900/40 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/60 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                {applyingLinkedPayers ? "Applying…" : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentReview && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div
            style={{ scrollbarWidth: "none" }}
            className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
            ) : (
              <div className="mb-4">
                {(() => {
                  const originating = getOriginatingPaymentsForMonth(
                    paymentReview.entry,
                    paymentReview.index,
                    paymentPieceRoles,
                    paymentTotalsByGroup
                  );
                  const creditPieces = (Array.isArray(paymentReview.entry?.linkedPayments)
                    ? paymentReview.entry.linkedPayments
                    : []
                  )
                    .map((p: any, pieceIndex: number) => ({ p, pieceIndex }))
                    .filter(({ p, pieceIndex }: { p: any; pieceIndex: number }) => {
                      if ((Number(p?.amount) || 0) <= 0) return false;
                      return (
                        getPaymentPieceRole(paymentPieceRoles, paymentReview.index, pieceIndex) ===
                        "credit"
                      );
                    });
                  const creditTotal = creditPieces.reduce(
                    (s: number, { p }: { p: any }) => s + (Number(p?.amount) || 0),
                    0
                  );

                  const txById = new Map(
                    (paymentReview.linkedTransactions || []).map((tx: any) => [
                      String(tx._id || ""),
                      tx,
                    ])
                  );

                  return (
                    <>
                      {originating.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                            Bank payment breakdown
                          </p>
                          <ul className="space-y-3 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-3">
                            {originating.map((row) => {
                              const tx = row.transactionId
                                ? txById.get(String(row.transactionId))
                                : null;
                              const bankAmt = tx
                                ? Math.abs(Number(tx.bankAmount ?? tx.amount) || 0)
                                : row.amount;
                              const fullBankAmt = bankAmt > 0 ? bankAmt : row.amount;
                              const appliedAmt = Number(row.appliedThisMonth) || 0;
                              const depositPart = Number(row.depositAllocated) || 0;
                              const rentTotal = Number(row.rentAppliedTotal) || appliedAmt;
                              const leftover = Math.max(
                                0,
                                Math.round((fullBankAmt - depositPart - rentTotal) * 100) / 100
                              );
                              const isCash = String(row.method || "").toLowerCase() === "cash";
                              return (
                                <li key={row.key} className="space-y-1.5 text-sm">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="shrink-0 text-gray-200">
                                      {formatDateTime(row.paidOn || tx?.date)}
                                    </span>
                                    <span className="tabular-nums font-medium text-gray-100">
                                      {formatMoney(fullBankAmt)}
                                    </span>
                                    <span
                                      className={`sm:ml-auto shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] leading-none ${
                                        isCash
                                          ? "border-amber-800/70 bg-amber-950/40 text-amber-300"
                                          : paymentPieceRoleMeta[row.role].className
                                      }`}
                                    >
                                      {isCash ? "Cash" : "Bank"}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5 pl-0.5 text-[12px] text-gray-400">
                                    {depositPart > 0.001 && (
                                      <div className="flex justify-between gap-3">
                                        <span>Deposit</span>
                                        <span className="tabular-nums text-gray-300">
                                          {formatMoney(depositPart)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between gap-3">
                                      <span>Rent this month</span>
                                      <span className="tabular-nums text-gray-300">
                                        {formatMoney(appliedAmt)}
                                      </span>
                                    </div>
                                    {rentTotal > appliedAmt + 0.001 && (
                                      <div className="flex justify-between gap-3">
                                        <span>Rent later months</span>
                                        <span className="tabular-nums text-gray-300">
                                          {formatMoney(rentTotal - appliedAmt)}
                                        </span>
                                      </div>
                                    )}
                                    {leftover > 0.001 && (
                                      <div className="flex justify-between gap-3 text-emerald-400/90">
                                        <span>Unallocated credit</span>
                                        <span className="tabular-nums">{formatMoney(leftover)}</span>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <p className="mt-2 text-[11px] text-gray-500">
                            Top amount matches the bank statement. Breakdown shows how that payment
                            was split across deposit, this month&apos;s rent, later months, and credit.
                          </p>
                        </div>
                      )}

                      {creditTotal > 0.001 && (
                        <div className="mb-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-3 text-sm">
                          <p className="text-xs uppercase tracking-wide text-emerald-400/80">
                            Applied from earlier credit
                          </p>
                          <p className="mt-1 tabular-nums text-emerald-300">
                            {formatMoney(creditTotal)}
                          </p>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Leftover from a payment already counted on an earlier month — not a new
                            payment.
                          </p>
                        </div>
                      )}

                      {paymentReview.paymentMethod === "bank" ||
                      (paymentReview.linkedTransactions?.length ?? 0) > 0 ? (
                        <>
                          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                            Linked bank transaction
                            {(paymentReview.linkedTransactions?.length ?? 0) > 1 ? "s" : ""}
                          </p>
                          {(paymentReview.linkedTransactions?.length ?? 0) === 0 ? (
                            <p className="rounded-lg border border-[#1a1a1a] px-3 py-3 text-sm text-gray-500">
                              No linked bank transaction for this month — this was recorded manually
                              (e.g. first rent). Reverse will clear the payment on this month.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {paymentReview.linkedTransactions.map((tx: any) => {
                                const bankAmount = Math.abs(
                                  Number(tx.bankAmount ?? tx.amount) || 0
                                );
                                const allocated =
                                  tx.allocatedAmount != null &&
                                  Number.isFinite(Number(tx.allocatedAmount))
                                    ? Number(tx.allocatedAmount)
                                    : null;
                                const isCreditOnly =
                                  allocated != null &&
                                  originating.every(
                                    (o) => String(o.transactionId || "") !== String(tx._id || "")
                                  );
                                return (
                                  <div
                                    key={tx._id || tx.transactionId}
                                    className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-3 text-sm"
                                  >
                                    <div className="flex justify-between gap-3 text-gray-200">
                                      <span className="font-medium">
                                        {tx.payerName || tx.description || "Bank payment"}
                                      </span>
                                      <span>{formatMoney(bankAmount)}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                      {formatDateTime(tx.date)}
                                      {isCreditOnly
                                        ? ` · ${formatMoney(allocated ?? 0)} from earlier credit`
                                        : allocated != null && allocated < bankAmount - 0.001
                                          ? ` · ${formatMoney(allocated)} applied to this month`
                                          : ""}
                                      {tx.description ? ` · ${tx.description}` : ""}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : originating.length === 0 && creditTotal <= 0 ? (
                        <p className="text-sm text-gray-400">
                          This month includes <strong className="text-gray-200">cash</strong>{" "}
                          payment(s). Reversing clears this month so you can re-enter cash or leave
                          it for bank match.
                        </p>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            )}

            <p className="mb-4 text-xs text-gray-500">
              Reverse clears this month&apos;s payment(s). Linked bank transactions are fully released
              back to the Transactions list (including any split used on other months). Manual first
              rent or cash is cleared on this month only, and the balance is recalculated.
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

      {pendingCash && selectedTenant && (() => {
        const rentRemaining = Math.max(
          0,
          (Number(pendingCash.entry.amountDue) || 0) - (Number(pendingCash.entry.amountPaid) || 0)
        );
        const depositOpen = getUnallocatedDepositAmount(selectedTenant);
        const maxAllowed = Math.round((rentRemaining + depositOpen) * 100) / 100;
        const entered = Number(pendingCash.cashAmount);
        const previewDeposit =
          Number.isFinite(entered) && entered > 0 && depositOpen > 0
            ? Math.min(depositOpen, Math.round(entered * 100) / 100)
            : 0;
        const previewRent =
          Number.isFinite(entered) && entered > 0
            ? Math.min(rentRemaining, Math.round((entered - previewDeposit) * 100) / 100)
            : 0;

        return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Record payment</h3>
            <p className="mb-4 text-sm text-gray-400">
              Enter how much was paid (full remaining or a partial amount) and whether it was{" "}
              <strong>cash</strong> or <strong>bank</strong>.
              {depositOpen > 0
                ? " Same as auto-reconcile: deposit is taken first, then rent."
                : ""}
            </p>

            <div className="mb-4 rounded-lg border border-[#111] bg-[#050505] p-3">
              <div className="flex justify-between text-sm text-gray-300">
                <div>Month</div>
                <div>{formatDate(pendingCash.entry.month)}</div>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <div>Rent remaining</div>
                <div>{formatMoney(rentRemaining)}</div>
              </div>
              {depositOpen > 0 && (
                <div className="flex justify-between text-sm text-gray-300">
                  <div>Unallocated deposit</div>
                  <div>{formatMoney(depositOpen)}</div>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-[#1a1a1a] pt-2 text-sm font-medium text-amber-300">
                <div>Max for this payment</div>
                <div>{formatMoney(maxAllowed)}</div>
              </div>
            </div>

            <label className="mb-1.5 block text-sm text-gray-300">Payment method</label>
            <div className="mb-4 flex gap-2">
              {(["cash", "bank"] as const).map((method) => {
                const selected = pendingCash.paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    disabled={payByCashMutation.isPending}
                    onClick={() =>
                      setPendingCash((prev) => (prev ? { ...prev, paymentMethod: method } : prev))
                    }
                    className={`rounded-full border px-4 py-2 text-sm capitalize transition disabled:opacity-50 ${
                      selected
                        ? "border-amber-600 bg-amber-600/15 text-amber-300"
                        : "border-[#2A2A2A] text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
            {pendingCash.paymentMethod === "bank" && (
              <p className="mb-4 text-xs text-gray-500">
                Marks this month as paid by bank without linking a bank feed transaction. Use Reconcile
                if you want to match a real bank payment instead.
              </p>
            )}

            <label className="mb-1 block text-sm text-gray-300">Amount paid (£)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={pendingCash.cashAmount}
              disabled={payByCashMutation.isPending}
              onChange={(e) =>
                setPendingCash((prev) => (prev ? { ...prev, cashAmount: e.target.value } : prev))
              }
              className="mb-2 w-full rounded-lg border border-gray-800 bg-[#050505] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:opacity-50"
            />
            {Number.isFinite(entered) && entered > 0 && (previewDeposit > 0.001 || previewRent > 0.001) && (
              <p className="mb-4 text-xs text-sky-300/90">
                Will apply:{" "}
                {previewDeposit > 0.001 && (
                  <span>{formatMoney(previewDeposit)} deposit</span>
                )}
                {previewDeposit > 0.001 && previewRent > 0.001 && <span> · </span>}
                {previewRent > 0.001 && <span>{formatMoney(previewRent)} rent</span>}
              </p>
            )}
            {!(Number.isFinite(entered) && entered > 0 && (previewDeposit > 0.001 || previewRent > 0.001)) && (
              <div className="mb-4" />
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingCash(null)}
                disabled={payByCashMutation.isPending}
                className="rounded-full border px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payByCashMutation.isPending}
                onClick={() => {
                  if (payByCashMutation.isPending) return;
                  const amount = Number(pendingCash.cashAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    toast.error("Enter a valid payment amount");
                    return;
                  }
                  if (amount > maxAllowed + 0.001) {
                    toast.error(
                      depositOpen > 0
                        ? `Amount cannot exceed rent remaining (${formatMoney(rentRemaining)}) plus deposit (${formatMoney(depositOpen)})`
                        : "Amount cannot exceed remaining due"
                    );
                    return;
                  }

                  const payload: {
                    index: number;
                    amount: number;
                    month?: string;
                    paymentMethod: "cash" | "bank";
                  } = {
                    index: pendingCash.index,
                    amount,
                    paymentMethod: pendingCash.paymentMethod,
                  };
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
                className="inline-flex min-w-[8.5rem] items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {payByCashMutation.isPending
                  ? "Recording…"
                  : pendingCash.paymentMethod === "bank"
                    ? "Confirm bank"
                    : "Confirm cash"}
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {archiveConfirmOpen && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Archive tenant?</h3>
            <p className="mb-3 text-sm text-gray-400">
              <span className="text-gray-200">{getTenantDisplayName(selectedTenant)}</span> at{" "}
              <span className="text-gray-200">{getPropertyDisplay(selectedTenant)}</span> will be
              moved to the archived list.
            </p>
            <ul className="mb-5 list-disc space-y-1.5 pl-5 text-sm text-gray-500">
              <li>No new rent months will be created.</li>
              <li>Payment history and bank links are kept.</li>
              <li>You can restore them anytime from Show archived.</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setArchiveConfirmOpen(false)}
                disabled={archiveTenantMutation.isPending}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmArchiveTenant}
                disabled={archiveTenantMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-gray-500 bg-gray-800/70 px-4 py-2 text-sm text-gray-100 hover:bg-gray-700/80 disabled:opacity-60"
              >
                <Archive className="h-4 w-4" />
                {archiveTenantMutation.isPending ? "Archiving…" : "Archive tenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {removeLineItemConfirm && selectedTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">
              Remove {removeLineItemConfirm.itemType}?
            </h3>
            <p className="mb-5 text-sm text-gray-400">
              Are you sure you want to remove this{" "}
              <span className="text-gray-200">{removeLineItemConfirm.itemType}</span>
              {removeLineItemConfirm.label ? (
                <>
                  {" "}
                  (<span className="text-gray-200">{removeLineItemConfirm.label}</span>)
                </>
              ) : null}
              ? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemoveLineItemConfirm(null)}
                disabled={removeLineItemMutation.isPending}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveLineItem}
                disabled={removeLineItemMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-rose-700 bg-rose-900/40 px-4 py-2 text-sm text-rose-200 hover:bg-rose-900/60 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {removeLineItemMutation.isPending ? "Removing…" : "Remove"}
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
                <DateInput
                  value={assignMoveIn}
                  onChange={(moveIn) => {
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
                    if (!e.target.checked) {
                      setAssignDeposit("");
                      setAssignDepositPaid("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                />
                Record deposit
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Security deposit only — enter the date it was paid in. Does not affect rent.
              </p>
              {assignHasDeposit && (
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm text-gray-200">Deposit amount (£)</label>
                    <input
                      value={assignDeposit}
                      onChange={(e) => setAssignDeposit(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="e.g. 780"
                      className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-200">Deposit paid date</label>
                    <DateInput
                      value={assignDepositPaid}
                      onChange={setAssignDepositPaid}
                      className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    />
                  </div>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedTenant.tenancyStatus === "vacant" ? "Edit room" : "Edit tenant"}
                </h3>
                <p className="mt-1 text-sm text-gray-400">{getPropertyDisplay(selectedTenant)}</p>
              </div>
              <button onClick={() => closeEditTenantModal()} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <label className="mb-1.5 block text-base text-gray-200">Tenant name</label>
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
                      className="flex-1 rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      placeholder="Name"
                    />
                    <button
                      type="button"
                      onClick={addEditName}
                      className="rounded-full border border-emerald-700 px-4 py-2.5 text-sm text-emerald-300 hover:bg-[#0b1510]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editTenantNames.map((name, index) => (
                      <div key={`${name}-${index}`} className="flex items-center gap-2 rounded-full border border-[#222] bg-[#0b0b0b] px-3 py-1.5 text-sm">
                        <span className="text-gray-200">{name}</span>
                        <button
                          type="button"
                          onClick={() => setEditTenantNames((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-gray-400 hover:text-white"
                          aria-label={`Remove ${name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {editTenantNames.length === 0 && !currentEditName.trim() && (
                    <p className="mt-2 text-sm text-amber-400">Add at least one name.</p>
                  )}
                </div>
              )}

              {showRoomEditField(selectedTenant) && (
                <div>
                  <label className="mb-1.5 block text-base text-gray-200">Room</label>
                  <input
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    placeholder="e.g. Room 3"
                  />
                </div>
              )}

              {selectedTenant.tenancyStatus !== "vacant" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-base text-gray-200">Move-in date</label>
                    <DateInput
                      value={editMoveIn}
                      onChange={(next) => {
                        setEditMoveIn(next);
                        if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) {
                          const [y, m] = next.split("-").map(Number);
                          const maxDay = new Date(y, m, 0).getDate();
                          setEditDueOn((d) => Math.min(d, maxDay));
                        }
                      }}
                      disabled={!canEditScheduleFields(selectedTenant)}
                      className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-base text-gray-200">Rent due day</label>
                    <select
                      value={editDueOn}
                      onChange={(e) => setEditDueOn(Number(e.target.value) || 1)}
                      disabled={!canEditScheduleFields(selectedTenant)}
                      className="w-full rounded-lg border border-[#2A2A2A] bg-[#111] px-3 py-2.5 text-base text-gray-100 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  {!canEditScheduleFields(selectedTenant) && (
                    <p className="text-sm text-amber-400 sm:col-span-2">
                      Move-in and due day are locked after payments.
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
                  labelClass="mb-1.5 block text-base text-gray-200"
                  inputClass="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}

              {selectedTenant.tenancyStatus !== "vacant" && (
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-base text-gray-200">
                    <input
                      type="checkbox"
                      checked={editHasDeposit}
                      onChange={(e) => {
                        setEditHasDeposit(e.target.checked);
                        if (!e.target.checked) {
                          setEditDeposit("");
                          setEditDepositPaid("");
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                    />
                    Record deposit
                  </label>
                  {editHasDeposit && (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-base text-gray-200">Deposit (£)</label>
                        <input
                          value={editDeposit}
                          onChange={(e) => setEditDeposit(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder="200"
                          className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-base text-gray-200">Paid on</label>
                        <DateInput
                          value={editDepositPaid}
                          onChange={setEditDepositPaid}
                          className="w-full rounded-lg border border-[#2A2A2A] bg-transparent px-3 py-2.5 text-base text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => closeEditTenantModal()}
                  className="rounded-full border border-[#2A2A2A] px-5 py-2.5 text-base text-gray-300 hover:bg-white/5"
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
                  className="rounded-full bg-emerald-500 px-5 py-2.5 text-base font-medium text-black hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
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
                      ? `£${Number(editDeposit).toFixed(2)}${
                          editDepositPaid ? ` (paid ${editDepositPaid})` : ""
                        }`
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

      {adjustmentOpen && selectedTenant && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:items-center">
          <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#0B0B0B] p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingLineItem
                    ? `Edit ${editingLineItem.type}`
                    : "Add charge, discount or refund"}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {editingLineItem
                    ? `Updates the amount on ${editingLineItem.monthLabel}'s rent row.`
                    : "Charges add to that month's rent (e.g. April £690 + £30 keys = £720). Discounts and refunds reduce what's owed — no fake credit or arrears."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentOpen(false);
                  setEditingLineItem(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {(
                [
                  { id: "charge", label: "Charge" },
                  { id: "discount", label: "Discount" },
                  { id: "refund", label: "Refund" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!!editingLineItem}
                  onClick={() => setAdjustmentType(opt.id)}
                  className={`rounded-full border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                    adjustmentType === opt.id
                      ? opt.id === "charge"
                        ? "border-sky-700 bg-sky-950/50 text-sky-300"
                        : opt.id === "discount"
                          ? "border-amber-700 bg-amber-950/40 text-amber-300"
                          : "border-rose-700 bg-rose-950/40 text-rose-300"
                      : "border-[#2A2A2A] text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-gray-400">
                Date recorded
                <DateInput
                  value={adjustmentDate}
                  onChange={setAdjustmentDate}
                  className="mt-1 w-full rounded-lg border border-[#222] bg-[#050505] px-3 py-2 text-gray-200"
                />
                <span className="mt-1 block text-[11px] text-gray-500">
                  When this was added (for your records only). Not a due date — the month&apos;s rent due date stays the same.
                </span>
              </label>
              <label className="block text-sm text-gray-400">
                Amount (£)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="30.00"
                  className="mt-1 w-full rounded-lg border border-[#222] bg-[#050505] px-3 py-2 text-gray-200"
                />
              </label>
              <label className="block text-sm text-gray-400">
                Description / Purpose
                <textarea
                  value={adjustmentDescription}
                  onChange={(e) => setAdjustmentDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    adjustmentType === "charge"
                      ? "e.g. Key replacement"
                      : adjustmentType === "discount"
                        ? "e.g. Discount for leak fixing"
                        : "e.g. Partial refund"
                  }
                  className="mt-1 w-full rounded-lg border border-[#222] bg-[#050505] px-3 py-2 text-gray-200"
                />
              </label>
              <label className="block text-sm text-gray-400">
                {editingLineItem
                  ? "Applied to month"
                  : adjustmentType === "charge"
                    ? "Apply to month"
                    : "Link to month (optional)"}
                <input
                  type="month"
                  value={adjustmentMonthLink}
                  onChange={(e) => setAdjustmentMonthLink(e.target.value)}
                  required={!editingLineItem && adjustmentType === "charge"}
                  disabled={!!editingLineItem}
                  className="mt-1 w-full rounded-lg border border-[#222] bg-[#050505] px-3 py-2 text-gray-200 disabled:opacity-60"
                />
                <span className="mt-1 block text-[11px] text-gray-500">
                  {editingLineItem
                    ? "Month can’t be changed here — remove and re-add to move it."
                    : adjustmentType === "charge"
                      ? "Adds this amount onto that month’s rent — no extra row."
                      : "Prefer applying a discount/refund against this month first."}
                </span>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentOpen(false);
                  setEditingLineItem(null);
                }}
                className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  addAdjustmentMutation.isPending || updateLineItemMutation.isPending
                }
                onClick={() => {
                  const amt = Number(adjustmentAmount);
                  if (!(amt > 0)) {
                    toast.error("Enter a positive amount");
                    return;
                  }
                  if (!adjustmentDescription.trim()) {
                    toast.error("Add a description");
                    return;
                  }
                  if (editingLineItem) {
                    updateLineItemMutation.mutate(
                      {
                        tenantId: selectedTenant._id,
                        rentEntryId: editingLineItem.rentEntryId,
                        lineItemId: editingLineItem.lineItemId,
                        payload: {
                          amount: amt,
                          description: adjustmentDescription.trim(),
                          date: adjustmentDate || undefined,
                        },
                      },
                      {
                        onSuccess: (res) => {
                          if (res?.data) setSelectedTenant(res.data);
                          setAdjustmentOpen(false);
                          setEditingLineItem(null);
                        },
                      }
                    );
                    return;
                  }
                  if (adjustmentType === "charge" && !adjustmentMonthLink) {
                    toast.error("Pick which month this charge adds to");
                    return;
                  }
                  addAdjustmentMutation.mutate(
                    {
                      tenantId: selectedTenant._id,
                      payload: {
                        type: adjustmentType,
                        amount: amt,
                        description: adjustmentDescription.trim(),
                        date: adjustmentDate || undefined,
                        monthLink: adjustmentMonthLink
                          ? `${adjustmentMonthLink}-01`
                          : null,
                      },
                    },
                    {
                      onSuccess: (res) => {
                        if (res?.data) setSelectedTenant(res.data);
                        setAdjustmentOpen(false);
                        setEditingLineItem(null);
                      },
                    }
                  );
                }}
                className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-black hover:brightness-105 disabled:opacity-50"
              >
                {addAdjustmentMutation.isPending || updateLineItemMutation.isPending
                  ? "Saving…"
                  : editingLineItem
                    ? "Save"
                    : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewTenantModal open={newTenantOpen} onClose={() => setNewTenantOpen(false)} />
    </div>
  );
}
