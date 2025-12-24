import apiClient from "./api-client";

export async function getTenants() {
  const res = await apiClient.get("/tenants");
  return res.data;
}

export async function getTenantById(id: string) {
  const res = await apiClient.get(`/tenants/${id}`);
  return res.data;
}

export async function createTenant(payload: { tenantName: string | string[]; property: string; rent: number | string }) {
  // backend accepts tenantName as string or array; controller will normalize
  const res = await apiClient.post(`/tenants`, payload);
  return res.data;
}

export async function getLandlordAddresses(landlordId: string) {
  const res = await apiClient.get(`/tenants/landlord/${landlordId}/addresses`);
  return res.data;
}

export async function getRentDetails(month?: number, year?: number) {
  const params: Record<string, any> = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const res = await apiClient.get(`/tenants/rent-details`, { params });
  return res.data;
}
