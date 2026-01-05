import { useQuery } from "@tanstack/react-query";
import { getAdminLandlords } from "@/lib/api/adminApi";

import { getLandlordTenants } from "@/lib/api/adminApi";

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

