"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";

export default function ArrearsPage() {
  const [openSection, setOpenSection] = useState<string | null>("Day 0");

  const sections = ["Day 0", "Day 1-6", "Day 7-13", "Day 14-27"];

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

      {/* Accordion Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section}
            className="bg-[#111] rounded-lg overflow-hidden border border-gray-800"
          >
            {/* Accordion Header */}
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-900 transition-colors text-left"
            >
              <span className="font-medium text-base sm:text-lg">
                {section}
              </span>
              {openSection === section ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Expanded Content */}
            {openSection === section && (
              <div className="p-4 border-t border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Example Cards */}
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="bg-black border border-gray-800 rounded-lg p-4 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-gray-200 font-medium mb-1 text-sm sm:text-base">
                          Reminder scheduled 16:00
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4 leading-relaxed">
                          Auto-reminder template: Friendly / Firm
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button className="border border-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-full flex-1 sm:flex-none text-center">
                          Open
                        </button>
                        <button className="border border-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-full flex-1 sm:flex-none text-center">
                          Send Notifications
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
