"use client";

import Image from "next/image";
import { Bell, CheckCircle, Gift, AlertTriangle } from "lucide-react";

export default function NotificationPage() {
  const notifications = [
    {
      title: "Payment matched – Jack Leah (Oct)",
      type: "success",
      time: "08:12",
    },
    {
      title: "New referral activated +10%",
      type: "promo",
      time: "09:04",
    },
    {
      title: "3 tenants moved to D7–13",
      type: "alert",
      time: "Yesterday",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <h1 className="text-xl md:text-2xl font-semibold mr-auto">
          Notifications
        </h1>

      
      </div>

      {/* Notifications Card */}
      <div className="mt-4">
        <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-4 md:p-6">
          {/* Title inside card
          <div className="mb-4">
            <p className="text-lg md:text-xl font-semibold text-white">
              Notifications
            </p>
          </div> */}

          <div className="flex flex-col gap-3">
            {notifications.map((item, index) => {
              const Icon =
                index === 0
                  ? CheckCircle
                  : index === 1
                  ? Gift
                  : AlertTriangle;

              return (
                <div
                  key={index}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-[#1f1f1f] bg-transparent"
                >
                  {/* Left side */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />

                    <p className="text-sm md:text-base font-medium text-white truncate">
                      {item.title}
                    </p>
                  </div>

                  {/* Time (right) */}
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {item.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
