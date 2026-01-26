import { useQuery } from "@tanstack/react-query";
import { getMyNotifications } from "@/lib/api/notifications";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      return await getMyNotifications();
    },
    enabled: typeof window !== "undefined",
    staleTime: 0,
  });
}
