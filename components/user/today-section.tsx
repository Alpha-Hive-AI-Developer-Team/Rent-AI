"use client";

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

export default function TodaySection() {
  const cards: TodayCard[] = [
    {
      id: 1,
      title: "3 transactions need review",
      subtitle: "AI confidence under 0.75",
      icon: "info",
    },
    {
      id: 2,
      title: "17 tenants late",
      subtitle: "Open Arrears across D buckets",
      icon: "clock",
    },
    {
      id: 3,
      title: "2 new referrals activated",
      subtitle: "+20% discount applied",
      icon: "referral",
    },
    {
      id: 4,
      title: "Xero export succeeded",
      subtitle: "08:12 today",
      icon: "check",
    },
  ];

  return (
    <div className="bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Today</h2>
        <button className="flex items-center gap-2 text-sm text-gray-300 border border-gray-800 rounded-full px-3 py-1 hover:bg-gray-800 transition">
          <RotateCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {cards.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 bg-[#111] border border-gray-800 rounded-xl p-4 hover:bg-[#1a1a1a] transition"
            >
              <Icon className="w-5 h-5 text-gray-300 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-200">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
