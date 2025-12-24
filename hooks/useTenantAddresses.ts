import { useQuery } from "@tanstack/react-query";
import { getLandlordAddresses } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useTenantAddresses() {
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useQuery<any, Error, any>({
    queryKey: ["tenantAddresses", userId],
    queryFn: () => getLandlordAddresses(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
