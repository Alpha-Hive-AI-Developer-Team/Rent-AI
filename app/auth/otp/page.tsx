"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import VerifyOtpModal from "@/components/auth/verify-otp";

// Ensure this page is always client-rendered
export const dynamic = "force-dynamic";

export default function VerifyOtpWrapper() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return <VerifyOtpModal email={email} />;
}
