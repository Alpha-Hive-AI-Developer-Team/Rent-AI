"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useResetPassword } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

export default function ResetPasswordWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <ResetPassword />;
}

function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  const resetPassword = useResetPassword();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setPending(true);
    resetPassword.mutate(
      { email, newPassword: password, confirmPassword },
      {
        onSuccess: (data: any) => {
          toast.success(data?.message || "Password reset successfully");
          router.push("/auth/sign-in");
        },
        onError: (err: any) => {
          setPending(false);
          toast.error(
            err?.response?.data?.message ||
              "Failed to reset password. Verify OTP first."
          );
        },
      }
    );
  };

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
      </div>

      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-20 px-10 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold mb-2">
          Set <span className="text-[#0CEB77]">New Password</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Reset password for <span className="text-[#0CEB77]">{email}</span>
        </p>

        <form onSubmit={handleReset} className="flex flex-col gap-4 max-w-md mx-auto">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              required
              minLength={6}
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm
              focus:border-[#0CEB77] outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={pending}
              required
              minLength={6}
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm
              focus:border-[#0CEB77] outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#222] hover:border-[#0CEB77]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Resetting password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>

          <Link
            href="/auth/sign-in"
            className="text-xs text-gray-400 hover:text-[#0CEB77] mt-4"
          >
            Back to Sign in
          </Link>
        </form>
      </div>
    </main>
  );
}
