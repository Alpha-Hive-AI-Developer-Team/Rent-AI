import apiClient from "./api-client";

export async function getPayerSuggestions() {
  const res = await apiClient.get("/tenants/payer-suggestions");
  const payload = res.data;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getTenants() {
  const res = await apiClient.get("/tenants");
  return res.data;
}

export async function getTenantById(id: string) {
  const res = await apiClient.get(`/tenants/${id}`);
  return res.data;
}

export async function createTenant(payload: {
  tenantName: string | string[];
  property: string;
  rent: number | string;
  dueOn?: number;
  moveInDate?: string;
  room?: string;
  propertyName?: string;
  postcode?: string;
  tenancyType?: "single" | "hmo";
  depositAmount?: number | string;
}) {
  const res = await apiClient.post(`/tenants`, payload);
  return res.data;
}

export async function createPropertySetup(payload: {
  property: string;
  propertyName?: string;
  postcode?: string;
  tenancyType: "single" | "hmo";
    tenants: Array<{
    tenantName?: string | string[];
    rent?: number | string;
    dueOn?: number;
    moveInDate?: string;
    room?: string;
    vacant?: boolean;
    depositAmount?: number | string;
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
  }>;
}) {
  const res = await apiClient.post(`/tenants/property-setup`, payload);
  return res.data;
}

export async function getLandlordAddresses(landlordId: string) {
  const res = await apiClient.get(`/tenants/landlord/${landlordId}/addresses`);
  const payload = res.data;
  const normalizedAddresses = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.addresses)
    ? payload.data.addresses
        .map((item: any) => (typeof item === "string" ? item : item?.address))
        .filter(Boolean)
    : [];

  return {
    ...payload,
    data: normalizedAddresses,
  };
}

export async function updateTenant(
  id: string,
  payload: {
    tenantName?: string | string[];
    room?: string;
    moveInDate?: string | null;
    dueOn?: number;
    depositAmount?: number | string;
    rent?: number | string;
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
  }
) {
  const res = await apiClient.put(`/tenants/${id}`, payload);
  return res.data;
}

/** Assign an occupant to a vacant room placeholder. */
export async function assignTenantToRoom(
  id: string,
  payload: {
    tenantName: string | string[];
    rent?: number | string;
    dueOn?: number;
    moveInDate?: string;
    depositAmount?: number | string;
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
  }
) {
  const res = await apiClient.post(`/tenants/${id}/assign`, payload);
  return res.data;
}

/** Soft-end tenancy — removes from active list, keeps history for the property. */
export async function endTenancy(id: string, payload?: { moveOutDate?: string }) {
  const res = await apiClient.delete(`/tenants/${id}`, { data: payload || {} });
  return res.data;
}

export async function getRentDetails(month?: number, year?: number) {
  const params: Record<string, any> = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const res = await apiClient.get(`/tenants/rent-details`, { params });

  return res.data;
}

export async function payRentByCash(
  tenantId: string,
  payload: { index?: number; month?: string; amount?: number } = {}
) {
  const res = await apiClient.post(`/tenants/${tenantId}/pay/cash`, payload);
  return res.data;
}

export async function getRentEntryPayment(
  tenantId: string,
  params: { index?: number; month?: string } = {}
) {
  const res = await apiClient.get(`/tenants/${tenantId}/rent-payment`, { params });
  return res.data;
}

export async function unreconcileRentEntry(
  tenantId: string,
  payload: { index?: number; month?: string } = {}
) {
  const res = await apiClient.post(`/tenants/${tenantId}/unreconcile`, payload);
  return res.data;
}

/** Remove a saved bank payer so future inflows no longer auto-link to this tenant. */
export async function unlinkLinkedPayer(tenantId: string, payerId: string) {
  const res = await apiClient.delete(`/tenants/${tenantId}/linked-payers/${payerId}`);
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
  const res = await apiClient.get(`/tenants/rent-collected`, { params });
  return res.data;
}

export async function getArrears() {
  const res = await apiClient.get(`/tenants/arrears`);
  return res.data;
}
