"use client";

import React from "react";

interface ReferralCardProps {
  name: string;
  rank: number;
  earnings: string;
  referrals: number;
  referralCode?: string;
}

export default function ReferralCard({
  name,
  rank,
  earnings,
  referrals,
  referralCode,
}: ReferralCardProps) {
  return (
   <div className="bg-[#111] border border-gray-800 rounded-xl p-4 w-full flex flex-col gap-4 transition hover:shadow-lg hover:border-gray-700">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-white font-medium">{name}</h3>
            {referralCode ? <p className="text-xs text-[#737373]">Code: {referralCode}</p> : null}
          </div>
        </div>
        <span className="text-xs text-white border border-gray-800 rounded-full px-2 py-1">
          #{rank}
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-gray-400 mt-2">
        <div>
          <p className="text-[#737373]">Earnings</p>
          <p className="text-white font-semibold">{earnings}</p>
        </div>
        <div>
          <p className="text-[#737373]">Referrals</p>
          <p className="text-white font-semibold">{referrals}</p>
        </div>
      </div>
    </div>
  );
}
