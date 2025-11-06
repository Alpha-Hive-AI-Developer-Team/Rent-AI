"use client";

import Image from "next/image";
import { Bell, Search } from "lucide-react";
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
      confidence: "96%",
    },
    {
      id: 3,
      date: "2025-09-05",
      description: "119 The Avenue – R3",
      amount: "£1200",
      status: "Needs Review",
      confidence: "96%",
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
    Matched: "bg-green-900/40 text-green-400 border-green-700/60",
    Unmatched: "bg-red-900/40 text-red-400 border-red-700/60",
    "Needs Review": "bg-yellow-900/40 text-yellow-400 border-yellow-700/60",
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
    { key: "confidence", label: "Confidence" },
    {
      key: "actions",
      label: "",
      render: () => (
        <button className="text-xs bg-[#1a1a1a] border border-gray-700 px-3 py-1 rounded-full text-gray-300 hover:bg-[#222] transition">
          Action
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Transactions</h1>

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

      {/* 🔍 Search + Sync Section */}
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

        <button className="bg-[#1a1a1a] text-sm border border-gray-700 rounded-full px-4 py-2 hover:bg-[#222] transition w-fit">
          Sync Bank Feed
        </button>
      </div>

      {/* Table Section */}
      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
