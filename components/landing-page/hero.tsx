"use client";

import { Phone } from "lucide-react";
import Image from "next/image";
import ChatWidget from "@/components/landing-page/chat-widget";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-black text-white overflow-hidden">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl leading-tight">
        Automate Rent Tracking & Arrears Detection with AI
      </h1>

      <p className="text-[#CBCBCB] mb-8 max-w-2xl text-sm md:text-base">
        RentAI uses Open Banking and AI to automate rent payments, detect
        arrears, and reduce manual work.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Book a Demo Button */}
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white text-[#171717] border border-gray-500 hover:bg-gray-100 transition">
          <Phone className="w-5 h-5 text-[#171717]" />
          <span>Book a Demo</span>
        </button>

        {/* Start Free Button */}
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#027A48] hover:bg-[#02653d] text-white transition">
          <Image src="/images/start.png" alt="start" width={20} height={20} />
          <span>Start Free</span>
        </button>
      </div>

      {/* Chat Widget pinned inside hero */}
      <div className="absolute bottom-6 right-6 z-30">
        <ChatWidget />
      </div>
    </section>
  );
}
