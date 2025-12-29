import apiClient from "./api-client";

export async function getUnreconciledTransactions() {
  const res = await apiClient.get(`/transactions/unreconciled`);
  return res.data;
}

export async function createTransaction(payload: any) {
  const res = await apiClient.post(`/transactions`, payload);
  return res.data;
}

// Fetch institutions proxied by backend (/api/yapily/institutions)
export async function getYapilyInstitutions() {
  const res = await apiClient.get(`/yapily/institutions`);
  return res.data;
}

export async function createYapilyAccountAuthRequest(payload: any) {
  const res = await apiClient.post(`/yapily/account-auth-requests`, payload);
  return res.data;
}

// Send consent to backend to fetch and store accounts: POST /api/transactions/yapily/accounts
export async function connectYapilyAccounts(consent: string) {
  const res = await apiClient.post(`/transactions/yapily/accounts`, {}, {
    headers: {
      consent,
    },
  });
  return res.data;
}

// Fetch transactions from Yapily via backend proxy: GET /api/transactions/yapily
export async function getYapilyTransactions(params: { accountId?: string; consent?: string; from?: string } = {}) {
  const res = await apiClient.get(`/transactions/yapily`, { params });
  return res.data;
}
export async function getConnectedAccounts() {
  const res = await apiClient.get(`/accounts`);
  return res.data;
}

export default { getUnreconciledTransactions, createTransaction, getYapilyInstitutions, createYapilyAccountAuthRequest, connectYapilyAccounts, getYapilyTransactions, getConnectedAccounts };
