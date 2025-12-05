"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("New Password:", password);

    // After success redirect
    router.push("/auth/sign-in");
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
      </div>

      {/* Card */}
      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-20 px-10 text-center">
        <h1 className="text-2xl font-semibold mb-2">Set <span className="text-[#0CEB77]">New Password</span></h1>
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
              className="w-full bg-transparent border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm
              focus:border-[#0CEB77] outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#1A1A1A] border border-[#2a2a2a] py-2 rounded-lg text-sm hover:bg-[#222] transition"
          >
            Reset Password
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
