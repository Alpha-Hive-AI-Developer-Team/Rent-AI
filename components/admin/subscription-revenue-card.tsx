"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
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
          { name: "Jan", paying: 0, nonPaying: 0 },
          { name: "Feb", paying: 0, nonPaying: 0 },
          { name: "Mar", paying: 0, nonPaying: 0 },
          { name: "Apr", paying: 0, nonPaying: 0 },
          { name: "May", paying: 0, nonPaying: 0 },
          { name: "Jun", paying: 0, nonPaying: 0 },
        ];

  const totalMembers = members?.total ?? 0;

  return (
    <div className="bg-[#111] text-white rounded-xl p-4 md:p-6 border border-gray-800/50 shadow-md w-full flex flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-medium text-base">Members &amp; Plans</h3>
          <p className="text-gray-400 text-xs mt-1">
            Plan mix is current · volume chart covers the last {windowMonths} months
            {monthName ? ` (through ${monthName})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 border border-gray-800 rounded-full px-2.5 py-0.5">
            Last {windowMonths} mo
          </span>
          {monthName ? (
            <span className="text-xs text-emerald-400 border border-emerald-900/40 bg-[#027A48]/15 rounded-full px-2.5 py-0.5">
              Current · {monthName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {TIER_ORDER.map((key) => {
          const tier = tiers?.[key];
          const count = tier?.count ?? 0;
          const share =
            totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
          return (
            <div
              key={key}
              className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: TIER_COLORS[key] }}
                />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {tier?.label || key}
                </span>
              </div>
              <p className="text-lg md:text-xl font-semibold leading-tight tabular-nums text-white">{count}</p>
              <p className="text-xs text-[#535862] mt-0.5">
                {tier?.display || "—"} · {share}%
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">Paying · now</p>
          <p className="text-emerald-400 font-semibold text-base mt-1 tabular-nums">
            {members?.paying ?? 0}
            <span className="text-gray-500 font-normal text-xs ml-1">
              ({members?.payingSharePct ?? 0}%)
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">Non-paying · now</p>
          <p className="text-white font-semibold text-base mt-1 tabular-nums">
            {members?.nonPaying ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">
            Expected MRR · {monthName || "this month"}
          </p>
          <p className="text-white font-semibold text-base mt-1 tabular-nums">
            {formatGbp(revenue?.expectedThisMonth ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">
            Net MRR · {monthName || "this month"}
          </p>
          <p className="text-white font-semibold text-base mt-1 tabular-nums">
            {formatGbp(revenue?.expectedThisMonthNet ?? 0)}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2">
        Paying vs non-paying by month
      </p>

      <div className="h-56 flex-1 min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
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
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }} />
            <Bar
              dataKey="nonPaying"
              name="Non-paying"
              fill="#ffffff"
              fillOpacity={0.55}
              radius={[4, 4, 0, 0]}
              barSize={14}
            />
            <Bar
              dataKey="paying"
              name="Paying"
              fill="#4ade80"
              fillOpacity={0.95}
              radius={[4, 4, 0, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
