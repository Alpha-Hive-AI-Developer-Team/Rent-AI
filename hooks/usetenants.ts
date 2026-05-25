import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenants, payRentByCash, updateTenant } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";
import toast from "react-hot-toast";




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

export function useUpdateTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: { tenantName: string[] } }) =>
      updateTenant(tenantId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Tenant updated");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update tenant";
      toast.error(msg);
    },
  });
}