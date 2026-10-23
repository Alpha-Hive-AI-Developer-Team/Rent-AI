import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createCheckoutSession,
	cancelSubscription as apiCancelSubscription,
	getNextRenewalCreditPreview,
	applyCreditsToNextRenewal as apiApplyCreditsToNextRenewal,
} from '../lib/api/payment';
import { loadStripe } from '@stripe/stripe-js';
import { getEnabledPlans } from '@/lib/api/adminApi';
import { PRICE_ID_MAP } from '@/lib/plans';
import toast from 'react-hot-toast';

type PlanKey = string;

export function usePayment() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const qc = useQueryClient();

	const plansQuery = useQuery({
		queryKey: ['enabledPlans'],
		queryFn: async () => {
			const res = await getEnabledPlans();
			return res.data || [];
		},
		staleTime: 60_000,
	});

	const nextCreditQuery = useQuery({
		queryKey: ['nextRenewalCredit'],
		queryFn: async () => {
			const res = await getNextRenewalCreditPreview();
			return res.data;
		},
		staleTime: 30_000,
	});

	const priceMap = useMemo(() => {
		const map: Record<string, string> = {
			starter: PRICE_ID_MAP.starter || process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
			pro: PRICE_ID_MAP.pro || process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
			enterprise: PRICE_ID_MAP.enterprise || process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '',
		};
		for (const p of plansQuery.data || []) {
			if (p.key && p.stripePriceId) map[p.key] = p.stripePriceId;
		}
		return map;
	}, [plansQuery.data]);

	const startCheckout = useCallback(async (
		plan: PlanKey,
		options?: boolean | { applyCredit?: boolean; applyCreditCents?: number }
	) => {
		setLoading(true);
		setError(null);
		try {
			const priceId = priceMap[plan];
			const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';

			const opts =
				typeof options === 'boolean'
					? { applyCredit: options }
					: options || {};

			const payload: Parameters<typeof createCheckoutSession>[0] = {
				planType: plan,
				planKey: plan,
				successUrl: `${origin}/user/payment?status=success`,
				cancelUrl: `${origin}/user/payment?status=cancel`,
			};
			if (priceId) payload.priceId = priceId;

			if (typeof opts.applyCreditCents === 'number' && opts.applyCreditCents > 0) {
				payload.applyCreditCents = Math.round(opts.applyCreditCents);
				payload.applyCredit = true;
			} else if (opts.applyCredit) {
				payload.applyCredit = true;
			}

			const sessionResult = await createCheckoutSession(payload);

			if ('upgraded' in sessionResult && sessionResult.upgraded === true) {
				await qc.invalidateQueries({ queryKey: ['me'] });
				await qc.invalidateQueries({ queryKey: ['payoutWallet'] });
				toast.success(
					sessionResult.message ||
						'Plan upgraded. You were charged a prorated amount for the rest of your billing period.'
				);
				return;
			}

			if (!('url' in sessionResult) || !('id' in sessionResult)) {
				throw new Error('Unexpected checkout session response');
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
			const msg =
				e?.response?.data?.message || e?.message || 'Checkout failed';
			setError(msg);
			toast.error(msg);
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

	const applyNextCreditMutation = useMutation({
		mutationFn: async (applyCreditCents: number) => {
			return apiApplyCreditsToNextRenewal({
				applyCredit: true,
				applyCreditCents: Math.round(applyCreditCents),
			});
		},
		onSuccess: async (res) => {
			toast.success(res.message || 'Credits reserved for your next renewal');
			await qc.invalidateQueries({ queryKey: ['me'] });
			await qc.invalidateQueries({ queryKey: ['payoutWallet'] });
			await qc.invalidateQueries({ queryKey: ['nextRenewalCredit'] });
		},
		onError: (err: any) => {
			toast.error(
				err?.response?.data?.message || err?.message || 'Failed to reserve credits'
			);
		},
	});

	const applyCreditsToNextRenewal = useCallback(
		async (applyCreditCents: number) => {
			return applyNextCreditMutation.mutateAsync(applyCreditCents);
		},
		[applyNextCreditMutation]
	);

	return {
		startCheckout,
		cancelSubscription,
		loading,
		error,
		cancelMutation,
		nextCreditQuery,
		applyCreditsToNextRenewal,
		applyNextCreditMutation,
		plansQuery,
		enabledPlans: plansQuery.data || [],
	};
}
