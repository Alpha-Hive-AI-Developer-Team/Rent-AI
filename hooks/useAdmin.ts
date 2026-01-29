import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminLandlords, getAdminReferralsTrend, getAdminTopReferrers } from "@/lib/api/adminApi";
import { createExpense, getExpenses, getIncomeSummary } from "@/lib/api/adminApi";

import { getLandlordTenants, getTenantTransactions, getAllTenants, getTenantStats, getAdminSummary, getAdminReferralsSummary } from "@/lib/api/adminApi";
import { getAdmins, createAdmin } from "@/lib/api/adminApi";
import { updateAdminStatus } from "@/lib/api/adminApi";

export function useAdminLandlords(filters: { search?: string; plan?: string; status?: string; page?: number; limit?: number } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["adminLandlords", filters],
		queryFn: () => getAdminLandlords(filters),
		staleTime: 0,
	});
}

export default useAdminLandlords;

export function useLandlordTenants(landlordId?: string) {
	return useQuery<any, Error, any>({
		queryKey: ["landlordTenants", landlordId],
		queryFn: () => getLandlordTenants({ landlordId }),
		enabled: !!landlordId,
		staleTime: 0,
	});
}

export function useTenantTransactions(tenantId?: string) {
    return useQuery<any, Error, any>({
        queryKey: ["tenantTransactions", tenantId],
        queryFn: () => getTenantTransactions(tenantId as string),
        enabled: !!tenantId,
        staleTime: 0,
    });
}

export function useTenantStats() {
	return useQuery<any, Error, any>({
		queryKey: ["tenantStats"],
		queryFn: () => getTenantStats(),
		staleTime: 60_000, // refresh every minute
	});
}

export function useAdminSummary() {
	return useQuery<any, Error, any>({
		queryKey: ["adminSummary"],
		queryFn: () => getAdminSummary(),
		staleTime: 60_000, // refresh every minute
	});
}

export function useAdminReferralsSummary(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["adminReferralsSummary", filters],
		queryFn: () => getAdminReferralsSummary(filters),
		staleTime: 60_000,

	});
}

export function useAdminReferralsTrend() {
    return useQuery<any, Error, any>({
        queryKey: ["adminReferralsTrend"],
        queryFn: () => getAdminReferralsTrend(),
        staleTime: 5 * 60_000, // refresh every 5 minutes
    });
}

export function useAdminTopReferrers() {
	return useQuery<any, Error, any>({
		queryKey: ["adminTopReferrers"],
		queryFn: () => getAdminTopReferrers(),
		staleTime: 5 * 60_000,
	});
}

export function useAllTenants(filters: { search?: string; status?: string } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["adminAllTenants", filters],
		queryFn: () => getAllTenants(filters),
		staleTime: 0,
	});
}

export function useAdmins(filters: { search?: string; status?: string; page?: number; limit?: number } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["adminsList", filters],
		queryFn: () => getAdmins(filters),
		staleTime: 0,
	});
}

export function useCreateAdmin() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: any) => createAdmin(payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["adminsList"] }),
	});
}

export function useUpdateAdminStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'disable' }) => updateAdminStatus(id, status),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["adminsList"] }),
    });
}

// --- Expenses & Income Summary Hooks ---
export function useExpenses(filters: { landlordId?: string; address?: string; from?: string; to?: string; page?: number; limit?: number } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["expenses", filters],
		queryFn: () => getExpenses(filters),
		enabled: !!filters.address || !!filters.landlordId,
		staleTime: 0,
	});
}

export function useIncomeSummary(filters: { landlordId?: string; address: string; from?: string; to?: string }) {
	return useQuery<any, Error, any>({
		queryKey: ["incomeSummary", filters],
		queryFn: () => getIncomeSummary(filters),
		enabled: !!filters.address,
		staleTime: 0,
	});
}

export function useCreateExpense() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: { landlordId?: string; address: string; description: string; amount: number; date?: string }) => createExpense(payload),
		onSuccess: (_res, variables) => {
			qc.invalidateQueries({ queryKey: ["expenses"] });
			qc.invalidateQueries({ queryKey: ["incomeSummary"] });
			// also invalidate by specific paramized keys
			qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "expenses" });
			qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "incomeSummary" });
		},
	});
}

