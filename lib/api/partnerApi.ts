import apiClient from "./api-client";

export type PartnerDashboardData = {
  monthlyRecurringCommissionGBP: string;
  monthlyRecurringCommissionCents: number;
  activeCommissionCustomers: number;
  forfeitedCustomersCount: number;
  daysRemaining: number;
  protectionStatus: "protected" | "pending_protection" | "at_risk" | "forfeited";
  isPendingProtection: boolean;
  availableToWithdrawGBP: string;
  availableToWithdrawCents: number;
  pendingHoldGBP: string;
  pendingHoldCents: number;
  totalEarnedGBP: string;
  referralCode: string;
  referralLink: string;
};

export type PartnerReferralItem = {
  id: string;
  status: "active" | "pending_qualification" | "cancelled" | "forfeited" | "disqualified";
  customerName: string;
  customerEmail: string;
  lockedMonthlyCommissionGBP: string;
  lockedSubscriptionPriceGBP: string;
  introducedAt: string;
  qualifiedAt: string | null;
  qualificationDeadline: string | null;
};

export type PartnerPaymentItem = {
  id: string;
  date: string;
  amountGBP: string;
  status: "Paid" | "Pending" | "Failed";
  currency: string;
  description: string;
};

export type PartnerHistoryItem = {
  id: string;
  date: string;
  type: string;
  amountGBP: string;
  isNegative: boolean;
  status: string;
  availableAt: string;
  invoiceId: string;
};

export type PartnerEarningsData = {
  totalEarnedGBP: string;
  monthlyRecurringCommissionGBP: string;
  pendingHoldGBP: string;
  availableToWithdrawGBP: string;
  payments: PartnerPaymentItem[];
  history: PartnerHistoryItem[];
};

export type PartnerActivityItem = {
  _id: string;
  type: string;
  title: string;
  subtitle: string;
  amountCents: number;
  badgeType: "positive" | "negative" | "warning" | "neutral";
  eventDate: string;
  createdAt: string;
};

export type PartnerProtectionData = {
  daysRemaining: number;
  totalCycleDays: number;
  percentageRemaining: number;
  protectionStatus: "protected" | "pending_protection" | "at_risk" | "forfeited";
  isPendingProtection: boolean;
  protectionDeadline: string;
  pendingProtectionUntil: string | null;
  activeCommissionCustomers: number;
  bannerTitle: string;
  bannerDescription: string;
  consequenceNote: string;
};

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
};

export type KeyInfoRule = {
  id: string;
  title: string;
  summary: string;
  icon: string;
};

export type PayoutStatusData = {
  isConnected: boolean;
  detailsSubmitted: boolean;
  stripeAccountId: string | null;
  availableToWithdrawGBP: string;
  availableBalanceCents: number;
  pendingHoldGBP: string;
  pendingHoldCents: number;
};

export async function getPartnerDashboard() {
  const res = await apiClient.get<{ success: boolean; data: PartnerDashboardData }>("/partner/dashboard");
  return res.data;
}

export async function getPartnerReferrals(tab: "active" | "pending" | "all" = "all") {
  const res = await apiClient.get<{
    success: boolean;
    data: { tab: string; total: number; referrals: PartnerReferralItem[] };
  }>(`/partner/referrals?tab=${tab}`);
  return res.data;
}

export async function getPartnerEarnings() {
  const res = await apiClient.get<{ success: boolean; data: PartnerEarningsData }>("/partner/earnings");
  return res.data;
}

export async function getPartnerActivity(page: number = 1, limit: number = 20) {
  const res = await apiClient.get<{
    success: boolean;
    data: { page: number; limit: number; total: number; activities: PartnerActivityItem[] };
  }>(`/partner/activity?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getPartnerProtection() {
  const res = await apiClient.get<{ success: boolean; data: PartnerProtectionData }>("/partner/protection");
  return res.data;
}

export async function getPartnerHowItWorks() {
  const res = await apiClient.get<{
    success: boolean;
    data: { steps: HowItWorksStep[]; pricingNote: string };
  }>("/partner/how-it-works");
  return res.data;
}

export async function getPartnerKeyInformation() {
  const res = await apiClient.get<{
    success: boolean;
    data: { rules: KeyInfoRule[] };
  }>("/partner/key-information");
  return res.data;
}

export async function getPartnerPayoutStatus() {
  const res = await apiClient.get<{ success: boolean; data: PayoutStatusData }>("/partner/payouts/status");
  return res.data;
}

export async function createPartnerOnboardingLink() {
  const res = await apiClient.post<{ success: boolean; data: { url: string; accountId: string } }>(
    "/partner/payouts/onboard"
  );
  return res.data;
}

export async function createPartnerDashboardLink() {
  const res = await apiClient.get<{ success: boolean; data: { url: string } }>("/partner/payouts/login-link");
  return res.data;
}

export async function withdrawPartnerFunds(amount?: number) {
  const res = await apiClient.post<{
    success: boolean;
    message: string;
    data: { withdrawnAmountGBP: string; remainingAvailableGBP: string; transferId: string };
  }>("/partner/payouts/withdraw", { amount });
  return res.data;
}
