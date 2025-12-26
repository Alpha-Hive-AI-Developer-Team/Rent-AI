import apiClient from "./api-client";

export async function getUnreconciledTransactions() {
  const res = await apiClient.get(`/transactions/unreconciled`);
  return res.data;
}

export async function createTransaction(payload: any) {
  const res = await apiClient.post(`/transactions`, payload);
  return res.data;
}

export default { getUnreconciledTransactions, createTransaction };
