import { useQuery } from "@tanstack/react-query";
import { getUnreconciledTransactions, getYapilyInstitutions } from "@/lib/api/transactionApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useUnreconciledTransactions() {
	const authUser = useAuthUser();
	const userId = authUser?.id || authUser?._id || authUser?.userId;

	return useQuery<any, Error, any>({
		queryKey: ["unreconciledTransactions", userId],
		queryFn: () => getUnreconciledTransactions(),
		enabled: !!userId,
		staleTime: 0, // 
	});
}

export default useUnreconciledTransactions;

export function useYapilyInstitutions(enabled = false) {
	return useQuery<any, Error, any>({
		queryKey: ["yapilyInstitutions"],
		queryFn: () => getYapilyInstitutions(),
		enabled,
		staleTime: 1000 * 60 * 5,
	});
}

