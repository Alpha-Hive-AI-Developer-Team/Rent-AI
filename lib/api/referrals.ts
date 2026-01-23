import apiClient from "./api-client";

export type ReferralUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  planType?: string;
  subscriptionStatus?: string | null;
  createdAt?: string;
   myReferralCode?: string;
};

export type ReferralsSummary = {
  totalReferrals: number;
  payingReferrals: number;
  totalCommissionCents: number;
  referrals: ReferralUser[];
 myReferralCode?: string;
};

export async function getReferralsSummary() {
  const res = await apiClient.get("/auth/referrals/summary");
  return res.data as { success: boolean; data: ReferralsSummary };
}
