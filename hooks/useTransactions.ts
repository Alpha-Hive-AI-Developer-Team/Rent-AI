import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreconciledTransactions, getConnectedBank, getConnectedAccounts } from "@/lib/api/transactionApi";
import { markRentPaidWithTransaction } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useUnreconciledTransactions() {
	const authUser = useAuthUser();

	return useQuery<any, Error, any>({
		queryKey: ["unreconciledTransactions"],
		queryFn: () => getUnreconciledTransactions(),
		staleTime: 0,
	});
}

export default useUnreconciledTransactions;

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

export function useConnectedInstitution(enabled = false) {
	const authUser = useAuthUser();
	const userId = authUser?.id || authUser?._id || authUser?.userId;

	return useQuery<any, Error, any>({
		queryKey: ["connectedBank", userId],
		queryFn: () => getConnectedBank(),
		enabled: !!userId && enabled,
		staleTime: 0,
	});
}

export function useReconcileTransaction() {
	const qc = useQueryClient();
	const authUser = useAuthUser();
	const userId = authUser?.id || authUser?._id || authUser?.userId;

	return useMutation({
		mutationFn: ({ tenantId, transactionId }: { tenantId: string; transactionId: string }) =>
			markRentPaidWithTransaction(tenantId, transactionId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
			qc.invalidateQueries({ queryKey: ["tenants", userId] });
			qc.invalidateQueries({ queryKey: ["todaySummary", userId] });
		},
	});
}
