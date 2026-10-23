"use client";

import React from "react";
import { Plus, Minus, RefreshCw, Clock, Activity, Calendar } from "lucide-react";
import { usePartnerActivity } from "@/hooks/usePartner";

export default function ActivityView() {
  const { data: activityResp, isLoading } = usePartnerActivity(1);

  const activities = activityResp?.data?.activities || [];

  return (
    <div className="space-y-6 w-full">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-white">Partner Activity Timeline</h1>
        <p className="text-xs md:text-sm text-[#535862] mt-1">
          Complete real-time log of customer signups, 14-day hold completions, 60-day resets, and monthly recurring
          commissions.
        </p>
      </div>

      <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 space-y-4 shadow-md">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[#161616] animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            No partner activity recorded yet. Share your referral link to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60 border border-gray-800/60 rounded-lg overflow-hidden">
            {activities.map((a) => {
              const isPositive = a.badgeType === "positive" || a.title.startsWith("+");
              const isNegative = a.badgeType === "negative" || a.title.startsWith("-1");
              const isWarning = a.badgeType === "warning" || (a.title.includes("£") && a.title.startsWith("-"));

              const dateStr = a.eventDate
                ? new Date(a.eventDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <div
                  key={a._id}
                  className="p-3.5 bg-[#0c0c0c] hover:bg-[#141414] flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                        isPositive
                          ? "bg-[#027A48]/15 border-emerald-900/40 text-emerald-400"
                          : isWarning
                          ? "bg-amber-950/20 border-amber-800/40 text-amber-400"
                          : "bg-rose-950/20 border-rose-800/40 text-rose-400"
                      }`}
                    >
                      {isPositive ? (
                        <Plus className="w-3.5 h-3.5" />
                      ) : isWarning ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-white">{a.title}</span>
                      <span className="text-xs text-gray-400 ml-2">— {a.subtitle}</span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 tabular-nums">{dateStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
