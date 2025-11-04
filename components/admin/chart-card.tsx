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

interface ChartCardProps {
  title: string;
  subtitle: string;
  data: any[];
  lines: {
    key: string;
    color: string;
    name?: string;
  }[];
  footer?: string;
}

export default function LineChartCard({
  title,
  subtitle,
  data,
  lines,
  footer,
}: ChartCardProps) {
  return (
    <div className="bg-[#111] text-white rounded-xl border border-gray-800/50 p-4 md:p-6 shadow-md flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm text-gray-300">{title}</h3>
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      </div>

      <div className="flex-1 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="#2a2a2a"
              strokeDasharray="0"
              horizontal={true}
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{ fill: "#666", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            {/* <YAxis
              tick={{ fill: "#666", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            /> */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            {lines.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.key}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                name={line.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {footer && (
        <p className="text-xs text-white mt-4">
          {footer} <span className="text-white">↗</span>
        </p>
      )}
    </div>
  );
}
