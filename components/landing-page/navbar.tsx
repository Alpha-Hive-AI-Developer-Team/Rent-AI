"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-black text-white">
      {/* Logo */}
      <Link href="/" className="text-xl font-semibold">
        RentAI
      </Link>

      {/* Links */}
      <div className="hidden md:flex items-center space-x-6">
        <Link href="#features" className="hover:text-green-400 transition">
          Features
        </Link>
        <Link href="#how" className="hover:text-green-400 transition">
          How it Works
        </Link>
        <Link href="#pricing" className="hover:text-green-400 transition">
          Pricing
        </Link>
        <Link href="#about" className="hover:text-green-400 transition">
          About
        </Link>
        <Link href="#contact" className="hover:text-green-400 transition">
          Contact
        </Link>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center space-x-3">
        <Link
          href="/login"
          className="px-4 py-2 rounded-md text-sm border border-gray-600 hover:bg-gray-800 transition"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-md text-sm bg-green-500 hover:bg-green-600 text-black font-semibold transition"
        >
          Start Free
        </Link>
      </div>
    </nav>
  );
}
