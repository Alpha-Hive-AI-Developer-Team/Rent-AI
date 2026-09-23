import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	getUnreconciledTransactions,
	getConnectedBank,
	getConnectedAccounts,
	autoMatchUnreconciledTransactions,
} from "@/lib/api/transactionApi";
import { markRentPaidWithTransaction } from "@/lib/api/tenantsApi";
import { useAuthUser } from "@/redux/useAuthUser";

export function useUnreconciledTransactions(params: { page?: number; limit?: number; search?: string } = {}) {
	const page = params.page ?? 1;
	const limit = params.limit ?? 20;
	const search = params.search?.trim() || "";

	return useQuery<any, Error, any>({
		queryKey: ["unreconciledTransactions", page, limit, search],
		queryFn: () => getUnreconciledTransactions({ page, limit, search: search || undefined }),
		staleTime: 60_000,
		placeholderData: (prev: any) => prev,
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

/** Auto-apply clear matches for txs already in the unreconciled queue. */
export function useAutoMatchTransactions() {
	const qc = useQueryClient();
	const authUser = useAuthUser();
	const userId = authUser?.id || authUser?._id || authUser?.userId;

	return useMutation({
		mutationFn: () => autoMatchUnreconciledTransactions(),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["unreconciledTransactions"] });
			qc.invalidateQueries({ queryKey: ["tenants", userId] });
			qc.invalidateQueries({ queryKey: ["todaySummary", userId] });
		},
	});
}
