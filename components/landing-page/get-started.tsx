"use client";

import { Button } from "@/components/ui/button"; // optional if you already have a button component

export default function GetStarted() {
  return (
    <section className="relative bg-black text-white flex flex-col items-center justify-center min-h-[80vh] px-6 text-center overflow-hidden">
      {/* Top white line + centered glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl">
        {/* White line */}
        <div className="h-[1px] bg-white/40"></div>

        {/* Centered glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[140px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="z-10 max-w-3xl mx-auto">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 mt-8">
          Manage Rent. Detect <br className="hidden sm:block" /> Arrears. Relax.
        </h1>

        {/* Subheading */}
        <p className="text-[#CACACA] text-base sm:text-lg max-w-2xl mx-auto mb-8">
          RentAI uses real-time banking data and machine learning to keep your
          portfolio balanced. Access your dashboard, sign in or create a new
          account today.
        </p>

        {/* Button */}
        <button className="bg-[#027A48] hover:bg-[#02653d] text-white px-6 py-2 rounded-md text-sm font-medium transition">
          Get Started
        </button>
      </div>
    </section>
  );
}
