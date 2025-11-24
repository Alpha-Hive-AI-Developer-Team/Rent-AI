"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);

  // Simple local form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", form);
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 flex flex-col items-center justify-start pt-12">

      {/* Top Navigation */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-10 px-2">

        {/* Left: Logo + RentAI */}
        <div className="flex items-center gap-2 ">
          <Image
            src="/images/rent.png"
            alt="RentAI Logo"
            width={50}
            height={50}
            className="object-contain px-2 py-2 rounded-full border border-[#0B3D2C] hover:border-[#0CEB77]"
          />
          <h2 className="text-lg font-semibold">Rent Ai</h2>
        </div>

        {/* Right: Sign In */}
        <Link
          href="/auth/sign-in"
          className="px-4 py-1.5 border border-[#0B3D2C] rounded-lg text-sm hover:bg-[#0CEB77]/10 transition"
        >
          Sign In
        </Link>
      </div>

      {/* Center Card */}
      <div className="w-full max-w-6xl bg-[#0E0E0E] border border-[#1f1f1f] rounded-3xl py-10 px-10 text-center shadow-2xl">

        {/* Title */}
        <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
        <p className="text-gray-400 text-sm mb-10">
          Let’s get started. Fill in the details below to create your account.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4 max-w-md mx-auto text-left">

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-300">First Name</label>
              <input
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">Last Name</label>
              <input
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Minimum 8 characters.</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full py-2 rounded-md font-medium text-sm
            bg-[#027A48] hover:bg-[#02653d] transition"
          >
            Sign up
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-green-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
