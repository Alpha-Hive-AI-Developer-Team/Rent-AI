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
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Notifications</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            3
          </span>
        </div>

        <Image
          src="/images/pexels.png"
          alt="User Avatar"
          width={36}
          height={36}
          className="rounded-full border border-gray-700"
        />
      </div>

      {/* Tabs */}
      {/* <div className="flex border-b border-gray-800 text-sm">
        <button className="px-4 py-2 text-white border-b-2 border-white">
          All
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-white">
          Unread
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-white">
          Read
        </button>
      </div> */}

      {/* Notification List (card) */}
      <div className="mt-4">
        <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-4 md:p-6">
          {/* In-card label matching screenshot */}
          <div className="mb-3">
            <p className="text-md font-semibold text-white">Notifications</p>
          </div>

          <div className="flex flex-col gap-3">
            {notifications.map((item, index) => {
              const isLast = index === notifications.length - 1;
              return (
                <div
                  key={index}
                  className={
                    "w-full flex items-center justify-between p-3 rounded-xl border border-[#1f1f1f] bg-transparent"
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      {index === 0 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {index === 1 && <Gift className="w-4 h-4 text-emerald-400" />}
                      {index === 2 && <AlertTriangle className="w-4 h-4 text-emerald-400" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 ml-4 whitespace-nowrap">
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
