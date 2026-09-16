"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ConsentStatus,
  getMyConsentStatus,
  recordLegalReconsent,
  writeLocalCookieConsent,
} from "@/lib/api/consentApi";

const LEGAL_DOC_ROUTES = ["/privacy-policy", "/terms-and-conditions"];

/**
 * Blocks logged-in users until they accept updated Privacy / Terms / Cookies versions.
 * Hidden on privacy/terms pages so users can read the documents.
 */
export default function LegalReconsentGate() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<"accepted" | "rejected" | "">("");

  const isLegalDocPage = LEGAL_DOC_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyConsentStatus();
      setStatus(res?.data || null);
      setAcceptPrivacy(false);
      setAcceptTerms(false);
      setCookieChoice("");
    } catch (err) {
      console.error("Failed to load consent status", err);
      // Don't block the whole app if the check fails unexpectedly
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setStatus(null);
      return;
    }
    loadStatus();
  }, [user, authLoading, loadStatus]);

  const onSubmit = async () => {
    if (!status) return;

    if (status.privacy.required && !acceptPrivacy) {
      toast.error("Please accept the updated Privacy Policy.");
      return;
    }
    if (status.terms.required && !acceptTerms) {
      toast.error("Please accept the updated Terms & Conditions.");
      return;
    }
    if (status.cookies.required && !cookieChoice) {
      toast.error("Please choose a cookie preference.");
      return;
    }

    setSaving(true);
    try {
      const res = await recordLegalReconsent({
        acceptedPrivacyPolicy: status.privacy.required ? true : undefined,
        acceptedTerms: status.terms.required ? true : undefined,
        cookieStatus:
          status.cookies.required && (cookieChoice === "accepted" || cookieChoice === "rejected")
            ? cookieChoice
            : undefined,
        categories:
          cookieChoice === "accepted"
            ? { necessary: true, analytics: true, marketing: false }
            : { necessary: true, analytics: false, marketing: false },
      });

      if (
        (cookieChoice === "accepted" || cookieChoice === "rejected") &&
        status.currentVersions?.cookies
      ) {
        writeLocalCookieConsent(cookieChoice, status.currentVersions.cookies);
      }

      const next = res?.data as ConsentStatus | undefined;
      if (next?.requiresAction) {
        setStatus(next);
        toast.error("Please complete all required acceptances.");
      } else {
        setStatus(next || { ...status, requiresAction: false });
        toast.success("Preferences saved. You can continue.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save updated consents.");
    } finally {
      setSaving(false);
    }
  };

  if (isLegalDocPage || authLoading || !user || loading || !status?.requiresAction) {
    return null;
  }

  const versions = status.currentVersions;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-[#0c0c0c] p-6 text-white shadow-2xl">
        <h2 className="text-lg font-semibold mb-1">Updated policies require your acceptance</h2>
        <p className="text-sm text-gray-400 mb-5">
          Our legal documents or cookie policy have been updated. Please review and accept the items below to continue using Rent Ai.
        </p>

        <div className="space-y-4 mb-6">
          {status.privacy.required && (
            <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptPrivacy}
                onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                I accept the updated{" "}
                <Link href="/privacy-policy" target="_blank" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>{" "}
                (v{versions.privacy})
                {status.privacy.acceptedVersion ? (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Previously accepted: v{status.privacy.acceptedVersion}
                  </span>
                ) : (
                  <span className="block text-xs text-gray-500 mt-0.5">No previous acceptance on file</span>
                )}
              </span>
            </label>
          )}

          {status.terms.required && (
            <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                I accept the updated{" "}
                <Link href="/terms-and-conditions" target="_blank" className="text-emerald-400 hover:underline">
                  Terms &amp; Conditions
                </Link>{" "}
                (v{versions.terms})
                {status.terms.acceptedVersion ? (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Previously accepted: v{status.terms.acceptedVersion}
                  </span>
                ) : (
                  <span className="block text-xs text-gray-500 mt-0.5">No previous acceptance on file</span>
                )}
              </span>
            </label>
          )}

          {status.cookies.required && (
            <div className="rounded-lg border border-[#222] bg-[#080808] p-3 space-y-3">
              <p className="text-sm text-gray-300">
                Cookie preference (v{versions.cookies})
                {status.cookies.acceptedVersion ? (
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Previously: v{status.cookies.acceptedVersion}
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCookieChoice("rejected")}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    cookieChoice === "rejected"
                      ? "border-emerald-600 text-emerald-300 bg-emerald-950/30"
                      : "border-[#2A2A2A] text-gray-300"
                  }`}
                >
                  Necessary only
                </button>
                <button
                  type="button"
                  onClick={() => setCookieChoice("accepted")}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    cookieChoice === "accepted"
                      ? "border-emerald-600 text-emerald-300 bg-emerald-950/30"
                      : "border-[#2A2A2A] text-gray-300"
                  }`}
                >
                  Accept all cookies
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="w-full rounded-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 py-2.5 text-sm font-medium"
        >
          {saving ? "Saving..." : "Accept and continue"}
        </button>
      </div>
    </div>
  );
}
