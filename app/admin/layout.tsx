import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/admin/sidebar";

export const metadata: Metadata = {
  title: "RentAI Dashboard",
  description: "Manage Rent, Automatically",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <div   className="flex bg-[#0a0a0a] text-white min-h-screen">
        <Sidebar />
        <main
          className="
            flex-1
            lg:ml-72  /* match desktop sidebar width */
            md:ml-20  /* match tablet/sidebar icon-only width */
            ml-20     /* mobile same as compact sidebar */
            transition-all
          "
        >
          {children}
        </main>
      </div>
    
  );
}
