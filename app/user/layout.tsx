import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/user/sidebar";

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
 
      <div className="bg-[#0a0a0a] text-white min-h-screen">
        <Sidebar />

        {/* Main content area — account for sidebar width */}
        <main
          className="
            transition-all duration-300
            ml-20           /* default sidebar compact (mobile) */
            lg:ml-72        /* desktop sidebar width */
           
          "
        >
          {children}
        </main>
      </div>
   
  );
}
