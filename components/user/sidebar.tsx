"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  CreditCard,
  LineChart,
  User as UserIcon,
  AlertTriangle,
  Gift,
  Settings as SettingsIcon,
  Bell,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);

  // Using lucide-react icons for consistent styling; removed Payment Plans per new UI.
  // Assumption: "Tenant Detail" route is /user/tenant-detail (placeholder if not yet implemented).
  const menuItems: { name: string; path: string; Icon: React.ElementType }[] = [
    { name: "Dashboard", path: "/user/dashboard", Icon: Home },
    { name: "Tenants", path: "/user/tenants", Icon: Users },
    { name: "Transactions", path: "/user/transactions", Icon: CreditCard },
    { name: "Reconcile", path: "/user/reconcile", Icon: LineChart },
    
    { name: "Arrears", path: "/user/arrears", Icon: AlertTriangle },
    { name: "Referrals", path: "/user/referrals", Icon: Gift },
    { name: "Payment Plans", path: "/user/payment", Icon: CreditCard },
    { name: "Notifications", path: "/user/notification", Icon: Bell },
  ];

  // Detect screen size (lg breakpoint)
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0A0A0A] text-gray-400 flex flex-col border-r border-gray-900/60 transition-all duration-300 z-50
        ${isDesktop ? "w-72" : "w-20"}
      `}
    >
      {/* 🖥️ Header */}
      {isDesktop ? (
        <div className="flex items-center justify-start gap-1 p-6">
          <Image
            src="/images/logo-transparent.png"
            alt="logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <span className="text-white font-semibold text-2xl">Rent Ai</span>
        </div>
      ) : (
        <div className="flex justify-center items-center p-4 border-b border-gray-800">
          <Image
            src="/images/logo-transparent.png"
            alt="logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
      )}

      {/* 📋 Navigation */}
      <nav className="flex-1 px-3 py-4">
        {/* {isDesktop && (
          <div className="text-xs text-gray-400 px-2 pb-2">Main</div>
        )} */}
        <div className="bg-transparent p-2 space-y-3">
          {menuItems.map(({ name, path, Icon }) => {
            const isActive = pathname === path || (pathname === "" && path === "/");
            return (
              <Link
                key={name}
                href={path}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition border
                  ${isActive
                    ? "text-white border-emerald-600 ring-1 ring-emerald-500/30"
                    : "text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60"}
                  ${!isDesktop ? "justify-center px-2 py-2 rounded-xl" : ""}
                `}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-300"}`}
                />
                {isDesktop && <span className="truncate">{name}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
