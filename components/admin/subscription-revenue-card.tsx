"use client";

import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
} from "recharts";

const TIER_ORDER = ["free", "starter", "pro", "enterprise"] as const;

const TIER_COLORS: Record<string, string> = {
  free: "#6b7280",
  starter: "#60a5fa",
  pro: "#4ade80",
  enterprise: "#fbbf24",
};

type TierInfo = {
  count: number;
  monthlyPrice: number;
  expectedRevenue: number;
  label: string;
  display: string;
};

type SeriesPoint = {
  name: string;
  paying: number;
  nonPaying: number;
  revenue?: number;
  netRevenue?: number;
  commissions?: number;
};

type MembersInfo = {
  total: number;
  paying: number;
  nonPaying: number;
  payingSharePct: number;
};

type RevenueInfo = {
  expectedThisMonth: number;
  expectedThisMonthNet: number;
  total: number;
  totalExcludingCommission: number;
  commissionsThisMonth: number;
  commissionsInWindow?: number;
  commissionsTotal: number;
  source?: string;
};

function formatGbp(n: number) {
  return `£${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function SubscriptionRevenueCard({
  tiers,
  members,
  revenue,
  series,
  monthName,
  windowMonths = 6,
}: {
  tiers?: Record<string, TierInfo> | null;
  members?: MembersInfo | null;
  revenue?: RevenueInfo | null;
  series?: SeriesPoint[];
  monthName?: string;
  windowMonths?: number;
}) {
  const chartData =
    Array.isArray(series) && series.length
      ? series
      : [
          { name: "Jan", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
          { name: "Feb", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
          { name: "Mar", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
          { name: "Apr", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
          { name: "May", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
          { name: "Jun", paying: 0, nonPaying: 0, revenue: 0, netRevenue: 0 },
        ];

  const totalMembers = members?.total ?? 0;

  return (
    <div className="bg-[#111] text-white rounded-xl p-4 md:p-6 border border-gray-800/50 shadow-md w-full">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-gray-200">Subscription Revenue</h3>
          <p className="text-xs text-gray-500 mt-1">
            Plan mix is current · chart &amp; totals cover the last {windowMonths} months
            {monthName ? ` (through ${monthName})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-700 rounded px-1.5 py-0.5">
            Last {windowMonths} mo
          </span>
          {monthName ? (
            <span className="text-[10px] uppercase tracking-wide text-emerald-400/90 border border-emerald-500/30 rounded px-1.5 py-0.5">
              Current · {monthName}
            </span>
          ) : null}
          {revenue?.source === "estimated" && (
            <span className="text-[10px] uppercase tracking-wide text-amber-500/80 border border-amber-500/30 rounded px-1.5 py-0.5">
              Estimated totals
            </span>
          )}
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {TIER_ORDER.map((key) => {
          const tier = tiers?.[key];
          const count = tier?.count ?? 0;
          const share =
            totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
          return (
            <div
              key={key}
              className="rounded-lg border border-gray-800 bg-[#0a0a0a] px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: TIER_COLORS[key] }}
                />
                <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {tier?.label || key}
                </span>
              </div>
              <p className="text-lg font-semibold leading-tight">{count}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {tier?.display || "—"} · {share}% · now
              </p>
            </div>
          );
        })}
      </div>

      {/* Paying / revenue strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5 text-xs">
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">Paying · now</p>
          <p className="text-green-400 font-semibold text-sm mt-0.5">
            {members?.paying ?? 0}
            <span className="text-gray-500 font-normal ml-1">
              ({members?.payingSharePct ?? 0}%)
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">Non-paying · now</p>
          <p className="text-gray-200 font-semibold text-sm mt-0.5">
            {members?.nonPaying ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">
            Expected MRR · {monthName || "this month"}
          </p>
          <p className="text-white font-semibold text-sm mt-0.5">
            {formatGbp(revenue?.expectedThisMonth ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">
            Net MRR · {monthName || "this month"}
          </p>
          <p className="text-white font-semibold text-sm mt-0.5">
            {formatGbp(revenue?.expectedThisMonthNet ?? 0)}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 mb-2">
        Chart: paying vs non-paying and net revenue by month (last {windowMonths} months)
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
            <CartesianGrid stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 11 }}
              allowDecimals={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 11 }}
              tickFormatter={(v) => `£${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: number, name: string) => {
                if (name === "Net revenue" || name === "Gross revenue") {
                  return [formatGbp(Number(value) || 0), name];
                }
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="nonPaying"
              name="Non-paying"
              fill="#ffffff"
              fillOpacity={0.55}
              radius={[4, 4, 0, 0]}
              barSize={10}
            />
            <Bar
              yAxisId="left"
              dataKey="paying"
              name="Paying"
              fill="#4ade80"
              fillOpacity={0.95}
              radius={[4, 4, 0, 0]}
              barSize={10}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="netRevenue"
              name="Net revenue"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">Gross revenue · last {windowMonths} mo</p>
          <p className="text-gray-200 font-medium mt-0.5">
            {formatGbp(revenue?.total ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">Net excl. commission · last {windowMonths} mo</p>
          <p className="text-gray-200 font-medium mt-0.5">
            {formatGbp(revenue?.totalExcludingCommission ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800/80 px-3 py-2">
          <p className="text-gray-500">Commissions paid out · last {windowMonths} mo</p>
          <p className="text-gray-200 font-medium mt-0.5">
            {formatGbp(revenue?.commissionsInWindow ?? revenue?.commissionsTotal ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
