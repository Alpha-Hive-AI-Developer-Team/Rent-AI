"use client";

import Image from "next/image";
import Link from "next/link";

export default function SplashScreen() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white text-center px-4">
      {/* Logo and Title */}
      <div className="flex items-center gap-2 mb-4">
        <Image
          src="/images/rent.png" 
          alt="RentAI Logo"
          width={80}
          height={80}
          className="object-contain"
        />
        <h1 className="text-3xl md:text-4xl font-bold">RentAI</h1>
      </div>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm md:text-base max-w-md mb-6">
        Effortlessly track all rent payments and automatically detect any arrears
        issues as they happen.
      </p>

      {/* Button */}
      <Link href="/auth/sign-up">
      <button
        className="px-6 py-2 rounded-full text-sm md:text-base font-medium
        bg-gradient-to-t from-[#0B3D2C] to-[#000000]
        border border-[#0B3D2C] hover:opacity-90 transition"
      >
        Get Started
      </button>
      </Link>
    </main>
  );
}
