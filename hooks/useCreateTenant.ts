import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTenant } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";
import { useToast } from "./use-toast";

export default function useCreateTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { tenantName: string | string[]; property: string; rent: number | string }) =>
      createTenant(data),
    onSuccess: (res) => {
      // Invalidate tenants list for current user
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
    
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create tenant";
      toast({ title: "Error", description: msg, duration: 6000 });
    },
  });
}
