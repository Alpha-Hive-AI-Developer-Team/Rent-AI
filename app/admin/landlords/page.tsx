"use client";

import { useState, useEffect } from "react";
import useAdminLandlords, { useLandlordTenants } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Plus, X, ChevronLeft } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";

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
    created: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—",
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
        interprise: "bg-yellow-600/30 text-[#AFB200]",
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

  // Tenant modal state (rendered inside same modal)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [modalView, setModalView] = useState<"landlord" | "tenant">("landlord");

  // Sample tenant transactions (UI-only)
  const tenantTransactions: Record<string, Array<any>> = {
    "Jack Leah": [
      { month: "2025-09", rent: "£1200", amountPaid: "£1200", paidDate: "2025-09-01", status: "Paid" },
      { month: "2025-08", rent: "£1200", amountPaid: "£0", paidDate: null, status: "Unpaid" },
    ],
    "Sara Miles": [
      { month: "2025-09", rent: "£1000", amountPaid: "£500", paidDate: "2025-09-12", status: "Partial" },
    ],
    "Tom Hardy": [
      { month: "2025-09", rent: "£950", amountPaid: "£950", paidDate: "2025-09-12", status: "Paid" },
    ],
    "Ava Green": [
      { month: "2025-10", rent: "£1100", amountPaid: "£1100", paidDate: "2025-10-01", status: "Paid" },
    ],
    "Liam Stone": [
      { month: "2025-09", rent: "£1250", amountPaid: "£1250", paidDate: "2025-09-20", status: "Paid" },
    ],
  };

  const openTenant = (tenantName: string) => {
    setSelectedTenant({ name: tenantName, transactions: tenantTransactions[tenantName] ?? [] });
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

  const addExpense = () => {
    const amt = Number(String(newExpenseAmount).replace(/[^0-9.-]+/g, "")) || 0;
    if (!newExpenseDesc || amt === 0) return;
    setManualExpenses((s) => [...s, { desc: newExpenseDesc, amount: amt }]);
    setNewExpenseDesc("");
    setNewExpenseAmount("");
  };

  const handleOpenLandlord = (landlord: any) => {
    setSelectedLandlord(landlord);
    setSelectedAddressIndex(0);
    setManualExpenses([]);
    setNewExpenseDesc("");
    setNewExpenseAmount("");
    setModalView("landlord");
    setSelectedTenant(null);
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
              {["All Plan", "free", "starter", "pro", "interprise"].map((plan) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-4xl bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedLandlord.name} — Addresses</h3>
              <button
                onClick={() => {
                  setSelectedLandlord(null);
                  setSelectedLandlordId(null);
                  setModalView("landlord");
                  setSelectedTenant(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h4 className="text-sm text-gray-400 mb-2">Addresses</h4>
                <div className="space-y-2">
                  {modalAddresses.map((addr: any, i: number) => (
                    <button
                      key={addr.id || `${i}`}
                      onClick={() => setSelectedAddressIndex(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        selectedAddressIndex === i ? "border-emerald-600 bg-emerald-900/10" : "border-gray-800"
                      }`}
                    >
                      <div className="text-sm text-gray-200">{addr.address || addr.property}</div>
                      <div className="text-xs text-gray-400">{(addr.tenants || []).length} tenants</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                {/* Render either landlord's tenants list or tenant transactions inside same modal */}
                {modalView === "landlord" ? (
                  <>
                    <h4 className="text-sm text-gray-400 mb-3">Tenants</h4>
                    {modalAddresses.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">No tenants found</div>
                    ) : currentTenants.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">No tenants found for this property</div>
                    ) : (
                      <div className="w-full overflow-x-auto rounded-lg bg-[#0B0B0B] border border-[#1a1a1a]">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
                              <th className="py-3 px-4 text-xs">Tenant Name</th>
                              <th className="py-3 px-4 text-xs">Rent</th>
                              <th className="py-3 px-4 text-xs">Status</th>
                              <th className="py-3 px-4 text-xs">Last Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTenants.map((t: any) => (
                              <tr
                                key={t._id || t.id}
                                onClick={() => openTenant(Array.isArray(t.tenantName) ? t.tenantName.join(" ") : t.name || t.tenantName)}
                                className="border-t border-[#151515] hover:bg-[#0e0e0e] cursor-pointer"
                              >
                                <td className="py-3 px-4 text-gray-300">{Array.isArray(t.tenantName) ? t.tenantName.join(" ") : t.name || t.tenantName}</td>
                                <td className="py-3 px-4 text-gray-300">{typeof t.rent === 'number' ? `£${t.rent}` : t.rent}</td>
                                <td className="py-3 px-4 text-gray-300">{t.status || (t.rentHistory && t.rentHistory[0] ? t.rentHistory[0].status : "-")}</td>
                                <td className="py-3 px-4 text-gray-300">{t.lastPayment ? new Date(t.lastPayment).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Totals + Manual Expenses */}
                    <div className="mt-4 p-4 rounded-lg border border-gray-800 bg-[#080808]">
                      {(() => {
                        const tenants = modalAddresses[selectedAddressIndex || 0]?.tenants || [];
                        const gross = tenants.reduce((s: number, t: any) => s + Number(String(t.rent).replace(/[^0-9.-]+/g, "")), 0);
                        const platformFee = +(gross * 0.12).toFixed(2);
                        const manualSum = manualExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                        const totalExpenses = +(platformFee + manualSum).toFixed(2);
                        const net = +(gross - totalExpenses).toFixed(2);
                        const fmt = (n: number) => `£${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        return (
                          <div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-200">
                              <div>
                                <div className="text-xs text-gray-400">Total Gross</div>
                                <div className="font-medium mt-1">{fmt(gross)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Total Expenses</div>
                                <div className="font-medium mt-1 text-rose-400">{fmt(totalExpenses)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Net Income</div>
                                <div className="font-medium mt-1 text-emerald-300">{fmt(net)}</div>
                              </div>
                            </div>

                            <div className="mt-4 border-t border-[#151515] pt-4">
                              <div className="text-xs text-gray-400 mb-2">Add Expense</div>
                              <div className="flex gap-2">
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
                                  className="w-40 bg-[#0b0b0b] border border-gray-800 text-white"
                                />
                                <Button onClick={addExpense} className="bg-[#111] border border-gray-800 text-gray-300">Add</Button>
                              </div>

                              {manualExpenses.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-xs text-gray-400 mb-2">Manual Expenses</div>
                                  <div className="space-y-2">
                                    {manualExpenses.map((ex, i) => (
                                      <div key={i} className="flex justify-between items-center bg-[#0b0b0b] p-2 rounded border border-[#151515] text-sm">
                                        <div className="text-gray-200">{ex.desc}</div>
                                        <div className="text-rose-400">{fmt(ex.amount)}</div>
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
                  // Tenant transactions view
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => setModalView("landlord")}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:underline"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                    </div>
                    <h4 className="text-sm text-gray-400 mb-3">{selectedTenant?.name} — Transactions</h4>
                    <div className="w-full overflow-x-auto rounded-lg bg-[#070707] border border-[#151515] p-3">
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
                          {(selectedTenant?.transactions ?? []).map((tr: any, i: number) => (
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
                    <div className="mt-4 flex items-center justify-end">
                      <button onClick={() => { setModalView("landlord"); }} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Back</button>
                    </div>
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
