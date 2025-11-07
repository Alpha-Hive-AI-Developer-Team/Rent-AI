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

      {/* Expected Rents */}
      <section className="bg-[#111] rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-300">Expected Rents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-black border border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium text-sm sm:text-base">Tom Walker</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Due 2025-10-01
                </p>
              </div>
              <p className="text-lg sm:text-xl font-semibold text-right sm:text-left">
                £950
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Matches */}
      <section className="bg-[#111] rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-300">AI Matches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-black border border-gray-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <span className="text-xs bg-[#111] border border-gray-800/30 text-yellow-400 px-2 py-1 rounded-full w-fit">
                Score 71%
              </span>

              <div className="mt-3 space-y-1">
                <p className="font-medium text-sm sm:text-base">
                  {i === 1
                    ? "FPS WALKER TOM RENT 22 NORTH"
                    : "FPI AMIRA K RENT 52 OAK"}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">tx TX-8</p>
                <p className="text-gray-400 text-xs sm:text-sm">
                  → Tom Walker / £950
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
                <button className="w-full sm:w-auto flex-1 bg-[#111] border border-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm transition">
                  Accept + Learn
                </button>
                <button className="w-full sm:w-auto flex-1 bg-[#111] border border-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm transition">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bank Transactions */}
      <section className="bg-[#111] rounded-xl p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-300">Bank Transactions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-black border border-gray-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium text-sm sm:text-base">
                  FPI JACK LEAH 119AV RENT
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">2025-10-02</p>
              </div>
              <p className="text-lg sm:text-xl font-semibold text-right sm:text-left">
                £1200
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
