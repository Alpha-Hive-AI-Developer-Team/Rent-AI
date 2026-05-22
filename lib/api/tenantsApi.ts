import apiClient from "./api-client";

export async function getTenants() {
  const res = await apiClient.get("/tenants");
  return res.data;
}

export async function getTenantById(id: string) {
  const res = await apiClient.get(`/tenants/${id}`);
  return res.data;
}

export async function createTenant(payload: { tenantName: string | string[]; property: string; rent: number | string; dueOn?: number; moveInDate?: string }) {
  // backend accepts tenantName as string or array; now also dueOn (day-of-month) and moveInDate (ISO date)
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

export async function payRentByCash(tenantId: string, payload: { index?: number; month?: string } = {}) {
  const res = await apiClient.post(`/tenants/${tenantId}/pay/cash`, payload);
  return res.data;
}

/** Reconcile a bank transaction against a tenant's oldest unpaid rent. */
export async function markRentPaidWithTransaction(tenantId: string, transactionId: string) {
  const res = await apiClient.post(`/tenants/${tenantId}/pay`, { transactionId });
  return res.data;
}

export async function getExpectedSeries(options: { granularity?: 'month' | 'day'; months?: number; days?: number } = {}) {
  const { granularity = 'month', months = 3, days } = options;
  const params: any = { granularity };
  if (granularity === 'month') params.months = months;
  if (granularity === 'day' && typeof days === 'number') params.days = days;
  const res = await apiClient.get(`/tenants/rent-series`, { params });
  return res.data;
}

export async function getCollectedSeries(options: { granularity?: 'month' | 'day'; months?: number; days?: number } = {}) {
  const { granularity = 'month', months = 3, days } = options;
  const params: any = { granularity };
  if (granularity === 'month') params.months = months;
  if (granularity === 'day' && typeof days === 'number') params.days = days;
  console.log("Fetching collected series with params:", params);
  const res = await apiClient.get(`/tenants/rent-collected`, { params });
  return res.data;
}

export async function getArrears() {
  const res = await apiClient.get(`/tenants/arrears`);
  return res.data;
}
