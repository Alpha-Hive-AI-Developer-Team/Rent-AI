"use client";

import Image from "next/image";
import { Bell, Copy, Check, Send } from "lucide-react";
import { useMyProfile } from "@/hooks/useAuth";
import { useMemo, useState } from "react";
import { useReferralsSummary } from "@/hooks/useAuth";
import plansConfig, { PLAN_PRICE_CENTS } from "@/lib/plans";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const { data: summaryResp } = useReferralsSummary();
  const { data: profileResp } = useMyProfile();

  const referralCode = profileResp?.data?.myReferralCode || "OTMAN10";
  const referralLink = (typeof window !== "undefined" ? window.location.origin : "https://rentai.app") + `/?r=${referralCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReferrals = summaryResp?.data?.totalReferrals ?? 0;
  const payingReferrals = summaryResp?.data?.payingReferrals ?? 0;
  const totalCommissionGBP = useMemo(() => {
    const cents = summaryResp?.data?.totalCommissionCents ?? 0;
    return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
  }, [summaryResp]);
  const referrals = summaryResp?.data?.referrals || [];
  const payingList = (referrals || []).filter((r: any) => (r.planType || 'free') !== 'free');

  // Compute how many more paying referrals are needed to fully cover plan price
  const currentPlan: string = profileResp?.data?.planType || "free";
  const currentDiscount = Number(totalCommissionGBP) || 0;

  const planKeysOrder = ["free", "starter", "pro", "enterprise"];
  const currentIndex = planKeysOrder.indexOf(currentPlan as any);
  const targets = currentIndex >= 0 ? planKeysOrder.slice(currentIndex + 1) : ["starter"];

  const neededByReferralType: Record<string, { target: string; neededStarter?: number; neededPro?: number; neededEnterprise?: number; remaining?: number }> = {};

  targets.forEach((target) => {
    const planPriceGBP = Math.round((PLAN_PRICE_CENTS[target] || 0) / 100);
    const remaining = Math.max(0, planPriceGBP - currentDiscount);

    // value given by one paying referral depends on referred user's plan — 10% of that plan price
    const perStarter = 0.1 * (Math.round((PLAN_PRICE_CENTS['starter'] || 0) / 100));
    const perPro = 0.1 * (Math.round((PLAN_PRICE_CENTS['pro'] || 0) / 100));
    const perEnterprise = 0.1 * (Math.round((PLAN_PRICE_CENTS['enterprise'] || 0) / 100));

    const neededStarter = perStarter > 0 ? Math.ceil(remaining / perStarter) : Infinity;
    const neededPro = perPro > 0 ? Math.ceil(remaining / perPro) : Infinity;
    const neededEnterprise = perEnterprise > 0 ? Math.ceil(remaining / perEnterprise) : Infinity;

    neededByReferralType[target] = { target, neededStarter, neededPro, neededEnterprise, remaining };
  });

  // Find the next unmet target (first target where remaining > 0)
  const nextTarget = targets.find((t) => {
    const info = neededByReferralType[t];
    return info && typeof info.remaining === 'number' && info.remaining > 0;
  });

  // Determine the next plan to show for pricing (if user is not on top plan)
  const nextPlanKey = targets.length > 0 ? targets[0] : currentPlan;
  const nextPlanLabel = nextPlanKey.charAt(0).toUpperCase() + nextPlanKey.slice(1);
  const nextPlanPriceGBP = Math.round((PLAN_PRICE_CENTS[nextPlanKey] || PLAN_PRICE_CENTS[currentPlan] || 0) / 100);
  const youPayNumber = Math.max(0, nextPlanPriceGBP - currentDiscount);
  const youPayDisplay = youPayNumber.toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Referrals & Partner Program</h1>
        {/* Global commission badge aligned with header, outside member discount card */}
        <span className="inline-flex items-center gap-2 text-[12px] bg-[#072014] text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full shrink-0">
          {payingReferrals} paying • £{totalCommissionGBP}/mo commission
        </span>

    
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
            <p className="text-[18px] font-semibold">£{totalCommissionGBP} <span className="text-sm text-gray-400">/mo</span></p>
            <p className="text-[12px] text-gray-400 mt-1">Your Upcoming plan: {nextPlanLabel} • You pay: <span className="text-white font-medium">£{youPayDisplay}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {/* Active referrals box */}
          <div className={`rounded-xl p-4 border border-[#2A2A2A] bg-transparent flex flex-col ${payingReferrals === 0 ? 'items-center justify-center' : 'items-start justify-center'}`}>
          
            {payingReferrals === 0 ? (<>
            
  
              
              <p className="text-[13px] text-gray-400">No active paying referrals yet — refer customers to get discounts and earn <span className="font-semibold text-white">10%</span> commission. Share your link above to get started.</p>
           </>   ) : (
            <>
              <p className="text-[14px] font-medium text-white mb-1">Active referrals: <span className="text-white">{totalReferrals} / {payingReferrals}</span></p>
              <p className="text-[13px] text-gray-400">{(() => {
                if (!profileResp?.data) return `Invite paying customers to increase your discount.`;
                if (targets.length === 0) return `You are on the top plan — referral discounts still apply and are capped at your plan price.`;

                if (!nextTarget) {
                  return `You have already reached the next target plan based on your current discount.`;
                }

                const info = neededByReferralType[nextTarget];
                if (!info) return `Invite paying customers to increase your discount.`;

                const tLabel = nextTarget.charAt(0).toUpperCase() + nextTarget.slice(1);
                const s = info.neededStarter === Infinity ? '—' : `${info.neededStarter}`;
                const p = info.neededPro === Infinity ? '—' : `${info.neededPro}`;
                const e = info.neededEnterprise === Infinity ? '—' : `${info.neededEnterprise}`;

                return `To make ${tLabel} free: ${s} more paying Starter referrals (or ${p} paying Pro referrals, or ${e} Enterprise referrals).`;
              })()}</p>
           </> )}
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
            <p className="text-base font-semibold">£{totalCommissionGBP} <span className="text-sm text-gray-400">/mo</span></p>
          </div>
        </div>

        {payingList.length === 0 ? (
          <div className="rounded-xl border border-[#2A2A2A] bg-transparent p-6 text-center text-gray-400">
            No active paying members yet — once referrals subscribe you'll see them here and earn commission.
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {payingList.map((r) => {
            const name = [r.firstName || "", r.lastName || ""].filter(Boolean).join(" ") || r.email;
            const plan = r.planType || "free";
            const planPriceGBP = Math.round((PLAN_PRICE_CENTS[plan] || 0) / 100);
            const status = plan !== "free" ? "Paying" : "Free";
            const commissionGBP = (planPriceGBP * 0.10).toFixed(2);
            return (
              <div key={r._id} className="bg-[#101010] rounded-xl border border-[#262626] p-4 flex flex-col">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-white text-[14px] leading-tight">{name}</p>
                  <span className={`inline-flex items-center px-3 py-[2px] text-[12px] rounded-full font-medium ${status === "Paying" ? "bg-[#0f1f15] text-emerald-300 border border-emerald-700" : "bg-[#1b0f0f] text-rose-300 border border-rose-700"}`}>
                    {status}
                  </span>
                </div>

                <p className="text-[12px] text-gray-400 mt-1">{plan.charAt(0).toUpperCase() + plan.slice(1)} • £{planPriceGBP} /mo</p>
                {status === "Paying" && (
                  <p className="text-[12px] text-gray-400 mt-3">Your commission: <span className="text-gray-200 font-semibold">£{commissionGBP}</span> <span className="text-gray-500">/mo</span></p>
                )}
              </div>
            );
          })}
        </div>
        )}
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
