"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Zap, Lock, LogIn } from "lucide-react";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeFromParam =
    searchParams.get("r") ||
    searchParams.get("ref") ||
    searchParams.get("code") ||
    searchParams.get("referral") ||
    "";
  const code = codeFromParam.trim().toUpperCase();

  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(3);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem("rentai_referral_code", code);
        document.cookie = `rentai_referral_code=${code}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (e) {
        console.warn("Could not save referral code to storage", e);
      }
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    const timer = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setRedirecting(true);
          router.push(`/auth/sign-up?r=${encodeURIComponent(code)}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [code, router]);

  const handleManualContinue = () => {
    setRedirecting(true);
    router.push(code ? `/auth/sign-up?r=${encodeURIComponent(code)}` : "/auth/sign-up");
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-center py-12">
      {/* Top Header */}
      <div className="flex items-center gap-2 mb-8">
        <Image
          src="/images/rent.png"
          alt="RentAI Logo"
          width={44}
          height={44}
          className="object-contain p-2 rounded-full border border-[#0B3D2C]"
        />
        <h1 className="text-xl font-bold tracking-tight">Rent AI</h1>
      </div>

      {/* Main Invitation Card */}
      <div className="w-full max-w-lg bg-[#0e0e0e] border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
        {/* Partner Referral Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#027A48]/15 text-emerald-400 border border-emerald-900/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Partner Invitation Applied</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">You&apos;re Invited to Rent AI</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            {code ? (
              <>
                You were referred with partner code{" "}
                <span className="font-mono font-bold text-white px-1.5 py-0.5 rounded bg-[#161616] border border-gray-800">
                  {code}
                </span>
                . Complete your registration to lock in the standard £299/mo rate.
              </>
            ) : (
              "Complete your registration to automate rent tracking, bank reconciliation, and arrears chasing."
            )}
          </p>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-1 gap-2.5 text-left pt-1">
          <div className="p-3 rounded-xl bg-[#141414] border border-gray-800 flex items-start gap-3">
            <Zap className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Automated Bank Reconciliation</p>
              <p className="text-[11px] text-gray-400">Direct UK bank feed matching and arrears chasing.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-gray-800 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">£299/mo Price Locked</p>
              <p className="text-[11px] text-gray-400">Guaranteed rate protection on your subscription.</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleManualContinue}
            className="w-full py-3 rounded-lg bg-[#027A48] hover:bg-green-700 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            {redirecting ? (
              <span>Loading Registration...</span>
            ) : (
              <>
                <span>Continue to Sign Up {code ? `(${autoRedirectSeconds}s)` : ""}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2">
            <Link
              href="/auth/sign-in"
              className="text-xs text-gray-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Already have an account? Sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-xs">
          <span className="w-4 h-4 border-2 border-t-transparent border-emerald-400 rounded-full animate-spin" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
