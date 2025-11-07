"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/user/dashboard",
      icon: "/images/home.png",
      activeIcon: "/images/home.png",
    },
    {
      name: "Tenants",
      path: "/user/tenants",
      icon: "/images/Vector.png",
      activeIcon: "/images/Vector.png",
    },
    {
      name: "Transactions",
      path: "/user/transactions",
      icon: "/images/CreditCard.png",
      activeIcon: "/images/CreditCard.png",
    },
    {
      name: "Reconcile",
      path: "/user/reconcile",
      icon: "/images/clipcheck.png",
      activeIcon: "/images/clipcheck.png",
    },
    {
      name: "Arrears",
      path: "/user/arrears",
      icon: "/images/help.png",
      activeIcon: "/images/help.png",
    },
    {
      name: "Referrals",
      path: "/user/referrals",
      icon: "/images/Vector.png",
      activeIcon: "/images/Vector.png",
    },
    {
      name: "Notifications",
      path: "/user/notification",
      icon: "/images/bell.png",
      activeIcon: "/images/bell.png",
    },
    {
      name: "Payment Plans",
      path: "/user/payment",
      icon: "/images/CreditCard.png",
      activeIcon: "/images/CreditCard.png",
    },
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
      className={`fixed top-0 left-0 h-screen bg-[#111] text-gray-400 flex flex-col border-r border-gray-800/50 transition-all duration-300 z-50
        ${isDesktop ? "w-72" : "w-20"}
      `}
    >
      {/* 🖥️ Header */}
      {isDesktop ? (
        <div className="flex items-center justify-start gap-3 p-6">
          <Image
            src="/images/logo-transparent.png"
            alt="logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <span className="text-white font-semibold text-lg">RentAI</span>
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
      <nav className="flex-1 px-2 py-6 space-y-2">
        {menuItems.map((item) => {
          // ✅ Default to Dashboard if pathname is empty or "/"
          const isActive =
            pathname === item.path || (pathname === "" && item.path === "/");

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition group
                ${isActive ? "text-white bg-gray-900/30" : "hover:text-white"}
                ${!isDesktop ? "justify-center" : ""}
              `}
            >
              {/* Left green border for active item */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-500 rounded-r-md"></div>
              )}

              <Image
                src={isActive ? item.activeIcon : item.icon}
                alt={item.name}
                width={22}
                height={22}
              />
              {isDesktop && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
