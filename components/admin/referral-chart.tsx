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
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 mt-6 w-full">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-medium">Referral – Driven Growth</h3>
          <p className="text-gray-400 text-sm">Partner commission earned · last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-white">
            {formatGbp(latest?.value || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {latest?.month || "This month"}
            {typeof latest?.referredSignups === "number" ? (
              <span className="ml-2">· {latest.referredSignups} referred signup{latest.referredSignups === 1 ? "" : "s"}</span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#2a2a2a" strokeDasharray="0" horizontal vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#555"
              tick={{ fill: "#666", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={48}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 11 }}
              tickFormatter={(v) => `£${Number(v || 0).toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#aaa" }}
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
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: "#f97316", r: 4 }}
              activeDot={{ r: 6, fill: "#f97316" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3">
        <p className="text-sm text-gray-400">
          <span className={`font-medium ${pct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            Trending {pct >= 0 ? "up" : "down"} by {pctLabel} this month
          </span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Showing partner commission earned over the last 6 months
        </p>
      </div>
    </div>
  );
}
