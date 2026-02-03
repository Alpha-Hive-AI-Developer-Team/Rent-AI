"use client";

import LineChartCard from "@/components/admin/chart-card";
import TransactionVolumeChart from "@/components/admin/volume-chart";
import AlertsCard from "@/components/admin/alert-card";
import StatCard from "@/components/admin/analytics-card";
import Image from "next/image";
import { Bell } from "lucide-react";
import { withAuth } from "@/hooks/withAuth";
import useAdminLandlords, { useAdminSummary, useAdminPaidUnpaidSeries, useAdminArrearsTrend } from "@/hooks/useAdmin";

 function DashboardPage() {
  const { data: summaryResp, isLoading: summaryLoading } = useAdminSummary();
  console.log("Summary Response:", summaryResp);
    const { data: paidUnpaidResp } = useAdminPaidUnpaidSeries(6);
    const { data: arrearsTrendResp } = useAdminArrearsTrend(6);
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

  const paidUnpaidData = Array.isArray(paidUnpaidResp?.data?.series)
    ? paidUnpaidResp.data.series.map((d: any) => ({ name: d.name, paying: d.paying, nonPaying: d.nonPaying }))
    : [];

  const arrearsSeries = Array.isArray(arrearsTrendResp?.data?.series)
    ? arrearsTrendResp.data.series.map((d: any) => ({ name: d.name, arrears: d.arrears }))
    : [];
  const arrearsFooter = typeof arrearsTrendResp?.data?.changePct === "number"
    ? `Trending ${arrearsTrendResp.data.changePct >= 0 ? "up" : "down"} by ${Math.abs(arrearsTrendResp.data.changePct)}% this month`
    : undefined;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 mb-8">
        <h1 className="text-xl font-semibold mr-auto">Dashboard</h1>

        {/* <div className="relative">
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
        /> */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg :grid-cols-2 gap-4 md:gap-6 mb-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <TransactionVolumeChart data={paidUnpaidData} />

        <LineChartCard
          title="Arrears Trends"
          subtitle={summary ? `Up to ${summary.monthName}` : "Arrears by Month"}
          data={arrearsSeries}
          lines={[
            { key: "arrears", color: "#FF6B00", name: "Unpaid" },
          ]}
          footer={arrearsFooter}
        />
      </div>
    
      {/* Recent Alerts Section */}
      {/* <AlertsCard /> */}
    </div>
  );
}
export default DashboardPage;

// export default withAuth(DashboardPage,["admin"]);