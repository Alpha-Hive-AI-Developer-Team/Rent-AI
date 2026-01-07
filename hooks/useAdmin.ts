import { useQuery } from "@tanstack/react-query";
import { getAdminLandlords } from "@/lib/api/adminApi";

import { getLandlordTenants, getTenantTransactions, getAllTenants, getTenantStats, getAdminSummary } from "@/lib/api/adminApi";

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

export function useAllTenants(filters: { search?: string; status?: string } = {}) {
	return useQuery<any, Error, any>({
		queryKey: ["adminAllTenants", filters],
		queryFn: () => getAllTenants(filters),
		staleTime: 0,
	});
}

