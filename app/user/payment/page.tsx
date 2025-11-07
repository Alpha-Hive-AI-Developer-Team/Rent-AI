"use client";

import Image from "next/image";
import { Bell } from "lucide-react";

export default function ReconcilePage() {
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

      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#111] p-4 rounded-lg border border-gray-800">
        <h2 className="text-sm md:text-sm mb-2 sm:mb-0">
          Current discount: <span className="font-semibold">60%</span>
        </h2>
        <button className="bg-[#111] border border-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-full transition">
          View Referral Dashboard
        </button>
      </div>

      {/* Plans & Billing */}
      <section>
        <h2 className="text-lg font-semibold mb-6">Plans & Billing</h2>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ultimate Plan */}
          <div className="bg-black border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Ultimate Plan</h3>
              <p className="text-sm text-gray-400 mb-4">
                Max features, full power, no limits.
              </p>
              <p className="text-3xl font-bold mb-2">£199+</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Unlimited tenants</li>
                <li>All Pro features included</li>
                <li>API Access</li>
                <li>White-label landlord portal</li>
                <li>Dedicated account manager</li>
                <li>SLA guarantee</li>
                <li>Sub-accounts</li>
                <li>24/7 chat support team members</li>
              </ul>
            </div>
            <button className="mt-6 bg-black border border-gray-700 hover:bg-gray-800 text-sm px-4 py-2 rounded-md">
              Subscribe Now
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-black border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Professional Plan</h3>
              <p className="text-sm text-gray-400 mb-4">
                Perfect for growing teams and creators.
              </p>
              <p className="text-3xl font-bold mb-2">£79</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Up to 150 tenants</li>
                <li>All Starter features included</li>
                <li>Full AI matching power</li>
                <li>Comms center (Email/SMS)</li>
                <li>Team collaboration tools</li>
                <li>Advanced analytics</li>
                <li>Xero/QuickBooks sync</li>
                <li>Priority email support</li>
                <li>Up to 5 users</li>
              </ul>
            </div>
            <button className="mt-6 bg-[#027A48] hover:bg-green-800 text-sm px-4 py-2 rounded-md">
              Subscribe Now
            </button>
          </div>

          {/* Starter Plan */}
          <div className="bg-black border border-gray-800 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Starter Plan</h3>
              <p className="text-sm text-gray-400 mb-4">
                Get started with essential tools.
              </p>
              <p className="text-3xl font-bold mb-2">£29</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Up to 20 tenants</li>
                <li>Open Banking integration</li>
                <li>AI-assisted matching</li>
                <li>Email notifications</li>
                <li>Limited storage</li>
                <li>Community support</li>
                <li>Basic analytics</li>
                <li>1 user only</li>
              </ul>
            </div>
            <button className="mt-6 bg-black border border-gray-700 hover:bg-gray-800 text-sm px-4 py-2 rounded-md">
              Subscribe Now
            </button>
          </div>
        </div>
      </section>
    {/* Add Card Section */}
      <section>
        <h2 className="text-lg font-semibold mb-6">Add Card</h2>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left: Form Fields */}
          <form className="w-full lg:w-1/2 space-y-6">
            {/* Card Number */}
            <div>
              <label className="block text-sm text-white mb-2">
                Card number
              </label>
              <input
                type="text"
                placeholder="Enter your card number"
                className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-500"
              />
            </div>

            {/* Expiry and CSV */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-white mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-500"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm text-white mb-2">
                  CSV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full bg-black border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="bg-[#111] text-white text-sm font-medium px-6 py-2 border border-gray-800/30 rounded-full hover:bg-gray-300 transition"
            >
              Save
            </button>
          </form>

          {/* Right: Card Image */}
          <div className="w-full lg:w-1/3 flex justify-center">
            <Image
              src="/images/card.png" 
              alt="Credit Card"
              width={380}
              height={240}
              className="rounded-xl object-contain"
            />
          </div>
        </div>
      </section>
    </div>
  );
}