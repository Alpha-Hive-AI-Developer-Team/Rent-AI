import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endTenancy,
  getTenants,
  payRentByCash,
  unreconcileRentEntry,
  updateTenant,
  assignTenantToRoom,
} from "@/lib/api/tenantsApi";
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
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload?: { index?: number; month?: string; amount?: number };
    }) => payRentByCash(tenantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
    },
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: {
        tenantName?: string[];
        room?: string;
        moveInDate?: string | null;
        dueOn?: number;
      };
    }) => updateTenant(tenantId, payload),
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

export function useAssignTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: {
        tenantName: string | string[];
        rent?: number | string;
        dueOn?: number;
        moveInDate?: string;
      };
    }) => assignTenantToRoom(tenantId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Tenant assigned");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to assign tenant";
      toast.error(msg);
    },
  });
}

export function useEndTenancy() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId, moveOutDate }: { tenantId: string; moveOutDate?: string }) =>
      endTenancy(tenantId, moveOutDate ? { moveOutDate } : undefined),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Tenant removed. History kept for this property.");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to remove tenant";
      toast.error(msg);
    },
  });
}

export function useUnreconcileRent() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload?: { index?: number; month?: string };
    }) => unreconcileRentEntry(tenantId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      toast.success(res?.message || "Payment reversed");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to reverse payment";
      toast.error(msg);
    },
  });
}
