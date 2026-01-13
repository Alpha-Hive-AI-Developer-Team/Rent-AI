import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenant } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";
import toast from "react-hot-toast";

export default function useCreateTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;


  return useMutation({
    mutationFn: (data: { tenantName: string | string[]; property: string; rent: number | string; dueOn?: number; moveInDate?: string }) =>
      createTenant(data),
    onSuccess: (res) => {
      // Invalidate tenants list for current user
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      const msg = res?.message || "Tenant created";
      toast.success(msg);
    
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create tenant";
        toast.error(msg);
    },
  });
}
