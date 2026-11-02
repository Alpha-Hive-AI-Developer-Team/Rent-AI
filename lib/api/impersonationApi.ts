import apiClient from "./api-client";

export async function startImpersonation(payload: {
  landlordId: string;
  reason?: string;
}) {
  const res = await apiClient.post("/auth/impersonate", payload);
  return res.data;
}

export async function endImpersonation(sessionId?: string) {
  const res = await apiClient.post("/auth/impersonate/end", {
    sessionId: sessionId || undefined,
  });
  return res.data;
}

export async function getCurrentImpersonation() {
  const res = await apiClient.get("/auth/impersonate/current");
  return res.data;
}

export async function getImpersonationAudit(filters: {
  landlordId?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
} = {}) {
  const params: Record<string, string | number> = {};
  if (filters.landlordId) params.landlordId = filters.landlordId;
  if (filters.actorId) params.actorId = filters.actorId;
  if (filters.action) params.action = filters.action;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  const res = await apiClient.get("/auth/impersonate/audit", { params });
  return res.data;
}
