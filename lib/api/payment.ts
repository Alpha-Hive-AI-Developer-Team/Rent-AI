export interface CreateCheckoutPayload {
	priceId: string;
	planType?: string;
	successUrl?: string;
	cancelUrl?: string;
	/** Legacy: apply all available credits (capped by price / invoice). */
	applyCredit?: boolean;
	/** Preferred: exact credit amount in minor units (pence). */
	applyCreditCents?: number;
}

import apiClient from './api-client';

export type CheckoutSessionResponse =
	| { success: boolean; url: string; id: string }
	| {
			success: boolean;
			upgraded: true;
			message?: string;
			subscriptionId?: string;
			appliedCreditCents?: number;
	  };

export async function createCheckoutSession(payload: CreateCheckoutPayload): Promise<CheckoutSessionResponse> {
  const res = await apiClient.post('/payments/checkout', payload);
  return res.data as CheckoutSessionResponse;
}



export async function cancelSubscription() {
  const res = await apiClient.post('/payments/cancel');
  return res.data as { success: boolean; message?: string; data?: any };
}
