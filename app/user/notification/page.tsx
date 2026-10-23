"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Gift,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
  Clock,
  CreditCard,
  CheckCheck,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";

type NotificationFilter = "all" | "unread" | "transaction" | "referral" | "alert";

export default function NotificationPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const pageSize = 12;

  const notificationsQuery = useNotifications({ page, limit: pageSize });
  const rawNotifications = notificationsQuery?.data?.data || [];
  const pagination = notificationsQuery?.data?.pagination;
  const total = pagination?.total || rawNotifications.length;
  const totalPages = pagination?.totalPages || 1;
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : Math.min(page * pageSize, total);

  // Client-side search and filtering for smooth instant response
  const filteredNotifications = useMemo(() => {
    let list = rawNotifications;

    if (filter === "unread") {
      list = list.filter((n: any) => !n.read);
    } else if (filter === "transaction") {
      list = list.filter((n: any) => n.type === "transaction");
    } else if (filter === "referral") {
      list = list.filter((n: any) => n.type === "referral");
    } else if (filter === "alert") {
      list = list.filter((n: any) => n.type !== "transaction" && n.type !== "referral");
    }

    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((n: any) =>
      String(n.description || "").toLowerCase().includes(q)
    );
  }, [rawNotifications, filter, search]);

  const unreadCount = useMemo(() => {
    return rawNotifications.filter((n: any) => !n.read).length;
  }, [rawNotifications]);

  const getNotificationIcon = (type: string) => {
    if (type === "referral") {
      return {
        Icon: Gift,
        badgeClass: "bg-sky-950/60 border border-sky-700/40 text-sky-400",
        label: "Referral",
        pillClass: "bg-sky-950/40 text-sky-300 border-sky-700/40",
      };
    }
    if (type === "transaction") {
      return {
        Icon: CreditCard,
        badgeClass: "bg-emerald-950/60 border border-emerald-700/40 text-emerald-400",
        label: "Transaction",
        pillClass: "bg-emerald-950/40 text-emerald-300 border-emerald-700/40",
      };
    }
    return {
      Icon: AlertTriangle,
      badgeClass: "bg-amber-950/60 border border-amber-700/40 text-amber-400",
      label: "Alert",
      pillClass: "bg-amber-950/40 text-amber-300 border-amber-700/40",
    };
  };

  const filterTabs: { key: NotificationFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "transaction", label: "Transactions" },
    { key: "referral", label: "Referrals" },
    { key: "alert", label: "Alerts" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-screen-xl mx-auto">
      {/* Header — matching Dashboard / Tenants / Arrears */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-700/40 bg-emerald-950/40 text-xs font-medium text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Stay updated on incoming rent transactions, arrear alerts, and referral rewards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => notificationsQuery.refetch()}
            disabled={notificationsQuery.isFetching}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#111] hover:bg-white/5 px-4 py-2.5 text-gray-300 hover:text-white font-medium text-xs sm:text-sm transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${notificationsQuery.isFetching ? "animate-spin text-emerald-400" : ""}`}
            />
            <span>{notificationsQuery.isFetching ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="flex flex-col gap-3 bg-[#111] border border-gray-800/80 rounded-2xl p-3 sm:p-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notification messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-800 bg-[#161616] py-2.5 pl-10 pr-9 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#027A48] focus:ring-1 focus:ring-[#027A48] transition"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                  active
                    ? "border-[#027A48] bg-[#027A48]/15 text-emerald-300 shadow-sm"
                    : "border-gray-800 bg-[#161616] text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="rounded-2xl border border-gray-800/80 bg-[#111] p-4 sm:p-6 shadow-md space-y-3">
        {notificationsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-gray-800/60 bg-[#161616] animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              {search || filter !== "all"
                ? "No matching notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              {search || filter !== "all"
                ? "Try adjusting your search query or switching filters."
                : "You're all caught up! When transactions or alerts occur, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((item: any) => {
              const { Icon, badgeClass, label, pillClass } = getNotificationIcon(
                item.type
              );
              const isUnread = !item.read;

              return (
                <div
                  key={item._id}
                  className={`flex items-start justify-between gap-3.5 p-4 rounded-xl border transition-all duration-200 ${
                    isUnread
                      ? "border-emerald-700/40 bg-emerald-950/15"
                      : "border-gray-800/60 bg-[#161616]/60 hover:bg-[#161616] hover:border-gray-700/60"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeClass}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${pillClass}`}
                        >
                          {label}
                        </span>
                        {item.createdAt && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-gray-200 leading-relaxed break-words">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {isUnread && (
                    <div className="shrink-0 pt-1">
                      <span className="block w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!notificationsQuery.isLoading && total > 0 && (
          <div className="pt-4 mt-4 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-400">
              Showing <span className="text-white font-medium">{startIndex}</span> to{" "}
              <span className="text-white font-medium">{endIndex}</span> of{" "}
              <span className="text-white font-medium">{total}</span> notifications
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || notificationsQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs sm:text-sm text-gray-400 px-1">
                Page <span className="text-white font-medium">{page}</span> of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || notificationsQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-2 text-xs sm:text-sm text-gray-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

