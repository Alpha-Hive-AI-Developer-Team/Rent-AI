"use client";

import LineChartCard from "@/components/admin/chart-card";
import StatCard from "@/components/admin/analytics-card";
import TodaySection from "@/components/user/today-section";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useRentDetails } from "@/hooks/useRentDetails";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import TransactionVolumeChart from "@/components/admin/volume-chart";

export default function DashboardPage() {
  const { data: rentDataRes, isLoading: rentLoading, isError: rentError } = useRentDetails();
  const rentData = rentDataRes?.data;
  const stats = [
  {
      title: `Expected (${rentData?.monthName ?? ''})`,
      value: rentLoading ? "—" : `£${rentData?.current?.expected?.toLocaleString?.() ?? rentData?.current?.expected ?? 0}`,
      trend: rentData?.percentageChange?.expected ?? 0,
    },
    {
      title: "Collected",
      value: rentLoading ? "—" : `£${rentData?.current?.collected?.toLocaleString?.() ?? rentData?.current?.collected ?? 0}`,
      trend: rentData?.percentageChange?.collected ?? 0,
    },
    {
      title: "Arrears",
      value: rentLoading ? "—" : `£${rentData?.current?.arrears?.toLocaleString?.() ?? rentData?.current?.arrears ?? 0}`,
      trend: rentData?.percentageChange?.arrears ?? 0,
    },
    {
      title: "Late Tenants",
      value: rentLoading ? "—" : `${rentData?.current?.lateCount ?? 0}`,
      trend: rentData?.percentageChange?.lateCount ?? 0,
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
    const expectedData = [
    { name: "Jan", expected: 3000 },
    { name: "Feb", expected: 3200 },
    { name: "Mar", expected: 3400 },
    { name: "Apr", expected: 3600 },
    { name: "May", expected: 3500 },
    { name: "Jun", expected: 3700 },
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
   <div className="bg-[#111] text-white rounded-xl  shadow-md w-full">
             {/* <div className="mb-4">
               <h3 className="text-sm font-medium text-gray-200">Expected Rent</h3>
               <p className="text-xs text-gray-500 mt-1">Expected rent per month</p>
             </div> */}
   
             <div className="h-56">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={expectedData} margin={{ left: 0, right: 10 }}>
                   <CartesianGrid stroke="#2a2a2a" vertical={false} />
                   <XAxis
                     dataKey="name"
                     axisLine={false}
                     tickLine={false}
                     tick={{ fill: "#9CA3AF", fontSize: 12 }}
                     tickMargin={8}
                   />
                   <YAxis
                     axisLine={false}
                     tickLine={false}
                     tick={{ fill: "#666", fontSize: 11 }}
                   />
                   <Tooltip
                     contentStyle={{
                       backgroundColor: "#1a1a1a",
                       border: "1px solid #333",
                       borderRadius: "8px",
                     }}
                     labelStyle={{ color: "#fff" }}
                   />
   
                   <Line
                     type="monotone"
                     dataKey="expected"
                     stroke="#ffffff"
                     strokeWidth={2}
                     dot={{ r: 3, stroke: '#ffffff', strokeWidth: 1, fill: '#111' }}
                     activeDot={{ r: 5 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>
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
