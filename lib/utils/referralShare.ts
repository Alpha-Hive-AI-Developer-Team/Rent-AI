/**
 * Build share URLs that open the correct native/web share surfaces
 * with the partner referral link included.
 */
export function buildReferralShareUrls(referralLink: string, referralCode?: string) {
  const link = String(referralLink || "").trim();
  const code = String(referralCode || "").trim().toUpperCase();
  const message = code
    ? `Automate rent collection with Rent AI. Sign up with my link: ${link} (code ${code})`
    : `Automate rent collection with Rent AI. Sign up with my link: ${link}`;

  const encodedMessage = encodeURIComponent(message);
  const encodedLink = encodeURIComponent(link);
  const encodedSubject = encodeURIComponent("You're invited to Rent AI");

  return {
    message,
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
    // X (Twitter) — intent/tweet still works for both twitter.com and x.com clients
    x: `https://twitter.com/intent/tweet?url=${encodedLink}&text=${encodeURIComponent(
      code ? `Automate rent collection with Rent AI (code ${code})` : "Automate rent collection with Rent AI"
    )}`,
    email: `mailto:?subject=${encodedSubject}&body=${encodedMessage}`,
  };
}

export function openShareUrl(url: string) {
  if (!url || typeof window === "undefined") return;
  // mailto: should use location for better mail-client handoff
  if (url.startsWith("mailto:")) {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
