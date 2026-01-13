import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenants, payRentByCash } from "@/lib/api/tenantsApi";
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

export default function usePayByCash() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload?: { index?: number; month?: string } }) =>
      payRentByCash(tenantId, payload),
    onSuccess: () => {
      // refresh tenants for current user
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
    },
  });
}