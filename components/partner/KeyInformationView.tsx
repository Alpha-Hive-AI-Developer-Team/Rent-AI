"use client";

import React from "react";
import { CheckCircle2, Info, Users, Clock, Ban, ShieldCheck } from "lucide-react";

export default function KeyInformationView() {
  const rules = [
    {
      id: "rate",
      title: "10% Commission Rate",
      description:
        "Earn 10% of the full monthly subscription price (£299/month). That equals £29.90 every month for each active customer you introduce.",
      icon: CheckCircle2,
      accent: "text-emerald-400",
    },
    {
      id: "prices",
      title: "Price Grandfathering",
      description:
        "If Rent AI increases subscription pricing in the future, all existing referrals keep their original introduction commission amount. New referrals adopt the updated price.",
      icon: Info,
      accent: "text-gray-300",
    },
    {
      id: "eligibility",
      title: "Open Eligibility",
      description:
        "Anyone can join the Partner Programme. You do not need to own property or subscribe to Rent AI yourself to refer customers and earn recurring income.",
      icon: Users,
      accent: "text-gray-300",
    },
    {
      id: "60day",
      title: "60-Day Activity Protection",
      description:
        "Introduce at least 1 new qualifying paying customer every 60 days to keep your portfolio protected. If missed, commission for the oldest active customer is permanently removed.",
      icon: Clock,
      accent: "text-amber-400",
    },
    {
      id: "14day",
      title: "14-Day Anti-Refund Period",
      description:
        "Introduced customers must complete 14 days without refund or dispute before qualifying. During these 14 days, your portfolio countdown is frozen under Pending Protection.",
      icon: ShieldCheck,
      accent: "text-emerald-400",
    },
    {
      id: "ban",
      title: "Anti-Abuse & Anti-Recycling",
      description:
        "Self-referrals are strictly forbidden. A customer forfeited under the 60-day rule cannot cancel and re-subscribe with the same partner code.",
      icon: Ban,
      accent: "text-rose-400",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Programme Rules & Key Information</h1>
        <p className="text-xs md:text-sm text-[#535862] mt-1">
          Core rules governing partner commissions, portfolio protection, anti-refund holds, and anti-abuse policies.
        </p>
      </div>

      {/* 3-Column Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {rules.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 flex flex-col justify-between space-y-3.5 hover:border-gray-700 transition shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#161616] border border-gray-800 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${r.accent}`} />
                </div>
                <h3 className="text-sm font-semibold text-white">{r.title}</h3>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">{r.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
