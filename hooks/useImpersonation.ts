"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clearImpersonationSession,
  getImpersonationSessionId,
  getStoredImpersonationLandlord,
  isImpersonating,
  landlordDisplayName,
  setImpersonationSession,
  type ImpersonationLandlord,
} from "@/lib/impersonation";
import {
  endImpersonation,
  getCurrentImpersonation,
  getImpersonationAudit,
  startImpersonation,
} from "@/lib/api/impersonationApi";

export function useIsImpersonating() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isImpersonating());
    const onStorage = () => setActive(isImpersonating());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return active;
}

export function useStartImpersonation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { landlordId: string; reason?: string; landlordHint?: ImpersonationLandlord }) =>
      startImpersonation({ landlordId: payload.landlordId, reason: payload.reason }),
    onSuccess: (res, variables) => {
      const data = res?.data || res;
      const sessionId = data?.sessionId;
      const landlord = data?.landlord || variables.landlordHint || null;
      if (!sessionId) {
        toast.error("Failed to start login-as session");
        return;
      }
      setImpersonationSession(sessionId, landlord);
      queryClient.clear();
      toast.success(`Acting as ${landlordDisplayName(landlord)}`);
      router.push("/user/dashboard");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to log in as landlord"
      );
    },
  });
}

export function useEndImpersonation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const sessionId = getImpersonationSessionId() || undefined;
      try {
        await endImpersonation(sessionId);
      } catch {
        // Still clear local session even if API fails
      }
      return true;
    },
    onSuccess: () => {
      clearImpersonationSession();
      queryClient.clear();
      toast.success("Exited landlord account");
      router.push("/admin/landlords");
    },
  });
}

export function useImpersonationBanner() {
  const [landlord, setLandlord] = useState<ImpersonationLandlord | null>(null);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const endMutation = useEndImpersonation();

  useEffect(() => {
    const sessionId = getImpersonationSessionId();
    if (!sessionId) {
      setLandlord(null);
      setActive(false);
      setReady(true);
      return;
    }
    setLandlord(getStoredImpersonationLandlord());
    setActive(true);
    setReady(true);

    (async () => {
      try {
        const res = await getCurrentImpersonation();
        const data = res?.data;
        if (data?.landlord) {
          setLandlord(data.landlord);
          setImpersonationSession(data.sessionId || sessionId, data.landlord);
          setActive(true);
        } else if (!data) {
          clearImpersonationSession();
          setLandlord(null);
          setActive(false);
        }
      } catch {
        // Keep stored landlord for banner; auth interceptor may clear on 401
      }
    })();
  }, []);

  const exit = useCallback(() => {
    endMutation.mutate();
  }, [endMutation]);

  return {
    active: active && ready,
    landlord,
    displayName: landlordDisplayName(landlord),
    exit,
    exiting: endMutation.isPending,
  };
}

export function useImpersonationAudit(
  filters: {
    landlordId?: string;
    actorId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  return useQuery({
    queryKey: ["impersonationAudit", filters],
    queryFn: () =>
      getImpersonationAudit({
        landlordId: filters.landlordId || undefined,
        actorId: filters.actorId || undefined,
        action: filters.action || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: filters.page,
        limit: filters.limit,
      }),
    enabled: Boolean(filters.enabled),
    placeholderData: (prev) => prev,
  });
}
