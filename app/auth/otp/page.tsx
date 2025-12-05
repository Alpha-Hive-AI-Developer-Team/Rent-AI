"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VerifyOtp() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const router = useRouter();

  // OTP state: array of 6 boxes
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);

  // Refs for auto-focusing
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer (60 seconds)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown logic
  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle OTP input box typing
  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next box
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Backspace moves focus to previous
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    const finalOtp = otp.join("");
    console.log("Verify OTP:", finalOtp);

    // Simulate OTP success
    router.push(`/auth/reset-password?email=${email}`);
  };

  // Resend OTP
  const handleResend = () => {
    console.log("Resend OTP to:", email);

    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);

    // Focus first box again
    inputRefs.current[0]?.focus();
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-start pt-12">

      {/* Top Navigation */}
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

      {/* Card */}
      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-20 px-10 text-center">
        <h1 className="text-2xl font-semibold mb-2">Verify <span className="text-[#0CEB77]">OTP</span></h1>
        <p className="text-gray-400 text-sm mb-6">
          Enter the 6-digit code sent to <span className="text-[#0CEB77]">{email}</span>
        </p>

        {/* Timer */}
        <p className="text-xs text-gray-500 mb-6">
          {canResend ? (
            <span className="text-[#0CEB77]">You can now resend OTP</span>
          ) : (
            <>Resend OTP in <span className="text-[#0CEB77]">{timer}s</span></>
          )}
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-6 max-w-xs mx-auto">

          {/* OTP Boxes */}
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-10 h-12 text-center text-lg bg-transparent border border-[#2a2a2a] rounded-lg focus:border-[#0CEB77] outline-none"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={otp.join("").length !== 6}
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2 rounded-lg text-sm hover:bg-[#222] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Verify OTP
          </button>

          {/* Resend Button */}
           <Link
            href="/auth/reset-password">
          <button
            type="button"
            disabled={!canResend}
            onClick={handleResend}
            className="text-xs text-[#0CEB77] hover:text-[#0CEB77]/70 transition disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Resend OTP
          </button>
          </Link>

          {/* Back */}
          <Link
            href="/auth/forgot-password"
            className="text-xs text-gray-400 hover:text-[#0CEB77] flex items-center justify-center gap-1 mt-1"
          >
            <ArrowLeft size={14} /> Go Back
          </Link>
        </form>
      </div>
    </main>
  );
}
