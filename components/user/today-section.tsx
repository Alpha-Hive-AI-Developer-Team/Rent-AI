"use client";

import { useTodaySummary } from "@/hooks/useRentDetails";
import { Info, Clock, UserPlus, CheckCircle, RotateCw } from "lucide-react";

interface TodayCard {
  id: number;
  title: string;
  subtitle: string;
  icon: "info" | "clock" | "referral" | "check";
}

const iconMap = {
  info: Info,
  clock: Clock,
  referral: UserPlus,
  check: CheckCircle,
};

const iconStyles = {
  info: "text-sky-400 bg-sky-950/40 border-sky-800/40",
  clock: "text-amber-400 bg-amber-950/40 border-amber-800/40",
  referral: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
  check: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
};

export default function TodaySection() {
  const { data, isLoading } = useTodaySummary();

  const summary = data?.data || {};
  const referralsCount = summary.referralsActivatedToday ?? 0;
  // Each referral gives 10% discount; cap at 100%
  const discountPercent = Math.min((referralsCount || 0) * 10, 100);
  const referralSubtitle = discountPercent > 0 ? `+${discountPercent}% discount applied` : "No discount applied";

  const cards: TodayCard[] = [
    {
      id: 1,
      title: `${isLoading ? "—" : (summary.unreconciledTransactions ?? 0)} transactions need review`,
      subtitle: "Transactions requiring manual review",
      icon: "info",
    },
    {
      id: 2,
      title: `${isLoading ? "—" : (summary.lateTenants ?? 0)} tenants late`,
      subtitle: "Open arrears across aging buckets",
      icon: "clock",
    },
    {
      id: 3,
      title: `${isLoading ? "—" : (summary.referralsActivatedToday ?? 0)} new referrals activated`,
      subtitle: referralSubtitle,
      icon: "referral",
    },
    {
      id: 4,
      title: "Xero export succeeded",
      subtitle: "08:12 today · sync complete",
      icon: "check",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-800/60">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white">Daily Pulse</h2>
          <p className="text-xs text-gray-400 mt-0.5">Automated rent reconciliation & operations alerts</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        {cards.map((item) => {
          const Icon = iconMap[item.icon];
          const badgeClass = iconStyles[item.icon];
          return (
            <div
              key={item.id}
              className="flex items-start gap-3.5 bg-[#111] border border-gray-800/80 rounded-2xl p-4 sm:p-5 hover:border-gray-700/80 hover:bg-[#141414] transition-all shadow-md group"
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${badgeClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
