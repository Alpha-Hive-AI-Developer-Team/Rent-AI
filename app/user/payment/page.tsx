"use client";

import Image from "next/image";
import { Bell, CheckCircle } from "lucide-react";
import { usePayment } from "@/hooks/usepayment";
import { useEffect, useState } from "react";
import { useMyProfile } from "@/hooks/useAuth";
import plansConfig, { PLANS, PLAN_PRICE_CENTS, PlanKey } from "@/lib/plans";
import Link from "next/link";
import usePayout from '@/hooks/usePayout';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { toast } from "react-hot-toast";

export default function PaymentPage() {
  const { startCheckout, cancelSubscription, cancelMutation, loading, error } = usePayment();
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
      // reflect subscription state
      // profileResp.data.currentPeriodEnd may be an ISO string or Date
      if (profileResp.data.currentPeriodEnd) {
        setTimeout(() => {}, 0); // noop to hint re-render if needed
      }
      console.log("User profile data:", profileResp.data);
    }
  }, [profileResp]);
  const { walletQuery, connectBankAsync, withdraw, manageBankAsync } = usePayout();
  const walletData = walletQuery.data ?? {};
  const walletBalance = typeof walletData.balance === 'number' ? walletData.balance : availableCredit;
  const isConnected = !!walletData.isConnected;
  const [connectLoading, setConnectLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawError, setWithdrawError] = useState<string>("");
  const plans = PLANS;
  const planNumericPrice: Record<string, number> = Object.fromEntries(Object.entries(PLAN_PRICE_CENTS).map(([k, v]) => [k, Math.round((v || 0) / 100)]));

  const getPlanDiscountPercent = (planKey: PlanKey) => {
    const price = planNumericPrice[planKey] || 0;
    if (price <= 0) return 0;
    const pct = Math.min(100, (availableCredit / price) * 100);
    return Math.round(pct);
  };

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2a0b0b] text-rose-300 text-sm">Subscription cancelled — ends {profileResp.data.currentPeriodEnd ? new Date(profileResp.data.currentPeriodEnd).toLocaleDateString() : ''}</div>
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
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center sm:justify-end gap-3 sm:gap-4 w-full">
            {/* Apply credits toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-200 w-full sm:w-auto">
              <input type="checkbox" className="accent-emerald-600" checked={applyCredit} onChange={(e) => setApplyCredit(e.target.checked)} />
              Apply available credits at checkout
            </label>

            {/* Referral dashboard */}
            <Link href="/user/referrals" className="w-full sm:w-auto">
              <button className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510]">
                View Referral Dashboard
              </button>
            </Link>

            {/* Cancel subscription at period end */}
           

            {/* Payout / Bank actions now inline */}
            {!isConnected ? (
              <button
                onClick={async () => {
                  setConnectLoading(true);
                  try {
                    toast.loading('Redirecting to Stripe onboarding...', { id: 'onboard' });
                    await connectBankAsync();
                    toast.dismiss('onboard');
                  } catch (e: any) {
                    toast.dismiss('onboard');
                    toast.error(e?.message || 'Connect failed');
                  } finally {
                    setConnectLoading(false);
                  }
                }}
                disabled={connectLoading}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-5 py-2 text-sm hover:bg-[#0b1510]"
              >
                {connectLoading ? 'Connecting...' : 'Connect Bank Account'}
              </button>
            ) : (
              <div className="inline-flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={withdrawLoading || (walletBalance || 0) <= 0}
                      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm text-white w-full sm:w-auto ${withdrawLoading || (walletBalance || 0) <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                      {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#07120b] text-white rounded-2xl p-6 w-full max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">Confirm Withdrawal</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm text-gray-300">
                        Available balance: £{(walletBalance || 0).toFixed(2)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="mt-4 space-y-2">
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
                        className="w-full bg-transparent border border-[#24302a] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-600"
                      />
                      {withdrawError && (
                        <div className="text-xs text-rose-400">{withdrawError}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        Note: You can withdraw up to your available balance. Confirming will initiate a bank transfer to your connected account.
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-sm text-gray-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const amountToWithdraw = typeof withdrawAmount === 'number' && withdrawAmount > 0 ? withdrawAmount : (walletBalance || 0);
                          if (amountToWithdraw <= 0 || withdrawError) return;
                          setWithdrawLoading(true);
                          try {
                            toast.loading('Submitting withdrawal...', { id: 'withdraw' });
                            await withdraw(amountToWithdraw);
                            toast.success('Amount Successfully transferred to your connected account', { id: 'withdraw', duration: 2000 });
                            setTimeout(() => window.location.reload(), 2000);
                          } catch (e: any) {
                            toast.error(e?.message || 'Withdraw failed', { id: 'withdraw' });
                          } finally {
                            setWithdrawLoading(false);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={withdrawLoading || !!withdrawError || ((walletBalance || 0) <= 0)}
                      >
                        Confirm Withdraw
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <button
                  onClick={async () => {
                    setManageLoading(true);
                    try {
                      toast.loading('Opening bank dashboard...', { id: 'manage' });
                      await manageBankAsync();
                      toast.dismiss('manage');
                    } catch (e: any) {
                      toast.dismiss('manage');
                      toast.error(e?.message || 'Failed to open bank dashboard');
                    } finally {
                      setManageLoading(false);
                    }
                  }}
                  disabled={manageLoading}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm text-white w-full sm:w-auto ${manageLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-transparent border border-emerald-700 text-emerald-300 hover:bg-[#0b1510]'}`}
                >
                  {manageLoading ? 'Opening...' : 'Manage bank details'}
                </button>
              </div>
            )}
          </div>
          
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