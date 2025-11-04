"use client";

import { UserRoundCheck, Info, Clock, RotateCw } from "lucide-react";

interface Alert {
  id: number;
  title: string;
  description: string;
  icon: "info" | "clock" | "update";
}

const iconMap = {
  info: Info,
  clock: Clock,
  update: UserRoundCheck,
};

export default function AlertsCard() {
  const alerts: Alert[] = [
    {
      id: 1,
      title: "Payment Failed",
      description: "Landlord ID: 2847",
      icon: "info",
    },
    {
      id: 2,
      title: "Pending Review",
      description: "AI Match Confidence: 67%",
      icon: "clock",
    },
    {
      id: 3,
      title: "System Update",
      description: "Scheduled for 2:00 AM",
      icon: "update",
    },
  ];

  return (
    <div className="bg-[#111] text-white rounded-xl p-4 border border-gray-800/50 md:p-6 shadow-md mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">Recent Alerts</h3>
        <button className="flex items-center gap-2 text-sm text-gray-300 border border-gray-800/50 rounded-full px-3 py-1 hover:bg-gray-800 transition">
          <RotateCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.icon];
          return (
            <div
              key={alert.id}
              className="flex flex-col gap-3 border border-gray-800 rounded-lg p-3 hover:bg-[#1a1a1a] transition"
            >
              <Icon className="w-5 h-5 text-gray-300" />
              <div>
                <p className="text-sm font-medium text-gray-200">{alert.title}</p>
                <p className="text-xs text-gray-500 mt-2">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
