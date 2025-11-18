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
        <span className={` inline-flex items-center px-2 border-[1px] py-1 justify-center rounded-full text-xs font-medium ${t.confidence === '96%' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-700' : t.confidence === '71%' ? 'bg-sky-900/20 text-sky-300 border border-sky-700' : 'bg-amber-900/20 text-amber-300 border border-amber-700'}`}>
          {t.confidence}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (t: Transaction) => (
        <span className={`px-2.5 py-1 text-xs rounded-full border ${statusColors[t.status]}`}>
          {t.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: () => (
        <div className="flex items-center gap-3">
          {/* Approve button: green text, rounded pill, right-side green circular icon */}
          <button className="flex items-center justify-between gap-1 bg-transparent border border-[#111] text-emerald-400 px-3 py-1 rounded-full text-sm hover:bg-emerald-900/5 transition ">
            <span className="whitespace-nowrap">Approve</span>
            <span className="flex items-center justify-center  rounded-full bg-emerald-900/25 border border-emerald-700">
              <Check className="w-3 h-3 text-emerald-400" />
            </span>
          </button>

          {/* Reject button: dark pill, white/gray text, right-side circular X */}
          <button className="flex items-center justify-between gap-3 bg-[#0b0b0b] border border-[#111] text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-white/2 transition ">
            <span className="whitespace-nowrap">Reject</span>
            <span className="flex items-center justify-center  rounded-full bg-transparent border border-gray-600">
              <X className="w-3 h-3 text-gray-300" />
            </span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Top header: title + right stacked actions */}


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


      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Interactive mockup</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button className="flex items-center gap-2 bg-transparent border border-emerald-700 text-emerald-400 px-4 py-2 rounded-full text-sm hover:bg-emerald-900/5 transition">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Quick Action</span>
          </button>

          
        </div>
      </div>

      {/* Transactions Inbox row with Sync Bank Feed opposite, search below */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Transactions Inbox</h2>
        </div>

        <div>
          <button className="bg-transparent text-emerald-400 text-sm border border-emerald-600 rounded-full px-4 py-2 hover:bg-emerald-900/5 transition w-fit">
            Sync Bank Feed
          </button>
        </div>
      </div>

      {/* <div className="mt-3 w-full md:w-1/4 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-gray-800 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
        />
      </div> */}

      {/* Table Section */}
      <div className="mt-4">
        <DataTable columns={columns} data={filtered} />
      </div>
    </div>
  );
}
