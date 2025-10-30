"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Image from "next/image";
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="flex justify-center bg-black py-6">
      <div className="flex items-center justify-between w-[90%] md:w-[70%] lg:w-[60%] bg-[#060606] border border-gray-800 rounded-2xl px-6 py-3 relative">
        {/* Logo */}
        <div className="flex items-center space-x-2">
         <Image src="/images/logo.png" alt="RentAi Logo" width={40} height={40} /> 
          <span className="font-semibold text-white text-lg">RentAi</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8 text-sm text-gray-300">
          <Link href="#features" className="hover:text-white transition">
            Features
          </Link>
          <Link href="#how" className="hover:text-white transition">
            How It Works
          </Link>
          <Link href="#pricing" className="hover:text-white transition">
            Pricing
          </Link>
          <Link href="#about" className="hover:text-white transition">
            About
          </Link>
          <Link href="#contact" className="hover:text-white transition">
            Contact
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-gray-300 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-gradient-to-b from-[#027A48] to-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-300 hover:text-white transition"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-[70px] left-0 w-full bg-[#060606] border-t border-gray-800 rounded-b-2xl py-4 flex flex-col items-center space-y-4 text-gray-300 md:hidden z-50">
            <Link
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              Features
            </Link>
            <Link
              href="#how"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              About
            </Link>
            <Link
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              Contact
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="bg-gradient-to-b from-green-500 to-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
            >
              Start Free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
