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

const data = [
  { name: "Mar 3", line1: 4000, line2: 2400 },
  { name: "Mar 10", line1: 3000, line2: 1398 },
  { name: "Mar 17", line1: 2000, line2: 9800 },
  { name: "Mar 24", line1: 2780, line2: 3908 },
  { name: "Mar 31", line1: 1890, line2: 4800 },
  { name: "Apr 7", line1: 2390, line2: 3800 },
  { name: "Apr 14", line1: 3490, line2: 4300 },
];

export default function TransactionVolumeChart({
  title = "Transaction Volume",
  subtitle = "Total for the last 3 months",
}) {
  return (
    <div className="bg-[#111] text-white rounded-xl p-4 md:p-6 border border-gray-800/50 shadow-md w-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-200">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="0"
              horizontal
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 11 }}
              tickMargin={10}
            />
            <YAxis hide axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="line1"
              stroke="#ffffff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="line2"
              stroke="#555555"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#999" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
