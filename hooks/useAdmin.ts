import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminLandlords, getAdminReferralsTrend, getAdminTopReferrers } from "@/lib/api/adminApi";

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

