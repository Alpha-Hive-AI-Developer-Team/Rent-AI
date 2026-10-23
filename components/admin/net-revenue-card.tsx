"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type SeriesPoint = {
  name: string;
  netRevenue?: number;
  revenue?: number;
  commissions?: number;
};

type RevenueInfo = {
  expectedThisMonthNet?: number;
  total?: number;
  totalExcludingCommission?: number;
  commissionsInWindow?: number;
  commissionsTotal?: number;
  source?: string;
};

function formatGbp(n: number) {
  return `£${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAxisGbp(n: number) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000) return `£${(v / 1000).toFixed(1)}k`;
  return `£${v.toFixed(0)}`;
}

const fallbackData = [
  { name: "Jan", netRevenue: 0 },
  { name: "Feb", netRevenue: 0 },
  { name: "Mar", netRevenue: 0 },
  { name: "Apr", netRevenue: 0 },
  { name: "May", netRevenue: 0 },
  { name: "Jun", netRevenue: 0 },
];

export default function NetRevenueCard({
  series,
  revenue,
  monthName,
  windowMonths = 6,
}: {
  series?: SeriesPoint[];
  revenue?: RevenueInfo | null;
  monthName?: string;
  windowMonths?: number;
}) {
  const chartData =
    Array.isArray(series) && series.length
      ? series.map((d) => ({
          name: d.name,
          netRevenue: Number(d.netRevenue) || 0,
        }))
      : fallbackData;

  const latest = chartData[chartData.length - 1];
  const prev = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const latestNet = Number(latest?.netRevenue) || 0;
  const prevNet = Number(prev?.netRevenue) || 0;
  const changePct = !prev
    ? 0
    : !prevNet
      ? latestNet
        ? 100
        : 0
      : Number((((latestNet - prevNet) / Math.abs(prevNet)) * 100).toFixed(2));
  const changeUp = changePct >= 0;

  return (
    <div className="bg-[#111] text-white rounded-xl p-4 md:p-6 border border-gray-800/50 shadow-md w-full flex flex-col">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-medium text-base">Net Revenue</h3>
          <p className="text-gray-400 text-xs mt-1">
            Excl. commission · last {windowMonths} months
            {monthName ? ` (through ${monthName})` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 border border-gray-800 rounded-full px-2.5 py-0.5">
            Last {windowMonths} mo
          </span>
          {revenue?.source === "estimated" && (
            <span className="text-xs text-amber-400 border border-amber-900/40 bg-amber-950/20 rounded-full px-2.5 py-0.5">
              Estimated
            </span>
          )}
          {(revenue?.source === "system" || revenue?.source === "payments") && (
            <span className="text-xs text-emerald-400 border border-emerald-900/40 bg-[#027A48]/15 rounded-full px-2.5 py-0.5">
              Payment history
            </span>
          )}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-semibold tabular-nums text-white">
          {formatGbp(latestNet)}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {latest?.name || monthName || "Latest month"}
          <span className={changeUp ? "text-emerald-400 ml-2" : "text-rose-400 ml-2"}>
            {changeUp ? "+" : ""}
            {changePct}% vs prior month
          </span>
        </p>
      </div>

      <div className="h-56 flex-1 min-h-[14rem]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
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
              width={44}
              tick={{ fill: "#666", fontSize: 11 }}
              tickFormatter={formatAxisGbp}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: number) => [formatGbp(Number(value) || 0), "Net revenue"]}
            />
            <Line
              type="monotone"
              dataKey="netRevenue"
              name="Net revenue"
              stroke="#0CEB77"
              strokeWidth={2.5}
              dot={{ fill: "#0CEB77", r: 3 }}
              activeDot={{ r: 5, fill: "#0CEB77" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">Gross · last {windowMonths} mo</p>
          <p className="text-white font-semibold text-sm mt-1 tabular-nums">
            {formatGbp(revenue?.total ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">Net excl. commission</p>
          <p className="text-white font-semibold text-sm mt-1 tabular-nums">
            {formatGbp(revenue?.totalExcludingCommission ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-[#0c0c0c] p-3">
          <p className="text-xs text-[#737373]">Commissions paid out</p>
          <p className="text-white font-semibold text-sm mt-1 tabular-nums">
            {formatGbp(revenue?.commissionsInWindow ?? revenue?.commissionsTotal ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
