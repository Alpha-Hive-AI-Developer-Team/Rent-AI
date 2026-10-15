"use client";

import React, { useState } from "react";
import PartnerNavigation, { PartnerTab } from "@/components/partner/PartnerNavigation";
import PartnerDashboard from "@/components/partner/PartnerDashboard";
import ReferCustomerView from "@/components/partner/ReferCustomerView";
import MyReferralsView from "@/components/partner/MyReferralsView";
import EarningsView from "@/components/partner/EarningsView";
import ProtectionStatusView from "@/components/partner/ProtectionStatusView";
import ActivityView from "@/components/partner/ActivityView";
import HowItWorksView from "@/components/partner/HowItWorksView";
import KeyInformationView from "@/components/partner/KeyInformationView";
import AccountView from "@/components/partner/AccountView";
import { usePartnerDashboard } from "@/hooks/usePartner";
import { useMyProfile } from "@/hooks/useAuth";

import { resolveReferralLink } from "@/lib/utils/referralLink";

export default function PartnerPortalPage() {
  const [currentTab, setCurrentTab] = useState<PartnerTab>("home");

  const { data: dashboardResp } = usePartnerDashboard();
  const { data: profileResp } = useMyProfile();

  const referralCode =
    dashboardResp?.data?.referralCode || profileResp?.data?.myReferralCode || "PARTNER10";
  const referralLink = resolveReferralLink(dashboardResp?.data?.referralLink, referralCode);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6 pb-28 lg:pb-8">
      {/* Top Navigation Tabs */}
      <PartnerNavigation currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Screen Views */}
      <main className="w-full">
        {currentTab === "home" && (
          <PartnerDashboard
            onReferClick={() => setCurrentTab("refer")}
            onViewReferrals={() => setCurrentTab("referrals")}
            onViewProtection={() => setCurrentTab("protection")}
            onViewEarnings={() => setCurrentTab("earnings")}
            onViewActivity={() => setCurrentTab("activity")}
          />
        )}

        {currentTab === "refer" && (
          <ReferCustomerView
            referralCode={referralCode}
            referralLink={referralLink}
            onOpenHelp={() => setCurrentTab("how-it-works")}
          />
        )}

        {currentTab === "referrals" && <MyReferralsView />}

        {currentTab === "earnings" && <EarningsView />}

        {currentTab === "protection" && (
          <ProtectionStatusView onReferClick={() => setCurrentTab("refer")} />
        )}

        {currentTab === "activity" && <ActivityView />}

        {currentTab === "how-it-works" && <HowItWorksView />}

        {currentTab === "key-info" && <KeyInformationView />}

        {currentTab === "account" && <AccountView />}
      </main>
    </div>
  );
}
