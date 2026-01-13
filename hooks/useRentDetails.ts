import { useQuery } from "@tanstack/react-query";
import { getExpectedSeries, getRentDetails } from "@/lib/api/tenantsApi";
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

export type SeriesOptions = { granularity?: 'month' | 'day'; months?: number; days?: number };

export default function useExpectedSeries(options: SeriesOptions = { granularity: 'month', months: 3 }) {
  const authUser = useAuthUser();
  const userId = (authUser as any)?.id || (authUser as any)?._id || (authUser as any)?.userId;

  return useQuery<any, Error, any>({
    queryKey: ["expectedSeries", userId, options],
    queryFn: () => getExpectedSeries(options),
    enabled: !!userId,
    staleTime: 0,
  });
}
