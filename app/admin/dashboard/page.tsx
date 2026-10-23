"use client";

import LineChartCard from "@/components/admin/chart-card";
import SubscriptionRevenueCard from "@/components/admin/subscription-revenue-card";
import StatCard from "@/components/admin/analytics-card";
import { useAdminSummary, useAdminArrearsTrend, useAdminSubscriptionRevenue } from "@/hooks/useAdmin";

function DashboardPage() {
  const { data: summaryResp } = useAdminSummary();
  const { data: arrearsTrendResp } = useAdminArrearsTrend(6);
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
      title: "Rent Processed",
      value: summary
        ? `£${Number(summary.rentProcessed?.total || 0).toLocaleString()}`
        : "—",
      trend: summary ? (summary.rentProcessed?.changePct ?? 0) : 0,
      period: "All time",
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

  const arrearsSeries = Array.isArray(arrearsTrendResp?.data?.series)
    ? arrearsTrendResp.data.series.map((d: any) => ({
        name: d.name,
        arrears: d.arrears,
      }))
    : [];
  const arrearsFooter =
    typeof arrearsTrendResp?.data?.changePct === "number"
      ? `Trending ${arrearsTrendResp.data.changePct >= 0 ? "up" : "down"} by ${Math.abs(
          arrearsTrendResp.data.changePct
        )}% this month`
      : undefined;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="flex items-center justify-end gap-4 mb-8">
        <h1 className="text-xl font-semibold mr-auto">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {stats.map((item, i) => (
          <StatCard key={i} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <SubscriptionRevenueCard
          tiers={sub?.tiers}
          members={sub?.members}
          revenue={sub?.revenue}
          series={sub?.series}
          monthName={monthName}
          windowMonths={windowMonths}
        />

        <LineChartCard
          title="Arrears Trends"
          subtitle={
            monthName
              ? `Last ${windowMonths} months · up to ${monthName}`
              : `Last ${windowMonths} months`
          }
          data={arrearsSeries}
          lines={[{ key: "arrears", color: "#FF6B00", name: "Unpaid" }]}
          footer={arrearsFooter}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
