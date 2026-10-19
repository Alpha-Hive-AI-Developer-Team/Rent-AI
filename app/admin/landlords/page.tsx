"use client";

import { useState, useEffect } from "react";
import useAdminLandlords, { useLandlordTenants, useTenantTransactions, useExpenses, useIncomeSummary, useCreateExpense } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Plus, X, ChevronLeft } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";
import TenantRentHistoryTable from "@/components/tenants/TenantRentHistoryTable";
import { formatDate } from "@/lib/utils";

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
        free: "bg-gray-800/30 text-gray-300",
        starter: "bg-green-600/30 text-[#009118]",
        pro: "bg-purple-600/30 text-[#9A00B2]",
        enterprise: "bg-yellow-600/30 text-[#AFB200]",
      },
      status: {
        active: "bg-green-600/30 text-[#00B22F]",
        disable: "bg-red-600/30 text-[#FF5E49]",
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
          className="flex items-center gap-3 text-left w-full"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700">
            {row.name.split(" ")[0][0]}
            {row.name.split(" ")[1][0]}
          </div>
          <span className="underline text-emerald-300">{row.name}</span>
        </button>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "plan",
      label: "Plan",
      render: (row: any) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${getBadgeColor(
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
          className={`px-2 py-1 rounded-lg text-xs font-medium ${getBadgeColor(
            "status",
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
    },
    { key: "created", label: "Created" },
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
  // const handleOpenLandlord = (landlord: any) => {
  //   setSelectedLandlord(landlord);
  //   setSelectedAddressIndex(0);
  // };

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
          toast("Expense saved and totals updated.");
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
    <div className="p-4 sm:p-6 md:p-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Landlord Management</h1>
          <p className="text-[#535862] text-sm">
            Manage all landlord and agency accounts
          </p>
        </div>
        {/* <Button className="bg-[#027A48] hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Landlord
        </Button> */}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-16 mb-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#535862]" />
          <Input
            placeholder="Search Landlords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#111] border-gray-800 text-white placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Plan Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-[#111] border-gray-800 text-white flex items-center"
              >
                {planFilter} <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* ✅ Fix: Add z-index and relative positioning */}
            <DropdownMenuContent
              className="bg-[#111] border-gray-800 text-white z-[9999] relative"
              align="start"
              sideOffset={4}
            >
              {["All Plan", "free", "starter", "pro", "enterprise"].map((plan) => (
                <DropdownMenuItem
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                >
                  {plan === "All Plan" ? "All Plan" : String(plan).charAt(0).toUpperCase() + String(plan).slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-[#111] border-gray-800 text-white flex items-center"
              >
                {statusFilter} <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* ✅ Same fix for the second dropdown */}
            <DropdownMenuContent
              className="bg-[#111] border-gray-800 text-white z-[9999] relative"
              align="start"
              sideOffset={4}
            >
              {["All Status", "active", "disable"].map((status) => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                  {status === "All Status" ? "All Status" : String(status).charAt(0).toUpperCase() + String(status).slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="bg-[#111] border-gray-800 text-white"
            onClick={() => {
              const p = planFilter === "All Plan" ? undefined : String(planFilter).toLowerCase();
              const s = statusFilter === "All Status" ? undefined : String(statusFilter).toLowerCase();
              setAppliedFilters({ search: search || undefined, plan: p, status: s });
            }}
          >
            Apply Filter
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

      {/* Landlord details modal */}
      {selectedLandlord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-[#0b0b0b] text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#151515] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{selectedLandlord.name}</h3>
                <p className="mt-0.5 truncate text-sm text-gray-400">
                  {selectedLandlord.email || "Landlord details"}
                  {selectedLandlord.plan ? ` · ${String(selectedLandlord.plan)}` : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedLandlord(null);
                  setSelectedLandlordId(null);
                  setModalView("landlord");
                  setSelectedTenantId(null);
                  setSelectedTenantName(null);
                }}
                className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-12">
              {modalView === "landlord" && (
                <div className="border-b border-[#151515] md:col-span-4 md:border-b-0 md:border-r md:border-[#151515]">
                  <div className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Addresses
                  </div>
                  <div className="max-h-[28vh] space-y-2 overflow-y-auto px-3 pb-10 md:max-h-[calc(92vh-7rem)] md:pb-12">
                    {tenantsLoading ? (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">Loading…</div>
                    ) : modalAddresses.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">No addresses</div>
                    ) : (
                      <>
                        {modalAddresses.map((addr: any, i: number) => (
                          <button
                            key={addr.id || `${i}`}
                            onClick={() => setSelectedAddressIndex(i)}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              selectedAddressIndex === i
                                ? "border-emerald-600 bg-emerald-950/30"
                                : "border-gray-800 bg-[#080808] hover:border-gray-700"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-100">
                              {addr.address || addr.property}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {(addr.tenants || []).length} tenant
                              {(addr.tenants || []).length === 1 ? "" : "s"}
                            </div>
                          </button>
                        ))}
                        <div className="h-4 shrink-0" aria-hidden />
                      </>
                    )}
                  </div>
                </div>
              )}

              <div
                className={`min-h-0 overflow-y-auto px-4 pt-4 pb-12 sm:px-6 sm:pb-14 ${
                  modalView === "landlord" ? "md:col-span-8" : "md:col-span-12"
                }`}
              >
                {modalView === "landlord" ? (
                  <>
                    <div className="mb-4">
                      <h4 className="text-base font-medium text-gray-100">
                        {currentAddress || "Tenants"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Click a tenant to open rent history (read-only)
                      </p>
                    </div>

                    {modalAddresses.length === 0 ? (
                      <div className="rounded-xl border border-[#1a1a1a] px-4 py-10 text-center text-gray-400">
                        No tenants found
                      </div>
                    ) : currentTenants.length === 0 ? (
                      <div className="rounded-xl border border-[#1a1a1a] px-4 py-10 text-center text-gray-400">
                        No tenants found for this property
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto rounded-xl border border-[#1a1a1a] bg-[#0B0B0B]">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#151515] bg-[#0f0f0f] text-left text-gray-400">
                              <th className="px-4 py-3 text-xs">Tenant Name</th>
                              <th className="px-4 py-3 text-xs">Rent</th>
                              <th className="px-4 py-3 text-xs">Status</th>
                              <th className="px-4 py-3 text-xs">Last Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTenants.map((t: any) => {
                              const statusRaw = String(
                                t.status ||
                                  (t.rentHistory && t.rentHistory[0] ? t.rentHistory[0].status : "") ||
                                  ""
                              ).toLowerCase();
                              const statusLabel = statusRaw
                                ? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1)
                                : "—";
                              const statusClass =
                                statusRaw === "paid"
                                  ? "border-green-700/60 bg-green-900/40 text-green-400"
                                  : statusRaw === "partial"
                                    ? "border-yellow-700/60 bg-yellow-900/40 text-yellow-400"
                                    : statusRaw === "unpaid"
                                      ? "border-red-700/60 bg-red-900/40 text-red-400"
                                      : "border-gray-700 bg-gray-800 text-gray-400";
                              const rentVal = Number(t.rent) || 0;
                              return (
                                <tr
                                  key={t._id || t.id}
                                  onClick={() => openTenant(t)}
                                  className="cursor-pointer border-t border-[#151515] hover:bg-[#0e0e0e]"
                                >
                                  <td className="px-4 py-3 text-gray-200">
                                    {Array.isArray(t.tenantName)
                                      ? t.tenantName.join(" ")
                                      : t.name || t.tenantName}
                                  </td>
                                  <td className="px-4 py-3 tabular-nums text-gray-300">
                                    {rentVal
                                      ? `£${rentVal.toLocaleString(undefined, {
                                          minimumFractionDigits: 0,
                                          maximumFractionDigits: 2,
                                        })}`
                                      : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`rounded-full border px-2.5 py-0.5 text-xs ${statusClass}`}
                                    >
                                      {statusLabel}
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

                    <div className="mt-5 mb-2 rounded-xl border border-gray-800 bg-[#080808] p-4 pb-6">
                      {(() => {
                        const gross = Number(incomeSummaryResp?.data?.grossIncome || 0);
                        const totalExpenses = Number(incomeSummaryResp?.data?.totalExpenses || 0);
                        const net = Number(
                          incomeSummaryResp?.data?.netIncome || gross - totalExpenses
                        );
                        const fmt = (n: number) =>
                          `£${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        return (
                          <div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div className="rounded-lg border border-[#151515] bg-[#0b0b0b] px-3 py-3">
                                <div className="text-xs text-gray-500">Total Gross</div>
                                <div className="mt-1 text-sm font-medium text-gray-100">{fmt(gross)}</div>
                              </div>
                              <div className="rounded-lg border border-[#151515] bg-[#0b0b0b] px-3 py-3">
                                <div className="text-xs text-gray-500">Total Expenses</div>
                                <div className="mt-1 text-sm font-medium text-rose-400">
                                  {fmt(totalExpenses)}
                                </div>
                              </div>
                              <div className="rounded-lg border border-[#151515] bg-[#0b0b0b] px-3 py-3">
                                <div className="text-xs text-gray-500">Net Income</div>
                                <div className="mt-1 text-sm font-medium text-emerald-300">
                                  {fmt(net)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-[#151515] pt-4">
                              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                Add Expense
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  placeholder="Description"
                                  value={newExpenseDesc}
                                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                                  className="bg-[#0b0b0b] border border-gray-800 text-white"
                                />
                                <Input
                                  placeholder="Amount (e.g. 120.00)"
                                  value={newExpenseAmount}
                                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                                  className="w-full bg-[#0b0b0b] border border-gray-800 text-white sm:w-40"
                                />
                                <Button
                                  onClick={addExpense}
                                  className="bg-[#111] border border-gray-800 text-gray-300"
                                >
                                  Add
                                </Button>
                              </div>

                              {Array.isArray(expensesResp?.data) && expensesResp!.data.length > 0 && (
                                <div className="mt-3">
                                  <div className="mb-2 text-xs text-gray-500">Manual Expenses</div>
                                  <div className="space-y-2">
                                    {expensesResp!.data.map((ex: any, i: number) => (
                                      <div
                                        key={ex._id || i}
                                        className="flex items-center justify-between rounded-lg border border-[#151515] bg-[#0b0b0b] px-3 py-2 text-sm"
                                      >
                                        <div className="text-gray-200">{ex.description}</div>
                                        <div className="tabular-nums text-rose-400">
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
                  </>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <button
                          onClick={() => {
                            setModalView("landlord");
                            setSelectedTenantId(null);
                            setSelectedTenantName(null);
                          }}
                          className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200"
                        >
                          <ChevronLeft className="h-4 w-4" /> Back to tenants
                        </button>
                        <h4 className="text-base font-medium text-gray-100">
                          {selectedTenantName} — Rent history
                        </h4>
                        {currentAddress ? (
                          <p className="text-xs text-gray-500">{currentAddress}</p>
                        ) : null}
                      </div>
                    </div>

                    {tenantError ? (
                      <div className="rounded-xl border border-rose-900/50 px-4 py-10 text-center text-rose-400">
                        Failed to load rent history.
                      </div>
                    ) : (
                      <TenantRentHistoryTable
                        tenantId={selectedTenantId}
                        tenant={tenantDetails}
                        rentHistory={tenantDetails?.rentHistory}
                        loading={tenantLoading}
                        readOnly
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
