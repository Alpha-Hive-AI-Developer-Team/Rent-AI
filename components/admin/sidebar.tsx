"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Building2, Users, Gift, LogOut, X } from "lucide-react";
import { useAuthUser } from "@/redux/useAuthUser";

export default function Sidebar() {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(true);
  const user=useAuthUser();
 console.log("Sidebar user role:", user?.role);
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const menuItems: { name: string; path: string; Icon: React.ElementType }[] = [
    { name: "Dashboard", path: "/admin/dashboard", Icon: Home },
    { name: "Admin Management", path: "/admin/management", Icon: Users },
    { name: "Landlord Management", path: "/admin/landlords", Icon: Building2 },
    { name: "Tenant Management", path: "/admin/tenants", Icon: Users },
    { name: "Referrals", path: "/admin/referrals", Icon: Gift },
  ];

  // determine role from auth user and decide which menu items to render
  const userRole = String(user?.role || "")
  console.log("Determined user role:", userRole);
  const isSuper = ["superAdmin"].includes(userRole);
  // show Admin Management only to super-admin; all other users see the menu without that item
  const renderMenuItems = isSuper ? menuItems : menuItems.filter((m) => m.name !== "Admin Management");

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
        <div className="flex items-center justify-start gap-3 p-6">
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
          {renderMenuItems.map(({ name, path, Icon }) => {
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
              <button onClick={() => { setLogoutOpen(false); router.push('/auth/sign-in'); }} className="px-4 py-2 rounded-full border border-rose-600 text-sm text-rose-300 bg-transparent hover:bg-rose-900/5">Logout</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
