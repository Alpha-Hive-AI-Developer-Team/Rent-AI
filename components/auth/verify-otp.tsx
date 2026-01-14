"use client";

import React, { useEffect, useRef, useState } from "react";
import { useVerifySignupOtp } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  email: string;
  onClose?: () => void;
};

export default function VerifyOtpModal({ email, onClose }: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);



  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const { mutate } = useVerifySignupOtp();
  const [loading, setLoading] = useState(false);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
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


        setLoading(true);
      mutate(
      { email, otp: finalOtp },
      {
        onSuccess: (data: any) => {
          setLoading(false);
          toast.success(data?.message || "OTP verified successfully");
          onClose?.();
        },
        onError: (err: any) => {
          setLoading(false);
          const message = err?.response?.data?.message || "OTP verification failed";
          toast.error(message);
        },
      }
    );
  };






  const handleResend = () => {
    setOtp(["", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    inputRefs.current[0]?.focus();
    toast.success("OTP resent");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-8 px-8 text-center shadow-2xl z-10">
        <h1 className="text-2xl font-semibold mb-2">Verify <span className="text-[#0CEB77]">OTP</span></h1>
        <p className="text-gray-400 text-sm mb-6">
          Enter the 4-digit code sent to <span className="text-[#0CEB77]">{email}</span>
        </p>

        <p className="text-xs text-gray-500 mb-6">
          {canResend ? (
            <span className="text-[#0CEB77]">You can now resend OTP</span>
          ) : (
            <>Resend OTP in <span className="text-[#0CEB77]">{timer}s</span></>
          )}
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-between gap-2 mb-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center text-lg bg-transparent border border-[#2a2a2a] rounded-lg focus:border-[#0CEB77] outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 4}
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2 rounded-lg text-sm hover:bg-[#222] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
                Verifying...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>

          <button
            type="button"
            disabled={!canResend}
            onClick={handleResend}
            className="text-xs text-[#0CEB77] hover:text-[#0CEB77]/70 transition disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Resend OTP
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-sm text-gray-400 hover:text-white"
          >
            Close
          </button>
        </form>
      </div>
    </div>
  );
}
