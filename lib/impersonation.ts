export const IMPERSONATION_SESSION_KEY = "impersonateSessionId";
export const IMPERSONATION_LANDLORD_KEY = "impersonateLandlord";

export type ImpersonationLandlord = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
  planType?: string;
};

export function getImpersonationSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(IMPERSONATION_SESSION_KEY);
}

export function getStoredImpersonationLandlord(): ImpersonationLandlord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_LANDLORD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImpersonationLandlord;
  } catch {
    return null;
  }
}

export function setImpersonationSession(
  sessionId: string,
  landlord: ImpersonationLandlord | null
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(IMPERSONATION_SESSION_KEY, sessionId);
  if (landlord) {
    sessionStorage.setItem(IMPERSONATION_LANDLORD_KEY, JSON.stringify(landlord));
  }
}

export function clearImpersonationSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(IMPERSONATION_SESSION_KEY);
  sessionStorage.removeItem(IMPERSONATION_LANDLORD_KEY);
}

export function isImpersonating(): boolean {
  return Boolean(getImpersonationSessionId());
}

export function landlordDisplayName(landlord?: ImpersonationLandlord | null) {
  if (!landlord) return "Landlord";
  const name = `${landlord.firstName || ""} ${landlord.lastName || ""}`.trim();
  return name || landlord.email || "Landlord";
}
