"use client";

import React from "react";
import { Share2, UserCheck, RefreshCw, Shield, Percent, Clock, CheckCircle2 } from "lucide-react";

export default function HowItWorksView() {
  const steps = [
    {
      num: "01",
      title: "Share Your Link",
      desc: "Share your unique partner link or referral code with landlords, property managers, and letting agents.",
      icon: Share2,
    },
    {
      num: "02",
      title: "Customer Subscribes",
      desc: "When they subscribe to Rent AI at £299/mo, their account is permanently linked to your partner profile.",
      icon: UserCheck,
    },
    {
      num: "03",
      title: "14-Day Anti-Refund Trial",
      desc: "Referrals qualify after a 14-day hold to protect against trial cancellations. Your 60-day protection resets.",
      icon: Clock,
    },
    {
      num: "04",
      title: "Recurring Commission",
      desc: "Earn 10% (£29.90/month) recurring commission every month for as long as they stay subscribed.",
      icon: RefreshCw,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">How the Partner Programme Works</h1>
        <p className="text-xs text-gray-400 mt-1">
          Simple, transparent, and recurring partner income for introducing landlords to Rent AI.
        </p>
      </div>

      {/* 4 Steps Desktop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="bg-[#111] border border-gray-800/50 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-gray-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-500">{s.num}</span>
                <div className="w-8 h-8 rounded-lg bg-[#161616] border border-gray-800 flex items-center justify-center text-emerald-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-1.5">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Economics & Commercial Terms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Pricing & Grandfathering */}
        <div className="bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Commercial Terms & Price Locking</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-gray-200">£29.90</strong> represents 10% of today&apos;s standard £299 monthly subscription.
            Rent AI guarantees <strong className="text-gray-200">price grandfathering</strong>: if subscription rates
            increase in the future, all existing referrals remain locked at the commission rate active when they subscribed.
          </p>
        </div>

        {/* Card 2: 60-Day Activity Protection */}
        <div className="bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">60-Day Activity Protection Cycle</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Partners must introduce at least <strong className="text-gray-200">1 new qualifying customer every 60 days</strong>.
            This rolling rule keeps your entire recurring portfolio safeguarded. If 60 days elapse without a new
            qualifying customer, the oldest referral is forfeited.
          </p>
        </div>
      </div>
    </div>
  );
}
