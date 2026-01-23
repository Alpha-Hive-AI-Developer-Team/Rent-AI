"use client";

import Image from "next/image";
import { Bell, CheckCircle } from "lucide-react";
import { usePayment } from "@/hooks/usepayment";
import { useEffect, useState } from "react";
import { useMyProfile } from "@/hooks/useAuth";
import plansConfig, { PLANS, PLAN_PRICE_CENTS, PlanKey } from "@/lib/plans";
import Link from "next/link";

export default function PaymentPage() {
  const { startCheckout, loading, error } = usePayment();
  const [activePlan, setActivePlan] = useState<string>("free");
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);
  const [availableCredit, setAvailableCredit] = useState<number>(0);
  const [applyCredit, setApplyCredit] = useState<boolean>(true);

  const planRank: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
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
      // You can show a toast or banner here
      console.log('Checkout status:', status);
    }
  }, []);

  const { data: profileResp } = useMyProfile();

  useEffect(() => {
    if (profileResp?.success && profileResp.data) {
      setActivePlan(profileResp.data.activePlan || profileResp.data.planType || 'free');
      setCurrentDiscount(profileResp.data.currentDiscount || 0);
      // Backend returns credits in cents; convert to GBP for display
      const cents = Number(profileResp.data.totalDiscountAmount || 0);
      setAvailableCredit(Math.max(0, Math.round(cents) / 100));
      console.log("User profile data:", profileResp.data);
    }
  }, [profileResp]);
  const plans = PLANS;
  const planNumericPrice: Record<string, number> = Object.fromEntries(Object.entries(PLAN_PRICE_CENTS).map(([k, v]) => [k, Math.round((v || 0) / 100)]));

  const getPlanDiscountPercent = (planKey: PlanKey) => {
    const price = planNumericPrice[planKey] || 0;
    if (price <= 0) return 0;
    const pct = Math.min(100, (availableCredit / price) * 100);
    return Math.round(pct);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Payment Plan</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </div>
      </div>

      {/* Plans & Billing */}
      <section>
        {/* <h2 className="text-lg font-semibold mb-6">Plans & Billing</h2> */}
        {/* Plan Cards (match screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.key} className={`rounded-2xl border p-5 flex flex-col justify-between ${activePlan === plan.key ? 'border-emerald-500 bg-[#072a17]' : 'border-[#2A2A2A] bg-transparent'}`}>
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-3">{plan.title}</h3>
                <p className="text-3xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-gray-400">{plan.per}</span></p>
                {plan.key !== 'free' && (planRank[plan.key] > (planRank[activePlan] ?? 0)) && (
                  <p className="text-xs text-emerald-400 mt-1">Up to {getPlanDiscountPercent(plan.key as any)}% off with credits</p>
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
                      startCheckout(plan.key as 'starter' | 'pro' | 'enterprise', applyCredit);
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

        {/* Referral discount bar (below plans) */}
        <div className="mt-6 rounded-2xl border border-[#2A2A2A] bg-transparent p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-200">Referral Discount</h3>
            {/* <p className="text-[13px] text-gray-400 mt-1">Current discount: <span className="font-semibold text-white">{currentDiscount}%</span></p> */}
            <p className="text-[13px] text-gray-400 mt-1">Available credits: <span className="font-semibold text-white">£{availableCredit.toFixed(2)}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input type="checkbox" className="accent-emerald-600" checked={applyCredit} onChange={(e) => setApplyCredit(e.target.checked)} />
              Apply available credits at checkout
            </label>
          <Link href="/user/referrals">
            <button className="inline-flex items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-5 py-2 text-sm hover:bg-[#0b1510]">
              View Referral Dashboard
            </button>
          </Link>
          </div>
        </div>
      </section>
      {/* Add Card Section */}
      <section>
        <h2 className="text-lg font-semibold mb-6">Add Card</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form Fields */}
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

          {/* Right: Card Image */}
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
      </section>
    </div>
  );
}