"use client";

import Image from "next/image";
import { Bell } from "lucide-react";

export default function NotificationPage() {
  const notifications = [
    {
      title: "Payment matched – Jack Leah (Oct)",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt",
      time: "5 hours ago",
    },
    {
      title: "New referral activated +10%",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt",
      time: "5 hours ago",
    },
    {
      title: "3 tenants moved to D7–13",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt",
      time: "5 hours ago",
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
      <div className="flex border-b border-gray-800 text-sm">
        <button className="px-4 py-2 text-white border-b-2 border-white">
          All
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-white">
          Unread
        </button>
        <button className="px-4 py-2 text-gray-400 hover:text-white">
          Read
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3 mt-4">
        {notifications.map((item, index) => (
          <div
            key={index}
            className="bg-[#0B0B0B] p-4 rounded-xl border border-[#1a1a1a] flex items-start justify-between hover:bg-[#111111] transition-colors"
          >
            <div>
              <p className="font-medium text-sm mb-1">{item.title}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
            <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
              {item.time}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
