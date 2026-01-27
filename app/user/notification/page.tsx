"use client";

import Image from "next/image";
import { Bell, CheckCircle, Gift, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationPage() {
  const notificationsQuery = useNotifications();
  const notifications = notificationsQuery?.data?.data || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <h1 className="text-xl md:text-2xl font-semibold mr-auto">Notifications</h1>
      </div>

      {/* Notifications Card */}
      <div className="mt-4">
        <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-4 md:p-6">
          <div className="flex flex-col gap-3">
            {notificationsQuery.isLoading ? (
              <div className="text-gray-400">Loading notifications…</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-400">No notifications yet.</div>
            ) : (
              notifications.map((item, index) => {
                // Choose an icon based on notification type
                const Icon =
                  item.type === "referral"
                    ? Gift
                    : item.type === "transaction"
                    ? CheckCircle
                    : AlertTriangle;

                return (
                  <div
                    key={item._id}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-[#1f1f1f] bg-transparent ${!item.read ? "ring-1 ring-emerald-600/10" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                      <p className="text-sm md:text-base font-medium text-white truncate">{item.description}</p>
                    </div>

                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
