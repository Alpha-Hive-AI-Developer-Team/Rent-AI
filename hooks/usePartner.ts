"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPartnerDashboard,
  getPartnerReferrals,
  getPartnerEarnings,
  getPartnerActivity,
  getPartnerProtection,
  getPartnerHowItWorks,
  getPartnerKeyInformation,
  getPartnerPayoutStatus,
  createPartnerOnboardingLink,
  createPartnerDashboardLink,
  withdrawPartnerFunds,
} from "@/lib/api/partnerApi";

export function usePartnerDashboard() {
  return useQuery({
    queryKey: ["partner-dashboard"],
    queryFn: getPartnerDashboard,
    staleTime: 30000,
  });
}

export function usePartnerReferrals(tab: "active" | "pending" | "all" = "all") {
  return useQuery({
    queryKey: ["partner-referrals", tab],
    queryFn: () => getPartnerReferrals(tab),
    staleTime: 30000,
  });
}

export function usePartnerEarnings() {
  return useQuery({
    queryKey: ["partner-earnings"],
    queryFn: getPartnerEarnings,
    staleTime: 30000,
  });
}

export function usePartnerActivity(page: number = 1) {
  return useQuery({
    queryKey: ["partner-activity", page],
    queryFn: () => getPartnerActivity(page),
    staleTime: 30000,
  });
}

export function usePartnerProtection() {
  return useQuery({
    queryKey: ["partner-protection"],
    queryFn: getPartnerProtection,
    staleTime: 30000,
  });
}

export function usePartnerHowItWorks() {
  return useQuery({
    queryKey: ["partner-how-it-works"],
    queryFn: getPartnerHowItWorks,
    staleTime: 300000,
  });
}

export function usePartnerKeyInformation() {
  return useQuery({
    queryKey: ["partner-key-info"],
    queryFn: getPartnerKeyInformation,
    staleTime: 300000,
  });
}

export function usePartnerPayoutStatus() {
  return useQuery({
    queryKey: ["partner-payout-status"],
    queryFn: getPartnerPayoutStatus,
    staleTime: 30000,
  });
}

export function useWithdrawPartnerFunds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount?: number) => withdrawPartnerFunds(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["partner-earnings"] });
      queryClient.invalidateQueries({ queryKey: ["partner-activity"] });
      queryClient.invalidateQueries({ queryKey: ["partner-payout-status"] });
    },
  });
}

export function usePartnerOnboard() {
  return useMutation({
    mutationFn: createPartnerOnboardingLink,
  });
}

export function usePartnerDashboardLink() {
  return useMutation({
    mutationFn: createPartnerDashboardLink,
  });
}
