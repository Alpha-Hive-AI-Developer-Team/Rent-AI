"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArrears } from "@/lib/api/tenantsApi";

export default function ArrearsPage() {
  const [openSection, setOpenSection] = useState<string | null>("Day 1");

  const sections = ["Day 1", "Day 2-6", "Day 7-13", "Day 14-27", "Day 28+"];

  const arrearsQuery = useQuery({
    queryKey: ["arrears"],
    queryFn: () => getArrears(),
    staleTime: 0,
  });

  const buckets: Record<string, any[]> = useMemo(() => {
    const data = arrearsQuery.data?.data?.buckets ?? {};
    const out: Record<string, any[]> = {};
    for (const s of sections) out[s] = Array.isArray(data[s]) ? data[s] : [];
    return out;
  }, [arrearsQuery.data]);

  const templateFor = (section: string) => {
    if (section === "Day 1") return "Friendly / Firm";
    if (section === "Day 2-6") return "Friendly / Firm";
    if (section === "Day 7-13") return "Friendly / Firm";
    if (section === "Day 14-27") return "Firm";
    return "Legal / Final";
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return "—";
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Arrears</h1>


      </div>

      {/* Sub Header (buttons ignored per requirement) */}
      <div className="flex justify-end w-full"></div>

      {/* Filter Pills (scrollable on mobile) */}
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setOpenSection(openSection === s ? null : s)}
            className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition ${
              openSection === s
                ? "border-emerald-600 text-emerald-400"
                : "border-gray-700 text-gray-300"
            }`}
          >
            {s} ({buckets[s]?.length || 0})
          </button>
        ))}
      </div>

      {/* Cards for Selected Section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {openSection ? (
          (buckets[openSection] || []).length > 0 ? (
            (buckets[openSection] || []).map((t: any) => (
              <div key={t.tenantId} className="rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200 font-medium mb-1 text-sm">
                      {Array.isArray(t.names) ? t.names.join(', ') : String(t.names || '')}
                    </p>
                    <p className="text-gray-400 text-xs">{t.property || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-300 text-sm">{t.daysOverdue} days overdue</p>
                    <p className="text-gray-500 text-xs">Due: {formatDate(t.oldestDueDate)}</p>
                    {/* <p className="text-amber-300 text-xs mt-1">Template: {templateFor(openSection || '')}</p> */}
                  </div>
                </div>
                <div className="border-t border-[#222] pt-3">
                  <p className="text-xs text-gray-400 mb-2">Unpaid items</p>
                  <div className="space-y-2">
                    {Array.isArray(t.unpaidItems) && t.unpaidItems.length > 0 ? t.unpaidItems.map((u: any, i: number) => (
                      <div key={i} className="flex items-start justify-between">
                        <div className="text-sm text-gray-200">{formatDate(u.month)}</div>
                        <div className="text-sm text-gray-200">£{Math.max(0, Number(u.amountDue || 0) - Number(u.amountPaid || 0)).toFixed(2)}</div>
                        <div className="text-sm text-gray-400">Due {formatDate(u.dueDate)}</div>
                        <div className="text-sm text-amber-300 capitalize">{u.status}</div>
                      </div>
                    )) : (
                      <div className="text-sm text-gray-400">No unpaid items</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm col-span-full text-center">No items for {openSection}</div>
          )
        ) : (
          <div className="text-gray-400 text-sm col-span-full text-center">Select a period to show arrears</div>
        )}
      </div>
    </div>
  );
}
