"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  DotProps,
} from "recharts";
import { MoveUpRight } from "lucide-react";
import React from "react";


type Point = { month: string; value: number };

interface Props {
  data?: Point[];
  trendPct?: number;
}

export default function ReferralGrowthChart({ data, trendPct }: Props) {
  const series = data && data.length ? data : [
    { month: "Jan", value: 0 },
    { month: "Feb", value: 0 },
    { month: "Mar", value: 0 },
    { month: "Apr", value: 0 },
    { month: "May", value: 0 },
    { month: "Jun", value: 0 },
  ];

  const pct = typeof trendPct === "number" ? trendPct : 0;
  const pctLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 mt-6 w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-white font-medium">Referral – Driven Growth</h3>
        <p className="text-gray-400 text-sm">Last 6 months</p>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="0"
              horizontal={true}
              vertical={false}
            />
            <XAxis dataKey="month" stroke="#555" tick={{ fill: "#666", fontSize: 12 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#aaa" }}
              itemStyle={{ color: "#f97316" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{
                fill: "#f97316",
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "#f97316",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-4  pt-3">
        <p className="text-sm text-gray-400">
          <span className={`text-white font-medium ${pct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            Trending {pct >= 0 ? "up" : "down"} by {pctLabel} this month
          </span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Showing total visitors for the last 6 months
        </p>
      </div>
      
    </div>
  );
}
