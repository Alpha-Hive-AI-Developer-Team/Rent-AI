import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWallet, createOnboardLink, withdraw as apiWithdraw, createLoginLink } from '@/lib/api/payout';

export function usePayout() {
  const qc = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ['payoutWallet'],
    queryFn: () => getWallet(),
    staleTime: 0,
  });

  const onboardMutation = useMutation({
    mutationFn: () => createOnboardLink(),
    onSuccess: (data: any) => {
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
    },
  });

  const manageMutation = useMutation({
    mutationFn: () => createLoginLink(),
    onSuccess: (data: any) => {
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => apiWithdraw(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payoutWallet'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const connectBank = useCallback(() => onboardMutation.mutate(), [onboardMutation]);
  // async variant so callers can await and control local loading state
  const connectBankAsync = useCallback(() => onboardMutation.mutateAsync(), [onboardMutation]);
  const manageBankAsync = useCallback(() => manageMutation.mutateAsync(), [manageMutation]);
  const withdraw = useCallback((amount: number) => withdrawMutation.mutateAsync(amount), [withdrawMutation]);

  return {
    walletQuery,
    connectBank,
    connectBankAsync,
    withdraw,
    onboardMutation,
    withdrawMutation,
    manageBankAsync,
  };
}

export default usePayout;
