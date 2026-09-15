import apiClient from "./api-client";

export type ConsentStatus = {
  currentVersions: { privacy: string; terms: string; cookies: string };
  privacy: { required: boolean; acceptedVersion: string | null; acceptedAt: string | null };
  terms: { required: boolean; acceptedVersion: string | null; acceptedAt: string | null };
  cookies: {
    required: boolean;
    acceptedVersion: string | null;
    acceptedAt: string | null;
    status: string | null;
  };
  requiresAction: boolean;
};

export async function getPolicyVersions() {
  const res = await apiClient.get("/consent/versions");
  return res.data;
}

export async function getMyConsentStatus(): Promise<{ success: boolean; data: ConsentStatus }> {
  const res = await apiClient.get("/consent/status");
  return res.data;
}

export async function recordCookieConsent(payload: {
  email?: string;
  status: "accepted" | "rejected" | "custom";
  categories?: { necessary?: boolean; analytics?: boolean; marketing?: boolean };
}) {
  const res = await apiClient.post("/consent/cookies", payload);
  return res.data;
}

export async function recordLegalReconsent(payload: {
  acceptedPrivacyPolicy?: boolean;
  acceptedTerms?: boolean;
  cookieStatus?: "accepted" | "rejected" | "custom";
  categories?: { necessary?: boolean; analytics?: boolean; marketing?: boolean };
}) {
  const res = await apiClient.post("/consent/reaccept", payload);
  return res.data;
}

export const COOKIE_STORAGE_KEY = "rentai_cookie_consent";

export function readLocalCookieConsent(expectedVersion?: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      status: "accepted" | "rejected";
      version: string;
      acceptedAt: string;
    };
    if (expectedVersion && parsed?.version !== expectedVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalCookieConsent(status: "accepted" | "rejected", version: string) {
  localStorage.setItem(
    COOKIE_STORAGE_KEY,
    JSON.stringify({
      status,
      version,
      acceptedAt: new Date().toISOString(),
    })
  );
}
