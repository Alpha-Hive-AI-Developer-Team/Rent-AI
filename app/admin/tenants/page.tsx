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


  // Dropdown states
  const [landlord, setLandlord] = useState("All Landlords");
  const [status, setStatus] = useState("Payment Status");
  const [arrears, setArrears] = useState("Arrears Bucket");

  // Fetch tenants from API (with filters)
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ search?: string; status?: string }>({});

  // call the hook with currently applied filters
  const { data: tenantsResp, isLoading, error } = useAllTenants(appliedFilters);
  const tenants = tenantsResp?.data ?? [];

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

  // Debounce search input (500ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, search: searchQuery ? String(searchQuery).trim() : undefined }));
    }, 500);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Apply status filter immediately when changed
  useEffect(() => {
    const s = status === "Payment Status" ? undefined : (status === "Arrears" ? "unpaid" : String(status).toLowerCase());
    setAppliedFilters((prev) => ({ ...prev, status: s }));
  }, [status]);


  const columns = [
    {
      key: "tenant",
      label: "Tenant Name",
      render: (row: any) => {
        const name = Array.isArray(row.tenantName) ? row.tenantName.join(" ") : row.tenantName;
        const initials = (name || "").split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase();
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
        const colors: Record<string, string> = {
          paid: "bg-green-900 text-green-400",
          unpaid: "bg-red-900 text-red-400",
          partial: "bg-yellow-900 text-yellow-400",
        };
        return (
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              colors[row.status]
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "lastPayment",
      label: "Last Payment",
      render: (row: any) => formatDate(row.lastPayment),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Tenant Management</h1>
          <p className="text-[#535862] text-sm">
            Monitor all tenants across the platform
          </p>
        </div>
        {/* <Button className="bg-[#027A48] hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Landlord
        </Button> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      {/* Search + Filters Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Search bar */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search by  Landlords or  Tenants"
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#111] border border-gray-800 text-gray-300 placeholder:text-gray-600 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* <Dropdown
            label={landlord}
            setValue={setLandlord}
            items={[
              "All Landlords",
              "James Wilson",
              "Sarah Chen",
              "David Kumar",
            ]}
          /> */}
          <Dropdown
            label={status}
            setValue={setStatus}
            items={["Payment Status", "Paid", "Partial", "Arrears"]}
          />
          {/* <Dropdown
            label={arrears}
            setValue={setArrears}
            items={["Arrears Bucket", "1-15 days", "16-30 days", "30+ days"]}
          /> */}
          {/* <Button className="bg-[#111] border border-gray-800 text-gray-300">
            Apply Filter
          </Button> */}
        </div>
      </div>

      {/* Table */}
      <CustomTable
        data={tenants}
        columns={columns}
        total={tenantsResp?.count ? `Showing ${tenantsResp.count} results` : ""}
      />

      {tenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-6xl bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl max-h-[85vh] overflow-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedTenantName} — Rent history</h3>
                <p className="text-sm text-gray-400">
                  Same payment view as the landlord portal (read-only)
                </p>
              </div>
              <div>
                <button onClick={() => { setTenantModalOpen(false); setSelectedTenantId(null); setSelectedTenantName(null); }} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {tenantError ? (
              <div className="p-6 text-center text-rose-400">Failed to load rent history.</div>
            ) : (
              <TenantRentHistoryTable
                tenantId={selectedTenantId}
                tenant={tenantDetails}
                rentHistory={tenantDetails?.rentHistory}
                loading={tenantLoading}
                readOnly
              />
            )}

            <div className="mt-4 flex items-center justify-end">
              <button onClick={() => { setTenantModalOpen(false); setSelectedTenantId(null); setSelectedTenantName(null); }} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown Component
interface DropdownProps {
  label: string;
  items: string[];
  setValue: (value: string) => void;
}
function Dropdown({ label, items, setValue }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-[#111] border-gray-800 text-gray-300 hover:bg-[#1a1a1a] flex items-center justify-between"
        >
          {label}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#111] border border-gray-800 text-gray-300">
        {items.map((item) => (
          <DropdownMenuItem
            key={item}
            onClick={() => setValue(item)}
            className="hover:bg-[#1a1a1a] cursor-pointer"
          >
            {item}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
