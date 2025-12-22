import apiClient from "./api-client";

export async function getTenants() {
  const res = await apiClient.get("/tenants");
  return res.data;
}

export async function getTenantById(id: string) {
  const res = await apiClient.get(`/tenants/${id}`);
  return res.data;
}
