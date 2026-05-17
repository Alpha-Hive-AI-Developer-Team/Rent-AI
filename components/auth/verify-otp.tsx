"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  useVerifySignupOtp,
  useVerifyResetOtp,
  useResendOtp,
} from "@/hooks/useAuth";
import toast from "react-hot-toast";

type Props = {
  email: string;
  onClose?: () => void;
  /** signup = account verification after register; reset = forgot-password flow */
  mode?: "signup" | "reset";
  /** modal = overlay; page = inline card on dedicated route */
  variant?: "modal" | "page";
};

export default function VerifyOtpModal({
  email,
  onClose,
  mode = "signup",
  variant = "modal",
}: Props) {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);

  const verifySignup = useVerifySignupOtp();
  const verifyReset = useVerifyResetOtp();
  const resendOtp = useResendOtp();

  const otpPurpose = mode === "reset" ? "reset" : "signup";

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      toast.error("Enter the 4-digit OTP");
      return;
    }

    setPending(true);

    if (mode === "reset") {
      verifyReset.mutate(
        { email, otp: finalOtp },
        {
          onSuccess: (data: any) => {
            toast.success(data?.message || "OTP verified");
            router.push(
              `/auth/reset-password?email=${encodeURIComponent(email)}`
            );
          },
          onError: (err: any) => {
            setPending(false);
            toast.error(
              err?.response?.data?.message || "OTP verification failed"
            );
          },
        }
      );
      return;
    }

    verifySignup.mutate(
      { email, otp: finalOtp },
      {
        onSuccess: (data: any) => {
          setPending(false);
          toast.success(data?.message || "OTP verified successfully");
          onClose?.();
        },
        onError: (err: any) => {
          setPending(false);
          toast.error(
            err?.response?.data?.message || "OTP verification failed"
          );
        },
      }
    );
  };

  const handleResend = () => {
    if (!canResend || resendPending || pending) return;

    setResendPending(true);
    resendOtp.mutate(
      { email, purpose: otpPurpose },
      {
        onSuccess: (data: any) => {
          setOtp(["", "", "", ""]);
          setTimer(60);
          setCanResend(false);
          inputRefs.current[0]?.focus();
          toast.success(data?.message || "OTP resent");
          setResendPending(false);
        },
        onError: (err: any) => {
          setResendPending(false);
          toast.error(err?.response?.data?.message || "Failed to resend OTP");
        },
      }
    );
  };

  const card = (
    <div
      className={`relative w-full max-w-md bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-8 px-8 text-center shadow-2xl ${
        variant === "modal" ? "z-10" : ""
      }`}
    >
      <h1 className="text-2xl font-semibold mb-2">
        Verify <span className="text-[#0CEB77]">OTP</span>
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        Enter the 4-digit code sent to{" "}
        <span className="text-[#0CEB77]">{email}</span>
      </p>

      <p className="text-xs text-gray-500 mb-6">
        {canResend ? (
          <span className="text-[#0CEB77]">You can now resend OTP</span>
        ) : (
          <>
            Resend OTP in <span className="text-[#0CEB77]">{timer}s</span>
          </>
        )}
      </p>

      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-between gap-2 mb-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={pending || resendPending}
              className="w-12 h-12 text-center text-lg bg-transparent border border-[#2a2a2a] rounded-lg focus:border-[#0CEB77] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={pending || otp.join("").length !== 4}
          className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#222] hover:border-[#0CEB77]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>

        <button
          type="button"
          disabled={!canResend || resendPending || pending}
          onClick={handleResend}
          className="text-xs text-[#0CEB77] hover:text-[#0CEB77]/70 transition disabled:text-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {resendPending ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-t-transparent border-[#0CEB77] rounded-full animate-spin" />
              Resending...
            </>
          ) : (
            "Resend OTP"
          )}
        </button>

        {variant === "modal" && onClose ? (
          <button
            type="button"
            onClick={onClose}
            disabled={pending || resendPending}
            className="mt-2 text-sm text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        ) : (
          <Link
            href="/auth/forgot-password"
            className="text-xs text-gray-400 hover:text-[#0CEB77] flex items-center justify-center gap-1"
          >
            <ArrowLeft size={14} /> Back
          </Link>
        )}
      </form>
    </div>
  );

  if (variant === "page") {
    return card;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!pending && !resendPending) onClose?.();
        }}
      />
      {card}
    </div>
  );
}
