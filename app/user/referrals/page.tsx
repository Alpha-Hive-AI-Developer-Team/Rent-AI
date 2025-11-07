"use client";

import Image from "next/image";
import { Bell, Copy, Check, Send } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-end gap-4">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-medium text-lg sm:text-xl">
              Referrals & Partner Program
            </h2>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              Each paying referral gives 10% off their plan price on your bill.
              Copy your unique link.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-semibold">
              £19.50 <span className="text-sm text-gray-400">/mon</span>
            </p>
            <p className="text-xs text-gray-400">
              Your plan: £79 • You pay: £59.50
            </p>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Your unique link</p>
        <div className="flex flex-col sm:flex-row items-center bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-700">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 w-full bg-transparent px-3 py-2 text-gray-300 text-sm text-center sm:text-left"
          />
          <div className="flex items-center w-full sm:w-auto justify-center sm:justify-end border-t sm:border-t-0 sm:border-l border-gray-800">
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
            <button className="px-3 py-2 hover:bg-gray-800 transition">
              <Send className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Referrals */}
      <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
        <div className="mb-4">
          <p className="font-medium mb-2 text-base sm:text-lg">
            Active referrals: <span className="text-white">5 / 10</span>
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Introduce 5 more paying customers to reach the 10-for-free target on
            a Starter plan.
          </p>
        </div>

        {/* Referral Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#111] rounded-lg border border-gray-800 p-4 flex flex-col justify-between"
            >
              <p className="text-gray-400 text-sm mb-1">2025-10-10</p>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">Jack Smith</p>
                <div className="text-right">
                  <p className="text-green-400 font-semibold text-sm">+10%</p>
                  <span className="text-xs text-gray-500">(Starter)</span>
                </div>
              </div>

              <p className="text-gray-400 text-sm mt-2">Subscribed</p>
            </div>
          ))}
        </div>
      </div>

      {/* Partnership Program */}
      <div className="bg-[#0a0a0a] rounded-lg p-4 md:p-6 border border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold">Partnership program</h2>
          <p className="text-xl sm:text-2xl font-semibold">
            £19.50 <span className="text-sm text-gray-400">/mon</span>
          </p>
        </div>

        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Earn 10% commission monthly for each paying customer you introduce —
          recurring while they remain active.
        </p>

        {/* Referral Partner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: "Alex R.", status: "Paying" },
            { name: "Priya S.", status: "Paying" },
            { name: "Luis C.", status: "Paying" },
            { name: "Kim T.", status: "Paying" },
            { name: "Maya H.", status: "Paying" },
            { name: "Omar N.", status: "Cancelled" },
          ].map((ref, idx) => (
            <div
              key={idx}
              className="bg-[#111] rounded-lg border border-gray-800 p-4 flex flex-col justify-between"
            >
              <div className="flex items-center mb-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    ref.status === "Paying"
                      ? "text-green-400 border border-gray-800"
                      : "text-red-400 border border-gray-800"
                  }`}
                >
                  {ref.status}
                </span>
              </div>

              <p className="font-semibold text-white text-base">{ref.name}</p>
              <p className="text-sm text-gray-400 mt-1">Starter • £29 /mo</p>
              <p className="text-sm text-gray-400 mt-1">
                Your commission: £2.90 /mo
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
