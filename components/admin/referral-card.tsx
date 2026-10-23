"use client";

import React from "react";

interface ReferralCardProps {
  name: string;
  rank: number;
  earnings: string;
  hold?: string;
  available?: string;
  referrals: number;
  referralCode?: string;
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
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-4 w-full flex flex-col gap-4 transition hover:shadow-lg hover:border-gray-700">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-white font-medium">{name}</h3>
            {referralCode ? (
              <p className="text-xs text-[#737373]">Code: {referralCode}</p>
            ) : null}
          </div>
        </div>
        <span className="text-xs text-white border border-gray-800 rounded-full px-2 py-1">
          #{rank}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
        <div>
          <p className="text-[#737373]">Total earned</p>
          <p className="text-white font-semibold tabular-nums">{earnings}</p>
        </div>
        <div>
          <p className="text-[#737373]">Referrals</p>
          <p className="text-white font-semibold tabular-nums">{referrals}</p>
        </div>
        <div>
          <p className="text-[#737373]">In hold (14d)</p>
          <p className="text-amber-300 font-semibold tabular-nums">{hold ?? "£0.00"}</p>
        </div>
        <div>
          <p className="text-[#737373]">Available</p>
          <p className="text-emerald-300 font-semibold tabular-nums">
            {available ?? "£0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}
