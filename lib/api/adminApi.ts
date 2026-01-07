import apiClient from "./api-client";

export async function getAdminLandlords(filters: { search?: string; plan?: string; status?: string; page?: number; limit?: number } = {}) {
	const params: Record<string, any> = {};
	if (filters.search) params.search = filters.search;
	if (filters.plan) params.plan = filters.plan;
	if (filters.status) params.status = filters.status;
	if (filters.page) params.page = filters.page;
	if (filters.limit) params.limit = filters.limit;
	const res = await apiClient.get(`/auth/landlords`, { params });
	return res.data;
}

export async function getLandlordTenants(filters: { landlordId?: string } = {}) {
	const params: Record<string, any> = {};
	if (filters.landlordId) params.landlordId = filters.landlordId;
	const res = await apiClient.get(`/auth/landlords/tenants`, { params });
	return res.data;
}

// Fetch a tenant's detailed transactions
export async function getTenantTransactions(tenantId: string) {
    const res = await apiClient.get(`/tenants/${tenantId}/details`);
    // Return the inner data object for easier consumption in hooks/components
    return res.data?.data ?? res.data;
}

// Fetch flattened list of all tenants (admin view)
export async function getAllTenants(filters: { search?: string; status?: string } = {}) {
	const params: Record<string, any> = {};
	if (filters.search) params.search = filters.search;
	if (filters.status) params.status = filters.status;
	const res = await apiClient.get(`/auth/tenants/all`, { params });
	return res.data;
}

export async function getTenantStats() {
    const res = await apiClient.get(`/auth/tenants/stats`);
    return res.data;
}

export async function getAdminSummary() {
	const res = await apiClient.get(`/stats/admin-summary`);
	return res.data;
}

export default { getAdminLandlords, getLandlordTenants, getTenantTransactions, getAllTenants };

