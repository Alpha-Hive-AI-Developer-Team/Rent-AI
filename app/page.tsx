"use client";

import Image from "next/image";
import Link from "next/link";

export default function SplashScreen() {
  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-start pt-12">

      {/* Top Bar (OUTSIDE the box) */}
      <div className="w-full max-w-7xl flex items-center justify-between px-6 mb-6">
        
        {/* Left: Logo + RentAI */}
        <div className="flex items-center gap-2 ">
          <Image
            src="/images/rent.png"
            alt="RentAI Logo"
            width={50}
            height={50}
            className="object-contain px-2 py-2 rounded-full border border-[#0B3D2C] hover:border-[#0CEB77]"
          />
          <h2 className="text-lg font-semibold">RentAI</h2>
        </div>

        {/* Right: Sign Up Button */}
        <Link
          href="/auth/sign-up"
          className="px-4 py-1.5 border border-[#0B3D2C] rounded-lg text-sm hover:bg-[#0CEB77]/10 transition"
        >
          Sign Up
        </Link>
      </div>

      {/* Center Box with Border */}
      <div className="w-full max-w-7xl border border-gray-800 rounded-2xl py-40 px-6 text-center">

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <h1
              className="text-5xl md:text-6xl font-bold text-[#0CEB77]
              drop-shadow-[0_0_30px_#0CEB77] mb-4"
            >
              Rent Ai
            </h1>
          </div>

          <p className="text-gray-400 text-sm md:text-base max-w-md mb-6">
            Effortlessly track all rent payments and automatically detect any arrears
            issues as they happen.
          </p>

          <Link href="/auth/sign-in">
            <button
              className="px-6 py-2 rounded-full text-sm md:text-base font-medium
              bg-gradient-to-t from-[#0B3D2C] to-[#000000]
              border border-[#0B3D2C] hover:opacity-90 transition"
            >
              Get Started
            </button>
          </Link>
        </div>
       
      </div>

    </main>
  );
}
