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


const data = [
  { month: "Jan", value: 109 },
  { month: "Feb", value:399 },
  { month: "Mar", value: 100 },
  { month: "Apr", value: 599 },
  { month: "May", value: 399 },
  { month: "Jun", value: 499 },
];

export default function ReferralGrowthChart() {
  return (
    <div className="bg-[#111] border border-gray-800 rounded-xl p-5 mt-6 w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-white font-medium">Referral – Driven Growth</h3>
        <p className="text-gray-400 text-sm">January – June 2024</p>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
          <span className="text-white font-medium">Trending up by 5.2% this month</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Showing total visitors for the last 6 months
        </p>
      </div>
      
    </div>
  );
}
