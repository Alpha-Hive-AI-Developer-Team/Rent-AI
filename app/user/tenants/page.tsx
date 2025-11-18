"use client";

import Image from "next/image";
import { Bell, Search, Plus } from "lucide-react";
import { useState } from "react";
import TenantDrawer from "@/components/user/tenant-drawer";
import DataTable from "@/components/user/data-table";

interface Tenant {
  id: number;
  name: string;
  property: string;
  rent: string;
  status: "Paid" | "Unpaid" | "Partial";
  lastPayment: string;
}

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tenants: Tenant[] = [
    {
      id: 1,
      name: "Jack Leah",
      property: "119 The Avenue – R3",
      rent: "£1200",
      status: "Paid",
      lastPayment: "2025-09-01",
    },
    {
      id: 2,
      name: "Jack Leah",
      property: "119 The Avenue – R3",
      rent: "£1200",
      status: "Unpaid",
      lastPayment: "2025-09-01",
    },
    {
      id: 3,
      name: "Jack Leah",
      property: "119 The Avenue – R3",
      rent: "£1200",
      status: "Partial",
      lastPayment: "2025-09-01",
    },
    {
      id: 4,
      name: "Jack Leah",
      property: "119 The Avenue – R3",
      rent: "£1200",
      status: "Paid",
      lastPayment: "2025-09-01",
    },
  ];

  const statusColors: Record<Tenant["status"], string> = {
    Paid: "bg-green-900/40 text-green-400 border-green-700/60",
    Unpaid: "bg-red-900/40 text-red-400 border-red-700/60",
    Partial: "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.property.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Tenant Name" },
    { key: "property", label: "Property" },
    { key: "rent", label: "Rent" },
    {
      key: "status",
      label: "Status",
      render: (t: Tenant) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[t.status]}`}
        >
          {t.status}
        </span>
      ),
    },
    { key: "lastPayment", label: "Last Payment" },
    {
      key: "actions",
      label: "",
      render: () => (
        <button className="text-xs bg-transparent border border-emerald-700 px-3 py-1 rounded-full text-emerald-400 hover:bg-emerald-900/5 transition">
          Open <span className="ml-2 text-emerald-400">›</span>
        </button>
      ),
    },
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

        <h2 className="text-base font-semibold">Tenants</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

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

          {/* Add New Tenant */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center justify-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">New Tenant</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-black/20 rounded-xl border border-gray-800 p-2 md:p-4">
        <DataTable columns={columns} data={filtered} />
      </div>

      {/* Drawer */}
      <TenantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
