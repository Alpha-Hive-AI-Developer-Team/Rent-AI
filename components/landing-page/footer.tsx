"use client";

import Link from "next/link";
import { Facebook, Instagram, X, Youtube } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 py-10 px-6 md:px-16 border-t border-gray-800 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Top section */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-800 pb-6 gap-6 md:gap-0">
          {/* Logo */}
          <div className="flex items-center space-x-2">
           <Image src="/images/logo-transparent.png" alt="RentAi Logo" width={50} height={50} />
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#D5D7DA]">
            <Link href="/features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="/how-it-works" className="hover:text-white transition">
              How It Works
            </Link>
            <Link href="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
          </nav>

          {/* Social Icons */}
          <div className="flex space-x-6 text-white">
            <Link href="https://facebook.com" target="_blank" className="hover:text-white transition">
              <Image src="/images/fb.png" alt="Facebook" width={18} height={18} />
            </Link>
            <Link href="https://instagram.com" target="_blank" className="hover:text-white transition">
              <Image src="/images/insta.png" alt="instagram" width={18} height={18} />
            </Link>
            <Link href="https://twitter.com" target="_blank" className="hover:text-white transition">
              <Image src="/images/twitter.png" alt="twitter" width={18} height={18} />
            </Link>
            <Link href="https://youtube.com" target="_blank" className="hover:text-white transition">
              <Image src="/images/youtube.png" alt="youtube" width={18} height={18} />
            </Link>
            <Link href="https://whatsapp.com" target="_blank" className="hover:text-white transition">
                <Image src="/images/wp.png" alt="whatsapp" width={18} height={18} />
            </Link>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 text-xs text-white gap-3 md:gap-0">
          <p>© 2025 RentAL. Built with in the UK. Powered by Open Banking.</p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/cookies-settings" className="hover:text-white transition">
              Cookies Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
