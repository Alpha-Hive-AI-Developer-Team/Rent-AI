"use client";
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/user/topbar";
import { useState } from "react";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Mobile topbar */}
      <Topbar isOpen={mobileOpen} onToggle={() => setMobileOpen((s) => !s)} />

      <main
        className="
          transition-all duration-300
          pt-16 lg:pt-0   /* account for mobile topbar */
          ml-0 md:ml-20 lg:ml-72
        "
      >
        {children}
      </main>
    </div>
  );
}
