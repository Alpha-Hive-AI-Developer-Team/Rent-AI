"use client";

import StatCard from "@/components/admin/analytics-card";
import TodaySection from "@/components/user/today-section";
import { LayoutDashboard } from "lucide-react";
import useExpectedSeries, { useRentDetails, useCollectedSeries } from "@/hooks/useRentDetails";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const rangeOptions = [
  { id: "3m", label: "3 Months" },
  { id: "6m", label: "6 Months" },
  { id: "30d", label: "30 Days" },
  { id: "7d", label: "7 Days" },
] as const;

export default function DashboardPage() {
  const { data: rentDataRes, isLoading: rentLoading } = useRentDetails();
  const rentData = rentDataRes?.data;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialExpectedRange = (searchParams?.get("range") || "3m") as "3m" | "6m" | "30d" | "7d";
  const initialCollectedRange = (searchParams?.get("collectedRange") || "3m") as "3m" | "6m" | "30d" | "7d";
  const [range, setRange] = useState<"3m" | "6m" | "30d" | "7d">(initialExpectedRange);
  const [collectedRange, setCollectedRange] = useState<"3m" | "6m" | "30d" | "7d">(initialCollectedRange);

  useEffect(() => {
    try {
      const base = searchParams ? searchParams.toString() : "";
      const params = new URLSearchParams(base);
      params.set("range", range);
      params.set("collectedRange", collectedRange);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch {}
  }, [range]);

  useEffect(() => {
    try {
      const base = searchParams ? searchParams.toString() : "";
      const params = new URLSearchParams(base);
      params.set("range", range);
      params.set("collectedRange", collectedRange);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch {}
  }, [collectedRange]);

  const seriesOptions =
    range === "3m"
      ? { granularity: "month", months: 3 }
      : range === "6m"
        ? { granularity: "month", months: 6 }
        : range === "30d"
          ? { granularity: "day", days: 30 }
          : { granularity: "day", days: 7 };
  const { data: expectedRes } = useExpectedSeries(seriesOptions as any);
  const expectedSeries = expectedRes?.data?.series ?? [];

  const collectedOptions =
    collectedRange === "3m"
      ? { granularity: "month", months: 3 }
      : collectedRange === "6m"
        ? { granularity: "month", months: 6 }
        : collectedRange === "30d"
          ? { granularity: "day", days: 30 }
          : { granularity: "day", days: 7 };

  const { data: collectedRes, isLoading: collectedLoading } = useCollectedSeries(collectedOptions as any);
  let collectedSeries = collectedRes?.data?.series ?? [];

  if ((!collectedSeries || collectedSeries.length === 0) && expectedSeries && expectedSeries.length > 0) {
    collectedSeries = expectedSeries.map((p: any) => ({ name: p.name, collected: Number(p.collected || 0) }));
  }
  const collectedData = collectedLoading ? [] : collectedSeries.map((p: any) => ({ name: p.name, collected: Number(p.collected || 0) }));

  const stats = [
    {
      title: `Expected (${rentData?.monthName ?? ''})`,
      value: rentLoading ? "—" : `£${rentData?.current?.expected?.toLocaleString?.() ?? rentData?.current?.expected ?? 0}`,
      trend: rentData?.percentageChange?.expected ?? 0,
      description: "Projected monthly rent roll",
      subtext: "Current month",
    },
    {
      title: "Collected",
      value: rentLoading ? "—" : `£${rentData?.current?.collected?.toLocaleString?.() ?? rentData?.current?.collected ?? 0}`,
      trend: rentData?.percentageChange?.collected ?? 0,
      description: "Successfully reconciled rent",
      subtext: "Current month",
    },
    {
      title: "Arrears",
      value: rentLoading ? "—" : `£${rentData?.current?.arrears?.toLocaleString?.() ?? rentData?.current?.arrears ?? 0}`,
      trend: rentData?.percentageChange?.arrears ?? 0,
      description: "Outstanding late balances",
      subtext: "Current month",
    },
    {
      title: "Late Tenants",
      value: rentLoading ? "—" : `${rentData?.current?.lateCount ?? 0}`,
      trend: rentData?.percentageChange?.lateCount ?? 0,
      description: "Tenants overdue on schedule",
      subtext: "Current month",
    },
  ];

  const totalCollectedInRange = collectedData.reduce((acc: number, curr: any) => acc + (Number(curr.collected) || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Landlord Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Real-time rental income, collection velocity, and portfolio alerts
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="w-full bg-[#111] border border-gray-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-gray-800/60">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Collected Rent</h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Collected total for the last {collectedRange === "3m" ? "3 months" : collectedRange === "6m" ? "6 months" : collectedRange === "30d" ? "30 days" : "7 days"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0a0a] p-1 rounded-xl border border-gray-800/80">
            {rangeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setCollectedRange(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  collectedRange === opt.id
                    ? "bg-[#027A48] text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {collectedData.length === 0 ? (
          <div className="text-sm text-gray-400 px-4 py-12 text-center">
            No collected payments found for the selected range.
          </div>
        ) : (
          <div className="w-full h-[280px] sm:h-[320px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={collectedData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectedGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#027A48" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={56}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `£${Number(v || 0).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d0d0d",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}
                  itemStyle={{ color: "#34d399", fontWeight: 600, fontSize: "13px" }}
                  formatter={(value: any) => [
                    `£${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    "Collected",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="url(#collectedGradient)"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "#000" }}
                  activeDot={{ r: 6, fill: "#34d399", stroke: "#000", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="pt-2 border-t border-gray-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs text-gray-500">
          <span>Collected total in range: <strong className="text-gray-200">£{totalCollectedInRange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          <span className="text-emerald-400 font-medium">Automatic bank reconciliation synced</span>
        </div>
      </div>

      {/* Recent Alerts Section */}
      <TodaySection />
    </div>
  );
}
