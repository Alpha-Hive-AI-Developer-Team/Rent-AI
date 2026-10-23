"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = {
  month: string;
  value: number;
  commissionCents?: number;
  referredSignups?: number;
};

interface Props {
  data?: Point[];
  trendPct?: number;
}

function formatGbp(n: number) {
  return `£${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ReferralGrowthChart({ data, trendPct }: Props) {
  const series =
    data && data.length
      ? data
      : [
          { month: "Jan", value: 0 },
          { month: "Feb", value: 0 },
          { month: "Mar", value: 0 },
          { month: "Apr", value: 0 },
          { month: "May", value: 0 },
          { month: "Jun", value: 0 },
        ];

  const pct = typeof trendPct === "number" ? trendPct : 0;
  const pctLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  const latest = series[series.length - 1];

  return (
    <div className="bg-[#111] border border-gray-800/80 rounded-2xl p-5 sm:p-6 shadow-xl w-full">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base sm:text-lg">Referral – Driven Growth</h3>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Partner commission earned · last 6 months</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-white tracking-tight">
            {formatGbp(latest?.value || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1 flex items-center sm:justify-end gap-1.5">
            <span>{latest?.month || "This month"}</span>
            {typeof latest?.referredSignups === "number" ? (
              <span>• {latest.referredSignups} referred signup{latest.referredSignups === 1 ? "" : "s"}</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="w-full h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="commissionGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#027A48" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal vertical={false} />
            <XAxis
              dataKey="month"
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
              formatter={(value: number, _name: string, item: any) => {
                const signups = item?.payload?.referredSignups;
                const label =
                  typeof signups === "number"
                    ? `Commission (${signups} signup${signups === 1 ? "" : "s"})`
                    : "Commission";
                return [formatGbp(Number(value) || 0), label];
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              name="Commission"
              stroke="url(#commissionGradient)"
              strokeWidth={3}
              dot={{ fill: "#10b981", r: 4, strokeWidth: 2, stroke: "#000" }}
              activeDot={{ r: 6, fill: "#34d399", stroke: "#000", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <p className="text-xs sm:text-sm text-gray-400">
          <span className={`font-semibold inline-flex items-center gap-1 ${pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            Trending {pct >= 0 ? "up" : "down"} by {pctLabel} this month
          </span>
        </p>
        <p className="text-[11px] text-gray-500">
          Showing partner commission earned over the last 6 months
        </p>
      </div>
    </div>
  );
}
