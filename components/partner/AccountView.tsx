"use client";

import React from "react";
import {
  User,
  CreditCard,
  Bell,
  FileText,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { usePartnerPayoutStatus, usePartnerOnboard, usePartnerDashboardLink } from "@/hooks/usePartner";
import { useMyProfile, useCustomerLogout } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function AccountView() {
  const { data: profileResp } = useMyProfile();
  const { data: payoutResp, isLoading: payoutLoading } = usePartnerPayoutStatus();
  const onboardMutation = usePartnerOnboard();
  const dashboardLinkMutation = usePartnerDashboardLink();
  const logout = useCustomerLogout();

  const user = profileResp?.data;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Partner User";
  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "P");
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "Recent";

  const payoutData = payoutResp?.data;
  const isConnected = payoutData?.isConnected || false;

  const handleStripeOnboard = async () => {
    try {
      const res = await onboardMutation.mutateAsync();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to start Stripe onboarding");
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const res = await dashboardLinkMutation.mutateAsync();
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to open Stripe dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Partner Account & Payout Settings</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your partner profile, Stripe Express bank connections, and payout preferences.
        </p>
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Profile & Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* User Profile Card */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#161616] border border-gray-700 flex items-center justify-center text-white text-base font-bold uppercase">
                {initials || "PA"}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{fullName}</h3>
                <p className="text-xs text-gray-400">{user?.email || "partner@rentai.co"}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800/60 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-gray-400">
                <span>Partner Status</span>
                <span className="font-medium text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between py-1 text-gray-400">
                <span>Partner Since</span>
                <span className="font-medium text-white">{memberSince}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-400">
                <span>Commission Rate</span>
                <span className="font-medium text-white">10% Recurring</span>
              </div>
            </div>
          </div>

          {/* Partner Support Card */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-semibold text-white">Partner Programme Support</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Have questions regarding 60-day protection or need custom enterprise referral arrangements? Contact our
              partner support team.
            </p>
            <p className="text-xs font-mono text-emerald-400 pt-1">support@rentai.co</p>
          </div>
        </div>

        {/* Right Column (7 cols): Payout Account & Settings */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stripe Express Payout Box */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#161616] border border-gray-800 flex items-center justify-center text-gray-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Stripe Express Payout Account</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isConnected
                      ? "Your bank account is connected for automated commission withdrawals."
                      : "Connect your UK bank account to receive cleared monthly earnings."}
                  </p>
                </div>
              </div>

              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/20 text-amber-400 border border-amber-800/40 shrink-0">
                  Setup Required
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {isConnected ? "Direct deposit enabled" : "Payouts held until connected"}
              </span>

              {isConnected ? (
                <button
                  onClick={handleOpenStripeDashboard}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#161616] hover:bg-[#202020] text-gray-200 border border-gray-700 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Stripe Dashboard
                </button>
              ) : (
                <button
                  onClick={handleStripeOnboard}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#027A48] hover:bg-green-700 text-white transition"
                >
                  Connect Bank Account
                </button>
              )}
            </div>
          </div>

          {/* Additional Settings & Actions */}
          <div className="bg-[#111] border border-gray-800/50 rounded-xl divide-y divide-gray-800/60 overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-[#141414] transition cursor-pointer">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-white">Partner Notifications</p>
                  <p className="text-[11px] text-gray-500">Receive alerts when referrals qualify or timers advance</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-[#141414] transition cursor-pointer">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs font-medium text-white">Programme Terms & Conditions</p>
                  <p className="text-[11px] text-gray-500">View 60-day rule, price locking, and anti-abuse policies</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] border border-gray-800 text-gray-400 hover:text-rose-400 text-xs font-medium transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out of Partner Portal
          </button>
        </div>
      </div>
    </div>
  );
}
