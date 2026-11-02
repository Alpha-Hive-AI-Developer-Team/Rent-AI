"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  X,
} from "lucide-react";
import { useImpersonationAudit } from "@/hooks/useImpersonation";
import useAdminLandlords, { useAdmins } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";

/** Local date-time for audit rows (staff activity in their timezone). */
function formatActivityWhen(input: any) {
  if (!input) return "—";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "session.start", label: "Session started" },
  { value: "session.end", label: "Session ended" },
  { value: "tenant.*", label: "Tenant changes" },
  { value: "rent.*", label: "Rent / payments" },
  { value: "transaction.*", label: "Transactions" },
  { value: "expense.*", label: "Expenses" },
  { value: "blocked.attempt", label: "Blocked attempts" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function personName(person?: {
  firstName?: string;
  lastName?: string;
  email?: string;
} | null) {
  if (!person) return "—";
  const name = `${person.firstName || ""} ${person.lastName || ""}`.trim();
  return name || person.email || "—";
}

function actionTone(action?: string, statusCode?: number | null) {
  if (action === "blocked.attempt" || (statusCode && statusCode >= 400)) {
    return "border-rose-800/50 bg-rose-950/20 text-rose-300";
  }
  if (action === "session.start") {
    return "border-emerald-700/40 bg-emerald-950/30 text-emerald-300";
  }
  if (action === "session.end") {
    return "border-amber-700/40 bg-amber-950/20 text-amber-200";
  }
  if (String(action || "").startsWith("rent.")) {
    return "border-sky-800/40 bg-sky-950/20 text-sky-300";
  }
  if (String(action || "").startsWith("tenant.")) {
    return "border-violet-800/40 bg-violet-950/20 text-violet-300";
  }
  return "border-gray-700 bg-[#1a1a1a] text-gray-300";
}

function statusLabel(code?: number | null) {
  if (code == null) return null;
  if (code >= 200 && code < 300) return { text: `OK ${code}`, className: "text-emerald-400" };
  if (code === 403) return { text: `Blocked ${code}`, className: "text-rose-400" };
  if (code >= 400) return { text: `Error ${code}`, className: "text-rose-400" };
  return { text: `HTTP ${code}`, className: "text-gray-400" };
}

type Props = {
  open: boolean;
  onClose: () => void;
  initialLandlordId?: string | null;
  initialLandlordName?: string | null;
};

export default function ImpersonationActivityModal({
  open,
  onClose,
  initialLandlordId = null,
  initialLandlordName = null,
}: Props) {
  const [landlordId, setLandlordId] = useState("");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [draftLandlordId, setDraftLandlordId] = useState("");
  const [draftActorId, setDraftActorId] = useState("");
  const [draftAction, setDraftAction] = useState("");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  useEffect(() => {
    if (!open) return;
    const lid = initialLandlordId || "";
    setLandlordId(lid);
    setDraftLandlordId(lid);
    setActorId("");
    setDraftActorId("");
    setAction("");
    setDraftAction("");
    setFrom("");
    setDraftFrom("");
    setTo("");
    setDraftTo("");
    setPage(1);
    setLimit(20);
  }, [open, initialLandlordId]);

  const { data: landlordsResp } = useAdminLandlords({
    page: 1,
    limit: 200,
  });
  const { data: adminsResp } = useAdmins({ page: 1, limit: 100 });

  const landlordOptions = useMemo(() => {
    const rows = Array.isArray(landlordsResp?.data) ? landlordsResp.data : [];
    return rows.map((l: any) => ({
      id: String(l.id || l._id),
      label:
        l.name ||
        `${l.firstName || ""} ${l.lastName || ""}`.trim() ||
        l.email ||
        "Landlord",
      email: l.email,
    }));
  }, [landlordsResp]);

  const actorOptions = useMemo(() => {
    const rows = Array.isArray(adminsResp?.data) ? adminsResp.data : [];
    return rows.map((a: any) => ({
      id: String(a.id || a._id),
      label:
        a.name ||
        `${a.firstName || ""} ${a.lastName || ""}`.trim() ||
        a.email ||
        "Admin",
      email: a.email,
      role: a.role,
    }));
  }, [adminsResp]);

  const { data: auditResp, isLoading, isFetching } = useImpersonationAudit({
    landlordId: landlordId || undefined,
    actorId: actorId || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit,
    enabled: open,
  });

  const rows = Array.isArray(auditResp?.data) ? auditResp.data : [];
  const total = Number(auditResp?.total || 0);
  const totalPages = Math.max(
    1,
    Number(auditResp?.totalPages) || Math.ceil(total / limit) || 1
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, total);

  const applyFilters = () => {
    setLandlordId(draftLandlordId);
    setActorId(draftActorId);
    setAction(draftAction);
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
  };

  const clearFilters = () => {
    const lid = initialLandlordId || "";
    setDraftLandlordId(lid);
    setDraftActorId("");
    setDraftAction("");
    setDraftFrom("");
    setDraftTo("");
    setLandlordId(lid);
    setActorId("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  if (!open) return null;

  const titleLandlord =
    initialLandlordName ||
    landlordOptions.find((l) => l.id === landlordId)?.label ||
    null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#111] border border-gray-800 rounded-2xl text-white shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-gray-800 px-5 py-4">
          <div className="min-w-0 flex items-start gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center bg-[#027A48]/15 border border-[#027A48]/30 text-emerald-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Login-as activity</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {titleLandlord
                  ? `Audit trail for ${titleLandlord}`
                  : "Audit trail across landlords · super admin only"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            aria-label="Close activity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="border-b border-gray-800/80 bg-[#0d0d0d] px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <label className="space-y-1">
              <span className="text-[11px] text-gray-500">Landlord</span>
              <select
                value={draftLandlordId}
                onChange={(e) => setDraftLandlordId(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-200 px-3 focus:outline-none focus:border-[#027A48]"
              >
                <option value="">All landlords</option>
                {landlordOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                    {l.email ? ` (${l.email})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-gray-500">Staff member</span>
              <select
                value={draftActorId}
                onChange={(e) => setDraftActorId(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-200 px-3 focus:outline-none focus:border-[#027A48]"
              >
                <option value="">All staff</option>
                {actorOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                    {a.role ? ` · ${a.role}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-gray-500">Activity type</span>
              <select
                value={draftAction}
                onChange={(e) => setDraftAction(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-200 px-3 focus:outline-none focus:border-[#027A48]"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-gray-500">From date</span>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-200 px-3 focus:outline-none focus:border-[#027A48]"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-gray-500">To date</span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#161616] border border-gray-800 text-xs text-gray-200 px-3 focus:outline-none focus:border-[#027A48]"
              />
            </label>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                onClick={applyFilters}
                className="h-9 flex-1 rounded-xl bg-[#027A48] hover:bg-[#02653d] text-white text-xs"
              >
                Apply
              </Button>
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3.5 rounded-xl border border-gray-700 bg-[#161616] text-gray-200 hover:bg-white/10 hover:text-white text-xs font-medium transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isLoading && rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Loading activity…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">
              No activity matches these filters.
            </p>
          ) : (
            rows.map((row: any) => {
              const actorName = personName(row.actor);
              const landlordName = personName(row.landlord);
              const status = statusLabel(row.statusCode);
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-gray-800 bg-[#161616] px-3.5 py-3 space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium ${actionTone(
                        row.action,
                        row.statusCode
                      )}`}
                    >
                      {row.action || "activity"}
                    </span>
                    <span className="text-[11px] text-gray-500 tabular-nums">
                      {formatActivityWhen(row.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-100 leading-snug">
                    {row.summary || row.path || "Activity recorded"}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <p>
                      <span className="text-gray-600">Staff:</span>{" "}
                      <span className="text-gray-300">{actorName}</span>
                      {row.actor?.role ? (
                        <span className="text-gray-500"> ({row.actor.role})</span>
                      ) : null}
                      {row.actor?.email ? (
                        <span className="text-gray-600"> · {row.actor.email}</span>
                      ) : null}
                    </p>
                    <p>
                      <span className="text-gray-600">Landlord:</span>{" "}
                      <span className="text-gray-300">{landlordName}</span>
                      {row.landlord?.email ? (
                        <span className="text-gray-600"> · {row.landlord.email}</span>
                      ) : null}
                    </p>
                    {(row.method || row.path) && (
                      <p className="sm:col-span-2 break-all">
                        <span className="text-gray-600">Request:</span>{" "}
                        <span className="text-gray-300">
                          {[row.method, row.path].filter(Boolean).join(" ")}
                        </span>
                      </p>
                    )}
                    {(row.resourceType || row.resourceId) && (
                      <p>
                        <span className="text-gray-600">Resource:</span>{" "}
                        <span className="text-gray-300">
                          {row.resourceType || "item"}
                          {row.resourceId ? ` · ${row.resourceId}` : ""}
                        </span>
                      </p>
                    )}
                    {status && (
                      <p>
                        <span className="text-gray-600">Result:</span>{" "}
                        <span className={status.className}>{status.text}</span>
                      </p>
                    )}
                    {row.sessionId && (
                      <p className="sm:col-span-2 break-all">
                        <span className="text-gray-600">Session:</span>{" "}
                        <span className="text-gray-400 font-mono text-[10px]">
                          {String(row.sessionId).slice(0, 24)}
                          {String(row.sessionId).length > 24 ? "…" : ""}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isFetching && rows.length > 0 ? (
            <p className="text-[11px] text-gray-500 text-center pt-1">Updating…</p>
          ) : null}
        </div>

        <div className="border-t border-gray-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d0d0d]">
          <p className="text-[11px] text-gray-500">
            {total === 0
              ? "Showing 0 results"
              : `Showing ${startIndex}–${endIndex} of ${total}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
              Per page
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-lg bg-[#161616] border border-gray-800 text-xs text-gray-200 px-2 focus:outline-none focus:border-[#027A48]"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-800 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="inline-flex h-8 items-center rounded-lg border border-gray-800 bg-[#161616] px-2.5 text-[11px] text-gray-300 tabular-nums">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-gray-800 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
