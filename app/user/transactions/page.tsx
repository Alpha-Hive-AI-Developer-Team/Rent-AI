"use client";

import Image from "next/image";
import { Plus, Search, Check, X, Bell } from "lucide-react";
import { useState } from "react";
import DataTable from "@/components/user/data-table";

interface Transaction {
  id: number;
  amount: string;
  status: "Matched" | "Unmatched" | "Needs Review";
  date: string;
  confidence: string;
  description: string;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");

  const transactions: Transaction[] = [
    {
      id: 1,
      date: "2025-09-01",
      description: "FPI JACK LEAH 119AV RENT",
      amount: "£1200",
      status: "Matched",
      confidence: "96%",
    },
    {
      id: 2,
      date: "2025-09-02",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Unmatched",
      confidence: "71%",
    },
    {
      id: 3,
      date: "2025-09-05",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Needs Review",
      confidence: "26%",
    },
    {
      id: 4,
      date: "2025-09-06",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Matched",
      confidence: "96%",
    },
  ];

  const statusColors: Record<Transaction["status"], string> = {
    Matched: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
    Unmatched: "bg-rose-900/20 text-rose-400 border-rose-700",
    "Needs Review": "bg-amber-900/20 text-amber-400 border-amber-700",
  };

  const filtered = transactions.filter(
    (t) =>
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.amount.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "date", label: "Date" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    {
      key: "confidence",
      label: "Confidence",
      render: (t: Transaction) => (
        <span
          className={`inline-flex items-center px-2 border py-1 rounded-full text-xs font-medium ${
            t.confidence === "96%"
              ? "bg-emerald-900/20 text-emerald-400 border-emerald-700"
              : t.confidence === "71%"
              ? "bg-sky-900/20 text-sky-300 border-sky-700"
              : "bg-amber-900/20 text-amber-300 border-amber-700"
          }`}
        >
          {t.confidence}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (t: Transaction) => (
        <span
          className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[t.status]}`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: () => (
        <div className="flex items-center gap-2 md:gap-3">
          {/* Approve */}
          <button className="flex items-center gap-1 bg-transparent border border-[#111] text-emerald-400 px-3 py-1 rounded-full text-xs md:text-sm hover:bg-emerald-900/5 transition">
            <span className="whitespace-nowrap">Approve</span>
            <span className="flex items-center justify-center rounded-full bg-emerald-900/25 border border-emerald-700 p-0.5">
              <Check className="w-3 h-3 text-emerald-400" />
            </span>
          </button>

          {/* Reject */}
          <button className="flex items-center gap-2 bg-[#0b0b0b] border border-[#111] text-gray-300 px-3 py-1 rounded-full text-xs md:text-sm hover:bg-white/5 transition">
            <span className="whitespace-nowrap">Reject</span>
            <span className="flex items-center justify-center rounded-full border border-gray-600 p-0.5">
              <X className="w-3 h-3 text-gray-300" />
            </span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Transactions</h1>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-gray-300" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              2
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

      {/* Section title + Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Interactive mockup</p>
        </div>

        <button className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-4 py-2 rounded-full text-sm hover:bg-emerald-900/5 transition w-full sm:w-auto">
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Quick Action</span>
        </button>
      </div>

      {/* Inbox + Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-semibold">Transactions Inbox</h2>

        <button className="bg-transparent text-emerald-400 text-sm border border-emerald-600 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition w-full sm:w-auto">
          Sync Bank Feed
        </button>
      </div>

      {/* Search */}
      <div className="mt-3 w-full sm:w-72 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-black/20 rounded-xl border border-gray-800 p-2 md:p-4">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
