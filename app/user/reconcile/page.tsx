"use client";

import Image from "next/image";
import { Bell } from "lucide-react";

export default function ReconcilePage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Reconcile</h1>

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

      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-sm md:text-md font-semibold text-center sm:text-left">
          Reconcile
        </h2>

        <button className="bg-[#111] border border-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-full w-full sm:w-auto transition">
          Quick Actions
        </button>
      </div>

      {/* Three-column layout (Expected Rents | AI Matches | Bank Transactions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Expected Rents */}
        <div className="bg-[#0B0B0B] rounded-2xl border border-[#1a1a1a] p-4">
          <h3 className="text-sm font-medium text-gray-300">Expected Rents</h3>
          <div className="mt-3 space-y-3">
            {[{ name: 'Tom Walker', due: '2025-10-01', amt: '£950' }, { name: 'Amira K.', due: '2025-10-01', amt: '£1450' }].map((r, i) => (
              <div key={i} className="bg-black border border-gray-800 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-gray-400 text-xs">Due {r.due}</p>
                </div>
                <div className="text-lg font-semibold">{r.amt}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Matches */}
        <div className="bg-[#0B0B0B] rounded-2xl border border-[#1a1a1a] p-4">
          <h3 className="text-sm font-medium text-gray-300">AI Matches</h3>
          <div className="mt-3 space-y-3">
            {[{
              title: 'FPS WALKER TOM RENT 22 NORTH', tx: 'TX-82', party: 'Tom Walker', amt: '£950', score: '71%'
            },{
              title: 'FPI AMIRA K RENT 52 OAK', tx: 'TX-83', party: 'Amira K.', amt: '£1450', score: '22%'
            }].map((m, i) => (
              <div key={i} className="bg-black border border-gray-800 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium uppercase leading-snug">{m.title}</p>
                    <p className="text-gray-400 text-xs">tx {m.tx}</p>
                    <p className="text-gray-400 text-xs mt-2">→ {m.party} / {m.amt}</p>
                  </div>

                  <div className={
                    "flex-shrink-0 text-sm font-normal px-3 py-1 rounded-full border " +
                    (m.score === '71%'
                      ? 'bg-[#07142a] border-[#11325a] text-sky-300'
                      : 'bg-[#2b1a05] border-[#4b2f05] text-amber-300')
                  }>
                    Score {m.score}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button className="bg-black border border-gray-800 text-emerald-400 px-3 py-1 rounded-full text-sm">Accept + Learn</button>
                  <button className="bg-black border border-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Transactions */}
        <div className="bg-[#0B0B0B] rounded-2xl border border-[#1a1a1a] p-4">
          <h3 className="text-sm font-medium text-gray-300">Bank Transactions</h3>
          <div className="mt-3 space-y-3">
            {[{ title: 'FPI JACK LEAH 119AV RENT', date: '2025-10-01', amount: '£1200' }, { title: 'FPS WALKER TOM RENT 22 NORTH', date: '2025-10-02', amount: '£600' }, { title: 'FPI AMIRA K RENT 52 OAK', date: '2025-10-08', amount: '£1450' }].map((t, i) => (
              <div key={i} className="bg-black border border-gray-800 rounded-lg p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-gray-400 text-xs">{t.date}</p>
                </div>
                <div className="text-lg font-semibold">{t.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
