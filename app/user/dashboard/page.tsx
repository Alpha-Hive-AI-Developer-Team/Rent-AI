"use client";

import LineChartCard from "@/components/admin/chart-card";
import StatCard from "@/components/admin/analytics-card";
import TodaySection from "@/components/user/today-section";
import Image from "next/image";
import { Bell } from "lucide-react";
import TransactionVolumeChart from "@/components/admin/volume-chart";

export default function DashboardPage() {
  const stats = [
    {
      title: "Expected (Oct)",
      value: "£24,500",
      trend: 12.5,
      description: "Trending up this month",
      subtext: "Visitors for the last 6 months",
    },
    {
      title: "Collected",
      value: "£22,300",
      trend: -20,
      description: "Down 20% this period",
      subtext: "Acquisition needs attention",
    },
    {
      title: "Arrears",
      value: "£2,200",
      trend: 12.5,
      description: "Strong user retention",
      subtext: "Engagement exceed targets",
    },
    {
      title: "Late Tenants",
      value: "17",
      trend: 4.5,
      description: "Steady performance increase",
      subtext: "Meets growth projections",
    },
  ];

  const transactionData = [
    { name: "Mar 3", value: 2400 },
    { name: "Mar 10", value: 1398 },
    { name: "Mar 17", value: 9800 },
    { name: "Mar 24", value: 3908 },
    { name: "Mar 31", value: 4800 },
  ];

  const arrearsData = [
    { name: "Jan", series1: 4000, series2: 2400 },
    { name: "Feb", series1: 3000, series2: 1398 },
    { name: "Mar", series1: 2000, series2: 9800 },
    { name: "Apr", series1: 2780, series2: 3908 },
    { name: "May", series1: 1890, series2: 4800 },
    { name: "Jun", series1: 2390, series2: 3800 },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Dashboard</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </div>

        <Image
          src="/images/pexels.png"
          alt="User Avatar"
          width={36}
          height={36}
          className="rounded-full border border-gray-700"
        />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

     {/* Charts Section — full width */}
<div className="space-y-6">
  {/* Chart with filter buttons */}
  <div className="bg-[#111] text-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-800/50 shadow-md w-full">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      {/* Left side — text */}
      <div>
        <h3 className="text-sm md:text-base font-medium text-gray-200">Expected (Oct)</h3>
        <p className="text-xs md:text-sm text-gray-500 mt-1">Total for the last 3 months</p>
      </div>

      {/* Right side — Filter Buttons */}
      <div className="flex flex-wrap justify-start sm:justify-end gap-2">
        {["Last 3 months", "Last 30 days", "Last 7 days"].map((label, i) => (
          <button
            key={i}
            className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-all duration-200
              ${
                i === 0
                  ? "bg-[#1e1e1e] text-white border border-gray-700"
                  : "bg-transparent text-gray-400 hover:bg-[#1a1a1a] border border-transparent"
              }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>

    {/* Chart itself */}
    <div className="w-full overflow-x-auto">
      <TransactionVolumeChart title="" subtitle="" />
    </div>
  </div>



  {/* Second chart */}
  <div className="w-full">
    <LineChartCard
      title="Collected"
      subtitle="January - June 2024"
      data={arrearsData}
      lines={[
        { key: "series1", color: "#00C6FF", name: "Current" },
        { key: "series2", color: "#FF6B00", name: "Previous" },
      ]}
      footer="Trending up by 5.2% this month"
    />
  </div>
</div>

      {/* Recent Alerts Section */}
      <TodaySection />
    </div>
  );
}
