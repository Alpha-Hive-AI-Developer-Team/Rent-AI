"use client";

import React, { useState } from "react";
import {
  Wallet,
  Clock,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  usePartnerEarnings,
  usePartnerPayoutStatus,
  usePartnerOnboard,
  usePartnerDashboardLink,
  useWithdrawPartnerFunds,
} from "@/hooks/usePartner";
import toast from "react-hot-toast";

export default function EarningsView() {
  const [subTab, setSubTab] = useState<"payouts" | "ledger">("payouts");
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: earningsResp, isLoading: earningsLoading } = usePartnerEarnings();
  const { data: payoutResp } = usePartnerPayoutStatus();
  const onboardMutation = usePartnerOnboard();
  const dashboardLinkMutation = usePartnerDashboardLink();
  const withdrawMutation = useWithdrawPartnerFunds();

  const earnings = earningsResp?.data;
  const totalEarned = earnings?.totalEarnedGBP || "0.00";
  const mrc = earnings?.monthlyRecurringCommissionGBP || "0.00";
  const pendingHold = earnings?.pendingHoldGBP || "0.00";
  const available = earnings?.availableToWithdrawGBP || "0.00";
  const payments = earnings?.payments || [];
  const history = earnings?.history || [];

  const isConnected = payoutResp?.data?.isConnected || false;

  const handleStripeOnboard = async () => {
    try {
      const res = await onboardMutation.mutateAsync();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to start onboarding");
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

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    const availableNum = parseFloat(available);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid withdrawal amount");
      return;
    }

    if (amountNum > availableNum) {
      toast.error(`Amount exceeds available balance of £${available}`);
      return;
    }

    try {
      await withdrawMutation.mutateAsync(amountNum);
      toast.success(`Withdrawal of £${amountNum.toFixed(2)} initiated successfully!`);
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Withdrawal failed");
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Earnings & Payouts</h1>
        <p className="text-xs md:text-sm text-[#535862] mt-1">
          Monitor your lifetime commission earnings, 14-day anti-refund hold balances, and request Stripe Express bank
          withdrawals.
        </p>
      </div>

      {/* Top 4 Stat Cards Grid (Standard Rent AI StatCard layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1 */}
        <div className="bg-[#111] text-white p-4 md:p-6 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between w-full">
          <h3 className="text-sm text-gray-400">Total Lifetime Earned</h3>
          <h2 className="text-2xl md:text-3xl font-semibold mb-1 tabular-nums text-white">£{totalEarned}</h2>
          <p className="text-xs text-gray-500 mt-1">Cumulative commission earnings</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#111] text-white p-4 md:p-6 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between w-full">
          <h3 className="text-sm text-gray-400">Monthly Recurring</h3>
          <h2 className="text-2xl md:text-3xl font-semibold mb-1 tabular-nums text-white">£{mrc}</h2>
          <p className="text-xs text-gray-500 mt-1">Recurring every active cycle</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111] text-white p-4 md:p-6 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-400">Available to Withdraw</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-1 tabular-nums text-white">£{available}</h2>
          <p className="text-xs text-gray-500 mt-1">Cleared 14-day hold trial</p>
        </div>

        {/* Card 4 */}
        <div className="bg-[#111] text-white p-4 md:p-6 rounded-xl border border-gray-800/50 shadow-md flex flex-col justify-between w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-400">Pending 14-Day Hold</h3>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-1 tabular-nums text-gray-200">£{pendingHold}</h2>
          <p className="text-xs text-gray-500 mt-1">Clears after 14 days without refund</p>
        </div>
      </div>

      {/* Stripe Connect & Withdrawal Action Banner */}
      <div className="bg-[#111] border border-gray-800/50 rounded-xl p-4 md:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#161616] border border-gray-800 flex items-center justify-center text-gray-300 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Stripe Express Payout Account</h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/20 text-amber-400 border border-amber-800/40">
                  Setup Required
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isConnected
                ? "Withdrawals are transferred directly into your connected bank account."
                : "Connect your bank account via Stripe Express to enable withdrawals."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {isConnected ? (
            <button
              onClick={handleOpenStripeDashboard}
              className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg bg-[#161616] hover:bg-[#202020] text-gray-300 border border-gray-800 flex items-center gap-1.5 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Stripe Dashboard
            </button>
          ) : (
            <button
              onClick={handleStripeOnboard}
              className="px-3.5 py-2 text-xs md:text-sm font-medium rounded-lg bg-[#027A48] hover:bg-green-700 text-white transition shadow-sm"
            >
              Connect Bank Account
            </button>
          )}

          <button
            onClick={() => {
              setWithdrawAmount(available);
              setWithdrawModalOpen(true);
            }}
            disabled={parseFloat(available) <= 0 || !isConnected}
            className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-[#027A48] hover:bg-green-700 disabled:bg-[#1a1a1a] disabled:text-gray-500 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Withdraw Available
          </button>
        </div>
      </div>

      {/* Tables Section with Sub-tabs */}
      <div className="bg-[#111] rounded-xl border border-gray-800/50 p-4 md:p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab("payouts")}
              className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition ${
                subTab === "payouts"
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Payout Transfers ({payments.length})
            </button>
            <button
              onClick={() => setSubTab("ledger")}
              className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition ${
                subTab === "ledger"
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Commission Ledger History ({history.length})
            </button>
          </div>
        </div>

        {subTab === "payouts" ? (
          <div className="overflow-x-auto rounded-lg border border-gray-800/60">
            <table className="w-full text-left text-xs sm:text-sm text-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium">
                  <th className="p-3 sm:p-4">Payout Date</th>
                  <th className="p-3 sm:p-4">Amount</th>
                  <th className="p-3 sm:p-4">Destination</th>
                  <th className="p-3 sm:p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      No payout transfers processed yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#141414] transition">
                      <td className="p-3 sm:p-4 text-gray-300 tabular-nums">
                        {new Date(p.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 sm:p-4 font-semibold text-white tabular-nums">£{p.amountGBP}</td>
                      <td className="p-3 sm:p-4 text-gray-400">{p.description}</td>
                      <td className="p-3 sm:p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/40">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800/60">
            <table className="w-full text-left text-xs sm:text-sm text-gray-300 min-w-[650px]">
              <thead>
                <tr className="bg-[#0c0c0c] border-b border-gray-800 text-gray-400 font-medium">
                  <th className="p-3 sm:p-4">Event Date</th>
                  <th className="p-3 sm:p-4">Event Type</th>
                  <th className="p-3 sm:p-4">Amount</th>
                  <th className="p-3 sm:p-4">Availability / Hold Status</th>
                  <th className="p-3 sm:p-4">Invoice Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No ledger history entries yet.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#141414] transition">
                      <td className="p-3 sm:p-4 text-gray-300 tabular-nums">
                        {new Date(h.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3 sm:p-4 font-medium text-gray-300 capitalize">
                        {h.type.replace(/_/g, " ")}
                      </td>
                      <td className="p-3 sm:p-4 font-semibold tabular-nums">
                        <span className={h.isNegative ? "text-rose-400" : "text-emerald-400"}>
                          {h.isNegative ? "-" : "+"}£{h.amountGBP}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#141414] text-gray-300 border border-gray-800">
                          {h.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-gray-400 text-xs tabular-nums">{h.invoiceId}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-white">Withdraw Available Earnings</h3>
            <p className="text-xs text-gray-400">
              Transfer cleared funds to your connected Stripe bank account.
            </p>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 font-medium">Amount to withdraw (£)</label>
                <input
                  type="number"
                  step="0.01"
                  max={available}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-[#0c0c0c] border border-gray-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#027A48]"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Available balance: £{available}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-xs font-medium text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-[#027A48] hover:bg-green-700 text-xs font-medium text-white transition disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? "Processing..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
