"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, Plus, X } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";

export default function LandlordManagement() {
  const [planFilter, setPlanFilter] = useState("All Plan");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const landlords = [
    {
      id: 1,
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Premium",
      tenants: 24,
      status: "Suspended",
      created: "Mar 25, 2025",
      addresses: [
        {
          id: "a1",
          address: "119 The Avenue - R3",
          tenants: [
            { id: 1, name: "Jack Leah", rent: "£1200", status: "Paid", lastPayment: "2025-09-01" },
            { id: 2, name: "Sara Miles", rent: "£1000", status: "Unpaid", lastPayment: "2025-08-12" },
          ],
        },
        {
          id: "a2",
          address: "42 Baker Street - Apt 2",
          tenants: [
            { id: 3, name: "Tom Hardy", rent: "£950", status: "Partial", lastPayment: "2025-09-12" },
          ],
        },
      ],
    },
    {
      id: 2,
      name: "Emily Clark",
      email: "emily@example.com",
      plan: "Enterprise",
      tenants: 34,
      status: "Active",
      created: "Mar 25, 2025",
      addresses: [
        {
          id: "b1",
          address: "7 Willow Lane - Flat B",
          tenants: [
            { id: 4, name: "Ava Green", rent: "£1100", status: "Paid", lastPayment: "2025-10-01" },
            { id: 5, name: "Liam Stone", rent: "£1250", status: "Paid", lastPayment: "2025-09-20" },
          ],
        },
      ],
    },
  ];

  const getBadgeColor = (type: string, value: string) => {
    const map: Record<string, Record<string, string>> = {
      plan: {
        Premium: "bg-purple-600/30 text-[#9A00B2]",
        Enterprise: "bg-yellow-600/30 text-[#AFB200]",
        Basic: "bg-green-600/30 text-[#009118]",
      },
      status: {
        Active: "bg-green-600/30 text-[#00B22F]",
        Pending: "bg-yellow-600/30 text-[#AFB200]",
        Suspended: "bg-red-600/30 text-[#FF5E49]",
      },
    };
    return map[type]?.[value] || "bg-gray-800 text-gray-400";
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

  // Local UI state for landlord details modal
  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);

  const handleOpenLandlord = (landlord: any) => {
    setSelectedLandlord(landlord);
    setSelectedAddressIndex(0);
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
        <Button className="bg-[#027A48] hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Landlord
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-16 mb-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#535862]" />
          <Input
            placeholder="Search Landlords..."
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
              {["All Plan", "Basic", "Premium", "Enterprise"].map((plan) => (
                <DropdownMenuItem
                  key={plan}
                  onClick={() => setPlanFilter(plan)}
                >
                  {plan}
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
              {["All Status", "Active", "Pending", "Suspended"].map(
                (status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="bg-[#111] border-gray-800 text-white"
          >
            Apply Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <CustomTable
        data={landlords}
        columns={columns}
        total="Showing 1 to 5 of 2,846 results"
      />

      {/* Landlord details modal */}
      {selectedLandlord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-4xl bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedLandlord.name} — Addresses</h3>
              <button onClick={() => setSelectedLandlord(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <h4 className="text-sm text-gray-400 mb-2">Addresses</h4>
                <div className="space-y-2">
                  {selectedLandlord.addresses.map((addr: any, i: number) => (
                    <button
                      key={addr.id}
                      onClick={() => setSelectedAddressIndex(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        selectedAddressIndex === i ? "border-emerald-600 bg-emerald-900/10" : "border-gray-800"
                      }`}
                    >
                      <div className="text-sm text-gray-200">{addr.address}</div>
                      <div className="text-xs text-gray-400">{addr.tenants.length} tenants</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-sm text-gray-400 mb-3">Tenants</h4>
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
                      {selectedLandlord.addresses[selectedAddressIndex || 0].tenants.map((t: any) => (
                        <tr key={t.id} className="border-t border-[#151515] hover:bg-[#0e0e0e]">
                          <td className="py-3 px-4 text-gray-300">{t.name}</td>
                          <td className="py-3 px-4 text-gray-300">{t.rent}</td>
                          <td className="py-3 px-4 text-gray-300">{t.status}</td>
                          <td className="py-3 px-4 text-gray-300">{t.lastPayment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 p-4 rounded-lg border border-gray-800 bg-[#080808]">
                  {(() => {
                    const tenants = selectedLandlord.addresses[selectedAddressIndex || 0].tenants;
                    const gross = tenants.reduce((s: number, t: any) => s + Number(String(t.rent).replace(/[^0-9.-]+/g, "")), 0);
                    const expenses = +(gross * 0.12).toFixed(2);
                    const net = +(gross - expenses).toFixed(2);
                    const fmt = (n: number) => `£${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                    return (
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-200">
                        <div>
                          <div className="text-xs text-gray-400">Total Gross</div>
                          <div className="font-medium mt-1">{fmt(gross)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Total Expenses</div>
                          <div className="font-medium mt-1 text-rose-400">{fmt(expenses)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Net Income</div>
                          <div className="font-medium mt-1 text-emerald-300">{fmt(net)}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
