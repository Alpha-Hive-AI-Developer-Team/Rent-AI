import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endTenancy,
  getTenants,
  archiveTenant,
  unarchiveTenant,
  payRentByCash,
  unreconcileRentEntry,
  unreconcileAllPayments,
  unlinkLinkedPayer,
  updateTenant,
  assignTenantToRoom,
  addTenantAdjustment,
  updateTenantLineItem,
  removeTenantLineItem,
  changeTenantDueDate,
} from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";
import toast from "react-hot-toast";

export function useTenants(opts: { archived?: "exclude" | "only" | "include" } = {}) {
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;
  const archived = opts.archived ?? "exclude";

  return useQuery<any, Error, any>({
    queryKey: ["tenants", userId, archived],
    queryFn: () => getTenants({ archived }),
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
      payload?: {
        index?: number;
        month?: string;
        amount?: number;
        paidOn?: string;
        paymentMethod?: "cash" | "bank";
      };
    }) => payRentByCash(tenantId, payload),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      const method = vars?.payload?.paymentMethod === "bank" ? "bank" : "cash";
      toast.success(method === "bank" ? "Marked as paid by bank" : "Cash payment recorded");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to record payment";
      toast.error(msg);
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
        depositAmount?: number | string;
        depositPaidDate?: string | null;
        firstPaymentAmount?: number | string;
        firstPaymentDate?: string | null;
        firstPaymentMethod?: "cash" | "bank";
        rent?: number | string;
        rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
        dueOnSchedule?: Array<{ effectiveFrom: string; dueOn: number }>;
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
        depositAmount?: number | string;
        depositPaidDate?: string | null;
        firstPaymentAmount?: number | string;
        firstPaymentDate?: string | null;
        firstPaymentMethod?: "cash" | "bank";
        rentSchedule?: Array<{ effectiveFrom: string; amount: number }>;
        dueOnSchedule?: Array<{ effectiveFrom: string; dueOn: number }>;
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

export function useArchiveTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId }: { tenantId: string }) => archiveTenant(tenantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Tenant archived");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to archive tenant";
      toast.error(msg);
    },
  });
}

export function useUnarchiveTenant() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId }: { tenantId: string }) => unarchiveTenant(tenantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Tenant restored");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to restore tenant";
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

export function useUnreconcileAllPayments() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId }: { tenantId: string }) => unreconcileAllPayments(tenantId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      toast.success(res?.message || "All payments reversed");
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to reverse all payments";
      toast.error(msg);
    },
  });
}

export function useUnlinkLinkedPayer() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({ tenantId, payerId }: { tenantId: string; payerId: string }) =>
      unlinkLinkedPayer(tenantId, payerId),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
      toast.success(res?.message || "Bank payer unlinked");
      return vars;
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to unlink payer";
      toast.error(msg);
    },
  });
}

export function useAddTenantAdjustment() {
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
        type: "charge" | "discount" | "refund";
        amount: number | string;
        description: string;
        date?: string;
        monthLink?: string | null;
      };
    }) => addTenantAdjustment(tenantId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Adjustment added");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to add adjustment";
      toast.error(msg);
    },
  });
}

export function useUpdateTenantLineItem() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({
      tenantId,
      rentEntryId,
      lineItemId,
      payload,
    }: {
      tenantId: string;
      rentEntryId: string;
      lineItemId: string;
      payload: {
        amount?: number | string;
        description?: string;
        date?: string;
      };
    }) => updateTenantLineItem(tenantId, rentEntryId, lineItemId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Adjustment updated");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update adjustment";
      toast.error(msg);
    },
  });
}

export function useRemoveTenantLineItem() {
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useMutation({
    mutationFn: ({
      tenantId,
      rentEntryId,
      lineItemId,
    }: {
      tenantId: string;
      rentEntryId: string;
      lineItemId: string;
    }) => removeTenantLineItem(tenantId, rentEntryId, lineItemId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Adjustment removed");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to remove adjustment";
      toast.error(msg);
    },
  });
}

export function useChangeTenantDueDate() {
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
        newDueOn: number;
        effectiveFrom: string;
        addTransition?: boolean;
        differenceDue?: number | string;
        note?: string;
      };
    }) => changeTenantDueDate(tenantId, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success(res?.message || "Due date updated");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to change due date";
      toast.error(msg);
    },
  });
}
