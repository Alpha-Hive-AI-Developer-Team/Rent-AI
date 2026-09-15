"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
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
  const [shake, setShake] = useState(false);

  const verifySignup = useVerifySignupOtp();
  const verifyReset = useVerifyResetOtp();
  const resendOtp = useResendOtp();

  const otpPurpose = mode === "reset" ? "reset" : "signup";
  const otpValue = otp.join("");
  const isComplete = otpValue.length === 4;
  const timerProgress = ((60 - timer) / 60) * 100;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const fillOtp = (digits: string) => {
    const next = digits.replace(/\D/g, "").slice(0, 4).split("");
    const padded = [...next, "", "", "", ""].slice(0, 4);
    setOtp(padded);
    const focusIndex = Math.min(next.length, 3);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) {
      fillOtp(value);
      return;
    }
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < otp.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillOtp(e.clipboardData.getData("text"));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length !== 4) {
      triggerShake();
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
            triggerShake();
            setOtp(["", "", "", ""]);
            inputRefs.current[0]?.focus();
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
          triggerShake();
          setOtp(["", "", "", ""]);
          inputRefs.current[0]?.focus();
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

  const backHref = mode === "reset" ? "/auth/forgot-password" : "/auth/sign-up";
  const subtitle =
    mode === "reset"
      ? "We sent a reset code to your inbox"
      : "Confirm your email to finish creating your account";

  const card = (
    <div
      className={`otp-card relative w-full max-w-md overflow-hidden rounded-3xl border border-[#1f1f1f] bg-[#0E0E0E]/95 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm ${
        variant === "modal" ? "z-10" : ""
      } ${shake ? "otp-shake" : ""}`}
    >
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#0CEB77]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0CEB77]/40 to-transparent" />

      <div className="relative px-7 py-9 sm:px-9">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0B3D2C] bg-[#061510] shadow-[0_0_28px_rgba(12,235,119,0.12)]">
          <ShieldCheck className="h-7 w-7 text-[#0CEB77]" strokeWidth={1.75} />
        </div>

        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#0CEB77]/80">
          {mode === "reset" ? "Password reset" : "Email verification"}
        </p>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
          Verify your code
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-gray-400">{subtitle}</p>

        <div className="mb-7 flex items-center justify-center gap-2 rounded-full border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-xs text-gray-400">
          <Mail className="h-3.5 w-3.5 shrink-0 text-[#0CEB77]" />
          <span className="truncate text-[#0CEB77]">{email}</span>
        </div>

        {/* timer bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Code expires soon</span>
            {canResend ? (
              <span className="text-[#0CEB77]">Ready to resend</span>
            ) : (
              <span className="tabular-nums text-[#0CEB77]">{timer}s</span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#1a1a1a]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B3D2C] to-[#0CEB77] transition-[width] duration-1000 ease-linear"
              style={{ width: `${canResend ? 100 : timerProgress}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                disabled={pending || resendPending}
                aria-label={`Digit ${index + 1}`}
                className={`h-14 w-12 rounded-xl border bg-[#0a0a0a] text-center text-xl font-semibold text-white outline-none transition duration-200 sm:h-16 sm:w-14 sm:text-2xl disabled:cursor-not-allowed disabled:opacity-50 ${
                  digit
                    ? "border-[#0CEB77]/55 shadow-[0_0_0_1px_rgba(12,235,119,0.15)]"
                    : "border-[#2a2a2a]"
                } focus:border-[#0CEB77] focus:shadow-[0_0_0_3px_rgba(12,235,119,0.12)]`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={pending || !isComplete}
            className={`w-full rounded-full py-3 text-sm font-medium transition disabled:cursor-not-allowed ${
              isComplete && !pending
                ? "border border-[#0B3D2C] bg-gradient-to-t from-[#0B3D2C] to-[#062018] text-white hover:opacity-95 shadow-[0_0_24px_rgba(12,235,119,0.15)]"
                : "border border-[#2a2a2a] bg-[#141414] text-gray-500"
            }`}
          >
            {pending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>

          <div className="space-y-3">
            <button
              type="button"
              disabled={!canResend || resendPending || pending}
              onClick={handleResend}
              className="mx-auto flex items-center justify-center gap-2 text-sm text-[#0CEB77] transition hover:text-[#0CEB77]/80 disabled:cursor-not-allowed disabled:text-gray-600"
            >
              {resendPending ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0CEB77] border-t-transparent" />
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
                className="text-sm text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            ) : (
              <Link
                href={backHref}
                className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-400 transition hover:text-[#0CEB77]"
              >
                <ArrowLeft size={14} /> Back
              </Link>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        .otp-card {
          animation: otpFadeIn 0.45s ease-out;
        }
        .otp-shake {
          animation: otpShake 0.45s ease-in-out;
        }
        @keyframes otpFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes otpShake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );

  if (variant === "page") {
    return card;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={() => {
          if (!pending && !resendPending) onClose?.();
        }}
      />
      {card}
    </div>
  );
}
