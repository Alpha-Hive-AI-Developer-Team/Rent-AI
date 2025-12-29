import { useQuery } from "@tanstack/react-query";
import { getUnreconciledTransactions, getYapilyInstitutions } from "@/lib/api/transactionApi";
import { getConnectedAccounts } from "@/lib/api/transactionApi";
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
		staleTime: 0,
	});
}

export function useConnectedAccounts(enabled = false) {
	const authUser = useAuthUser();
	const userId = authUser?.id || authUser?._id || authUser?.userId;

	return useQuery<any, Error, any>({
		queryKey: ["connectedAccounts", userId],
		queryFn: () => getConnectedAccounts(),
		enabled: !!userId && enabled,
		staleTime: 0,
	});
}

