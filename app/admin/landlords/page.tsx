"use client";

import { useState, useEffect } from "react";
import useAdminLandlords, {
  useUpdateLandlordStatus,
} from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Search,
  X,
  Building2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  History,
} from "lucide-react";
import CustomTable from "@/components/admin/custom-table";
import { formatDate } from "@/lib/utils";
import { useAuthUser } from "@/redux/useAuthUser";
import { useStartImpersonation } from "@/hooks/useImpersonation";
import ImpersonationActivityModal from "@/components/admin/ImpersonationActivityModal";

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "LL";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function LandlordManagement() {
  const authUser = useAuthUser();
  const isSuperAdmin = String(authUser?.role || "") === "superAdmin";
  const startImpersonation = useStartImpersonation();

  const [planFilter, setPlanFilter] = useState("All Plan");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ search?: string; plan?: string; status?: string }>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const { data: adminResp, isLoading: adminLoading, error: adminError } = useAdminLandlords({ ...appliedFilters, page, limit });
  const updateLandlordStatusMutation = useUpdateLandlordStatus();
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    name: string;
    nextStatus: "active" | "disable";
  } | null>(null);
  const [loginAsConfirm, setLoginAsConfirm] = useState<{
    id: string;
    name: string;
    email?: string;
  } | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityLandlord, setActivityLandlord] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openActivity = (landlord?: { id: string; name: string } | null) => {
    setActivityLandlord(landlord || null);
    setActivityOpen(true);
  };

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
        <div className="flex items-center gap-3 text-left w-full">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-800/40 to-teal-900/40 border border-emerald-600/30 text-emerald-300 font-semibold text-xs shrink-0">
            {getInitials(row.name)}
          </div>
          <span className="text-gray-200 font-medium truncate max-w-[200px]">
            {row.name}
          </span>
        </div>
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
                className="bg-[#141414] border border-gray-800 text-gray-200 rounded-xl shadow-xl min-w-[180px] p-1 z-50"
              >
                {isActive && (
                  <DropdownMenuItem
                    onClick={() =>
                      setLoginAsConfirm({
                        id: String(row.id),
                        name: row.name || row.email,
                        email: row.email,
                      })
                    }
                    className="cursor-pointer text-emerald-300 hover:bg-emerald-950/30 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log in as</span>
                  </DropdownMenuItem>
                )}
                {isSuperAdmin && (
                  <DropdownMenuItem
                    onClick={() =>
                      openActivity({
                        id: String(row.id),
                        name: row.name || row.email,
                      })
                    }
                    className="cursor-pointer text-gray-200 hover:bg-white/5 rounded-lg text-xs px-3 py-2 flex items-center gap-2"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View activity</span>
                  </DropdownMenuItem>
                )}
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
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => openActivity(null)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-700 bg-[#161616] px-3.5 text-xs sm:text-sm font-medium text-gray-200 hover:bg-white/10 hover:text-white transition"
          >
            <History className="w-4 h-4 text-emerald-400" />
            Login-as activity
          </button>
        )}
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

      {/* Log in as confirmation */}
      {loginAsConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111] border border-gray-800 rounded-2xl p-6 text-white shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#027A48]/15 border border-[#027A48]/30 text-emerald-400">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Log in as landlord</h3>
                <p className="text-xs text-gray-400">Open their account with support controls</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-6 leading-relaxed bg-[#161616] p-3.5 rounded-xl border border-gray-800/60">
              Open <strong className="text-white">{loginAsConfirm.name}</strong>
              {loginAsConfirm.email ? ` (${loginAsConfirm.email})` : ""}? You can edit tenants, rents, and
              payments. Bank link, payouts, and subscription changes stay locked.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLoginAsConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={startImpersonation.isPending}
                onClick={() => {
                  const [firstName, ...rest] = String(loginAsConfirm.name || "").trim().split(/\s+/);
                  startImpersonation.mutate({
                    landlordId: loginAsConfirm.id,
                    landlordHint: {
                      id: loginAsConfirm.id,
                      firstName: firstName || loginAsConfirm.name,
                      lastName: rest.join(" ") || undefined,
                      email: loginAsConfirm.email,
                    },
                  });
                }}
                className="px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-medium transition active:scale-95 disabled:opacity-50 bg-[#027A48] hover:bg-[#02653d]"
              >
                {startImpersonation.isPending ? "Opening…" : "Log in as"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <ImpersonationActivityModal
          open={activityOpen}
          onClose={() => {
            setActivityOpen(false);
            setActivityLandlord(null);
          }}
          initialLandlordId={activityLandlord?.id || null}
          initialLandlordName={activityLandlord?.name || null}
        />
      )}

    </div>
  );
}