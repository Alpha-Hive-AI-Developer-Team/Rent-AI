import { useQuery } from "@tanstack/react-query";
import { getLandlordAddresses } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useTenantAddresses() {
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useQuery<string[], Error>({
    queryKey: ["tenantAddresses", userId],
    queryFn: async () => {
      const response = await getLandlordAddresses(userId);
      return Array.isArray(response?.data) ? response.data : [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
