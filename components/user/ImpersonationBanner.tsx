"use client";

import { LogOut } from "lucide-react";
import { useImpersonationBanner } from "@/hooks/useImpersonation";

export default function ImpersonationBanner() {
  const { active, displayName, landlord, exit, exiting } = useImpersonationBanner();

  if (!active) return null;

  return (
    <div className="sticky top-0 z-[60] w-full border-b border-amber-700/40 bg-amber-950/90 text-amber-50 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <p className="text-xs sm:text-sm">
          <span className="font-semibold">Acting as {displayName}</span>
          {landlord?.email ? (
            <span className="text-amber-200/80"> ({landlord.email})</span>
          ) : null}
          <span className="text-amber-200/70"> · Bank link and payouts stay locked</span>
        </p>
        <button
          type="button"
          onClick={exit}
          disabled={exiting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-900/60 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-800/70 disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" />
          {exiting ? "Exiting…" : "Exit to Admin"}
        </button>
      </div>
    </div>
  );
}
