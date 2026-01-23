"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useCustomerLogout } from "@/hooks/useAuth";

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
    const logout = useCustomerLogout();
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Using lucide-react icons for consistent styling; removed Payment Plans per new UI.
  // Assumption: "Tenant Detail" route is /user/tenant-detail (placeholder if not yet implemented).
  const menuItems: { name: string; path: string; Icon: React.ElementType }[] = [
    { name: "Dashboard", path: "/user/dashboard", Icon: Home },
    { name: "Tenants", path: "/user/tenants", Icon: Users },
    { name: "Transactions", path: "/user/transactions", Icon: CreditCard },
    // { name: "Reconcile", path: "/user/reconcile", Icon: LineChart },
    { name: "Arrears", path: "/user/arrears", Icon: AlertTriangle },
    { name: "Referrals", path: "/user/referrals", Icon: Gift },
    { name: "Payment Plans", path: "/user/payment", Icon: CreditCard },
    { name: "Notifications", path: "/user/notification", Icon: Bell },
  ];

  // Main items shown by default for less distraction for older users
  const mainItems = menuItems.slice(0, 3);
  const extraItems = menuItems.slice(3);

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
      <>
        <style jsx global>{`
          .hide-scrollbar {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        <aside
          className={`fixed top-0 left-0 h-screen bg-[#0A0A0A] text-gray-400 flex flex-col border-r border-gray-900/60 transition-all duration-300 z-40
            ${isDesktop ? "w-72" : "w-20"}
            ${!isDesktop ? "hidden" : ""}
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
      <nav className={`flex-1 px-3 py-4 overflow-y-auto ${showMore ? "hide-scrollbar" : ""}`}>
        {/* {isDesktop && (
          <div className="text-xs text-gray-400 px-2 pb-2">Main</div>
        )} */}
        <div className="bg-transparent p-2 space-y-3">
          {mainItems.map(({ name, path, Icon }) => {
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

          {/* Extra items hidden by default to reduce distraction */}
          {showMore &&
            extraItems.map(({ name, path, Icon }) => {
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

          {/* Show more / show less toggle */}
          <button
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition border text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60 ${!isDesktop ? "justify-center px-2 py-2 rounded-xl" : ""}`}
          >
            {showMore ? (
              <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-emerald-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-300" />
            )}
            {isDesktop && <span>{showMore ? "Show less" : "Show more"}</span>}
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={() => setLogoutOpen(true)}
          className={`group relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm transition border text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60 ${!isDesktop ? "justify-center px-2 py-2 rounded-xl" : ""}`}
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-400" />
          {isDesktop && <span>Logout</span>}
        </button>
      </div>

      {/* Logout confirmation modal */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirm logout</h3>
              <button onClick={() => setLogoutOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-300 mb-4">Are you sure you want to logout? You will be redirected to the sign-in page.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setLogoutOpen(false)} className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  setLogoutOpen(false);
                  setLoading(true);
                  logout.mutate(undefined, {
                    onSettled: () => setLoading(false),
                  });
                }}
                disabled={loading}
                className="px-4 py-2 rounded-full border border-rose-600 text-sm text-rose-300 bg-transparent hover:bg-rose-900/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="inline-block w-4 h-4 border-2 border-t-transparent border-rose-300 rounded-full animate-spin mr-2" />
                    Logging out...
                  </span>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </aside>

        {/* Mobile overlay panel (renders on top of content when toggled) */}
        {!isDesktop && mobileOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => onClose?.()}
            />
            <aside className="relative w-72 h-full bg-[#0A0A0A] text-gray-400 flex flex-col border-r border-gray-900/60 transition-transform duration-200">
              <div className="flex items-center justify-start gap-1 p-6">
                <Image
                  src="/images/logo-transparent.png"
                  alt="logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                 <span className="text-white font-semibold text-2xl">Rent Ai</span>
                <button
                  onClick={() => onClose?.()} 
                  className="text-gray-400 hover:text-white p-2 mr-2"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className={`flex-1 px-3 py-4 ${showMore ? "overflow-y-auto h-[90vh] hide-scrollbar" : "overflow-y-auto"}`}>
                <div className="bg-transparent p-2 space-y-3">
                  {mainItems.map(({ name, path, Icon }) => {
                    const isActive = pathname === path || (pathname === "" && path === "/");
                    return (
                      <Link
                        key={name}
                        href={path}
                        onClick={() => onClose?.()}
                        className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition border
                          ${isActive
                            ? "text-white border-emerald-600 ring-1 ring-emerald-500/30"
                            : "text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60"}
                        `}
                      >
                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-300"}`} />
                        <span className="truncate">{name}</span>
                      </Link>
                    );
                  })}

                  {showMore &&
                    extraItems.map(({ name, path, Icon }) => {
                      const isActive = pathname === path || (pathname === "" && path === "/");
                      return (
                        <Link
                          key={name}
                          href={path}
                          onClick={() => onClose?.()}
                          className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition border
                            ${isActive
                              ? "text-white border-emerald-600 ring-1 ring-emerald-500/30"
                              : "text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60"}
                          `}
                        >
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-300"}`} />
                          <span className="truncate">{name}</span>
                        </Link>
                      );
                    })}

                  <button
                    onClick={() => { setShowMore((s) => !s); }}
                    aria-expanded={showMore}
                    className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition border text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60"
                  >
                    {showMore ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-emerald-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-300" />
                    )}
                    <span>{showMore ? "Show less" : "Show more"}</span>
                  </button>
                </div>
              </nav>

              <div className="p-4">
                <button
                  onClick={() => setLogoutOpen(true)}
                  className="group relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm transition border text-gray-300 border-[#2A2A2A] hover:text-white hover:border-emerald-700/60"
                >
                  <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </>
  );
}
