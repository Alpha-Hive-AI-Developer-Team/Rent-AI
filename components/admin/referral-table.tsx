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
import { formatDate } from "@/lib/utils";

interface ReferralData {
  code: string;
  name: string;
  status: string;
  rewardCents: number;
  holdCents?: number;
  availableCents?: number;
  withdrawnCents?: number;
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
    <div className="bg-[#111] rounded-2xl border border-gray-800/80 p-4 sm:p-6 mt-6 text-white w-full overflow-hidden shadow-md shadow-black/40 space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800/60 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Referral Code Directory
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Overview of active partner codes, referred accounts, and locked commission payouts
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center justify-between bg-[#161616] border border-gray-800 text-gray-300 hover:text-white hover:bg-white/5 w-full sm:w-auto rounded-xl text-xs sm:text-sm h-10 px-3.5"
              >
                <span>
                  Status:{" "}
                  <strong className="text-white font-medium capitalize">
                    {statusFilter === "All" ? "All" : statusFilter}
                  </strong>
                </span>
                <ChevronDown className="ml-2 w-3.5 h-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#141414] border border-gray-800 text-gray-300 rounded-xl shadow-xl min-w-[140px] p-1 z-50"
            >
              {["All", "active", "disable"].map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className="hover:bg-white/5 cursor-pointer rounded-lg text-xs sm:text-sm px-3 py-2 capitalize"
                >
                  {status === "All" ? "All Statuses" : status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search referrers or code..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-[#161616] border border-gray-800 text-xs sm:text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-9 pr-3 py-2.5 w-full focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
            />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto rounded-xl border border-gray-800/70 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full min-w-[880px] text-left text-xs sm:text-sm text-gray-300">
          <thead>
            <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium text-[11px] sm:text-xs uppercase tracking-wider">
              <th className="p-3.5 whitespace-nowrap">Code</th>
              <th className="p-3.5 whitespace-nowrap">Referrer</th>
              <th className="p-3.5 whitespace-nowrap">Status</th>
              <th className="p-3.5 whitespace-nowrap">Total Earned</th>
              <th className="p-3.5 whitespace-nowrap">In Hold (14d)</th>
              <th className="p-3.5 whitespace-nowrap">Available</th>
              <th className="p-3.5 whitespace-nowrap">Paying / Referred</th>
              <th className="p-3.5 whitespace-nowrap">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800/50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400 text-sm">
                  No referral records found
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={i}
                  className="hover:bg-[#151515] transition-colors"
                >
                  <td className="p-3.5 font-mono text-emerald-400 font-medium text-xs">
                    {item.code}
                  </td>
                  <td className="p-3.5 text-white font-medium">{item.name}</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${
                        item.status === "active"
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-700/40"
                          : "bg-rose-950/40 text-rose-400 border border-rose-800/40"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === "active" ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      {item.status === "active" ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-3.5 tabular-nums text-white font-medium">
                    {formatMoney(item.rewardCents)}
                  </td>
                  <td className="p-3.5 tabular-nums text-amber-400 font-medium">
                    {formatMoney(item.holdCents || 0)}
                  </td>
                  <td className="p-3.5 tabular-nums text-emerald-400 font-medium">
                    {formatMoney(item.availableCents || 0)}
                  </td>
                  <td className="p-3.5 text-gray-300 font-mono text-xs">{item.usersRatio}</td>
                  <td className="p-3.5 text-gray-400">{formatDate(item.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-gray-400 text-xs sm:text-sm py-2 px-1 gap-3">
        <p className="text-center sm:text-left text-xs text-gray-400">
          Showing {data.length} of {total || 0} results
        </p>

        <div className="flex flex-wrap justify-center sm:justify-end gap-2 items-center">
          <Button
            variant="outline"
            disabled={prevDisabled}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="bg-[#141414] border-gray-800 text-white flex items-center px-3 py-1.5 text-xs rounded-xl hover:bg-white/5 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
          </Button>
          <span className="px-2 text-xs text-gray-300">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={nextDisabled}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="bg-[#141414] border-gray-800 text-white flex items-center px-3 py-1.5 text-xs rounded-xl hover:bg-white/5 disabled:opacity-40"
          >
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
