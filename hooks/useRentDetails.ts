import { useQuery } from "@tanstack/react-query";
import { getRentDetails } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useRentDetails(month?: number, year?: number) {
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;

  return useQuery<any, Error, any>({
    queryKey: ["rentDetails", userId, month, year],
    queryFn: () => getRentDetails(month, year),
    enabled: !!userId,
    staleTime: 0,
  });
}
