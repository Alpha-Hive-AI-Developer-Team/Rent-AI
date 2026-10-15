/**
 * Resolves the referral URL dynamically using the current window origin (whether local or production)
 * or fallback to environment variables.
 * Formatted as `/join?r=CODE` for 100% compatibility with Next.js static exports (output: 'export').
 */
export function resolveReferralLink(rawLink?: string, code?: string): string {
  const origin =
    (typeof window !== "undefined" && window.location?.origin) ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_API_BASE_CALLBACK ||
    "http://localhost:3000";

  const cleanOrigin = origin.replace(/\/$/, "");
  const cleanCode = (code || "PARTNER10").trim().toUpperCase();

  return `${cleanOrigin}/join?r=${cleanCode}`;
}
