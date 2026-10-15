"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Linkedin,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { usePartnerDashboard, usePartnerReferrals, usePartnerActivity } from "@/hooks/usePartner";
import { useMyProfile } from "@/hooks/useAuth";
import { resolveReferralLink } from "@/lib/utils/referralLink";
import { buildReferralShareUrls, openShareUrl } from "@/lib/utils/referralShare";
import toast from "react-hot-toast";

type PartnerDashboardProps = {
  onReferClick?: () => void;
  onViewReferrals?: () => void;
  onViewProtection?: () => void;
  onViewEarnings?: () => void;
  onViewActivity?: () => void;
};

export default function PartnerDashboard({
  onReferClick,
  onViewReferrals,
  onViewProtection,
  onViewEarnings,
  onViewActivity,
}: PartnerDashboardProps) {
  const { data: dashboardResp } = usePartnerDashboard();
  const { data: referralsResp } = usePartnerReferrals("all");
  const { data: activityResp } = usePartnerActivity(1);
  const { data: profileResp } = useMyProfile();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const data = dashboardResp?.data;
  const user = profileResp?.data;
  const firstName = user?.firstName || "Partner";

  const mrc = data?.monthlyRecurringCommissionGBP ?? "0.00";
  const activeCustomers = data?.activeCommissionCustomers ?? 0;
  const daysRemaining = data?.daysRemaining ?? 60;
  const isPendingProtection = data?.isPendingProtection ?? false;
  const availableToWithdraw = data?.availableToWithdrawGBP ?? "0.00";
  const pendingHold = data?.pendingHoldGBP ?? "0.00";
  const referralCode = data?.referralCode || profileResp?.data?.myReferralCode || "PARTNER10";
  const referralLink = resolveReferralLink(data?.referralLink, referralCode);

  const recentReferrals = (referralsResp?.data?.referrals || []).slice(0, 4);
  const recentActivities = (activityResp?.data?.activities || []).slice(0, 4);

  // Calculate progress ratio for 60-day cycle
  const progressRatio = Math.max(0, Math.min(100, Math.round((daysRemaining / 60) * 100)));

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const shareUrls = buildReferralShareUrls(referralLink, referralCode);

  return (
    <div className="space-y-6 w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Partner Programme Overview</h1>
          <p className="text-xs text-gray-400 mt-1">
            Welcome back, {firstName} • Earn 10% recurring monthly commission on referred active subscriptions.
          </p>
        </div>
        {onReferClick && (
          <button
            onClick={onReferClick}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-[#027A48] hover:bg-green-700 text-white transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Referral Link
          </button>
        )}
      </div>

      {/* 4 Metric Cards Row (Desktop Standard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Recurring Commission */}
        <div
          onClick={onViewEarnings}
          className="bg-[#111] text-white p-5 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between cursor-pointer hover:border-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Monthly Commission</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
              10% Recurring
            </span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight">£{mrc}</p>
          <p className="text-[11px] text-gray-500 mt-2">Recurring every active billing cycle</p>
        </div>

        {/* Card 2: Active Customers */}
        <div
          onClick={onViewReferrals}
          className="bg-[#111] text-white p-5 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between cursor-pointer hover:border-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Active Customers</span>
            <Users className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight">{activeCustomers}</p>
          <p className="text-[11px] text-gray-500 mt-2">£29.90 / month per referral</p>
        </div>

        {/* Card 3: 60-Day Protection */}
        <div
          onClick={onViewProtection}
          className="bg-[#111] text-white p-5 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between cursor-pointer hover:border-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Protection Status</span>
            {isPendingProtection ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-950/30 text-amber-300 border border-amber-800/40">
                Pending
              </span>
            ) : daysRemaining <= 7 ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-800/60">
                At Risk
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                Protected
              </span>
            )}
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight">{daysRemaining} Days</p>
          <p className="text-[11px] text-gray-500 mt-2">
            {isPendingProtection ? "Frozen during 14d trial" : "Remaining in 60-day cycle"}
          </p>
        </div>

        {/* Card 4: Available Balance */}
        <div
          onClick={onViewEarnings}
          className="bg-[#111] text-white p-5 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between cursor-pointer hover:border-gray-700 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Available Payout</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight">£{availableToWithdraw}</p>
          <p className="text-[11px] text-gray-500 mt-2">+ £{pendingHold} in 14d hold</p>
        </div>
      </div>

      {/* Middle Row: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Quick Referral Link & Code */}
        <div className="lg:col-span-7 bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Share Your Referral Link</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Earn 10% recurring commission (£29.90/month) for each subscribed customer.
              </p>
            </div>
          </div>

          {/* Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">Unique Referral Link</label>
            <div className="flex items-center gap-2 bg-[#0c0c0c] border border-gray-800 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-200 truncate flex-1 font-mono">{referralLink}</span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 transition flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Code Box & Social Share */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Referral Code</label>
              <div className="flex items-center justify-between bg-[#0c0c0c] border border-gray-800 rounded-lg px-3 py-2">
                <span className="text-sm font-bold text-white font-mono tracking-wider">{referralCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 transition flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Quick Share</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.whatsapp)}
                  className="flex-1 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center justify-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.linkedin)}
                  className="flex-1 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center justify-center gap-1.5 transition"
                >
                  <Linkedin className="w-3.5 h-3.5 text-sky-400" /> LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => openShareUrl(shareUrls.email)}
                  className="px-3 py-2 rounded-lg bg-[#0c0c0c] hover:bg-[#1a1a1a] border border-gray-800 text-xs font-medium text-gray-300 flex items-center justify-center transition"
                  aria-label="Share by email"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): 60-Day Rolling Protection Status */}
        <div className="lg:col-span-5 bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">60-Day Activity Protection</h2>
              {isPendingProtection ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/30 text-amber-300 border border-amber-800/40">
                  Trial Active
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                  Portfolio Protected
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Introduce at least 1 new paying customer every 60 days to protect your recurring commission portfolio. If
              60 days pass without a qualifying introduction, commission for 1 existing customer (the oldest) is
              forfeited.
            </p>

            {/* Cycle Progress Bar */}
            <div className="space-y-1.5 mt-4">
              <div className="w-full h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    daysRemaining <= 7
                      ? "bg-rose-500"
                      : daysRemaining <= 20
                      ? "bg-amber-500"
                      : "bg-[#027A48]"
                  }`}
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                <span>{daysRemaining} days remaining</span>
                <span>60-day cycle</span>
              </div>
            </div>
          </div>

          {onReferClick && (
            <button
              onClick={onReferClick}
              className="w-full py-2.5 rounded-lg bg-[#027A48] hover:bg-green-700 text-white font-medium text-xs transition flex items-center justify-center gap-2 mt-2"
            >
              Introduce New Customer
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Referrals & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Referrals Preview */}
        <div className="lg:col-span-7 bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Recent Referrals</h2>
            {onViewReferrals && (
              <button
                onClick={onViewReferrals}
                className="text-xs text-[#027A48] hover:underline font-medium flex items-center gap-1"
              >
                View all referrals <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-medium">
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Locked Commission</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {recentReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No customer referrals recorded yet. Share your link to start earning.
                    </td>
                  </tr>
                ) : (
                  recentReferrals.map((r) => {
                    const isPending = r.status === "pending_qualification";
                    const isForfeited = r.status === "forfeited";
                    return (
                      <tr key={r.id} className="hover:bg-[#141414] transition">
                        <td className="py-2.5">
                          <p className="font-medium text-white">{r.customerName}</p>
                          <p className="text-[11px] text-gray-500">{r.customerEmail}</p>
                        </td>
                        <td className="py-2.5 text-gray-400">
                          {r.introducedAt
                            ? new Date(r.introducedAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "—"}
                        </td>
                        <td className="py-2.5 font-mono text-white">
                          £{r.lockedMonthlyCommissionGBP}/mo
                        </td>
                        <td className="py-2.5">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/20 text-amber-400 border border-amber-800/40">
                              Pending (14d)
                            </span>
                          ) : isForfeited ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/20 text-rose-400 border border-rose-800/40">
                              Forfeited
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Recent Activity Preview */}
        <div className="lg:col-span-5 bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Activity Timeline</h2>
            {onViewActivity && (
              <button
                onClick={onViewActivity}
                className="text-xs text-[#027A48] hover:underline font-medium flex items-center gap-1"
              >
                View all <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No partner events logged yet.</p>
            ) : (
              recentActivities.map((a) => (
                <div
                  key={a._id}
                  className="p-2.5 rounded-lg bg-[#0c0c0c] border border-gray-800/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#027A48] shrink-0" />
                    <span className="font-medium text-white truncate">{a.title}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono shrink-0 ml-2">
                    {a.eventDate
                      ? new Date(a.eventDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
