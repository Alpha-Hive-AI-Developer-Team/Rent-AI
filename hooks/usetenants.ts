import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";




export function useTenants() {
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useQuery<any, Error, any>({
    queryKey: ["tenants", userId],
    queryFn: () => getTenants(),
    enabled: !!userId,
    staleTime: 0,
  });
}