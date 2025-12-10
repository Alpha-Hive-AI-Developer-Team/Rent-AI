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

const data = [
  { name: "Jan", paying: 2800, nonPaying: 600 },
  { name: "Feb", paying: 3000, nonPaying: 700 },
  { name: "Mar", paying: 3400, nonPaying: 800 },
  { name: "Apr", paying: 3600, nonPaying: 900 },
  { name: "May", paying: 3300, nonPaying: 650 },
  { name: "Jun", paying: 3100, nonPaying: 550 },
  { name: "Jul", paying: 3500, nonPaying: 500 },
];

export default function TransactionVolumeChart({
  title = "Monthly Member Volume",
  subtitle = "Paying vs Non-paying members (monthly)",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#111] text-white rounded-xl p-4 md:p-6 border border-gray-800/50 shadow-md w-full">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-200">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 10 }}>
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ color: "#9CA3AF" }} />

            <Bar
              dataKey="nonPaying"
              name="Non-paying Members"
              fill="#ffffff"
              fillOpacity={0.65}
              radius={[6, 6, 0, 0]}
              barSize={12}
            />
            <Bar
              dataKey="paying"
              name="Paying Members"
              fill="#4ade80"
              fillOpacity={0.95}
              radius={[6, 6, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
