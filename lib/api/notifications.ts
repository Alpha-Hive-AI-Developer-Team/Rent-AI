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

export type NotificationsResponse = {
  success: boolean;
  data: NotificationItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export async function getMyNotifications(params?: { page?: number; limit?: number }) {
  const res = await apiClient.get("/notifications/my", { params });
  return res.data as NotificationsResponse;
}
