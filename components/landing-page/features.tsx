"use client";

import Image from "next/image";

export default function Features() {
  return (
    <section className="bg-black text-white px-6 md:px-16 py-20">
      {/* Heading */}
      <div className="text-left mb-16 max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Manage Rent, Automatically.
        </h2>
        <p className="text-[#CACACA] max-w-3xl mx-auto text-sm md:text-base">
          RentAI handles reconciliation, arrears detection, and tenant
          communication — automatically.
        </p>
      </div>

      {/* Features Title */}
      <h3 className="text-3xl font-semibold mb-8">Features</h3>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Card 1 */}
          <div className="group border border-gray-700 rounded-xl p-6 bg-gradient-to-b from-[#111] to-[#000] transition-all duration-300 hover:border-gray-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-gray-700/30">
            <div className="text-sm font-semibold mb-20 bg-white text-black w-8 h-8 flex items-center justify-center rounded-full">
              01
            </div>
            <h4 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition">
              AI-Powered Matching
            </h4>
            <p className="text-white text-sm leading-relaxed">
              Self-learning AI that automatically improves match accuracy over
              time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group border border-gray-700 rounded-xl p-6 bg-[#D1FAE5] text-black transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-emerald-300/30 hover:border-emerald-400">
            <div className="text-sm font-semibold mb-10 bg-black text-white w-8 h-8 flex items-center justify-center rounded-full">
              03
            </div>
            <h4 className="text-lg font-semibold mb-2 group-hover:text-emerald-700 transition">
              Finance Integrations
            </h4>
            <p className="text-black text-sm leading-relaxed">
              Seamlessly synchronize your financial data with Xero, QuickBooks,
              and Stripe.
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Card 3 - Large */}
          <div className="group border border-gray-700 rounded-xl p-6 bg-gradient-to-b from-[#111] to-[#000] transition-all duration-300 hover:border-gray-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-gray-700/30">
            <div className="text-sm font-semibold mb-14 bg-white text-black w-8 h-8 flex items-center justify-center rounded-full">
              02
            </div>
            <h4 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition">
              Arrears Dashboard
            </h4>
            <p className="text-white text-sm leading-relaxed">
              Get a real-time, centralized dashboard to monitor all tenant
              arrears instantly.
            </p>
          </div>

          {/* Two small cards below */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 4 */}
            <div className="group border border-gray-700 rounded-xl p-6 bg-gradient-to-b from-[#111] to-[#000] transition-all duration-300 hover:border-gray-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-gray-700/30 flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold mb-10 bg-white text-black w-8 h-8 flex items-center justify-center rounded-full">
                  04
                </div>
                <h4 className="text-lg font-semibold mb-2 group-hover:text-green-400 transition">
                  Automated Reminders
                </h4>
                <p className="text-white text-sm leading-relaxed">
                  Automatically send payment reminders via Email, SMS, or
                  WhatsApp.
                </p>
              </div>
            </div>

            {/* Card 5 with logo */}
            <div className="group border border-[#027A48] rounded-xl p-6 bg-gradient-to-b from-[#111] to-[#000] transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 flex items-center justify-center">
              <Image
                src="/images/logo-transparent.png"
                alt="AI Chess Icon"
                width={150}
                height={150}
                className="object-contain group-hover:opacity-90 transition"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
