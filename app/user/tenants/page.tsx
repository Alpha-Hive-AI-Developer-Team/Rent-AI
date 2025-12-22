"use client";

import Image from "next/image";
import { Bell, Search, Plus, X } from "lucide-react";
import { useState } from "react";
import TenantDrawer from "@/components/user/tenant-drawer";
import NewTenantModal from "@/components/user/new-tenant-modal";
import { useTenants } from "@/hooks/usetenants";

// Using `any` for tenant shapes returned by the API to keep types flexible

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const { data, isLoading, isError } = useTenants();

  // backend returns { success, message, count, data: Tenant[] }
  const tenantsFromApi = data?.data ?? [];

  const statusColors: Record<string, string> = {
    Paid: "bg-green-900/40 text-green-400 border-green-700/60",
    Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
    Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
  };

  const filtered = tenantsFromApi.filter((t: any) =>
    (Array.isArray(t.tenantName) ? t.tenantName.join(", ") : (t.tenantName || "")).toLowerCase().includes(search.toLowerCase()) ||
    (t.property || "").toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Tenant Name" },
    { key: "property", label: "Property" },
    { key: "rent", label: "Rent" },
    {
      key: "status",
      label: "Status",
      render: (t: any) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[t.status]}`}
        >
          {t.status}
        </span>
      ),
    },
    { key: "lastPayment", label: "Last Payment" },
    // {
    //   key: "actions",
    //   label: "",
    //   render: () => (
    //     <button className="text-xs bg-transparent border border-emerald-700 px-3 py-1 rounded-full text-emerald-400 hover:bg-emerald-900/5 transition">
    //       Open <span className="ml-2 text-emerald-400">›</span>
    //     </button>
    //   ),
    // },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">

      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-semibold">Tenants</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-300" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>

          <Image
            src="/images/pexels.png"
            alt="User Avatar"
            width={36}
            height={36}
            className="rounded-full border border-gray-700"
          />
        </div>
      </div>

      {/* Search + New Tenant */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

  {/* Search */}
  <div className="relative w-full sm:w-72 md:w-96">
    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search tenants..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
    />
  </div>

  {/* New Tenant Button (Right Side) */}
  <button
    onClick={() => setNewTenantOpen(true)}
    className="flex items-center justify-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition w-full sm:w-auto md:ml-auto"
  >
    <Plus className="w-4 h-4 text-emerald-400" />
    <span className="text-sm">New Tenant</span>
  </button>

</div>


      {/* Table (inlined UI) */}
      <div className="w-full overflow-x-auto rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a]">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tl-2xl">Tenant Name</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Property</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Rent</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm">Status</th>
              <th className="py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm rounded-tr-2xl">Last Payment</th>
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

            {!isLoading && !isError && filtered.map((t: any) => (
              <tr
                key={t._id}
                onClick={() => { setSelectedTenant(t); setTransactionModalOpen(true); }}
                className="border-t border-[#151515] hover:bg-[#0e0e0e] transition cursor-pointer"
              >
                <td className="py-4 px-6 text-gray-300 text-sm">{Array.isArray(t.tenantName) ? t.tenantName[0] : t.tenantName}</td>
                <td className="py-4 px-6 text-gray-300 text-sm">{t.property}</td>
                <td className="py-4 px-6 text-gray-300 text-sm">{typeof t.rent === 'number' ? `£${t.rent}` : t.rent}</td>
                <td className="py-4 px-6 text-gray-300 text-sm">
                  <span className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[(t.status || '').charAt(0).toUpperCase() + (t.status || '').slice(1) as any] || 'bg-gray-800 text-gray-400'}`}>
                    {t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-6 text-gray-300 text-sm">{t.lastPayment ? new Date(t.lastPayment).toISOString().split('T')[0] : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction history modal */}
      {transactionModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-3xl bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{Array.isArray(selectedTenant?.tenantName) ? selectedTenant.tenantName[0] : (selectedTenant?.tenantName || selectedTenant?.name || 'Tenant')} — Transaction History</h3>
                <p className="text-sm text-gray-400">{selectedTenant.property}</p>
              </div>
              <button onClick={() => { setTransactionModalOpen(false); setSelectedTenant(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full overflow-x-auto rounded-lg bg-[#0B0B0B] border border-[#1a1a1a]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
                    <th className="py-3 px-4 text-xs">Month</th>
                    <th className="py-3 px-4 text-xs">Amount Due</th>
                    <th className="py-3 px-4 text-xs">Amount Paid</th>
                    <th className="py-3 px-4 text-xs">Paid On</th>
                    <th className="py-3 px-4 text-xs">Due Date</th>
                    <th className="py-3 px-4 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTenant.rentHistory?.map((tr: any, i: number) => (
                    <tr key={tr._id || i} className="border-t border-[#151515] hover:bg-[#0e0e0e]">
                      <td className="py-3 px-4 text-gray-300">{tr.month ? new Date(tr.month).toISOString().split('T')[0] : '—'}</td>
                      <td className="py-3 px-4 text-gray-300">{typeof tr.amountDue === 'number' ? `£${tr.amountDue}` : tr.amountDue}</td>
                      <td className={`py-3 px-4 ${tr.status === 'unpaid' ? 'text-rose-400' : 'text-gray-300'}`}>{tr.amountPaid ?? '—'}</td>
                      <td className="py-3 px-4 text-gray-300">{tr.paidOn ? new Date(tr.paidOn).toISOString().split('T')[0] : '—'}</td>
                      <td className="py-3 px-4 text-gray-300">{tr.dueDate ? new Date(tr.dueDate).toISOString().split('T')[0] : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full border ${statusColors[(tr.status || '').charAt(0).toUpperCase() + (tr.status || '').slice(1) as any] || 'bg-gray-800 text-gray-400'}`}>
                          {tr.status?.charAt(0).toUpperCase() + tr.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => { setTransactionModalOpen(false); setSelectedTenant(null); }} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer (existing tenant details) */}
      <TenantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* New tenant modal */}
      <NewTenantModal open={newTenantOpen} onClose={() => setNewTenantOpen(false)} />
    </div>
  );
}
