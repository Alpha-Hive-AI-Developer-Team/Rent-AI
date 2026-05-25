import { useQuery } from "@tanstack/react-query";
import { getMyNotifications } from "@/lib/api/notifications";

export function useNotifications(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["notifications", params?.page ?? 1, params?.limit ?? 10],
    queryFn: async () => {
      return await getMyNotifications(params);
    },
    enabled: typeof window !== "undefined",
    staleTime: 0,
  });
}
