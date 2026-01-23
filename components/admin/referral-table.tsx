"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ReferralData {
  code: string;
  name: string;
  status: string;
  rewardCents: number;
  usersRatio: string;
  createdAt: string;
}

interface ReferralTableProps {
  data: ReferralData[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: string;
  searchTerm: string;
  onStatusChange: (status: string) => void;
  onSearch: (term: string) => void;
  onPageChange: (page: number) => void;
}

export default function ReferralTable({ data, total, page, pageSize, statusFilter, searchTerm, onStatusChange, onSearch, onPageChange }: ReferralTableProps) {
  const formatMoney = (cents: number) => `£${(Math.max(0, Math.round(cents || 0)) / 100).toFixed(2)}`;
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  // Local input state + debounce so we don't fire onSearch on every keystroke
  const [localSearch, setLocalSearch] = useState<string>(searchTerm || "");

  useEffect(() => {
    setLocalSearch(searchTerm || "");
  }, [searchTerm]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (localSearch !== searchTerm) onSearch(localSearch);
    }, 500);
    return () => clearTimeout(id);
  }, [localSearch, onSearch, searchTerm]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize)));
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="bg-[#0A0A0A] rounded-xl border border-[#1E1E1E] p-4 sm:p-6 mt-6 text-white w-full overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Referrals Code Management
        </h2>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between bg-[#121212] border border-[#1E1E1E] text-gray-300 hover:bg-[#1A1A1A] w-full sm:w-auto"
              >
                {statusFilter === "All" ? "All Status" : `${statusFilter} Status`}
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#121212] border border-[#1E1E1E] text-gray-300 z-50"
            >
              {["All", "active", "disable"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className="hover:bg-[#1E1E1E]"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Referrers..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-[#121212] border border-[#1E1E1E] text-sm text-gray-300 rounded-lg pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#027A48]"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full min-w-[700px] text-left text-xs sm:text-sm text-gray-300">
          <thead>
            <tr className="border-b border-[#1E1E1E] text-[#737373]">
              <th className="p-3 whitespace-nowrap">Code</th>
              <th className="p-3 whitespace-nowrap">Referrer</th>
              <th className="p-3 whitespace-nowrap">Status</th>
              <th className="p-3 whitespace-nowrap">Reward Value</th>
              <th className="p-3 whitespace-nowrap">Users Ratio</th>
              <th className="p-3 whitespace-nowrap">Created</th>
              <th className="p-3 whitespace-nowrap">Action</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className="border-b border-[#1E1E1E] hover:bg-[#121212] transition"
              >
                <td className="p-3">{item.code}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-[10px] sm:text-xs rounded-md ${
                      item.status === "active"
                        ? "bg-green-800/30 text-[#00C853]"
                        : "bg-red-800/30 text-[#FF5252]"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">{formatMoney(item.rewardCents)}</td>
                <td className="p-3">{item.usersRatio}</td>
                <td className="p-3">{formatDate(item.createdAt)}</td>
                <td className="p-3">
                  <Button
                    size="sm"
                    className="text-[10px] sm:text-xs px-3 py-1 bg-[#027A48] hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-gray-400 text-xs sm:text-sm p-4 gap-3 sm:gap-0">
        <p className="text-center sm:text-left">
          Showing {data.length} of {total || 0} results
        </p>

        <div className="flex flex-wrap justify-center sm:justify-end gap-2 items-center">
          <Button
            variant="outline"
            disabled={prevDisabled}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="bg-[#111] border-gray-800 text-white flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="px-2 text-white">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={nextDisabled}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="bg-[#111] border-gray-800 text-white flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
