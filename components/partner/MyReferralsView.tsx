"use client";

import React, { useState, useMemo } from "react";
import { Search, Building2, Clock, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { usePartnerReferrals } from "@/hooks/usePartner";

export default function MyReferralsView() {
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: resp, isLoading } = usePartnerReferrals(activeTab);

  const referrals = resp?.data?.referrals || [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return referrals;
    const q = searchQuery.toLowerCase();
    return referrals.filter(
      (r) =>
        r.customerName?.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
    );
  }, [referrals, searchQuery]);

  return (
    <div className="space-y-6 w-full">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Referrals Portfolio</h1>
          <p className="text-xs text-gray-400 mt-1">
            Track customer introductions, price-grandfathered recurring commissions, and 14-day hold lifecycles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Tab Filter Buttons */}
          <div className="flex bg-[#141414] p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "active"
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Active Referrals
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "pending"
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pending (14d)
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                activeTab === "all"
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search referrals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111] border border-gray-800 text-xs text-gray-300 rounded-lg pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#027A48]"
            />
          </div>
        </div>
      </div>

      {/* Full-Width Table Card */}
      <div className="bg-[#111] border border-gray-800/50 rounded-xl overflow-hidden p-5 space-y-4">
        <div className="overflow-x-auto rounded-lg border border-gray-800/60">
          <table className="w-full text-left text-xs text-gray-300 min-w-[720px]">
            <thead>
              <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium">
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Introduced Date</th>
                <th className="p-3.5">Introduction Price</th>
                <th className="p-3.5">Locked Commission</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Qualification Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Loading referrals...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No referrals found for this view.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isPending = r.status === "pending_qualification";
                  const isForfeited = r.status === "forfeited";
                  const isCancelled = r.status === "cancelled";

                  const introDate = r.introducedAt
                    ? new Date(r.introducedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  const qualifiedDate = r.qualifiedAt
                    ? new Date(r.qualifiedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : isPending
                    ? "Pending qualification"
                    : isForfeited
                    ? "Forfeited (60d)"
                    : "—";

                  return (
                    <tr key={r.id} className="hover:bg-[#141414] transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#161616] border border-gray-800 flex items-center justify-center text-gray-400">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{r.customerName}</p>
                            <p className="text-[11px] text-gray-500">{r.customerEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-gray-400">{introDate}</td>

                      <td className="p-3.5 text-gray-300 font-mono">£{r.lockedSubscriptionPriceGBP}</td>

                      <td className="p-3.5">
                        <span className="font-semibold text-white font-mono">
                          £{r.lockedMonthlyCommissionGBP}
                          <span className="text-[11px] font-normal text-gray-500">/mo</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/20 text-amber-400 border border-amber-800/40">
                            <Clock className="w-3 h-3" /> Pending (14d)
                          </span>
                        ) : isForfeited ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-950/20 text-rose-400 border border-rose-800/40">
                            <AlertCircle className="w-3 h-3" /> Forfeited (60d)
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1a1a1a] text-gray-400 border border-gray-800">
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-gray-400 text-[11px]">{qualifiedDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Commercial Terms Notice */}
        <div className="p-3 bg-[#0c0c0c] rounded-lg border border-gray-800/60 flex items-center gap-2.5 text-xs text-gray-400">
          <Info className="w-4 h-4 text-gray-400 shrink-0" />
          <span>
            <strong className="text-gray-200">Price Grandfathering Active:</strong> Each referral is locked at the
            subscription price active when they joined. Future Rent AI price updates will not reduce your historical
            commission amount.
          </span>
        </div>
      </div>
    </div>
  );
}
