"use client";

import SubscriptionRevenueCard from "@/components/admin/subscription-revenue-card";
import NetRevenueCard from "@/components/admin/net-revenue-card";
import StatCard from "@/components/admin/analytics-card";
import { useAdminSummary, useAdminSubscriptionRevenue } from "@/hooks/useAdmin";

function DashboardPage() {
  const { data: summaryResp } = useAdminSummary();
  const { data: subRevenueResp } = useAdminSubscriptionRevenue(6);

  const summary = summaryResp?.data;
  const sub = subRevenueResp?.data;
  const monthName = sub?.monthName || summary?.monthName || "";
  const windowMonths = sub?.windowMonths || 6;

  const stats = [
    {
      title: "Total Landlords",
      value: summary ? (summary.landlords?.total ?? 0).toLocaleString() : "—",
      trend: summary ? (summary.landlords?.changePct ?? 0) : 0,
      period: monthName ? `All time · new in ${monthName}` : "All time",
    },
    {
      title: "Expected Sub Revenue",
      value: sub
        ? `£${Number(sub.revenue?.expectedThisMonth || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "—",
      trend: sub ? (sub.revenue?.expectedChangePct ?? 0) : 0,
      period: monthName
        ? `Current month · ${monthName} (projected MRR)`
        : "Current month (projected MRR)",
    },
    {
      title: "Revenue excl. Commission",
      value: sub
        ? `£${Number(sub.revenue?.totalExcludingCommission || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : "—",
      trend: (() => {
        const series = sub?.series;
        if (!Array.isArray(series) || series.length < 2) return 0;
        const cur = Number(series[series.length - 1]?.netRevenue || 0);
        const prev = Number(series[series.length - 2]?.netRevenue || 0);
        if (!prev) return cur ? 100 : 0;
        return Number((((cur - prev) / Math.abs(prev)) * 100).toFixed(2));
      })(),
      period: `Last ${windowMonths} months (net)`,
    },
  ];

  return (
    <div className="p-6 bg-black min-h-screen text-white space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-[#535862] text-sm">
            Overview of platform revenue, subscription performance, and landlord growth
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 items-stretch">
        <SubscriptionRevenueCard
          tiers={sub?.tiers}
          members={sub?.members}
          revenue={sub?.revenue}
          series={sub?.series}
          monthName={monthName}
          windowMonths={windowMonths}
        />

        <NetRevenueCard
          series={sub?.series}
          revenue={sub?.revenue}
          monthName={monthName}
          windowMonths={windowMonths}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
