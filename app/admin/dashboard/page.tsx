"use client";

import LineChartCard from "@/components/admin/chart-card";
import TransactionVolumeChart from "@/components/admin/volume-chart";
import AlertsCard from "@/components/admin/alert-card";
import StatCard from "@/components/admin/analytics-card";
import Image from "next/image";
import { Bell } from "lucide-react";
import { withAuth } from "@/hooks/withAuth";
import useAdminLandlords, { useAdminSummary } from "@/hooks/useAdmin";

 function DashboardPage() {
  const { data: summaryResp, isLoading: summaryLoading } = useAdminSummary();
  const summary = summaryResp?.data;
  const stats = [
    {
      title: "Total Landlords",
      value: summary ? (summary.landlords?.total ?? 0).toLocaleString() : "—",
      trend: summary ? (summary.landlords?.changePct ?? 0) : 0,
      description: "Trending this month",
      subtext: summary ? summary.monthName : "",
    },
    {
      title: "Rent Processed",
      value: summary ? `£${Number(summary.rentProcessed?.total || 0).toLocaleString()}` : "—",
      trend: summary ? (summary.rentProcessed?.changePct ?? 0) : 0,
      description: "Processed rent this month",
      subtext: summary ? summary.monthName : "",
    }
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
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 mb-8">
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg :grid-cols-2 gap-4 md:gap-6 mb-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <TransactionVolumeChart />

        <LineChartCard
          title="Arrears Trends"
          subtitle="January - June 2024"
          data={arrearsData}
          lines={[
            { key: "series1", color: "#00C6FF", name: "Current" },
            { key: "series2", color: "#FF6B00", name: "Previous" },
          ]}
          footer="Trending up by 5.2% this month"
        />
      </div>
    
      {/* Recent Alerts Section */}
      <AlertsCard />
    </div>
  );
}
export default DashboardPage;

// export default withAuth(DashboardPage,["admin"]);