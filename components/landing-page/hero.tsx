"use client";

import { Phone } from "lucide-react";
import Image from "next/image";
import ChatWidget from "@/components/landing-page/chat-widget";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20 md:py-32 bg-black text-white overflow-hidden">
      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl leading-snug sm:leading-tight">
        Automate Rent Tracking & Arrears Detection with AI
      </h1>

      {/* Description */}
      <p className="text-[#CBCBCB] mb-10 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed px-2">
        RentAI uses Open Banking and AI to automate rent payments, detect
        arrears, and reduce manual work.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
        {/* Book a Demo Button */}
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white text-[#171717] border border-gray-500 hover:bg-gray-100 transition text-sm sm:text-base font-medium">
          <Phone className="w-5 h-5 text-[#171717]" />
          <span>Book a Demo</span>
        </button>

        {/* Start Free Button */}
        <Link href="/auth/splash-screen">
          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#027A48] hover:bg-[#02653d] text-white transition text-sm sm:text-base font-medium">
            <Image src="/images/start.png" alt="start" width={20} height={20} />
            <span>Start Free</span>
          </button>
        </Link>
      </div>

      {/* Chat Widget (hidden on very small screens for spacing) */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30">
        <ChatWidget />
      </div>
    </section>
  );
}
