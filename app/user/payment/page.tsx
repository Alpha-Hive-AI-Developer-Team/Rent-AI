"use client";

import Image from "next/image";
import { Bell, CheckCircle } from "lucide-react";

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Payment Plan</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </div>

        <Image
          src="/images/pexels.png"
          alt="User Avatar"
          width={36}
          height={36}
          className="rounded-full border border-gray-700"
        />
      </div>

      {/* Plans & Billing */}
      <section>
        {/* <h2 className="text-lg font-semibold mb-6">Plans & Billing</h2> */}
        {/* Plan Cards (match screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-transparent p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Free</h3>
              <p className="text-3xl font-bold mb-1">£0<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 3 tenants</li>
              </ul>
            </div>
            <button className="mt-5 w-full rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510]">Select</button>
          </div>

          {/* Starter */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-transparent p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Starter</h3>
              <p className="text-3xl font-bold mb-1">£29<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 20 tenants</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> CSV export</li>
              </ul>
            </div>
            <button className="mt-5 w-full rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510]">Select</button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-transparent p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Pro</h3>
              <p className="text-3xl font-bold mb-1">£79<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> 150 tenants</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> CSV export</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Xero/QuickBooks</li>
              </ul>
            </div>
            <button className="mt-5 w-full rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510]">Select</button>
          </div>

          {/* Enterprise */}
          <div className="rounded-2xl border border-[#2A2A2A] bg-transparent p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 mb-3">Enterprise</h3>
              <p className="text-3xl font-bold mb-1">£199+<span className="text-sm font-normal text-gray-400">/mo</span></p>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Unlimited tenants</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> CSV export</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Xero export</li>
              </ul>
            </div>
            <button className="mt-5 w-full rounded-full border border-emerald-700 text-emerald-300 px-4 py-2 text-sm hover:bg-[#0b1510]">Select</button>
          </div>
        </div>

        {/* Referral discount bar (below plans) */}
        <div className="mt-6 rounded-2xl border border-[#2A2A2A] bg-transparent p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-200">Referral Discount</h3>
            <p className="text-[13px] text-gray-400 mt-1">Current discount: <span className="font-semibold text-white">60%</span></p>
          </div>
          <button className="inline-flex items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-5 py-2 text-sm hover:bg-[#0b1510]">
            View Referral Dashboard
          </button>
        </div>
      </section>
      {/* Add Card Section */}
      <section>
        <h2 className="text-lg font-semibold mb-6">Add Card</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form Fields */}
          <form className="w-full space-y-5">
            <div>
              <label className="block text-sm text-gray-200 mb-2">Card number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-2">Name on card</label>
              <input
                type="text"
                placeholder="Jane Doe"
                className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-200 mb-2">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-200 mb-2">CVV</label>
                <input
                  type="password"
                  placeholder="123"
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <button type="submit" className="inline-flex items-center justify-center rounded-full border border-emerald-700 text-emerald-300 px-6 py-2 text-sm hover:bg-[#0b1510]">
              Save
            </button>
          </form>

          {/* Right: Card Image */}
          <div className="w-full flex justify-center lg:justify-end">
            <Image
              src="/images/card.png"
              alt="Credit Card"
              width={420}
              height={260}
              className="rounded-xl object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}