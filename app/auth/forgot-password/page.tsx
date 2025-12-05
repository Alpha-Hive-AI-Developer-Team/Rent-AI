"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // You will integrate email sending later
    console.log("Send OTP to:", email);

    // Redirect to OTP screen with email in params
    router.push(`/auth/verify-otp?email=${email}`);
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
      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-20 px-10 text-center shadow-2xl">
        <h1 className="text-2xl font-semibold mb-2">
          Reset <span className="text-[#0CEB77]">Password</span>
        </h1>
        <p className="text-gray-400 text-sm mb-10">
          Enter your email to receive a 6-digit OTP.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-md mx-auto"
        >
          {/* Email */}
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-9 py-2 text-sm 
              focus:border-[#0CEB77] outline-none"
            />
          </div>

          {/* Send OTP */}
              <Link
            href="/auth/otp">
          <button
            type="submit"
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-[#222] transition"
          >
            Send OTP
          </button>
          </Link>


          {/* Back to Login */}
          <Link
            href="/auth/sign-in"
            className="text-xs text-gray-400 hover:text-[#0CEB77] flex items-center justify-center gap-1 mt-4"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </form>
      </div>
    </main>
  );
}
