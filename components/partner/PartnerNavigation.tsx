"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Share2,
  Users,
  Wallet,
  ShieldCheck,
  Activity,
  HelpCircle,
  Info,
  User,
  MoreHorizontal,
  X,
} from "lucide-react";

export type PartnerTab =
  | "home"
  | "refer"
  | "referrals"
  | "earnings"
  | "protection"
  | "activity"
  | "how-it-works"
  | "key-info"
  | "account";

type PartnerNavigationProps = {
  currentTab: PartnerTab;
  onTabChange: (tab: PartnerTab) => void;
};

export default function PartnerNavigation({ currentTab, onTabChange }: PartnerNavigationProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const desktopTabs: { id: PartnerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "Overview", icon: LayoutDashboard },
    { id: "refer", label: "Refer a Customer", icon: Share2 },
    { id: "referrals", label: "My Referrals", icon: Users },
    { id: "earnings", label: "Earnings & Payouts", icon: Wallet },
    { id: "protection", label: "60-Day Protection", icon: ShieldCheck },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "how-it-works", label: "How It Works", icon: HelpCircle },
    { id: "key-info", label: "Key Info", icon: Info },
    { id: "account", label: "Account", icon: User },
  ];

  const handleMobileNavClick = (tab: PartnerTab) => {
    onTabChange(tab);
    setMoreMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Horizontal Tab Strip (Rent AI Standard) */}
      <div className="hidden lg:flex items-center gap-2 border-b border-gray-800 pb-3 mb-6 w-full overflow-x-auto hide-scrollbar">
        {desktopTabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-[#1E1E1E] text-white border border-gray-700 shadow-sm"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-[#141414] border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-gray-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Bottom Navigation Bar (Screens < lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B0B]/95 backdrop-blur-md border-t border-[#1E1E1E] px-4 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => handleMobileNavClick("home")}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
            currentTab === "home" ? "text-emerald-400" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => handleMobileNavClick("referrals")}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
            currentTab === "referrals" ? "text-emerald-400" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Referrals</span>
        </button>

        <button
          onClick={() => handleMobileNavClick("earnings")}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
            currentTab === "earnings" ? "text-emerald-400" : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium">Earnings</span>
        </button>

        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
            ["refer", "protection", "activity", "how-it-works", "key-info", "account"].includes(currentTab)
              ? "text-emerald-400"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {moreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c0c0c] border-t border-gray-800 rounded-t-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-gray-400">Partner Navigation</span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="p-1 rounded-full hover:bg-[#1A1A1A] text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMobileNavClick("refer")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Refer</p>
                  <p className="text-[10px] text-gray-400">Share link & code</p>
                </div>
              </button>

              <button
                onClick={() => handleMobileNavClick("protection")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Protection</p>
                  <p className="text-[10px] text-gray-400">60-day status</p>
                </div>
              </button>

              <button
                onClick={() => handleMobileNavClick("activity")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <Activity className="w-4 h-4 text-gray-300 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Activity</p>
                  <p className="text-[10px] text-gray-400">Live feed</p>
                </div>
              </button>

              <button
                onClick={() => handleMobileNavClick("how-it-works")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <HelpCircle className="w-4 h-4 text-gray-300 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">How It Works</p>
                  <p className="text-[10px] text-gray-400">Programme steps</p>
                </div>
              </button>

              <button
                onClick={() => handleMobileNavClick("key-info")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <Info className="w-4 h-4 text-gray-300 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Key Info</p>
                  <p className="text-[10px] text-gray-400">Rules & terms</p>
                </div>
              </button>

              <button
                onClick={() => handleMobileNavClick("account")}
                className="p-3 rounded-lg bg-[#111] hover:bg-[#161616] border border-gray-800 flex items-center gap-2.5 text-left transition"
              >
                <User className="w-4 h-4 text-gray-300 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">Account</p>
                  <p className="text-[10px] text-gray-400">Payout details</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
