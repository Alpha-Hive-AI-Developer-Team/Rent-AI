export interface CreateCheckoutPayload {
	priceId: string;
	planType?: string;
	successUrl?: string;
	cancelUrl?: string;
	applyCredit?: boolean;
}

export async function createCheckoutSession(payload: CreateCheckoutPayload, token?: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/payments/checkout`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(payload),
		credentials: 'include',
	});

	if (!res.ok) {
		const msg = await res.text();
		throw new Error(msg || 'Failed to create checkout session');
	}
	return res.json() as Promise<{ success: boolean; url: string; id: string }>;
}
