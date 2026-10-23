"use client";

import { useState, useEffect } from "react";
import useAdminLandlords, { useAllTenants, useTenantTransactions, useTenantStats } from "@/hooks/useAdmin";
import StatCard from "@/components/admin/analytics-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronDown, X } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";
import TenantRentHistoryTable from "@/components/tenants/TenantRentHistoryTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "TN";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TenantManagement() {
  // fetch live stats
  const { data: statsResp, isLoading: statsLoading } = useTenantStats();
  const statsData = statsResp?.data;

  const stats = [
    {
      title: "Total Tenants",
      value: statsData ? (statsData.totalTenants?.count ?? 0).toLocaleString() : "—",
      trend: statsData ? (statsData.totalTenants?.changePct ?? 0) : 0,
      description: "Total registered tenants",
      subtext: "Current month",
    },
    {
      title: "Paid On Time",
      value: statsData ? (statsData.paidOnTime?.count ?? 0).toLocaleString() : "—",
      trend: statsData ? (statsData.paidOnTime?.changePct ?? 0) : 0,
      description: "Tenants paid before due date",
      subtext: "Current month",
    },
    {
      title: "Partial Payments",
      value: statsData ? (statsData.partialPayments?.count ?? 0).toLocaleString() : "—",
      trend: statsData ? (statsData.partialPayments?.changePct ?? 0) : 0,
      description: "Tenants with partial payments",
      subtext: "Current month",
    },
    {
      title: "In Arrears",
      value: statsData ? (statsData.inArrears?.count ?? 0).toLocaleString() : "—",
      trend: statsData ? (statsData.inArrears?.changePct ?? 0) : 0,
      description: "Late payments",
      subtext: "Current month",
    },
  ];

  // Dropdown & pagination states
  const [status, setStatus] = useState("Payment Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ search?: string; status?: string }>({});
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Debounce search input (500ms) & reset to page 1 on filter/search change
  useEffect(() => {
    const handle = setTimeout(() => {
      const s = status === "Payment Status" ? undefined : (status === "Arrears" ? "unpaid" : String(status).toLowerCase());
      setPage(1);
      setAppliedFilters({ search: searchQuery ? String(searchQuery).trim() : undefined, status: s });
    }, 500);
    return () => clearTimeout(handle);
  }, [searchQuery, status]);

  // when page or limit changes, sync applied filters
  useEffect(() => {
    const s = status === "Payment Status" ? undefined : (status === "Arrears" ? "unpaid" : String(status).toLowerCase());
    setAppliedFilters({ search: searchQuery ? String(searchQuery).trim() : undefined, status: s });
  }, [page, limit]);

  // call the hook with currently applied filters and pagination
  const { data: tenantsResp, isLoading, error } = useAllTenants({ ...appliedFilters, page, limit });
  const rawTenants = tenantsResp?.data ?? [];
  const totalTenants: number = Number(tenantsResp?.total ?? tenantsResp?.count ?? (Array.isArray(rawTenants) ? rawTenants.length : 0));
  const totalPages = Math.max(1, Math.ceil(totalTenants / limit));

  // Fallback slice in case backend returned unsliced results
  const tenants = rawTenants.length > limit
    ? rawTenants.slice((page - 1) * limit, page * limit)
    : rawTenants;

  const startIndex = totalTenants === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalTenants);
  const totalText = totalTenants === 0
    ? `Showing 0 results`
    : page === 1 && totalTenants <= limit
    ? `Showing ${totalTenants} results`
    : `Showing ${startIndex} to ${endIndex} of ${totalTenants} results`;

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string | null>(null);

  const { data: tenantDetails, isLoading: tenantLoading, error: tenantError } = useTenantTransactions(selectedTenantId || undefined);

  function openTenantModal(tenant: any) {
    const name = Array.isArray(tenant.tenantName) ? tenant.tenantName.join(" ") : tenant.tenantName || tenant.tenantName;
    setSelectedTenantName(name || "Tenant");
    setSelectedTenantId(tenant._id || tenant.id || null);
    setTenantModalOpen(true);
  }

  const columns = [
    {
      key: "tenant",
      label: "Tenant Name",
      render: (row: any) => {
        const name = Array.isArray(row.tenantName) ? row.tenantName.join(" ") : row.tenantName;
        const initials = getInitials(name);
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => openTenantModal(row)} className="w-7 h-7 rounded-full bg-[#1a1a1a] text-xs flex items-center justify-center text-white hover:brightness-110">{initials}</button>
            <button onClick={() => openTenantModal(row)} className="text-left hover:underline text-sm text-gray-200">{name}</button>
          </div>
        );
      },
    },
    { key: "landlordName", label: "Landlord" },
    { key: "property", label: "Property" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const statusRaw = String(row.status || "").toLowerCase();
        const isPaid = statusRaw === "paid";
        const isPartial = statusRaw === "partial";
        const isUnpaid = statusRaw === "unpaid" || statusRaw === "arrears";

        const badgeClass = isPaid
          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40"
          : isPartial
          ? "bg-amber-950/40 text-amber-400 border border-amber-700/40"
          : isUnpaid
          ? "bg-rose-950/40 text-rose-400 border border-rose-800/40"
          : "bg-white/5 text-gray-400 border border-gray-800";

        const dotClass = isPaid
          ? "bg-emerald-400"
          : isPartial
          ? "bg-amber-400"
          : isUnpaid
          ? "bg-rose-400"
          : "bg-gray-400";

        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {row.status || "—"}
          </span>
        );
      },
    },
    {
      key: "lastPayment",
      label: "Last Payment",
      render: (row: any) => (
        <span className="text-gray-400 text-xs sm:text-sm">
          {formatDate(row.lastPayment)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-black min-h-screen text-white space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Tenant Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Monitor registered tenants, payment performance, and arrears across all landlord properties
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111] border border-gray-800/70 rounded-xl p-3 sm:p-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by landlord name or tenant..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161616] border border-gray-800 text-xs sm:text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 rounded-xl bg-[#161616] border border-gray-800 text-gray-300 hover:text-white hover:border-gray-700 flex items-center justify-between sm:justify-start gap-2 text-xs sm:text-sm transition w-full sm:w-auto"
              >
                <span>
                  Status:{" "}
                  <strong className="text-white font-medium capitalize">
                    {status === "Payment Status" ? "All" : status}
                  </strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#141414] border border-gray-800 text-gray-300 rounded-xl shadow-xl min-w-[150px] p-1 z-50"
            >
              {["Payment Status", "Paid", "Partial", "Arrears"].map((item) => (
                <DropdownMenuItem
                  key={item}
                  onClick={() => setStatus(item)}
                  className="hover:bg-white/5 cursor-pointer rounded-lg text-xs sm:text-sm px-3 py-2"
                >
                  {item === "Payment Status" ? "All Statuses" : item}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <CustomTable
        data={tenants}
        columns={columns}
        total={totalText}
        pagination={{
          page,
          pageSize: limit,
          total: totalTenants,
          onPageChange: (p: number) => setPage(Math.max(1, Math.min(totalPages, Number(p)))),
          onPageSizeChange: (n: number) => {
            setLimit(n);
            setPage(1);
          },
        }}
      />

      {/* Rent History Modal */}
      {tenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
          <div className="w-full max-w-6xl bg-[#111] border border-gray-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-start justify-between pb-4 border-b border-gray-800/80 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {selectedTenantName} — Rent History
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                  Same payment ledger view as the landlord portal (read-only audit)
                </p>
              </div>
              <button
                onClick={() => {
                  setTenantModalOpen(false);
                  setSelectedTenantId(null);
                  setSelectedTenantName(null);
                }}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {tenantError ? (
              <div className="p-8 text-center text-rose-400 text-xs sm:text-sm">
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

            <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-center justify-end">
              <button
                onClick={() => {
                  setTenantModalOpen(false);
                  setSelectedTenantId(null);
                  setSelectedTenantName(null);
                }}
                className="px-5 py-2 rounded-xl border border-gray-800 text-xs sm:text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

