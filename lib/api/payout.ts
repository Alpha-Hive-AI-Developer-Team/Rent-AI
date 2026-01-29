import apiClient from './api-client';

export async function getWallet() {
  const res = await apiClient.get('/payouts/wallet');
  return res.data;
}

export async function createOnboardLink() {
  const res = await apiClient.post('/payouts/onboard');
  return res.data;
}

export async function createLoginLink() {
  const res = await apiClient.post('/payouts/login-link');
  return res.data;
}

export async function withdraw(amount?: number) {
  const res = await apiClient.post('/payouts/withdraw', { amount });
  return res.data;
}

export default { getWallet, createOnboardLink, withdraw };
