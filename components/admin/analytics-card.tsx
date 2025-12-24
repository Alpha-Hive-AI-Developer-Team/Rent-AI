import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  // description: string;
  // subtext: string;
}

export default function StatCard({
  title,
  value,
  trend,
  // description,
  // subtext,
}: StatCardProps) {
  const isPositive = trend >= 0;

  const safeTrend = typeof trend === 'number' && Number.isFinite(trend) ? trend : 0;
  const trendFormatted = safeTrend.toFixed(2);

  return (
    <div className="bg-[#111] text-white p-4 md:p-6 rounded-xl shadow-md flex flex-col border border-gray-800/50 justify-between w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-400">{title}</h3>
        <div className="flex items-center text-xs border border-gray-800 p-1 rounded-md text-gray-400">
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3 text-green-400 mr-1" />
          ) : (
            <ArrowDownRight className="w-3 h-3 text-red-400 mr-1" />
          )}
          <span className={isPositive ? "text-green-400" : "text-red-400"}>
            {isPositive ? "+" : ""}
            {trendFormatted}%
          </span>
        </div>
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2">{value}</h2>
      {/* <p className="text-sm text-white mt-2">{description}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p> */}
    </div>
  );
}
