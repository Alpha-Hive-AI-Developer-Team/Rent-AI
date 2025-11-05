"use client";

import { useState } from "react";
import StatCard from "@/components/admin/analytics-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronDown } from "lucide-react";
import CustomTable from "@/components/admin/custom-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TenantManagement() {
 const stats = [
  { title: "Total Tenants", value: "2,847", trend: 12.5, description: "Total registered tenants", subtext: "Across all landlords" },
  { title: "Paid On Time", value: "7,945", trend: -20, description: "Tenants paid before due date", subtext: "Last 30 days" },
  { title: "Partial Payments", value: "243", trend: 12.5, description: "Tenants paid partially", subtext: "Current billing cycle" },
  { title: "In Arrears", value: "113", trend: -4.5, description: "Late payments", subtext: "Overdue tenants" },
];


  // Dropdown states
  const [landlord, setLandlord] = useState("All Landlords");
  const [status, setStatus] = useState("Payment Status");
  const [arrears, setArrears] = useState("Arrears Bucket");

  // Dummy table data
  const data = [
    {
      tenant: "Robert Johnson",
      landlord: "James Wilson",
      propertyId: "P-2647",
      status: "Arrears",
      lastPayment: "Mar 25, 2025",
    },
    {
      tenant: "Robert Johnson",
      landlord: "James Wilson",
      propertyId: "P-2647",
      status: "Paid",
      lastPayment: "Mar 25, 2025",
    },
    {
      tenant: "Robert Johnson",
      landlord: "Sarah Chen",
      propertyId: "P-2647",
      status: "Partial",
      lastPayment: "Mar 25, 2025",
    },
    {
      tenant: "Robert Johnson",
      landlord: "Sarah Chen",
      propertyId: "P-2647",
      status: "Partial",
      lastPayment: "Mar 25, 2025",
    },
  ];

  const columns = [
    {
      key: "tenant",
      label: "Tenant Name",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] text-xs flex items-center justify-center text-white">
            {row.tenant
              .split(" ")
              .map((n: string) => n[0])
              .join("")}
          </div>
          <span>{row.tenant}</span>
        </div>
      ),
    },
    { key: "landlord", label: "Landlord" },
    { key: "propertyId", label: "Property ID" },
    {
      key: "status",
      label: "Status",
      render: (row: any) => {
        const colors: Record<string, string> = {
          Paid: "bg-green-900 text-green-400",
          Arrears: "bg-red-900 text-red-400",
          Partial: "bg-yellow-900 text-yellow-400",
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
    { key: "lastPayment", label: "Last Payment" },
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
        <Button className="bg-[#027A48] hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Landlord
        </Button>
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
            placeholder="Search Landlords..."
            className="pl-9 bg-[#111] border border-gray-800 text-gray-300 placeholder:text-gray-600 w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <Dropdown
            label={landlord}
            setValue={setLandlord}
            items={[
              "All Landlords",
              "James Wilson",
              "Sarah Chen",
              "David Kumar",
            ]}
          />
          <Dropdown
            label={status}
            setValue={setStatus}
            items={["Payment Status", "Paid", "Partial", "Arrears"]}
          />
          <Dropdown
            label={arrears}
            setValue={setArrears}
            items={["Arrears Bucket", "1-15 days", "16-30 days", "30+ days"]}
          />
          <Button className="bg-[#111] border border-gray-800 text-gray-300">
            Apply Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <CustomTable
        data={data}
        columns={columns}
        total="Showing 1 to 5 of 2,846 results"
      />
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
