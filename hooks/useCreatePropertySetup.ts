import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPropertySetup } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";
import toast from "react-hot-toast";

export type PropertySetupPayload = {
  property: string;
  propertyName?: string;
  postcode?: string;
  tenancyType: "single" | "hmo";
  tenants: Array<{
    tenantName?: string | string[];
    rent?: number | string;
    dueOn?: number;
    moveInDate?: string;
    room?: string;
    vacant?: boolean;
    depositAmount?: number | string;
  }>;
};

export default function useCreatePropertySetup() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: (data: PropertySetupPayload) => createPropertySetup(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["tenantAddresses"] });
      toast.success(res?.message || "Property added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add property");
    },
  });
}
