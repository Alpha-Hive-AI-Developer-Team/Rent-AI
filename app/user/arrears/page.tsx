"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell } from "lucide-react";

export default function ArrearsPage() {
  const [openSection, setOpenSection] = useState<string | null>("Day 0");

  const sections = ["Day 0", "Day 1-6", "Day 7-13", "Day 14-27", "Day 28+"];

  // Dummy arrears data keyed by section
  const arrearsData: Record<string, { id: number; name: string; unit?: string; days: number; template: string }[]> = {
    "Day 0": [
      { id: 1, name: "Tom Walker", unit: "Unit 17 - Room A", days: 0, template: "Friendly / Firm" },
    ],
    "Day 1-6": [
      { id: 2, name: "Amira K.", unit: "52 Oak St - 1F", days: 3, template: "Friendly / Firm" },
      { id: 3, name: "Jack Leah", unit: "119 The Avenue - R3", days: 5, template: "Friendly / Firm" },
    ],
    "Day 7-13": [
      { id: 4, name: "Sara M.", unit: "5 Park View - 2B", days: 9, template: "Friendly / Firm" },
    ],
    "Day 14-27": [
      { id: 5, name: "Tom Walker", unit: "22 North Rd - R2", days: 18, template: "Firm" },
    ],
    "Day 28+": [
      { id: 6, name: "Amira K.", unit: "52 Oak St - 1F", days: 32, template: "Legal / Final" },
    ],
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <h1 className="text-xl font-semibold mr-auto">Arrears</h1>

        <div className="relative">
          <Bell className="w-6 h-6 text-gray-300" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </div>

        <Image
          src="/images/pexels.png"
          alt="User Avatar"
          width={36}
          height={36}
          className="rounded-full border border-gray-700"
        />
      </div>

      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg md:text-xl font-semibold text-center sm:text-left">
          Arrears Manager
        </h2>
        <button className="bg-[#111] border border-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-full w-full sm:w-auto transition">
          Send Scheduled Reminders
        </button>
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex items-center gap-3">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => toggleSection(s)}
            className={`text-xs px-3 py-1 rounded-full border ${
              openSection === s
                ? "border-emerald-600 text-emerald-400"
                : "border-gray-700 text-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards for selected section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {openSection ? (
          (arrearsData[openSection] || []).length > 0 ? (
            (arrearsData[openSection] || []).map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a] p-4">
                <div>
                  <p className="text-gray-200 font-medium mb-1 text-sm">
                    {item.name} {item.unit ? `· ${item.unit}` : ""} ({item.days} days)
                  </p>
                  <p className="text-gray-400 text-xs mb-4">Auto-reminder template: {item.template}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button className="text-xs bg-transparent border border-emerald-700 px-3 py-1 rounded-full text-emerald-400 hover:bg-emerald-900/5 transition">
                    Open
                  </button>
                  <button className="text-xs bg-[#111] border border-gray-800 px-3 py-1 rounded-full text-gray-300 hover:bg-[#222] transition">
                    Send Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400">No items for {openSection}</div>
          )
        ) : (
          <div className="text-gray-400">Select a period to show arrears</div>
        )}
      </div>
    </div>
  );
}
