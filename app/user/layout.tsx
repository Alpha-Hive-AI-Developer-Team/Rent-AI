"use client";
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/user/sidebar";
import { useState } from "react";
import Topbar from "@/components/user/topbar";
import { Toaster } from "react-hot-toast";

// export const metadata: Metadata = {
//   title: "RentAI Dashboard",
//   description: "Manage Rent, Automatically",
// };

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

        {/* Main content area — account for sidebar width */}
        <main
          className="
            transition-all duration-300
            pt-16  lg:pt-0          /* account for mobile topbar height */
            ml-0            /* no sidebar on small screens */
            lg:ml-72        /* desktop sidebar width */
          "
        >
          {children}
        </main>
        {/* Global toaster for user area */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0b1510",
              color: "#d1fae5",
              border: "1px solid #064e3b",
            },
          }}
        />
      </div>
   
  );
}
