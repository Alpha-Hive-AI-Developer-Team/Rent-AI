"use client";

import React from "react";
import { ShieldCheck, Clock, AlertTriangle, ShieldAlert, ArrowRight, Shield } from "lucide-react";
import ProtectionGauge from "./ProtectionGauge";
import { usePartnerProtection } from "@/hooks/usePartner";

type ProtectionStatusViewProps = {
  onReferClick?: () => void;
};

export default function ProtectionStatusView({ onReferClick }: ProtectionStatusViewProps) {
  const { data: protectionResp, isLoading } = usePartnerProtection();

  const data = protectionResp?.data;
  const daysRemaining = data?.daysRemaining ?? 60;
  const isPendingProtection = data?.isPendingProtection ?? false;
  const protectionStatus = data?.protectionStatus ?? "protected";

  return (
    <div className="space-y-6 w-full">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-white">60-Day Portfolio Protection Status</h1>
        <p className="text-xs text-gray-400 mt-1">
          Safeguard your recurring monthly commissions by introducing at least one new qualifying customer every 60 days.
        </p>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Gauge & Current State */}
        <div className="lg:col-span-5 bg-[#111] border border-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-5">
          <ProtectionGauge daysRemaining={daysRemaining} totalDays={60} size={160} strokeWidth={11} />

          <div className="space-y-1.5">
            {isPendingProtection ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/20 text-amber-400 border border-amber-800/40">
                <Clock className="w-3.5 h-3.5" /> Pending Protection Active
              </span>
            ) : daysRemaining <= 7 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/20 text-rose-400 border border-rose-800/40">
                <ShieldAlert className="w-3.5 h-3.5" /> Portfolio At Risk
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                <ShieldCheck className="w-3.5 h-3.5" /> Portfolio Protected
              </span>
            )}

            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed pt-1">
              {isPendingProtection
                ? "A new referral is currently completing their 14-day anti-refund trial, temporarily freezing your portfolio protection countdown."
                : `You have ${daysRemaining} days remaining in your current 60-day cycle to introduce 1 new customer.`}
            </p>
          </div>

          {onReferClick && (
            <button
              onClick={onReferClick}
              className="w-full py-2.5 rounded-lg bg-[#027A48] hover:bg-green-700 text-white font-medium text-xs transition flex items-center justify-center gap-2"
            >
              Introduce New Customer
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right Column (7 cols): The 4 Core Rules */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Rule 1: Stay Active */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">How to Stay Active</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Introduce at least <strong className="text-gray-200">1 new qualifying customer every 60 days</strong>. Once the customer completes their 14-day anti-refund trial, your 60-day protection countdown automatically resets for another 60 days.
              </p>
            </div>
          </div>

          {/* Rule 2: 60-Day Forfeiture */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-gray-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">The 60-Day Forfeiture Consequence</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                If 60 days elapse with no new qualifying customer, commission rights for <strong className="text-gray-200">the oldest active referral are permanently removed (-1 Customer)</strong>. That commission right is permanently lost.
              </p>
            </div>
          </div>

          {/* Rule 3: Anti-Recycling */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-gray-800 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Strict Anti-Recycling Protection</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                If a partner loses a referral under the 60-day rule, they cannot ask that customer to cancel and re-subscribe. Durable historical identity tracking ensures recycled customers will never count as new referrals or reset the clock.
              </p>
            </div>
          </div>

          {/* Rule 4: Pending Protection */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#181818] border border-gray-800 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Pending Protection Safeguard</h3>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                When a new customer signs up, your 60-day protection enters <strong className="text-gray-200">Pending Protection</strong> during their 14-day qualification trial. Your portfolio cannot be penalized or forfeited while a new referral is in their trial period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
