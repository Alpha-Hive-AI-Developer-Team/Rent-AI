"use client";

import { useState, useEffect } from "react";
import useAdminLandlords, {
  useLandlordTenants,
  useTenantTransactions,
  useExpenses,
  useIncomeSummary,
  useCreateExpense,
  useUpdateLandlordStatus,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Search,
  Plus,
  X,
  ChevronLeft,
  Building2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import CustomTable from "@/components/admin/custom-table";
import TenantRentHistoryTable from "@/components/tenants/TenantRentHistoryTable";
import { formatDate } from "@/lib/utils";

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "LL";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LandlordManagement() {
  const [planFilter, setPlanFilter] = useState("All Plan");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ search?: string; plan?: string; status?: string }>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null);

  const { data: adminResp, isLoading: adminLoading, error: adminError } = useAdminLandlords({ ...appliedFilters, page, limit });
  const { data: tenantsResp, isLoading: tenantsLoading, error: tenantsError } = useLandlordTenants(selectedLandlordId || undefined);
  const updateLandlordStatusMutation = useUpdateLandlordStatus();
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    name: string;
    nextStatus: "active" | "disable";
  } | null>(null);

  const confirmChangeStatus = () => {
    if (!statusConfirm) return;
    updateLandlordStatusMutation.mutate(
      { id: statusConfirm.id, status: statusConfirm.nextStatus },
      {
        onSuccess: () => {
          toast.success(
            statusConfirm.nextStatus === "active"
              ? "Landlord account activated"
              : "Landlord account disabled"
          );
          setStatusConfirm(null);
          if (
            selectedLandlord &&
            String(selectedLandlord.id) === String(statusConfirm.id)
          ) {
            setSelectedLandlord({
              ...selectedLandlord,
              status: statusConfirm.nextStatus,
            });
          }
        },
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to update landlord status"
          ),
      }
    );
  };

  // keep UI controls (search, dropdown labels) in sync with appliedFilters
  useEffect(() => {
    if (!appliedFilters) return;
    setSearch(appliedFilters.search || "");
    setPlanFilter(appliedFilters.plan ? String(appliedFilters.plan) : "All Plan");
    setStatusFilter(appliedFilters.status ? String(appliedFilters.status) : "All Status");
  }, [appliedFilters]);

  // Debounce search input — update appliedFilters after user stops typing
  useEffect(() => {
    const handle = setTimeout(() => {
      const p = planFilter === "All Plan" ? undefined : String(planFilter).toLowerCase();
      const s = statusFilter === "All Status" ? undefined : String(statusFilter).toLowerCase();
      // reset to first page when filters/search change
      setPage(1);
      setAppliedFilters({ search: search || undefined, plan: p, status: s });
    }, 500);

    return () => clearTimeout(handle);
  }, [search, planFilter, statusFilter]);

  // when page or limit changes, update appliedFilters to trigger refetch
  useEffect(() => {
    const p = planFilter === "All Plan" ? undefined : String(planFilter).toLowerCase();
    const s = statusFilter === "All Status" ? undefined : String(statusFilter).toLowerCase();
    setAppliedFilters({ search: search || undefined, plan: p, status: s });
  }, [page, limit]);

  // derive landlords directly from hook response (no local state)
  const landlords = (adminResp?.data || []).map((l: any) => ({
    id: l._id,
    name: l.name,
    email: l.email,
    plan: (String(l.planType || "free")).toLowerCase(),
    tenants: l.tenantsCount || 0,
    status: (String(l.status || "active")).toLowerCase(),
    created: formatDate(l.createdAt),
    addresses: l.addresses || [],
  }));

  const totalLandlords: number = Number(adminResp?.total || 0);
  const totalPages = Math.max(1, Math.ceil(totalLandlords / limit));

  const startIndex = totalLandlords === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalLandlords);
  const totalText = totalLandlords === 0
    ? `Showing 0 results`
    : page === 1 && totalLandlords <= limit
    ? `Showing ${totalLandlords} results`
    : `Showing ${startIndex} to ${endIndex} of ${totalLandlords} results`;

  const getBadgeColor = (type: string, value: string) => {
    const val = String(value || "").toLowerCase();
    const map: Record<string, Record<string, string>> = {
      plan: {
        free: "bg-white/5 text-gray-300 border border-gray-800",
        starter: "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40",
        pro: "bg-purple-950/40 text-purple-400 border border-purple-700/40",
        enterprise: "bg-amber-950/40 text-amber-400 border border-amber-700/40",
      },
      status: {
        active: "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40",
        disable: "bg-rose-950/40 text-rose-400 border border-rose-800/40",
      },
    };

    return map[type]?.[val] || "bg-gray-800 text-gray-400";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row: any) => (
        <button
          onClick={() => handleOpenLandlord(row)}
          className="flex items-center gap-3 text-left w-full hover:opacity-90 transition group"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-800/40 to-teal-900/40 border border-emerald-600/30 text-emerald-300 font-semibold text-xs shrink-0">
            {getInitials(row.name)}
          </div>
          <span className="text-gray-200 group-hover:text-emerald-400 font-medium transition truncate max-w-[200px]">
            {row.name}
          </span>
        </button>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "plan",
      label: "Plan",
      render: (row: any) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getBadgeColor(
            "plan",
            row.plan
          )}`}
        >
          {row.plan}
        </span>
      ),
    },
    { key: "tenants", label: "Tenants" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getBadgeColor(
            "status",
            row.status
          )}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.status === "active" ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
          {row.status === "disable" ? "Disabled" : row.status}
        </span>
      ),
    },
    { key: "created", label: "Created" },
    {
      key: "actions",
      label: "Actions",
      render: (row: any) => {
        const isActive = row.status === "active";
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
                  aria-label="Landlord actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#141414] border border-gray-800 text-gray-200 rounded-xl shadow-xl min-w-[160px] p-1 z-50"
              >
                {isActive ? (
                  <DropdownMenuItem
                    onClick={() =>
                      setStatusConfirm({
                        id: String(row.id),
                        name: row.name || row.email,
                        nextStatus: "disable",
                      })
                    }
                    className="cursor-pointer text-rose-400 hover:bg-rose-950/30 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Disable Account</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      setStatusConfirm({
                        id: String(row.id),
                        name: row.name || row.email,
                        nextStatus: "active",
                      })
                    }
                    className="cursor-pointer text-emerald-400 hover:bg-emerald-950/30 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Activate Account</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);

  const modalAddresses: any[] = (tenantsResp && Array.isArray(tenantsResp.data)) ? tenantsResp.data : (selectedLandlord?.addresses || []);
  const currentTenants = modalAddresses[selectedAddressIndex || 0]?.tenants || [];
  const currentAddress: string = (modalAddresses[selectedAddressIndex || 0]?.address || modalAddresses[selectedAddressIndex || 0]?.property || "");

  // Tenant modal state (rendered inside same modal)
  const [modalView, setModalView] = useState<"landlord" | "tenant">("landlord");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string | null>(null);

  const { data: tenantDetails, isLoading: tenantLoading, error: tenantError } = useTenantTransactions(selectedTenantId || undefined);

  const openTenant = (tenant: any) => {
    const name = Array.isArray(tenant.tenantName) ? tenant.tenantName.join(" ") : tenant.name || tenant.tenantName;
    setSelectedTenantName(name || "Tenant");
    setSelectedTenantId(tenant._id || tenant.id || null);
    setModalView("tenant");
  };

  // Manual expenses state and inputs
  const [manualExpenses, setManualExpenses] = useState<Array<{ desc: string; amount: number }>>([]);
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const createExpenseMutation = useCreateExpense();

  const { data: expensesResp } = useExpenses({ landlordId: selectedLandlordId || undefined, address: currentAddress || undefined, page: 1, limit: 100 });
  const { data: incomeSummaryResp } = useIncomeSummary({ landlordId: selectedLandlordId || undefined, address: currentAddress || "" });

  const addExpense = () => {
    const amt = Number(String(newExpenseAmount).replace(/[^0-9.-]+/g, "")) || 0;
    const desc = String(newExpenseDesc || "").trim();
    if (!desc || amt <= 0) {
      toast.error("Provide a description and positive amount.");
      return;
    }
    
    if (!selectedLandlordId || !currentAddress) {
      toast.error("Select an address before adding an expense.");
      return;
    }
  
    createExpenseMutation.mutate(
      { landlordId: selectedLandlordId, address: currentAddress, description: desc, amount: amt },
      {
        onSuccess: () => {
          setNewExpenseDesc("");
          setNewExpenseAmount("");
          toast.success("Expense saved and totals updated.");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || "Failed to add expense";
          toast.error(msg);
        },
      }
    );
  };

  const handleOpenLandlord = (landlord: any) => {
    setSelectedLandlord(landlord);
    setSelectedAddressIndex(0);
    setManualExpenses([]);
    setNewExpenseDesc("");
    setNewExpenseAmount("");
    setModalView("landlord");
    setSelectedTenantId(null);
    setSelectedTenantName(null);
    setSelectedLandlordId(landlord.id || landlord._id || null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen text-white space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Landlord Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Manage all landlord and agency accounts, inspect property portfolios, and review tenant ledgers
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] border border-gray-800/70 rounded-xl p-3 sm:p-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            placeholder="Search landlords by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161616] border border-gray-800 text-xs sm:text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plan Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-3.5 rounded-xl bg-[#161616] border border-gray-800 text-gray-300 hover:text-white hover:bg-white/5 flex items-center justify-between gap-2 text-xs sm:text-sm transition"
              >
                <span>Plan: <strong className="text-white font-medium capitalize">{planFilter}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#141414] border border-gray-800 text-gray-300 rounded-xl shadow-xl min-w-[140px] p-1 z-50"
              align="start"
              sideOffset={4}
            >
              {["All Plan", "free", "starter", "pro", "enterprise"].map((plan) => (
                <DropdownMenuItem
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                  className="hover:bg-white/5 cursor-pointer rounded-lg text-xs sm:text-sm px-3 py-2 capitalize"
                >
                  {plan === "All Plan" ? "All Plans" : plan}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-3.5 rounded-xl bg-[#161616] border border-gray-800 text-gray-300 hover:text-white hover:bg-white/5 flex items-center justify-between gap-2 text-xs sm:text-sm transition"
              >
                <span>Status: <strong className="text-white font-medium capitalize">{statusFilter}</strong></span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-[#141414] border border-gray-800 text-gray-300 rounded-xl shadow-xl min-w-[140px] p-1 z-50"
              align="start"
              sideOffset={4}
            >
              {["All Status", "active", "disable"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="hover:bg-white/5 cursor-pointer rounded-lg text-xs sm:text-sm px-3 py-2 capitalize"
                >
                  {status === "All Status" ? "All Statuses" : status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            className="h-10 px-4 rounded-xl bg-[#027A48] hover:bg-[#02653d] text-white text-xs sm:text-sm font-medium transition active:scale-95"
            onClick={() => {
              const p = planFilter === "All Plan" ? undefined : String(planFilter).toLowerCase();
              const s = statusFilter === "All Status" ? undefined : String(statusFilter).toLowerCase();
              setAppliedFilters({ search: search || undefined, plan: p, status: s });
            }}
          >
            Apply
          </Button>
        </div>
      </div>


      {/* Table */}
      <CustomTable
        data={landlords}
        columns={columns}
        total={totalText}
        pagination={{
          page,
          pageSize: limit,
          total: totalLandlords,
          onPageChange: (p: number) => setPage(Math.max(1, Math.min(totalPages, Number(p)))),
          onPageSizeChange: (n: number) => {
            setLimit(n);
            setPage(1);
          },
        }}
      />

      {/* Status confirmation modal */}
      {statusConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  statusConfirm.nextStatus === "disable"
                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    : "bg-[#027A48]/15 border border-[#027A48]/30 text-emerald-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {statusConfirm.nextStatus === "disable"
                    ? "Disable Landlord Account"
                    : "Reactivate Landlord Account"}
                </h3>
                <p className="text-xs text-gray-400">Confirm account access change</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed bg-[#161616] p-3.5 rounded-xl border border-gray-800/60">
              {statusConfirm.nextStatus === "disable" ? (
                <>
                  Are you sure you want to disable access for{" "}
                  <strong className="text-white">{statusConfirm.name}</strong>?
                  They will be signed out and cannot log in until reactivated.
                </>
              ) : (
                <>
                  Are you sure you want to activate access for{" "}
                  <strong className="text-white">{statusConfirm.name}</strong>?
                  They will be able to sign in again.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmChangeStatus}
                disabled={updateLandlordStatusMutation.isPending}
                className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-medium transition active:scale-95 disabled:opacity-50 ${
                  statusConfirm.nextStatus === "disable"
                    ? "bg-rose-700 hover:bg-rose-600 shadow-sm shadow-rose-900/30"
                    : "bg-[#027A48] hover:bg-[#02653d] shadow-sm shadow-[#027A48]/30"
                }`}
              >
                {updateLandlordStatusMutation.isPending
                  ? "Updating..."
                  : statusConfirm.nextStatus === "disable"
                  ? "Disable Account"
                  : "Activate Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Landlord details modal */}
      {selectedLandlord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#111] text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-800/80 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-base sm:text-lg font-semibold">{selectedLandlord.name}</h3>
                <p className="mt-0.5 truncate text-xs sm:text-sm text-gray-400">
                  {selectedLandlord.email || "Landlord details"}
                  {selectedLandlord.plan ? ` · ${String(selectedLandlord.plan).toUpperCase()}` : ""}
                  {selectedLandlord.status
                    ? ` · ${selectedLandlord.status === "disable" ? "Disabled" : "Active"}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-9 px-3 rounded-xl text-xs border ${
                    selectedLandlord.status === "active"
                      ? "border-rose-800/60 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300"
                      : "border-emerald-700/50 text-emerald-400 hover:bg-emerald-950/30 hover:text-emerald-300"
                  }`}
                  onClick={() =>
                    setStatusConfirm({
                      id: String(selectedLandlord.id),
                      name: selectedLandlord.name || selectedLandlord.email,
                      nextStatus:
                        selectedLandlord.status === "active" ? "disable" : "active",
                    })
                  }
                >
                  {selectedLandlord.status === "active"
                    ? "Disable Account"
                    : "Activate Account"}
                </Button>
                <button
                  onClick={() => {
                    setSelectedLandlord(null);
                    setSelectedLandlordId(null);
                    setModalView("landlord");
                    setSelectedTenantId(null);
                    setSelectedTenantName(null);
                  }}
                  className="rounded-xl p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-12 overflow-hidden">
              {modalView === "landlord" && (
                <div className="border-b border-gray-800/80 md:col-span-4 md:border-b-0 md:border-r md:border-gray-800/80">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-800/60 bg-[#0c0c0c]">
                    Portfolio Properties
                  </div>
                  <div className="max-h-[28vh] space-y-2 overflow-y-auto px-3 py-3 md:max-h-[calc(90vh-8rem)] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {tenantsLoading ? (
                      <div className="px-2 py-8 text-center text-xs text-gray-400">Loading properties…</div>
                    ) : modalAddresses.length === 0 ? (
                      <div className="px-2 py-8 text-center text-xs text-gray-400">No properties recorded</div>
                    ) : (
                      modalAddresses.map((addr: any, i: number) => (
                        <button
                          key={addr.id || `${i}`}
                          onClick={() => setSelectedAddressIndex(i)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            selectedAddressIndex === i
                              ? "border-[#027A48] bg-[#027A48]/15 text-white"
                              : "border-gray-800/80 bg-[#161616] text-gray-300 hover:border-gray-700 hover:text-white"
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-medium truncate">
                            {addr.address || addr.property}
                          </div>
                          <div className="mt-1 text-[11px] text-gray-400">
                            {(addr.tenants || []).length} tenant
                            {(addr.tenants || []).length === 1 ? "" : "s"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div
                className={`min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  modalView === "landlord" ? "md:col-span-8" : "md:col-span-12"
                }`}
              >
                {modalView === "landlord" ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-white truncate max-w-[400px]">
                          {currentAddress || "Tenants"}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Click a tenant row to inspect their rent transaction ledger (read-only audit)
                        </p>
                      </div>
                    </div>

                    {modalAddresses.length === 0 ? (
                      <div className="rounded-xl border border-gray-800 bg-[#161616] px-4 py-10 text-center text-xs text-gray-400">
                        No tenants found
                      </div>
                    ) : currentTenants.length === 0 ? (
                      <div className="rounded-xl border border-gray-800 bg-[#161616] px-4 py-10 text-center text-xs text-gray-400">
                        No tenants registered for this property
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto rounded-xl border border-gray-800/80 bg-[#161616] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <table className="min-w-full text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-gray-800 bg-[#0c0c0c] text-left text-gray-400 font-medium text-[11px] uppercase tracking-wider">
                              <th className="px-4 py-3">Tenant Name</th>
                              <th className="px-4 py-3">Rent</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Last Payment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {currentTenants.map((t: any) => {
                              const statusRaw = String(
                                t.status ||
                                  (t.rentHistory && t.rentHistory[0] ? t.rentHistory[0].status : "") ||
                                  ""
                              ).toLowerCase();
                              const isPaid = statusRaw === "paid";
                              const isPartial = statusRaw === "partial";
                              const isUnpaid = statusRaw === "unpaid";

                              const statusClass = isPaid
                                ? "border-emerald-700/40 bg-emerald-950/40 text-emerald-400"
                                : isPartial
                                ? "border-amber-700/40 bg-amber-950/40 text-amber-400"
                                : isUnpaid
                                ? "border-rose-800/40 bg-rose-950/40 text-rose-400"
                                : "border-gray-800 bg-white/5 text-gray-400";

                              const rentVal = Number(t.rent) || 0;
                              return (
                                <tr
                                  key={t._id || t.id}
                                  onClick={() => openTenant(t)}
                                  className="cursor-pointer hover:bg-white/5 transition"
                                >
                                  <td className="px-4 py-3 text-white font-medium">
                                    {Array.isArray(t.tenantName)
                                      ? t.tenantName.join(" ")
                                      : t.name || t.tenantName}
                                  </td>
                                  <td className="px-4 py-3 tabular-nums text-gray-200">
                                    {rentVal
                                      ? `£${rentVal.toLocaleString(undefined, {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 2,
                                        })}`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}
                                    >
                                      {statusRaw || "—"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-400">
                                    {formatDate(t.lastPayment)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Financial Summary & Expense Tool */}
                    <div className="rounded-xl border border-gray-800/80 bg-[#161616] p-4 space-y-4">
                      {(() => {
                        const gross = Number(incomeSummaryResp?.data?.grossIncome || 0);
                        const totalExpenses = Number(incomeSummaryResp?.data?.totalExpenses || 0);
                        const net = Number(
                          incomeSummaryResp?.data?.netIncome || gross - totalExpenses
                        );
                        const fmt = (n: number) =>
                          `£${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                              <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                                <div className="text-[11px] text-gray-400 font-medium">Total Gross Income</div>
                                <div className="mt-1 text-sm sm:text-base font-bold text-white tabular-nums">{fmt(gross)}</div>
                              </div>
                              <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                                <div className="text-[11px] text-gray-400 font-medium">Total Expenses</div>
                                <div className="mt-1 text-sm sm:text-base font-bold text-rose-400 tabular-nums">
                                  {fmt(totalExpenses)}
                                </div>
                              </div>
                              <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] px-3.5 py-3">
                                <div className="text-[11px] text-gray-400 font-medium">Net Income</div>
                                <div className="mt-1 text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                                  {fmt(net)}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-800/80 pt-4 space-y-3">
                              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Record Property Expense
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  placeholder="Expense description..."
                                  value={newExpenseDesc}
                                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                                  className="bg-[#0c0c0c] border border-gray-800 text-xs sm:text-sm text-white rounded-xl focus:border-[#027A48]"
                                />
                                <Input
                                  placeholder="Amount (e.g. 120.00)"
                                  value={newExpenseAmount}
                                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                                  className="w-full bg-[#0c0c0c] border border-gray-800 text-xs sm:text-sm text-white sm:w-44 rounded-xl focus:border-[#027A48]"
                                />
                                <Button
                                  onClick={addExpense}
                                  className="bg-[#027A48] hover:bg-[#02653d] text-white text-xs sm:text-sm font-medium rounded-xl px-5 transition active:scale-95"
                                >
                                  Add
                                </Button>
                              </div>

                              {Array.isArray(expensesResp?.data) && expensesResp!.data.length > 0 && (
                                <div className="space-y-2 pt-2">
                                  <div className="text-xs text-gray-400 font-medium">Manual Expenses Log</div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {expensesResp!.data.map((ex: any, i: number) => (
                                      <div
                                        key={ex._id || i}
                                        className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-[#0c0c0c] px-3 py-2 text-xs"
                                      >
                                        <div className="text-gray-200">{ex.description}</div>
                                        <div className="tabular-nums font-semibold text-rose-400">
                                          {fmt(Number(ex.amount || 0))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-800/60">
                      <div>
                        <button
                          onClick={() => {
                            setModalView("landlord");
                            setSelectedTenantId(null);
                            setSelectedTenantName(null);
                          }}
                          className="mb-2 inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition"
                        >
                          <ChevronLeft className="h-4 w-4" /> Back to property tenants
                        </button>
                        <h4 className="text-base font-semibold text-white">
                          {selectedTenantName} — Rent Ledger
                        </h4>
                        {currentAddress ? (
                          <p className="text-xs text-gray-400">{currentAddress}</p>
                        ) : null}
                      </div>
                    </div>

                    {tenantError ? (
                      <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-8 text-center text-rose-400 text-xs sm:text-sm">
                        Failed to load rent history ledger.
                      </div>
                    ) : (
                      <div className="overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <TenantRentHistoryTable
                          tenantId={selectedTenantId}
                          tenant={tenantDetails}
                          rentHistory={tenantDetails?.rentHistory}
                          loading={tenantLoading}
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
