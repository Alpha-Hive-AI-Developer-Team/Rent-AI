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
import { ChevronDown, Search, Plus } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";

export default function LandlordManagement() {
  const [planFilter, setPlanFilter] = useState("All Plan");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const landlords = [
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Premium",
      tenants: 24,
      status: "Suspended",
      created: "Mar 25, 2025",
    },
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Enterprise",
      tenants: 34,
      status: "Active",
      created: "Mar 25, 2025",
    },
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Premium",
      tenants: 56,
      status: "Suspended",
      created: "Mar 25, 2025",
    },
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Premium",
      tenants: 65,
      status: "Pending",
      created: "Mar 25, 2025",
    },
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Enterprise",
      tenants: 78,
      status: "Pending",
      created: "Mar 25, 2025",
    },
    {
      name: "Robert Johnson",
      email: "info@gmail.com",
      plan: "Basic",
      tenants: 21,
      status: "Active",
      created: "Mar 25, 2025",
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700">
            {row.name.split(" ")[0][0]}
            {row.name.split(" ")[1][0]}
          </div>
          <span>{row.name}</span>
        </div>
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
    </div>
  );
}
