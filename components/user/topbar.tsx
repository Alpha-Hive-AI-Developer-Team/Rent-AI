"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";

export default function Topbar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="lg:hidden fixed top-0 left-0 w-full z-50">
      <div className="w-full bg-[#060606] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onToggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="text-gray-300 hover:text-white p-2"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

    <div className="flex items-center justify-center space-x-2">
         <span className="text-white font-normal text-md">Rent Ai</span>
          <Image src="/images/logo-transparent.png" alt="RentAi" width={36} height={36} />
         
    </div>
      </div>
    </div>
  );
}
