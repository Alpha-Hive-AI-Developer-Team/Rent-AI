"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArrears } from "@/lib/api/tenantsApi";
import { formatDate } from "@/lib/utils";
import StatCard from "@/components/admin/analytics-card";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Home,
  Search,
  X,
} from "lucide-react";

const SECTIONS = ["Day 1", "Day 2-6", "Day 7-13", "Day 14-27", "Day 28+"] as const;

function money(n: number) {
  return `£${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function tenantLabel(t: any) {
  return Array.isArray(t.names)
    ? t.names.join(", ")
    : String(t.names || "Unknown Tenant");
}

function tenantOutstanding(t: any) {
  return (t.unpaidItems || []).reduce((acc: number, u: any) => {
    const due = Number(u.amountDue || 0);
    const paid = Number(u.amountPaid || 0);
    return acc + Math.max(0, due - paid);
  }, 0);
}

/** Soft stage chip — same palette family as tenant status badges */
function stageChipClass(section: string) {
  if (section === "Day 28+") {
    return "bg-rose-950/40 text-rose-300 border-rose-700/40";
  }
  if (section === "Day 14-27") {
    return "bg-amber-950/40 text-amber-300 border-amber-700/40";
  }
  if (section === "Day 7-13") {
    return "bg-amber-950/30 text-amber-200/90 border-amber-800/30";
  }
  return "bg-emerald-950/40 text-emerald-300 border-emerald-700/40";
}

export default function ArrearsPage() {
  const [openSection, setOpenSection] = useState<string>("Day 1");
  const [search, setSearch] = useState("");

  const arrearsQuery = useQuery({
    queryKey: ["arrears"],
    queryFn: () => getArrears(),
    staleTime: 0,
  });

  const buckets: Record<string, any[]> = useMemo(() => {
    const data = arrearsQuery.data?.data?.buckets ?? {};
    const out: Record<string, any[]> = {};
    for (const s of SECTIONS) out[s] = Array.isArray(data[s]) ? data[s] : [];
    return out;
  }, [arrearsQuery.data]);

  const stats = useMemo(() => {
    let totalAmount = 0;
    let criticalCount = (buckets["Day 28+"] || []).length;
    let earlyCount =
      (buckets["Day 1"] || []).length + (buckets["Day 2-6"] || []).length;
    const seenTenants = new Set<string>();

    for (const s of SECTIONS) {
      for (const t of buckets[s] || []) {
        const id = String(t.tenantId || t.property || Math.random());
        if (!seenTenants.has(id)) seenTenants.add(id);
        totalAmount += tenantOutstanding(t);
      }
    }

    return {
      totalTenants: seenTenants.size,
      totalAmount,
      criticalCount,
      earlyCount,
    };
  }, [buckets]);

  const q = search.trim().toLowerCase();
  const isSearching = q.length > 0;

  const currentList = useMemo(() => {
    const matches = (t: any) => {
      if (!q) return true;
      const name = tenantLabel(t).toLowerCase();
      const prop = String(t.property || "").toLowerCase();
      return name.includes(q) || prop.includes(q);
    };

    if (isSearching) {
      const rows: { section: string; tenant: any }[] = [];
      for (const s of SECTIONS) {
        for (const t of buckets[s] || []) {
          if (matches(t)) rows.push({ section: s, tenant: t });
        }
      }
      return rows;
    }

    return (buckets[openSection] || [])
      .filter(matches)
      .map((tenant) => ({ section: openSection, tenant }));
  }, [buckets, openSection, q, isSearching]);

  const statCards = [
    {
      title: "Total Overdue",
      value: money(stats.totalAmount),
      trend: 0,
      period: "All aging stages",
    },
    {
      title: "Tenants in Arrears",
      value: String(stats.totalTenants),
      trend: 0,
      period: "Unique tenancies",
    },
    {
      title: "Critical (Day 28+)",
      value: String(stats.criticalCount),
      trend: 0,
      period: "Legal notice stage",
    },
    {
      title: "Early Stage (Day 1–6)",
      value: String(stats.earlyCount),
      trend: 0,
      period: "Friendly follow-up",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header — same pattern as Dashboard / Tenants */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-800/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 hidden sm:flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Arrears
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Track overdue rent by aging stage and follow up with tenants
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => arrearsQuery.refetch()}
          disabled={arrearsQuery.isFetching}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-gray-800 bg-[#111] hover:bg-white/5 px-4 py-2.5 text-gray-300 hover:text-white font-medium text-xs sm:text-sm transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${arrearsQuery.isFetching ? "animate-spin text-emerald-400" : ""}`}
          />
          <span>{arrearsQuery.isFetching ? "Refreshing…" : "Refresh"}</span>
        </button>
      </div>

      {/* Stats — StatCard like Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {statCards.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      {/* Search + stage tabs — same control row as Tenants */}
      <div className="flex flex-col gap-3 bg-[#111] border border-gray-800/80 rounded-2xl p-3 sm:p-4 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants or property…"
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

        {!isSearching ? (
          <div className="flex flex-wrap items-center gap-2">
            {SECTIONS.map((s) => {
              const count = buckets[s]?.length || 0;
              const active = openSection === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOpenSection(s)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                    active
                      ? "border-[#027A48] bg-[#027A48]/15 text-emerald-300 shadow-sm"
                      : "border-gray-800 bg-[#161616] text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{s}</span>
                  <span
                    className={`min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
                      active
                        ? "bg-[#027A48]/30 text-emerald-100"
                        : "bg-gray-800/80 text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 px-0.5">
            Searching all stages ·{" "}
            <span className="text-gray-300 font-medium">
              {currentList.length} result{currentList.length === 1 ? "" : "s"}
            </span>
          </p>
        )}
      </div>

      {/* List */}
      {arrearsQuery.isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-gray-800/80 bg-[#111] animate-pulse shadow-md"
            />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-2xl border border-gray-800/80 bg-[#111] px-6 py-14 text-center shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-[#027A48]/10 border border-[#027A48]/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {isSearching ? "No matches" : `No arrears in ${openSection}`}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto">
            {isSearching
              ? "Try a different tenant or property name."
              : "Nothing overdue in this aging stage."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {currentList.map(({ section, tenant: t }) => {
            const name = tenantLabel(t);
            const initials =
              name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((n: string) => n[0]?.toUpperCase())
                .join("") || "T";
            const overdueSum = tenantOutstanding(t);
            const key = `${section}-${t.tenantId || name}`;

            return (
              <div
                key={key}
                className="rounded-2xl border border-gray-800/80 bg-[#111] p-4 sm:p-5 space-y-4 shadow-md hover:border-gray-700/80 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 font-semibold text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                        {name}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                        <Home className="w-3 h-3 shrink-0 text-gray-500" />
                        <span className="truncate">
                          {t.property || "No property"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] sm:text-xs font-medium tabular-nums ${stageChipClass(section)}`}
                    >
                      {t.daysOverdue ?? "—"}d overdue
                    </span>
                    {isSearching ? (
                      <p className="text-[10px] text-gray-500">{section}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-800/60 bg-[#0a0a0a] p-3 text-xs">
                  <div>
                    <p className="text-gray-500">Oldest due</p>
                    <p className="mt-0.5 text-gray-200 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      {formatDate(t.oldestDueDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Balance overdue</p>
                    <p className="mt-0.5 text-sm font-semibold text-rose-300 tabular-nums">
                      {money(overdueSum)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-800/60 pt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium">Unpaid schedule</span>
                    <span className="text-gray-500">
                      {(t.unpaidItems || []).length} item
                      {(t.unpaidItems || []).length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto [scrollbar-width:thin]">
                    {Array.isArray(t.unpaidItems) && t.unpaidItems.length > 0 ? (
                      t.unpaidItems.map((u: any, i: number) => {
                        const outstanding = Math.max(
                          0,
                          Number(u.amountDue || 0) - Number(u.amountPaid || 0)
                        );
                        const status = String(u.status || "unpaid").toLowerCase();
                        const statusClass =
                          status === "partial"
                            ? "bg-amber-950/40 text-amber-300 border-amber-700/40"
                            : "bg-rose-950/40 text-rose-300 border-rose-700/40";
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-3 rounded-xl border border-gray-800/60 bg-[#0e0e0e] px-3 py-2.5 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-200 truncate">
                                {formatDate(u.month)}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Due {formatDate(u.dueDate)}
                              </p>
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <p className="font-semibold text-rose-300 tabular-nums">
                                {money(outstanding)}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${statusClass}`}
                              >
                                {u.status || "Unpaid"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500 py-1">
                        No unpaid items listed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
