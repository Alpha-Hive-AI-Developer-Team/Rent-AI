import apiClient from "./api-client";

export async function getTodaySummary() {
  const res = await apiClient.get(`/stats/today-summary`);
  return res.data;
}

export default { getTodaySummary };
