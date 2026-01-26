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

// --- Admin management (super-admin) ---
export async function getAdmins(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
	const params: Record<string, any> = {};
	if (filters.search) params.search = filters.search;
	if (filters.status) params.status = filters.status;
	if (filters.page) params.page = filters.page;
	if (filters.limit) params.limit = filters.limit;
	const res = await apiClient.get(`/auth/admins`, { params });
	return res.data;
}

export async function createAdmin(payload: { firstName: string; lastName: string; email: string; password: string }) {
	const res = await apiClient.post(`/auth/admins`, payload);
	return res.data;
}

export async function updateAdminStatus(adminId: string, status: 'active' | 'disable') {
	console.log(`Updating admin ${adminId} status to ${status}`);
	const res = await apiClient.put(`/auth/admins/${adminId}/status`, { status });
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

// Admin referrals summary (top referrers + table)
export async function getAdminReferralsSummary(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
	const params: Record<string, any> = {};
	if (filters.search) params.search = filters.search;
	if (filters.status) params.status = filters.status;
	if (filters.page) params.page = filters.page;
	if (filters.limit) params.limit = filters.limit;
	const res = await apiClient.get(`/auth/admin/referrals/summary`, { params });
	return res.data;
}

export async function getAdminReferralsTrend() {
    const res = await apiClient.get(`/auth/admin/referrals/trend`);
    return res.data;
}

export async function getAdminTopReferrers() {
	const res = await apiClient.get(`/auth/admin/referrals/top`);
	return res.data;
}

export default { getAdminLandlords, getLandlordTenants, getTenantTransactions, getAllTenants, getAdmins, createAdmin, updateAdminStatus, getAdminReferralsSummary, getAdminTopReferrers };

// --- Expenses & Income Summary ---
export async function createExpense(payload: { landlordId?: string; address: string; description: string; amount: number; date?: string }) {
	console.log('Creating expense with payload:', payload);
	const res = await apiClient.post(`/expenses`, payload);
	return res.data;
}

export async function getExpenses(filters: { landlordId?: string; address?: string; from?: string; to?: string; page?: number; limit?: number } = {}) {
	const params: Record<string, any> = {};
	if (filters.landlordId) params.landlordId = filters.landlordId;
	if (filters.address) params.address = filters.address;
	if (filters.from) params.from = filters.from;
	if (filters.to) params.to = filters.to;
	if (filters.page) params.page = filters.page;
	if (filters.limit) params.limit = filters.limit;
	const res = await apiClient.get(`/expenses`, { params });
	return res.data;
}

export async function getIncomeSummary(filters: { landlordId?: string; address: string; from?: string; to?: string }) {
	const params: Record<string, any> = {};
	if (filters.landlordId) params.landlordId = filters.landlordId;
	if (filters.address) params.address = filters.address;
	if (filters.from) params.from = filters.from;
	if (filters.to) params.to = filters.to;
	const res = await apiClient.get(`/expenses/summary`, { params });
	return res.data;
}

