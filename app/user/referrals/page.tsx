"use client";

import Image from "next/image";
import { Bell, Copy, Check, Send } from "lucide-react";
import { useState } from "react";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://rentai.app?r=OTMAN10";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeReferrals = [
    { name: "Jack Smith" },
    { name: "Amira Khan" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Referrals & Partner Program</h1>
        {/* Global commission badge aligned with header, outside member discount card */}
        <span className="inline-flex items-center gap-2 text-[12px] bg-[#072014] text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full shrink-0">
          5 paying • £19.50/mo commission
        </span>

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



      {/* Card 1: Member discount */}
      <div className="relative rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a] p-6">

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-[14px] text-gray-200 font-medium">Member discount</p>
            <p className="text-[13px] text-gray-400 leading-relaxed mt-1">
              Each paying referral gives <span className="font-semibold text-white">10% of their plan price</span> off your bill. Total discount is capped at your plan price.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[18px] font-semibold">£19.50 <span className="text-sm text-gray-400">/mo</span></p>
            <p className="text-[12px] text-gray-400 mt-1">Your plan: £79 • You pay: <span className="text-white font-medium">£59.50</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Active referrals box */}
          <div className="rounded-xl p-4 border border-[#2A2A2A] bg-transparent">
            <p className="text-[14px] font-medium text-white mb-1">Active referrals: <span className="text-white">5 / 10</span></p>
            <p className="text-[13px] text-gray-400">Introduce 5 more paying customer(s) to reach the 10-for-free target on a Starter plan (or to reach a bigger discount on higher plans).</p>
          </div>

          {/* Referral link box */}
          <div className="rounded-xl p-4 border border-[#2A2A2A] bg-transparent flex flex-col justify-between">
            <div className="mb-4">
              <p className="text-[14px] text-gray-200">Your unique link</p>
              <div className="mt-2 flex items-center gap-3 w-full">
                <div className="flex-1 bg-[#111] px-3 py-2 rounded-md border border-[#2A2A2A] text-[13px] text-gray-200 break-words">{referralLink}</div>
                <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] bg-[#0b1510] text-emerald-300 border border-emerald-700 ring-1 ring-emerald-500/30">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] bg-transparent text-gray-300 border border-[#2A2A2A]">
                  <Send className="w-4 h-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Card 2: Partnership program */}
      <div className="rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-medium">Partnership program</h3>
            <p className="text-[12px] text-gray-400">Earn <span className="font-semibold text-white">10% commission</span> monthly for each paying customer you introduce — recurring while they remain active.</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">£19.50 <span className="text-sm text-gray-400">/mo</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Alex R.", status: "Paying" },
            { name: "Priya S.", status: "Paying" },
            { name: "Luis C.", status: "Paying" },
            { name: "Kim T.", status: "Paying" },
            { name: "Maya H.", status: "Paying" },
            { name: "Omar N.", status: "Cancelled" },
          ].map((ref, idx) => (
            <div key={idx} className="bg-[#101010] rounded-xl border border-[#262626] p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <p className="font-medium text-white text-[14px] leading-tight">{ref.name}</p>
                <span className={`inline-flex items-center px-3 py-[2px] text-[12px] rounded-full font-medium ${ref.status === "Paying" ? "bg-[#0f1f15] text-emerald-300 border border-emerald-700" : "bg-[#1b0f0f] text-rose-300 border border-rose-700"}`}>
                  {ref.status}
                </span>
              </div>

              <p className="text-[12px] text-gray-400 mt-1">Starter • £29 /mo</p>
              <p className="text-[12px] text-gray-400 mt-3">Your commission: <span className="text-gray-200 font-semibold">£2.90</span> <span className="text-gray-500">/mo</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent referral events */}
      <div className="mt-6">
        <h3 className="text-[13px] text-gray-400 mb-3">Recent referral events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#2A2A2A] bg-transparent p-4">
            <p className="text-[13px] text-gray-200">+10% — Jack subscribed (Starter)</p>
            <p className="text-[12px] text-gray-500 mt-2">2025-10-10</p>
          </div>

          <div className="rounded-xl border border-[#2A2A2A] bg-transparent p-4">
            <p className="text-[13px] text-gray-200">+10% — Sara upgraded (Pro)</p>
            <p className="text-[12px] text-gray-500 mt-2">2025-10-12</p>
          </div>
        </div>
      </div>

    </div>
  );
}
