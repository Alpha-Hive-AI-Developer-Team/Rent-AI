"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import VerifyOtpModal from "@/components/auth/verify-otp";
import { withGuest } from "@/hooks/withGuest";

export const dynamic = "force-dynamic";

function VerifyOtpPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!email) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(12,235,119,0.08),_transparent_55%)]" />
        <p className="relative text-gray-400">
          Missing email.{" "}
          <Link href="/auth/forgot-password" className="text-[#0CEB77] hover:underline">
            Start over
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-black px-4 pb-16 pt-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(12,235,119,0.09),_transparent_50%)]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#0B3D2C]/20 blur-3xl" />

      <div className="relative z-10 mb-10 flex w-full max-w-5xl items-center justify-between px-2">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/rent.png"
            alt="RentAI Logo"
            width={50}
            height={50}
            className="rounded-full border border-[#0B3D2C] object-contain px-2 py-2 transition hover:border-[#0CEB77]"
          />
          <h2 className="text-lg font-semibold">Rent Ai</h2>
        </Link>
        <Link
          href="/auth/sign-in"
          className="rounded-lg border border-[#0B3D2C] px-4 py-1.5 text-sm transition hover:bg-[#0CEB77]/10"
        >
          Sign In
        </Link>
      </div>

      <div className="relative z-10 flex w-full flex-1 items-start justify-center sm:items-center">
        <VerifyOtpModal email={email} mode="reset" variant="page" />
      </div>
    </main>
  );
}

export default withGuest(VerifyOtpPage);
