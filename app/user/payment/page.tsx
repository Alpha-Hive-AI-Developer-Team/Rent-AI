"use client";

import Image from "next/image";
import { Bell, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Payment Plan</h1>

      
      </div>
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

   
<div className="flex gap-2">
        {/* Subscription status */}
      {profileResp?.data && (
        <div className="">
          {profileResp.data.subscriptionStatus === 'active' && !profileResp.data.cancelAtPeriodEnd && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#072a17] text-emerald-300 text-sm">Auto-renews • Active</div>
          )}
          {profileResp.data.subscriptionStatus === 'active' && profileResp.data.cancelAtPeriodEnd && (
            <div className="inline-flex flex-col gap-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a0b0b] text-rose-300 text-sm">Subscription cancelled — ends {profileResp.data.currentPeriodEnd ? formatDate(profileResp.data.currentPeriodEnd) : ''}</div>
              <div className="text-xs text-gray-400 mt-1">You will retain access to paid features until the end of the current period.</div>
            </div>
          )}
        </div>
      )}

       {activePlan !== 'free' && profileResp?.data?.subscriptionStatus === 'active' && !profileResp?.data?.cancelAtPeriodEnd && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-rose-700 text-rose-300 px-3 py-1 text-sm hover:bg-[#1a0b0b]">
                    Cancel at period end
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel your subscription at the end of the current billing period. You will keep access to paid features until that date.
                      {profileResp?.data?.currentPeriodEnd && (
                        <div className="mt-2 text-sm text-gray-400">Active until: {new Date(profileResp.data.currentPeriodEnd).toLocaleString()}</div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                      try {
                        await cancelSubscription();
                        toast.success("Subscription will cancel at period end", { duration: 2000 });
                        setTimeout(() => window.location.reload(), 2000);
                      } catch (e: any) {
                        toast.error(e?.message || 'Failed to cancel subscription');
                      }
                    }}>
                      Confirm cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
</div>
       {/* View withdrawal history */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="inline-flex items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510] w-full sm:w-auto">
                View Withdrawal History
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#07120b] text-white rounded-2xl p-6 w-full max-w-3xl">
              <AlertDialogHeader>
                <div className="flex items-start justify-between">
                  <AlertDialogTitle className="text-lg text-white">Withdrawal History</AlertDialogTitle>
                  <AlertDialogCancel className="text-sm text-gray-700">Close</AlertDialogCancel>
                </div>
              </AlertDialogHeader>
              <AlertDialogDescription>
                <div className="text-xs text-gray-400 bg-[#0b1510] border border-[#24302a] rounded-lg p-3">
                  Funds will automatically be transferred to your bank account in 5–7 days. You can view pending payouts in your Stripe Express account.
                </div>
                <div className="max-h-72 overflow-y-auto mt-4">
                  {walletData?.transactions && walletData.transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 text-xs border-b border-[#24302a]">
                          <th className="py-3">Request Date</th>
                          <th className="py-3">Type</th>
                          <th className="py-3">Amount</th>
                          <th className="py-3">Status</th>
                          {/* <th className="py-3">Description</th> */}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12221a]">
                        {walletData.transactions.map((t: any) => {
                          const status = (t.status || '').toLowerCase();
                          const statusClass = status === 'paid' ? 'text-emerald-400' : status === 'failed' ? 'text-rose-400' : 'text-amber-400';
                          return (
                            <tr key={t._id || t.stripeTransferId || t.createdAt}>
                              <td className="py-3 align-top text-gray-200">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
                              <td className="py-3 align-top text-gray-200">{t.type || '-'}</td>
                              <td className="py-3 align-top text-emerald-300">£{(Number(t.amount) || 0).toFixed(2)}</td>
                              <td className={`py-3 align-top ${statusClass}`}>{t.status || '-'}</td>
                              {/* <td className="py-3 align-top text-gray-400">{t.description || '-'}</td> */}
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No payout transactions found.</div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogContent>
          </AlertDialog>
 </div>
      {/* Plans & Billing */}
      <section>
        {/* <h2 className="text-lg font-semibold mb-6">Plans & Billing</h2> */}
        {/* Plan Cards (match screenshot) */}
        {plansQuery.isLoading && (
          <p className="text-sm text-gray-400 mb-4">Loading plans…</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.key} className={`rounded-2xl border p-5 flex flex-col justify-between ${activePlan === plan.key ? 'border-emerald-500 bg-[#072a17]' : 'border-[#2A2A2A] bg-transparent'}`}>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-3">{plan.title}</h3>
                <p className="text-3xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-gray-400">{plan.per}</span></p>
                {plan.description ? (
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                ) : null}
                {plan.key !== 'free' && (planRank[plan.key] > (planRank[activePlan] ?? 0)) && (
                  <p className="text-xs text-emerald-400 mt-1">Up to {getPlanDiscountPercent(plan.key as PlanKey)}% off with credits</p>
                )}  
                <ul className="mt-3 space-y-2 text-sm text-gray-300">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> {f}</li>
                  ))}
                </ul>
              </div>
              {(() => {
                const { disabled, label, highlight } = getButtonState(plan.key);
                return (
                  <button
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      if (plan.key === 'free') return;
                      handleSelectPlan(plan.key);
                    }}
                    className={`mt-5 w-full rounded-full px-4 py-2 text-sm ${highlight ? 'bg-emerald-600 text-white border-emerald-600' : 'border border-emerald-700 text-emerald-300 hover:bg-[#0b1510]'} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    
                    {label}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>

        {/* Confirm mid-cycle plan upgrade (proration) — not shown for new checkout */}
        <AlertDialog
          open={!!upgradeConfirmPlan}
          onOpenChange={(open) => {
            if (!open) setUpgradeConfirmPlan(null);
          }}
        >
          <AlertDialogContent className="bg-[#0c0c0c] text-white border border-[#222]">
            <AlertDialogHeader>
              <AlertDialogTitle>Upgrade to {upgradePlanLabel}?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                You are on <span className="text-gray-200">{currentPlanLabel}</span>. Upgrading to{" "}
                <span className="text-gray-200">{upgradePlanLabel}</span> will prorate the change
                for the rest of your current billing period and charge the difference now. Your next
                renewal will be the full {upgradePlanLabel} price.
                {upgradeCreditNote}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#2A2A2A] bg-transparent text-gray-300 hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmUpgradePlan}
                disabled={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {loading ? "Upgrading…" : "Confirm upgrade"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Credits & wallet */}
        <div className="mt-8 space-y-5 pb-8">
          <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-500">Referral wallet</p>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <p className="text-3xl font-semibold tabular-nums text-white">
                    £{availableCredit.toFixed(2)}
                  </p>
                  <p className="pb-1 text-sm text-gray-400">available credits</p>
                </div>
                {pendingHoldBalance > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-800/50 bg-amber-950/30 px-3 py-1 text-xs font-medium text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    £{pendingHoldBalance.toFixed(2)} on 14-day hold
                  </div>
                )}
                {pendingHoldBalance > 0 && (
                  <p className="mt-2 max-w-md text-[12px] text-gray-500">
                    On-hold referral credits clear automatically after 14 days, then can be used for
                    upgrades, next renewal, or withdrawals.
                  </p>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <Link href="/user/referrals">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-emerald-800/80 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510] sm:w-auto"
                  >
                    Referral dashboard
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
                    className="inline-flex w-full items-center justify-center rounded-full border border-emerald-800/80 px-4 py-2 text-sm text-emerald-300 hover:bg-[#0b1510] sm:w-auto"
                  >
                    {connectLoading ? "Connecting..." : "Connect bank"}
                  </button>
                ) : (
                  <>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          disabled={withdrawLoading || (walletBalance || 0) <= 0}
                          className={`inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm text-white sm:w-auto ${
                            withdrawLoading || (walletBalance || 0) <= 0
                              ? "cursor-not-allowed bg-gray-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {withdrawLoading ? "Withdrawing..." : "Withdraw"}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-full max-w-lg rounded-2xl bg-[#07120b] p-6 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg">Confirm Withdrawal</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-gray-300">
                            Available balance: £{(walletBalance || 0).toFixed(2)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-4 space-y-2">
                          {pendingHoldBalance > 0 && (
                            <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 p-2.5 text-xs text-amber-300/90">
                              £{pendingHoldBalance.toFixed(2)} is in a 14-day hold and cannot be
                              withdrawn yet.
                            </div>
                          )}
                          <label className="text-sm text-gray-200">Amount to withdraw (GBP)</label>
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
                            className="w-full rounded-lg border border-[#24302a] bg-transparent px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:border-emerald-600 focus:outline-none"
                          />
                          {withdrawError && (
                            <div className="text-xs text-rose-400">{withdrawError}</div>
                          )}
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-sm text-gray-700">Cancel</AlertDialogCancel>
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
                                  "Amount Successfully transferred to your connected account",
                                  { id: "withdraw", duration: 2000 }
                                );
                                setTimeout(() => window.location.reload(), 2000);
                              } catch (e: any) {
                                toast.error(e?.message || "Withdraw failed", { id: "withdraw" });
                              } finally {
                                setWithdrawLoading(false);
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700"
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
                      className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm sm:w-auto ${
                        manageLoading
                          ? "cursor-not-allowed border-gray-700 text-gray-500"
                          : "border-emerald-800/80 text-emerald-300 hover:bg-[#0b1510]"
                      }`}
                    >
                      {manageLoading ? "Opening..." : "Manage bank"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 border-t border-[#1a1a1a] pt-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">Use at checkout / upgrade</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Off by default. Turn on and enter an amount only when you want credits applied.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={applyCredit}
                    onChange={(e) => setApplyCredit(e.target.checked)}
                  />
                  Apply credits
                </label>
              </div>
              {applyCredit && availableCredit > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#080808] px-4 py-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-gray-400">£</span>
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
                      className="w-24 rounded-lg border border-[#2A2A2A] bg-black px-2 py-1.5 text-sm text-white"
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs text-emerald-400 hover:underline"
                    onClick={() => setCreditAmount(availableCredit.toFixed(2))}
                  >
                    Use max (£{availableCredit.toFixed(2)})
                  </button>
                </div>
              )}
            </div>
          </div>

          {canReserveForNext && (
            <div className="rounded-2xl border border-[#1f1f1f] bg-[#0b0b0b] p-5 sm:p-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-100">
                    Apply credits to next payment
                  </h3>
                  <p className="mt-1 max-w-xl text-sm text-gray-500">
                    Reserve wallet credits for your next auto-renewal. Amount defaults to £0 so
                    nothing is reserved unless you choose it.
                  </p>
                </div>
                {profileResp?.data?.currentPeriodEnd && (
                  <div className="mt-2 shrink-0 rounded-full border border-[#222] bg-[#080808] px-3 py-1 text-xs text-gray-400 sm:mt-0">
                    Next charge {formatDate(profileResp.data.currentPeriodEnd)}
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3">
                  <p className="text-xs text-gray-500">Plan renewal</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-100">
                    £{nextPlanPounds.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3">
                  <p className="text-xs text-gray-500">Already reserved</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-sky-300">
                    £{stripeReservedPounds.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
                  <p className="text-xs text-emerald-500/80">Estimated next charge</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-300">
                    £{estimatedNextChargePounds.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 border-t border-[#1a1a1a] pt-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1.5 text-sm text-gray-300">
                    <span className="text-xs text-gray-500">Amount to reserve (£)</span>
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
                      className="w-32 rounded-lg border border-[#2A2A2A] bg-black px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <button
                    type="button"
                    className="mb-2 text-xs text-emerald-400 hover:underline"
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
                  <div className="mb-2 min-w-[10rem] text-sm text-gray-500">
                    {nextRenewalCreditPounds > 0 ? (
                      <>
                        After reserve:{" "}
                        <span className="font-medium text-emerald-300">
                          £{nextPlanPounds.toFixed(2)} → £{previewNextChargeAfterReserve.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-600">Enter an amount to preview</span>
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
                      className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-[#1a1a1a] disabled:text-gray-500"
                    >
                      {applyNextCreditMutation.isPending
                        ? "Reserving…"
                        : "Reserve for next payment"}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reserve credits for next renewal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This deducts £{nextRenewalCreditPounds.toFixed(2)} from your wallet now and
                        applies it to your next Stripe renewal
                        {nextPlanPounds > 0 && (
                          <>
                            {" "}
                            (£{nextPlanPounds.toFixed(2)} → about £
                            {previewNextChargeAfterReserve.toFixed(2)})
                          </>
                        )}
                        . Reserved credits leave your withdrawable wallet immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReserveNextRenewalCredit}>
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
      {/* Add Card Section */}
      {/* <section>
        <h2 className="text-lg font-semibold mb-6">Add Card</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <form className="w-full space-y-5">
            <div>
              <label className="block text-sm text-gray-200 mb-2">Card number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-2">Name on card</label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-200 mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-200 mb-2">CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <button type="submit" className="inline-flex items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-6 py-2 text-sm hover:bg-[#0b1510]">
              Save
            </button>
          </form>


          <div className="w-full flex justify-center lg:justify-end">
            <Image
              src="/images/card.png"
              alt="Credit Card"
              width={420}
              height={260}
              className="rounded-xl object-contain"
            />
          </div>
        </div>
      </section> */}
    </div>
  );
}