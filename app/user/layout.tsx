"use client";
import "./globals.css";
import Sidebar from "@/components/user/sidebar";
import { useEffect, useState } from "react";
import Topbar from "@/components/user/topbar";
import ImpersonationBanner from "@/components/user/ImpersonationBanner";
import { useAuthUser } from "@/redux/useAuthUser";
import { useRouter } from "next/navigation";
import { getImpersonationSessionId } from "@/lib/impersonation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthUser();
  const router = useRouter();
  const [gateReady, setGateReady] = useState(false);

  useEffect(() => {
    const role = String(user?.role || "");
    const isStaff = role === "admin" || role === "superAdmin";
    if (!isStaff) {
      setGateReady(true);
      return;
    }
    const sessionId = getImpersonationSessionId();
    if (!sessionId) {
      router.replace("/admin/dashboard");
      return;
    }
    setGateReady(true);
  }, [user?.role, router]);

  const role = String(user?.role || "");
  const isStaff = role === "admin" || role === "superAdmin";
  if (isStaff && !gateReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-gray-400 flex items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Topbar isOpen={mobileOpen} onToggle={() => setMobileOpen((s) => !s)} />

      <main
        className="
          transition-all duration-300
          pt-16  lg:pt-0
          ml-0
          lg:ml-72
        "
      >
        <ImpersonationBanner />
        {children}
      </main>
    </div>
  );
}
