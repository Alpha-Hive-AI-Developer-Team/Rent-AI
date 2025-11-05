"use client";

import Image from "next/image";
import { Bell, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://rental.app?r=OTMAN10";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Referrals</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
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

      {/* Referral Info Section */}
      <div className="bg-[#111] rounded-xl p-6 space-y-6 border border-gray-800">
        {/* Plan & Price */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium text-lg">Referrals & Partner Program</h2>
            <p className="text-sm text-gray-400 mt-1">
              Each paying referral gives 10% off their plan price on your bill. Copy your unique link.
            </p>
          </div>
          <div className="mt-3 sm:mt-0 text-right">
            <p className="text-2xl font-semibold">£19.50 <span className="text-sm text-gray-400">/mon</span></p>
            <p className="text-xs text-gray-400">
              Your plan: £79 • You pay: £59.50
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Your unique link</p>
          <div className="flex items-center bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-transparent px-3 py-2 text-gray-300 text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 hover:bg-gray-800 transition"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Active Referrals */}
        <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <p className="font-medium">Active referrals: <span className="text-green-400">5 / 10</span></p>
            <p className="text-sm text-gray-400">
              Introduce 5 more paying customers to reach the 10-for-free target on a Starter plan.
            </p>
          </div>

          {/* Referral Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-[#111] rounded-lg border border-gray-800 p-4 flex flex-col justify-between"
              >
                <div>
                  <p className="text-gray-400 text-sm mb-1">2025-10-10</p>
                  <p className="font-semibold text-white">Jack Smith</p>
                  <p className="text-gray-400 text-sm mt-1">Subscribed</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-green-400 font-semibold">+10%</p>
                  <span className="text-xs text-gray-500">(Starter)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
