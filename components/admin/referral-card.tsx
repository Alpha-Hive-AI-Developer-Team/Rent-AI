"use client";

import React from "react";
import { Award, Users, Clock, CheckCircle2 } from "lucide-react";

interface ReferralCardProps {
  name: string;
  rank: number;
  earnings: string;
  hold?: string;
  available?: string;
  referrals: number;
  referralCode?: string;
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "PA";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ReferralCard({
  name,
  rank,
  earnings,
  hold,
  available,
  referrals,
  referralCode,
}: ReferralCardProps) {
  const isTop1 = rank === 1;
  const isTop2 = rank === 2;
  const isTop3 = rank === 3;

  const rankBadgeStyle = isTop1
    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
    : isTop2
    ? "bg-slate-300/15 border-slate-300/40 text-slate-200"
    : isTop3
    ? "bg-amber-700/15 border-amber-700/40 text-amber-400"
    : "bg-white/5 border-gray-800 text-gray-400";

  return (
    <div className="bg-[#111] border border-gray-800/80 rounded-2xl p-4 sm:p-5 w-full flex flex-col justify-between gap-4 transition-all duration-200 hover:border-gray-700 hover:shadow-lg shadow-md shadow-black/40">
      {/* Top Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-800/30 to-teal-900/30 border border-emerald-700/30 text-emerald-300 font-semibold text-xs flex items-center justify-center shrink-0">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">
              {name}
            </h3>
            {referralCode ? (
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Code: <span className="text-emerald-400">{referralCode}</span>
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${rankBadgeStyle}`}
        >
          {isTop1 && <Award className="w-3.5 h-3.5" />}
          <span>#{rank}</span>
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#0c0c0c] border border-gray-800/60 text-xs">
        <div>
          <p className="text-gray-400 text-[11px]">Total Earned</p>
          <p className="text-white font-bold text-sm tabular-nums mt-0.5">
            {earnings}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-[11px] flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" />
            Referrals
          </p>
          <p className="text-white font-bold text-sm tabular-nums mt-0.5">
            {referrals}
          </p>
        </div>
        <div className="pt-2 border-t border-gray-800/60">
          <p className="text-gray-400 text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            In Hold (14d)
          </p>
          <p className="text-amber-400 font-semibold tabular-nums mt-0.5">
            {hold ?? "£0.00"}
          </p>
        </div>
        <div className="pt-2 border-t border-gray-800/60">
          <p className="text-gray-400 text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Available
          </p>
          <p className="text-emerald-400 font-semibold tabular-nums mt-0.5">
            {available ?? "£0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}

