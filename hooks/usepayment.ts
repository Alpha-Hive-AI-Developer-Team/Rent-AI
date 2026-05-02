import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCheckoutSession, cancelSubscription as apiCancelSubscription } from '../lib/api/payment';
import { loadStripe } from '@stripe/stripe-js';
import { PRICE_ID_MAP } from '@/lib/plans';
import toast from 'react-hot-toast';

type PlanKey = 'starter' | 'pro' | 'enterprise';

export function usePayment() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const qc = useQueryClient();

	const priceMap = useMemo(() => ({
		starter: PRICE_ID_MAP.starter || process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
		pro: PRICE_ID_MAP.pro || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
		enterprise: PRICE_ID_MAP.enterprise || process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
	}), []);

	const startCheckout = useCallback(async (plan: PlanKey, applyCredit?: boolean) => {
		setLoading(true);
		setError(null);
		try {
			const priceId = priceMap[plan];
			if (!priceId) throw new Error(`Missing Stripe price id for plan: ${plan}`);
			const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
			const sessionResult = await createCheckoutSession({
				priceId,
				planType: plan,
				successUrl: `${origin}/user/payment?status=success`,
				cancelUrl: `${origin}/user/payment?status=cancel`,
				applyCredit: !!applyCredit,
			});

			if ('upgraded' in sessionResult && sessionResult.upgraded) {
				await qc.invalidateQueries({ queryKey: ['me'] });
				toast.success(
					sessionResult.message ||
						'Plan upgraded. You were charged a prorated amount for the rest of your billing period.'
				);
				return;
			}

			const { url, id } = sessionResult;
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
			throw e;
		} finally {
			setLoading(false);
		}
	}, [priceMap, qc]);

	const cancelMutation = useMutation({
		mutationFn: async () => {
			return await apiCancelSubscription();
		},
		onMutate: () => {
			setLoading(true);
			setError(null);
		},
		onSuccess: () => {
			// Invalidate profile/notifications so UI updates (keys used elsewhere)
			qc.invalidateQueries({ queryKey: ['me'] });
			qc.invalidateQueries({ queryKey: ['notifications'] });
		},
		onError: (_err: any) => {
			setError(_err?.message || String(_err));
		},
		onSettled: () => {
			setLoading(false);
		}
	});

	const cancelSubscription = useCallback(async () => {
		return cancelMutation.mutateAsync();
	}, [cancelMutation]);

	return { startCheckout, cancelSubscription, loading, error, cancelMutation };
}
