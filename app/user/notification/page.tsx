"use client";

import { useState } from "react";
import { CheckCircle, Gift, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const notificationsQuery = useNotifications({ page, limit: pageSize });
  const notifications = notificationsQuery?.data?.data || [];
  const pagination = notificationsQuery?.data?.pagination;
  const total = pagination?.total || notifications.length;
  const totalPages = pagination?.totalPages || 1;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(page * pageSize, total);

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

          {!notificationsQuery.isLoading && total > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-[#1a1a1a] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-400">
                Showing {startIndex} to {endIndex} of {total} notifications
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1 || notificationsQuery.isFetching}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages || notificationsQuery.isFetching}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
