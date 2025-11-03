"use client";

import Image from "next/image";

export default function SignIn() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-black text-white px-4">
      {/* Card */}
      <div className="bg-[#0B0B0B] w-full max-w-sm p-8 rounded-2xl shadow-lg border border-[#1a1a1a] text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/images/auth.png" 
            alt="RentAI Logo"
            width={40}
            height={40}
          />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>
        <p className="text-gray-400 text-sm mb-6">
          Log in to unlock tailored content and stay connected with your community.
        </p>

        {/* Form */}
        <form className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-sm mb-1 text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-300">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-transparent border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="mt-2 w-full py-2 rounded-md font-medium text-sm
            bg-[#027A48] hover:bg-[#02653d] transition"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
