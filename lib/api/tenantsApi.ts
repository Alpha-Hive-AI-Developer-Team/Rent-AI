import apiClient from "./api-client";

export async function getPayerSuggestions() {
  const res = await apiClient.get("/tenants/payer-suggestions");
  const payload = res.data;
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function getTenants(params: { archived?: "exclude" | "only" | "include" } = {}) {
  const archived = params.archived ?? "exclude";
  const res = await apiClient.get("/tenants", {
    params:
      archived === "only"
        ? { archived: "only" }
        : archived === "include"
          ? { archived: "include" }
          : undefined,
  });
  return res.data;
}

export async function archiveTenant(id: string) {
  const res = await apiClient.post(`/tenants/${id}/archive`);
  return res.data;
}

export async function unarchiveTenant(id: string) {
  const res = await apiClient.post(`/tenants/${id}/unarchive`);
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
  rentFrequency?: "monthly" | "weekly";
  moveInDate?: string;
  room?: string;
  propertyName?: string;
  postcode?: string;
  tenancyType?: "single" | "hmo";
  depositAmount?: number | string;
  depositPaidDate?: string | null;
  firstPaymentAmount?: number | string;
  firstPaymentDate?: string | null;
  firstPaymentMethod?: "cash" | "bank";
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
    rentFrequency?: "monthly" | "weekly";
    moveInDate?: string;
    room?: string;
    vacant?: boolean;
    depositAmount?: number | string;
    depositPaidDate?: string | null;
    firstPaymentAmount?: number | string;
    firstPaymentDate?: string | null;
    firstPaymentMethod?: "cash" | "bank";
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
    dueOnSchedule?: Array<{ effectiveFrom: string; dueOn: number }>;
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
    rentFrequency?: "monthly" | "weekly";
    depositAmount?: number | string;
    depositPaidDate?: string | null;
    firstPaymentAmount?: number | string;
    firstPaymentDate?: string | null;
    firstPaymentMethod?: "cash" | "bank";
    rent?: number | string;
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
    dueOnSchedule?: Array<{ effectiveFrom: string; dueOn: number }>;
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
    rentFrequency?: "monthly" | "weekly";
    moveInDate?: string;
    depositAmount?: number | string;
    depositPaidDate?: string | null;
    firstPaymentAmount?: number | string;
    firstPaymentDate?: string | null;
    firstPaymentMethod?: "cash" | "bank";
    rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
    dueOnSchedule?: Array<{ effectiveFrom: string; dueOn: number }>;
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
  payload: {
    index?: number;
    month?: string;
    amount?: number;
    paidOn?: string;
    paymentMethod?: "cash" | "bank";
  } = {}
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

/** Linked bank transaction for a tenant deposit (deposit-only payments). */
export async function getDepositPayment(tenantId: string) {
  const res = await apiClient.get(`/tenants/${tenantId}/deposit-payment`);
  return res.data;
}

export async function unreconcileRentEntry(
  tenantId: string,
  payload: { index?: number; month?: string } = {}
) {
  const res = await apiClient.post(`/tenants/${tenantId}/unreconcile`, payload);
  return res.data;
}

/** Reverse all rent + deposit payments and unreconcile linked bank txs. */
export async function unreconcileAllPayments(tenantId: string) {
  const res = await apiClient.post(`/tenants/${tenantId}/unreconcile-all`);
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

/** One-off charge, discount, or refund (keeps rent ledger synced). */
export async function addTenantAdjustment(
  tenantId: string,
  payload: {
    type: "charge" | "discount" | "refund";
    amount: number | string;
    description: string;
    date?: string;
    monthLink?: string | null;
  }
) {
  const res = await apiClient.post(`/tenants/${tenantId}/adjustments`, payload);
  return res.data;
}

/** Edit a folded charge / discount / refund on a rent month. */
export async function updateTenantLineItem(
  tenantId: string,
  rentEntryId: string,
  lineItemId: string,
  payload: {
    amount?: number | string;
    description?: string;
    date?: string;
  }
) {
  const res = await apiClient.put(
    `/tenants/${tenantId}/rent-history/${rentEntryId}/line-items/${lineItemId}`,
    payload
  );
  return res.data;
}

/** Remove a folded charge / discount / refund from a rent month. */
export async function removeTenantLineItem(
  tenantId: string,
  rentEntryId: string,
  lineItemId: string
) {
  const res = await apiClient.delete(
    `/tenants/${tenantId}/rent-history/${rentEntryId}/line-items/${lineItemId}`
  );
  return res.data;
}

/** Change due day mid-tenancy; optional transition/prorated charge. */
export async function changeTenantDueDate(
  tenantId: string,
  payload: {
    newDueOn: number;
    effectiveFrom: string;
    addTransition?: boolean;
    differenceDue?: number | string;
    note?: string;
  }
) {
  const res = await apiClient.post(`/tenants/${tenantId}/change-due-date`, payload);
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
