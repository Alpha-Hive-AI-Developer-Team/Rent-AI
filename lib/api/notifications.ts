import apiClient from "./api-client";

export type NotificationItem = {
  _id: string;
  user: string;
  type: string;
  description: string;
  data?: any;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getMyNotifications() {
  const res = await apiClient.get("/notifications/my");
  return res.data as { success: boolean; data: NotificationItem[] };
}
