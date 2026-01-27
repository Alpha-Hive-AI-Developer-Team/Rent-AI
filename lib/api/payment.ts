export interface CreateCheckoutPayload {
	priceId: string;
	planType?: string;
	successUrl?: string;
	cancelUrl?: string;
	applyCredit?: boolean;
}

import apiClient from './api-client';

export async function createCheckoutSession(payload: CreateCheckoutPayload) {
  const res = await apiClient.post('/payments/checkout', payload);
  return res.data as { success: boolean; url: string; id: string };
}



export async function cancelSubscription() {
  const res = await apiClient.post('/payments/cancel');
  return res.data as { success: boolean; message?: string; data?: any };
}
