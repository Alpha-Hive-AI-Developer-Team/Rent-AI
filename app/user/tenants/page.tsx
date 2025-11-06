"use client";

import Image from "next/image";
import { Bell, Search } from "lucide-react";
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
        <button className="text-xs bg-[#1a1a1a] border border-gray-700 px-3 py-1 rounded-full text-gray-300 hover:bg-[#222] transition">
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Tenants</h1>

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

      {/* 🔍 Search and Add Tenant Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:w-1/4">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-[#1a1a1a] text-sm border border-gray-700 rounded-full px-4 py-2 hover:bg-[#222] transition w-fit"
        >
          Add New Tenant
        </button>
      </div>

      {/* Table Section */}
      <DataTable columns={columns} data={filtered} />

      {/* Drawer */}
      <TenantDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
