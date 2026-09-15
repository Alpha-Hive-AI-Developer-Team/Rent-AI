"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getPolicyVersions,
  readLocalCookieConsent,
  recordCookieConsent,
  writeLocalCookieConsent,
} from "@/lib/api/consentApi";

/**
 * Anonymous / logged-out cookie banner.
 * Logged-in users are handled by LegalReconsentGate when versions change.
 */
export default function CookieConsentBanner() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [cookieVersion, setCookieVersion] = useState("1.0");

  useEffect(() => {
    if (authLoading) return;
    // Logged-in reconsent is handled by LegalReconsentGate
    if (user) {
      setVisible(false);
      return;
    }

    (async () => {
      let version = "1.0";
      try {
        const res = await getPolicyVersions();
        version = res?.data?.cookies || "1.0";
      } catch {
        // keep default
      }
      setCookieVersion(version);
      const stored = readLocalCookieConsent(version);
      setVisible(!stored);
    })();
  }, [pathname, user, authLoading]);

  const saveConsent = async (status: "accepted" | "rejected") => {
    writeLocalCookieConsent(status, cookieVersion);
    setVisible(false);

    try {
      await recordCookieConsent({
        status,
        categories: {
          necessary: true,
          analytics: status === "accepted",
          marketing: false,
        },
      });
    } catch {
      // Banner still closes; server record is best-effort
    }
  };

  if (!visible || user) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 md:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#0c0c0c]/95 p-4 shadow-2xl backdrop-blur md:flex-row md:items-center md:justify-between md:p-5">
        <div className="text-sm text-gray-300">
          <p className="mb-1 font-medium text-white">We use cookies</p>
          <p>
            Necessary cookies keep Rent Ai secure and signed in. Optional analytics cookies help us improve the product.
            See our{" "}
            <Link href="/privacy-policy" className="text-emerald-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveConsent("rejected")}
            className="rounded-full border border-[#2A2A2A] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
