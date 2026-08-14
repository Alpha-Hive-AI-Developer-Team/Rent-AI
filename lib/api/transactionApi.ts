import apiClient from "./api-client";

export async function getUnreconciledTransactions() {
  const res = await apiClient.get(`/transactions/unreconciled`);
  console.log("Unreconciled Transactions:", res.data);
  return res.data;
}

export async function createTransaction(payload: any) {
  const res = await apiClient.post(`/transactions`, payload);
  return res.data;
}

export async function createPlaidLinkToken() {
  const res = await apiClient.post(`/plaid/link-token`);
  return res.data;
}

export async function exchangePlaidPublicToken(payload: {
  public_token: string;
  institution?: { institution_id?: string; name?: string } | null;
}) {
  const res = await apiClient.post(`/plaid/exchange`, payload);
  return res.data;
}

export async function getPlaidTransactions(params: { accountId?: string } = {}) {
  const res = await apiClient.get(`/transactions/plaid`, { params });
  return res.data;
}

export async function getConnectedAccounts() {
  const res = await apiClient.get(`/accounts`);
  return res.data;
}

export async function getConnectedBank() {
  const res = await apiClient.get(`/plaid/connected`);
  return res.data;
}

export async function simulatePlaidIncoming(payload: { amount?: number; description?: string } = {}) {
  const res = await apiClient.post(`/plaid/sandbox/simulate-incoming`, payload);
  return res.data;
}

export default {
  getUnreconciledTransactions,
  createTransaction,
  createPlaidLinkToken,
  exchangePlaidPublicToken,
  getPlaidTransactions,
  getConnectedAccounts,
};
