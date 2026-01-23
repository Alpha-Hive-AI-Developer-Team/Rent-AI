import { useCallback, useMemo, useState } from 'react';
import { createCheckoutSession } from '../lib/api/payment';
import { loadStripe } from '@stripe/stripe-js';
import plansConfig, { PRICE_ID_MAP } from '@/lib/plans';

type PlanKey = 'starter' | 'pro' | 'enterprise';

export function usePayment() {
    console.log("usePayment hook called");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);


console.log("Environment variables:", {
         NEXT_PUBLIC_STRIPE_PRICE_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
            NEXT_PUBLIC_STRIPE_PRICE_PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
			NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
        });
	const priceMap = useMemo(() => ({
		starter: PRICE_ID_MAP.starter || process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
		pro: PRICE_ID_MAP.pro || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
		enterprise: PRICE_ID_MAP.enterprise || process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
	}), []);

	const startCheckout = useCallback(async (plan: PlanKey, applyCredit?: boolean) => {
		setLoading(true);
		setError(null);
		try {
			const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') || undefined : undefined;
			const priceId = priceMap[plan];
			if (!priceId) throw new Error(`Missing Stripe price id for plan: ${plan}`);
			const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
			const { url, id } = await createCheckoutSession({
				priceId,
				planType: plan,
				successUrl: `${origin}/user/payment?status=success`,
				cancelUrl: `${origin}/user/payment?status=cancel`,
				applyCredit: !!applyCredit,
			}, token);
			const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
			if (pk) {
				const stripe = await loadStripe(pk);
				if (!stripe) throw new Error('Failed to load Stripe');
				const result = await stripe.redirectToCheckout({ sessionId: id });
				if (result.error) throw new Error(result.error.message);
			} else {
				if (typeof window !== 'undefined') {
					window.location.href = url;
				}
			}
		} catch (e: any) {
			setError(e?.message || 'Checkout failed');
		} finally {
			setLoading(false);
		}
	}, [priceMap]);
console.log("usePayment returning:", { startCheckout, loading, error });
	return { startCheckout, loading, error };
}
