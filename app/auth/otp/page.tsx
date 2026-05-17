"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import VerifyOtpModal from "@/components/auth/verify-otp";

export const dynamic = "force-dynamic";

export default function VerifyOtpPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!email) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <p className="text-gray-400">
          Missing email.{" "}
          <Link href="/auth/forgot-password" className="text-[#0CEB77] hover:underline">
            Start over
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-start pt-12">
      <div className="w-full max-w-6xl flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-2">
          <Image
            src="/images/rent.png"
            alt="RentAI Logo"
            width={50}
            height={50}
            className="object-contain px-2 py-2 rounded-full border border-[#0B3D2C] hover:border-[#0CEB77]"
          />
          <h2 className="text-lg font-semibold">Rent Ai</h2>
        </div>
        <Link
          href="/auth/sign-in"
          className="px-4 py-1.5 border border-[#0B3D2C] rounded-lg text-sm hover:bg-[#0CEB77]/10 transition"
        >
          Sign In
        </Link>
      </div>

      <VerifyOtpModal email={email} mode="reset" variant="page" />
    </main>
  );
}
