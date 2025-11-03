"use client";

import Image from "next/image";
import Link from "next/link";

export default function SignUp() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      {/* Card */}
      <div className="bg-[#0B0B0B] w-full max-w-sm p-8 rounded-2xl shadow-lg border border-[#1a1a1a] text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/images/auth.png" 
            alt="RentAI Logo"
            width={28}
            height={28}
          />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold mb-2">Create an account</h1>
        <p className="text-gray-400 text-sm mb-6">
          Let’s get started. Fill in the details below to create your account.
        </p>

        {/* Form */}
        <form className="flex flex-col gap-4 text-left">
          {/* Name fields side-by-side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-gray-300">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last Name"
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
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Minimum 8 characters.
            </p>
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
        <p className="text-gray-400 text-sm mt-4">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-green-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
