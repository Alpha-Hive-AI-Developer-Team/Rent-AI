"use client";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 bg-black text-white">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl leading-tight">
        Automate Rent Tracking & Arrears Detection with AI
      </h1>

      <p className="text-gray-400 mb-8 max-w-xl text-sm md:text-base">
        RentAI uses Open Banking and AI to automate rent payments, detect
        arrears, and reduce manual work.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button className="px-6 py-3 rounded-md bg-transparent border border-gray-500 hover:bg-gray-800 transition">
          Book a Demo
        </button>
        <button className="px-6 py-3 rounded-md bg-green-500 hover:bg-green-600 text-black font-semibold transition">
          Start Free
        </button>
      </div>
    </section>
  );
}
