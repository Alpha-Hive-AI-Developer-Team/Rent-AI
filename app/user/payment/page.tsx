"use client";

import { CheckCircle2, CreditCard, History, Info, Sparkles, Wallet, ArrowRight } from "lucide-react";
import { usePayment } from "@/hooks/usepayment";
import { useEffect, useState } from "react";
import { useMyProfile } from "@/hooks/useAuth";
import { PLANS, PLAN_PRICE_CENTS, PlanKey } from "@/lib/plans";
import Link from "next/link";
import usePayout from '@/hooks/usePayout';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function PaymentPage() {
  const {
    startCheckout,
    cancelSubscription,
    cancelMutation,
    loading,
    error,
    nextCreditQuery,
    applyCreditsToNextRenewal,
    applyNextCreditMutation,
    enabledPlans,
    plansQuery,
  } = usePayment();
  const [activePlan, setActivePlan] = useState<string>("free");
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);
  const [availableCredit, setAvailableCredit] = useState<number>(0);
  const [pendingCredit, setPendingCredit] = useState<number>(0);
  const [applyCredit, setApplyCredit] = useState<boolean>(false);
  /** Pounds the user wants to apply (capped to available credits). Default 0 so credits are not used by accident. */
  const [creditAmount, setCreditAmount] = useState<string>("0");
  /** Pounds to reserve for the next auto-renewal. Default 0 so credits are not reserved by accident. */
  const [nextRenewalCreditAmount, setNextRenewalCreditAmount] = useState<string>("0");
  /** Pending mid-cycle upgrade (proration) awaiting confirmation — not used for new checkout. */
  const [upgradeConfirmPlan, setUpgradeConfirmPlan] = useState<string | null>(null);

  const planRank: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
    ...Object.fromEntries(
      (enabledPlans || []).map((p, idx) => [
        p.key,
        p.key === "free" ? 0 : typeof p.sortOrder === "number" ? p.sortOrder + 1 : idx + 1,
      ])
    ),
  };

  const getButtonState = (planKey: string) => {
    const currentRank = planRank[activePlan] ?? 0;
    const targetRank = planRank[planKey] ?? 0;
    const isCurrent = activePlan === planKey;
    const disabled = loading || isCurrent || currentRank > targetRank; // disable if loading, current plan, or target is lower than current
    const label = isCurrent ? "Current plan" : (currentRank > targetRank ? "Select" : "Select");
    const highlight = isCurrent;
    return { disabled, label, highlight } as { disabled: boolean; label: string; highlight: boolean };
  };

  useEffect(() => {
    // optionally react to status from success/cancel redirect
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const status = params.get('status');
    if (status) {
      // optionally react to status from success/cancel redirect
    }
  }, []);

  const { data: profileResp } = useMyProfile();

  useEffect(() => {
    if (profileResp?.success && profileResp.data) {
      setActivePlan(profileResp.data.activePlan || profileResp.data.planType || 'free');
      setCurrentDiscount(profileResp.data.currentDiscount || 0);
      // Backend returns credits in cents; convert to GBP for display
      const cents = Number(profileResp.data.totalDiscountAmount || 0);
      const pounds = Math.max(0, Math.round(cents) / 100);
      setAvailableCredit(pounds);
      const pendingCents = Number(profileResp.data.pendingDiscountAmount || 0);
      setPendingCredit(Math.max(0, Math.round(pendingCents) / 100));
      // Keep chosen credit amounts; only clamp if they exceed newly loaded wallet balance.
      setCreditAmount((prev) => {
        const n = Number(prev);
        if (!Number.isFinite(n) || n <= 0) return "0";
        return Math.min(n, pounds).toFixed(2);
      });
      setNextRenewalCreditAmount((prev) => {
        const n = Number(prev);
        if (!Number.isFinite(n) || n <= 0) return "0";
        return Math.min(n, pounds).toFixed(2);
      });
    }
  }, [profileResp]);
  const { walletQuery, connectBankAsync, withdraw, manageBankAsync } = usePayout();
  const walletData = walletQuery.data ?? {};
  const walletBalance = typeof walletData.balance === 'number' ? walletData.balance : availableCredit;
  const pendingHoldBalance = typeof walletData.pendingHold === 'number' ? walletData.pendingHold : pendingCredit;
  const isConnected = !!walletData.isConnected;
  const [connectLoading, setConnectLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawError, setWithdrawError] = useState<string>("");
  const plans = (enabledPlans?.length
    ? enabledPlans.map((p) => ({
        key: p.key as PlanKey | string,
        title: p.title,
        priceDisplay: p.priceDisplay || `£${((p.priceCents || 0) / 100).toFixed(0)}`,
        priceCents: p.priceCents || 0,
        price: p.priceDisplay || `£${((p.priceCents || 0) / 100).toFixed(0)}`,
        per: "/mo",
        features: p.features || [],
        description: p.description || "",
      }))
    : PLANS) as Array<{
    key: string;
    title: string;
    priceDisplay: string;
    priceCents: number;
    price?: string;
    per?: string;
    features?: string[];
    description?: string;
  }>;
  const planNumericPrice: Record<string, number> = Object.fromEntries(
    plans.map((p) => [p.key, Math.round((p.priceCents || PLAN_PRICE_CENTS[p.key as PlanKey] || 0) / 100)])
  );

  const creditAmountPounds = (() => {
    const n = Number(creditAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, availableCredit);
  })();

  const creditAmountCents = Math.round(creditAmountPounds * 100);

  const nextCreditPreview = nextCreditQuery.data;
  const nextPlanPounds = Math.max(0, Number(nextCreditPreview?.nextPlanAmountCents || 0) / 100);
  const stripeReservedPounds = Math.max(0, Number(nextCreditPreview?.stripeCreditCents || 0) / 100);
  const estimatedNextChargePounds = Math.max(
    0,
    Number(nextCreditPreview?.estimatedNextChargeCents || 0) / 100
  );
  const canReserveForNext =
    !!nextCreditPreview?.canApply && availableCredit > 0 && nextPlanPounds > 0;

  const nextRenewalCreditPounds = (() => {
    const n = Number(nextRenewalCreditAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, availableCredit);
  })();

  const previewNextChargeAfterReserve = Math.max(
    0,
    Math.round((estimatedNextChargePounds - nextRenewalCreditPounds) * 100) / 100
  );

  const handleReserveNextRenewalCredit = async () => {
    const cents = Math.round(nextRenewalCreditPounds * 100);
    if (!(cents > 0)) {
      toast.error("Enter a credit amount greater than £0");
      return;
    }
    try {
      await applyCreditsToNextRenewal(cents);
      setNextRenewalCreditAmount("0");
    } catch {
      // toast handled in mutation
    }
  };

  const getPlanDiscountPercent = (planKey: PlanKey) => {
    const price = planNumericPrice[planKey] || 0;
    if (price <= 0) return 0;
    const creditForPct = applyCredit ? creditAmountPounds : 0;
    const pct = Math.min(100, (creditForPct / price) * 100);
    return Math.round(pct);
  };

  const hasActivePaidSubscription =
    (planRank[activePlan] ?? 0) > 0 &&
    profileResp?.data?.subscriptionStatus === "active" &&
    !profileResp?.data?.cancelAtPeriodEnd;

  const runPlanCheckout = (planKey: string) => {
    if (planKey === "free") return;
    // Only apply credits when explicitly enabled AND amount > 0 (default amount is 0).
    if (applyCredit && creditAmountCents > 0) {
      startCheckout(planKey, { applyCredit: true, applyCreditCents: creditAmountCents });
    } else {
      startCheckout(planKey, { applyCredit: false });
    }
  };

  const handleSelectPlan = (planKey: string) => {
    if (planKey === "free") return;
    const currentRank = planRank[activePlan] ?? 0;
    const targetRank = planRank[planKey] ?? 0;
    // Mid-cycle upgrade / proration — ask for confirmation (not new Stripe Checkout).
    if (hasActivePaidSubscription && targetRank > currentRank) {
      setUpgradeConfirmPlan(planKey);
      return;
    }
    runPlanCheckout(planKey);
  };

  const confirmUpgradePlan = () => {
    if (!upgradeConfirmPlan) return;
    const plan = upgradeConfirmPlan;
    setUpgradeConfirmPlan(null);
    runPlanCheckout(plan);
  };

  const upgradePlanLabel = upgradeConfirmPlan
    ? plans.find((p) => p.key === upgradeConfirmPlan)?.title || upgradeConfirmPlan
    : "";
  const currentPlanLabel =
    plans.find((p) => p.key === activePlan)?.title || activePlan || "current plan";
  const upgradeCreditNote =
    applyCredit && creditAmountCents > 0
      ? ` £${creditAmountPounds.toFixed(2)} in credits will be applied to this upgrade invoice.`
      : " No credits will be applied unless you enable them above.";

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-screen-xl mx-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header — matching Dashboard / Tenants / Arrears */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Payment Plans & Billing
              </h1>
              {profileResp?.data?.subscriptionStatus === 'active' && !profileResp.data.cancelAtPeriodEnd && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-700/40 bg-emerald-950/40 text-xs font-medium text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Auto-renews · Active
                </span>
              )}
              {profileResp?.data?.subscriptionStatus === 'active' && profileResp.data.cancelAtPeriodEnd && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-700/40 bg-rose-950/40 text-xs font-medium text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Cancelling on {profileResp.data.currentPeriodEnd ? formatDate(profileResp.data.currentPeriodEnd) : ''}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Manage your subscription tier, referral credits wallet, and bank payouts
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Cancel Subscription Action (if active) */}
          {activePlan !== 'free' && profileResp?.data?.subscriptionStatus === 'active' && !profileResp?.data?.cancelAtPeriodEnd && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-xl border border-rose-800/60 bg-rose-950/20 text-rose-300 px-3.5 py-2 text-xs sm:text-sm font-medium hover:bg-rose-950/40 transition w-full sm:w-auto">
                  Cancel subscription
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111] text-white border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-bold text-white">Cancel subscription?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400 text-sm">
                    This will cancel your subscription at the end of the current billing period. You will retain full access to all paid features until that date.
                    {profileResp?.data?.currentPeriodEnd && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-300">
                        Active until: <span className="text-white font-medium">{new Date(profileResp.data.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="border-gray-800 bg-transparent text-gray-300 hover:bg-white/5 rounded-xl text-xs sm:text-sm">
                    Keep subscription
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await cancelSubscription();
                        toast.success("Subscription will cancel at period end", { duration: 2000 });
                        setTimeout(() => window.location.reload(), 2000);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to cancel subscription');
                      }
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm"
                  >
                    Confirm cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Withdrawal History Action */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#161616] text-gray-200 hover:text-white hover:bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium transition w-full sm:w-auto">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Withdrawal History</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#111] text-white border border-gray-800 rounded-2xl p-5 sm:p-6 w-full max-w-3xl shadow-2xl">
              <AlertDialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <AlertDialogTitle className="text-lg font-bold text-white">Withdrawal History</AlertDialogTitle>
                    <p className="text-xs text-gray-400 mt-0.5">Track your bank payouts and referral credit transfers</p>
                  </div>
                  <AlertDialogCancel className="border-gray-800 bg-transparent text-gray-300 hover:bg-white/5 rounded-xl text-xs py-1.5 px-3">
                    Close
                  </AlertDialogCancel>
                </div>
              </AlertDialogHeader>
              <div className="space-y-4 pt-2">
                <div className="text-xs text-gray-300 bg-[#161616] border border-gray-800/80 rounded-xl p-3 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Funds are automatically transferred to your connected bank account via Stripe Express within 5–7 business days.</span>
                </div>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-800 bg-[#0c0c0c] no-scrollbar">
                  {walletData?.transactions && walletData.transactions.length > 0 ? (
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-gray-400 text-[11px] bg-[#141414] border-b border-gray-800">
                          <th className="py-2.5 px-3.5">Request Date</th>
                          <th className="py-2.5 px-3.5">Type</th>
                          <th className="py-2.5 px-3.5">Amount</th>
                          <th className="py-2.5 px-3.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {walletData.transactions.map((t: any) => {
                          const status = (t.status || '').toLowerCase();
                          const statusPill =
                            status === 'paid'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40'
                              : status === 'failed'
                              ? 'bg-rose-950/40 text-rose-300 border-rose-700/40'
                              : 'bg-amber-950/40 text-amber-300 border-amber-700/40';
                          return (
                            <tr key={t._id || t.stripeTransferId || t.createdAt} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-3.5 text-gray-300">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}</td>
                              <td className="py-3 px-3.5 text-gray-300 capitalize">{t.type || 'Payout'}</td>
                              <td className="py-3 px-3.5 font-semibold text-emerald-400 tabular-nums">£{(Number(t.amount) || 0).toFixed(2)}</td>
                              <td className="py-3 px-3.5 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${statusPill}`}>
                                  {t.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">No payout transactions found.</div>
                  )}
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Plans & Billing Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Available Plans</h2>
            <p className="text-xs text-gray-400">Choose the subscription tier that matches your property portfolio</p>
          </div>
          {plansQuery.isLoading && (
            <span className="text-xs text-emerald-400 animate-pulse">Loading plans…</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const isCurrent = activePlan === plan.key;
            const { disabled, label, highlight } = getButtonState(plan.key);
            const discountPct = getPlanDiscountPercent(plan.key as PlanKey);

            return (
              <div
                key={plan.key}
                className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative ${
                  isCurrent
                    ? 'border-[#027A48] bg-gradient-to-b from-[#027A48]/15 via-[#111] to-[#111] shadow-xl shadow-emerald-950/20'
                    : 'border-gray-800/80 bg-[#111] hover:border-gray-700/80 shadow-md'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#027A48] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Current Plan</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{plan.title}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{plan.price}</span>
                      <span className="text-xs font-normal text-gray-400">{plan.per}</span>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed min-h-[2rem]">{plan.description}</p>
                    )}
                  </div>

                  {plan.key !== 'free' && (planRank[plan.key] > (planRank[activePlan] ?? 0)) && discountPct > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-[11px] font-medium text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Up to {discountPct}% off with credits</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800/60">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2.5">Included Features</p>
                    <ul className="space-y-2 text-xs text-gray-300">
                      {plan.features?.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-tight text-gray-200">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-gray-800/60">
                  <button
                    disabled={disabled}
                    onClick={() => {
                      if (disabled || plan.key === 'free') return;
                      handleSelectPlan(plan.key);
                    }}
                    className={`w-full rounded-xl py-2.5 px-4 text-xs sm:text-sm font-semibold transition ${
                      highlight
                        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 cursor-default'
                        : disabled
                        ? 'border border-gray-800 bg-[#161616] text-gray-500 cursor-not-allowed opacity-60'
                        : 'bg-[#027A48] hover:bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    }`}
                  >
                    {label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm mid-cycle plan upgrade (proration) */}
        <AlertDialog
          open={!!upgradeConfirmPlan}
          onOpenChange={(open) => {
            if (!open) setUpgradeConfirmPlan(null);
          }}
        >
          <AlertDialogContent className="bg-[#111] text-white border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-white">Upgrade to {upgradePlanLabel}?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                You are currently on <span className="text-white font-medium">{currentPlanLabel}</span>. Upgrading to{" "}
                <span className="text-emerald-300 font-semibold">{upgradePlanLabel}</span> will prorate the billing change
                for the remainder of your current monthly cycle and charge only the difference today. Your subsequent renewals will continue at the full {upgradePlanLabel} rate.
                {upgradeCreditNote}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="border-gray-800 bg-transparent text-gray-300 hover:bg-white/5 rounded-xl text-xs sm:text-sm">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmUpgradePlan}
                disabled={loading}
                className="bg-[#027A48] hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-950/40"
              >
                {loading ? "Upgrading…" : "Confirm upgrade"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credits & Wallet Section */}
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-gray-800/80 bg-[#111] p-5 sm:p-6 shadow-md space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Referral Wallet</h3>
                    <p className="text-xs text-gray-400">Your available rewards balance from landlord referrals</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-baseline gap-3">
                  <p className="text-3xl sm:text-4xl font-extrabold tabular-nums text-white">
                    £{availableCredit.toFixed(2)}
                  </p>
                  <span className="text-xs text-gray-400 font-medium">available credits</span>
                </div>

                {pendingHoldBalance > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-700/40 bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      £{pendingHoldBalance.toFixed(2)} on 14-day hold
                    </div>
                    <p className="text-[11px] text-gray-500 max-w-md">
                      On-hold referral credits clear automatically after 14 days, then can be used for upgrades, renewals, or bank withdrawals.
                    </p>
                  </div>
                )}
              </div>

              {/* Wallet Actions */}
              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <Link href="/user/referrals" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#161616] px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition"
                  >
                    <span>Referral Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </Link>

                {!isConnected ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setConnectLoading(true);
                      try {
                        toast.loading("Redirecting to Stripe onboarding...", { id: "onboard" });
                        await connectBankAsync();
                        toast.dismiss("onboard");
                      } catch (e: any) {
                        toast.dismiss("onboard");
                        toast.error(e?.message || "Connect failed");
                      } finally {
                        setConnectLoading(false);
                      }
                    }}
                    disabled={connectLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-950/30 px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-300 hover:bg-emerald-950/50 transition disabled:opacity-50"
                  >
                    {connectLoading ? "Connecting…" : "Connect Payout Bank"}
                  </button>
                ) : (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          disabled={withdrawLoading || (walletBalance || 0) <= 0}
                          className={`w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition ${
                            withdrawLoading || (walletBalance || 0) <= 0
                              ? "cursor-not-allowed bg-gray-800 text-gray-500"
                              : "bg-[#027A48] hover:bg-emerald-600 shadow-md shadow-emerald-950/40"
                          }`}
                        >
                          {withdrawLoading ? "Withdrawing…" : "Withdraw Funds"}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-full max-w-lg rounded-2xl bg-[#111] p-5 sm:p-6 text-white border border-gray-800 shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-bold text-white">Confirm Withdrawal</AlertDialogTitle>
                          <AlertDialogDescription className="text-xs sm:text-sm text-gray-300">
                            Available withdrawable balance: <span className="text-emerald-400 font-bold">£{(walletBalance || 0).toFixed(2)}</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-4 space-y-3">
                          {pendingHoldBalance > 0 && (
                            <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-2.5 text-xs text-amber-300/90">
                              £{pendingHoldBalance.toFixed(2)} is in a 14-day hold and cannot be withdrawn yet.
                            </div>
                          )}
                          <div>
                            <label className="text-xs sm:text-sm text-gray-300 block mb-1.5">Amount to withdraw (GBP)</label>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={0.01}
                              placeholder={(walletBalance || 0).toFixed(2)}
                              value={withdrawAmount === "" ? "" : withdrawAmount}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = Number(val);
                                if (val === "") {
                                  setWithdrawAmount("");
                                  setWithdrawError("");
                                  return;
                                }
                                if (Number.isNaN(num) || num <= 0) {
                                  setWithdrawError("Enter a valid amount greater than 0");
                                } else if (num > (walletBalance || 0)) {
                                  setWithdrawError("Amount exceeds available balance");
                                } else {
                                  setWithdrawError("");
                                }
                                setWithdrawAmount(num);
                              }}
                              className="w-full rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 placeholder:text-gray-500 focus:border-[#027A48] focus:outline-none transition"
                            />
                            {withdrawError && (
                              <div className="text-xs text-rose-400 mt-1">{withdrawError}</div>
                            )}
                          </div>
                        </div>
                        <AlertDialogFooter className="gap-2 sm:gap-0 pt-3">
                          <AlertDialogCancel className="border-gray-800 bg-transparent text-gray-300 hover:bg-white/5 rounded-xl text-xs sm:text-sm">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              const amountToWithdraw =
                                typeof withdrawAmount === "number" && withdrawAmount > 0
                                  ? withdrawAmount
                                  : walletBalance || 0;
                              if (amountToWithdraw <= 0 || withdrawError) return;
                              setWithdrawLoading(true);
                              try {
                                toast.loading("Submitting withdrawal...", { id: "withdraw" });
                                await withdraw(amountToWithdraw);
                                toast.success(
                                  "Amount successfully transferred to your connected account",
                                  { id: "withdraw", duration: 2000 }
                                );
                                setTimeout(() => window.location.reload(), 2000);
                              } catch (e: any) {
                                toast.error(e?.message || "Withdraw failed", { id: "withdraw" });
                              } finally {
                                setWithdrawLoading(false);
                              }
                            }}
                            className="bg-[#027A48] hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm"
                            disabled={
                              withdrawLoading ||
                              !!withdrawError ||
                              (walletBalance || 0) <= 0
                            }
                          >
                            Confirm Withdraw
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <button
                      type="button"
                      onClick={async () => {
                        setManageLoading(true);
                        try {
                          toast.loading("Opening bank dashboard...", { id: "manage" });
                          await manageBankAsync();
                          toast.dismiss("manage");
                        } catch (e: any) {
                          toast.dismiss("manage");
                          toast.error(e?.message || "Failed to open bank dashboard");
                        } finally {
                          setManageLoading(false);
                        }
                      }}
                      disabled={manageLoading}
                      className={`w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-gray-800 bg-[#161616] px-4 py-2.5 text-xs sm:text-sm font-medium transition ${
                        manageLoading
                          ? "cursor-not-allowed text-gray-500"
                          : "text-gray-200 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {manageLoading ? "Opening…" : "Manage Bank"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Use at Checkout / Upgrade Switch */}
            <div className="border-t border-gray-800/60 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-200">Use credits at checkout / upgrade</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                    Off by default. Turn on and enter an amount only when you want credits applied.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs sm:text-sm text-gray-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#027A48] rounded"
                    checked={applyCredit}
                    onChange={(e) => setApplyCredit(e.target.checked)}
                  />
                  <span>Apply credits</span>
                </label>
              </div>

              {applyCredit && availableCredit > 0 && (
                <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-800/80 bg-[#161616] px-4 py-3">
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-emerald-400 font-bold">£</span>
                    <input
                      type="number"
                      min={0}
                      max={availableCredit}
                      step={0.01}
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      onBlur={() => {
                        const n = Number(creditAmount);
                        if (!Number.isFinite(n) || n <= 0) {
                          setCreditAmount("0");
                          return;
                        }
                        setCreditAmount(Math.min(n, availableCredit).toFixed(2));
                      }}
                      className="w-28 rounded-lg border border-gray-700 bg-black px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48]"
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline transition"
                    onClick={() => setCreditAmount(availableCredit.toFixed(2))}
                  >
                    Use max (£{availableCredit.toFixed(2)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reserve for Next Renewal Section */}
          {canReserveForNext && (
            <div className="rounded-2xl border border-gray-800/80 bg-[#111] p-5 sm:p-6 shadow-md space-y-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Apply credits to next payment
                  </h3>
                  <p className="mt-1 max-w-xl text-xs sm:text-sm text-gray-400">
                    Reserve wallet credits for your next auto-renewal. Amount defaults to £0 so nothing is reserved unless you choose it.
                  </p>
                </div>
                {profileResp?.data?.currentPeriodEnd && (
                  <div className="mt-2 shrink-0 rounded-full border border-gray-800 bg-[#161616] px-3 py-1 text-xs text-gray-400 sm:mt-0">
                    Next charge {formatDate(profileResp.data.currentPeriodEnd)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-800/80 bg-[#161616] p-4">
                  <p className="text-xs text-gray-400">Plan renewal</p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-white">
                    £{nextPlanPounds.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800/80 bg-[#161616] p-4">
                  <p className="text-xs text-gray-400">Already reserved</p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-sky-300">
                    £{stripeReservedPounds.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4">
                  <p className="text-xs text-emerald-400/90 font-medium">Estimated next charge</p>
                  <p className="mt-1 text-lg sm:text-xl font-bold tabular-nums text-emerald-300">
                    £{estimatedNextChargePounds.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-800/60 pt-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm text-gray-300">
                    <span className="text-xs text-gray-400">Amount to reserve (£)</span>
                    <input
                      type="number"
                      min={0}
                      max={availableCredit}
                      step={0.01}
                      value={nextRenewalCreditAmount}
                      onChange={(e) => setNextRenewalCreditAmount(e.target.value)}
                      onBlur={() => {
                        const n = Number(nextRenewalCreditAmount);
                        if (!Number.isFinite(n) || n <= 0) {
                          setNextRenewalCreditAmount("0");
                          return;
                        }
                        setNextRenewalCreditAmount(Math.min(n, availableCredit).toFixed(2));
                      }}
                      className="w-32 rounded-xl border border-gray-800 bg-[#161616] px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#027A48]"
                    />
                  </label>
                  <button
                    type="button"
                    className="mb-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium transition"
                    onClick={() =>
                      setNextRenewalCreditAmount(
                        Math.min(
                          availableCredit,
                          estimatedNextChargePounds || availableCredit
                        ).toFixed(2)
                      )
                    }
                  >
                    Max
                  </button>
                  <div className="mb-2 min-w-[10rem] text-xs sm:text-sm text-gray-400">
                    {nextRenewalCreditPounds > 0 ? (
                      <>
                        After reserve:{" "}
                        <span className="font-semibold text-emerald-300">
                          £{nextPlanPounds.toFixed(2)} → £{previewNextChargeAfterReserve.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Enter an amount to preview</span>
                    )}
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={
                        applyNextCreditMutation.isPending || !(nextRenewalCreditPounds > 0)
                      }
                      className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500 transition shadow-md shadow-sky-950/40"
                    >
                      {applyNextCreditMutation.isPending
                        ? "Reserving…"
                        : "Reserve for next payment"}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#111] text-white border border-gray-800 rounded-2xl p-6 shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-bold text-white">Reserve credits for next renewal?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                        This deducts £{nextRenewalCreditPounds.toFixed(2)} from your referral wallet today and
                        applies it to your upcoming Stripe auto-renewal
                        {nextPlanPounds > 0 && (
                          <>
                            {" "}
                            (£{nextPlanPounds.toFixed(2)} → about £
                            {previewNextChargeAfterReserve.toFixed(2)})
                          </>
                        )}
                        . Reserved credits leave your withdrawable wallet balance immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
                      <AlertDialogCancel className="border-gray-800 bg-transparent text-gray-300 hover:bg-white/5 rounded-xl text-xs sm:text-sm">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleReserveNextRenewalCredit}
                        className="bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm"
                      >
                        Confirm reserve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}