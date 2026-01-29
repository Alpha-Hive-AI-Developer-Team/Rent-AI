"use client";

import { useState } from "react";
import Image from "next/image";
import { Bell } from "lucide-react";

export default function ArrearsPage() {
  const [openSection, setOpenSection] = useState<string | null>("Day 1");

  const sections = ["Day 1", "Day 2-6", "Day 7-13", "Day 14-27", "Day 28+"];

  const arrearsData: Record<
    string,
    {
      id: number;
      name: string;
      unit?: string;
      days: number;
      template: string;
    }[]
  > = {
    "Day 1": [
      {
        id: 1,
        name: "Tom Walker",
        unit: "Unit 17 - Room A",
        days: 1,
        template: "Friendly / Firm",
      },
    ],
    "Day 1-6": [
      {
        id: 2,
        name: "Amira K.",
        unit: "52 Oak St - 1F",
        days: 3,
        template: "Friendly / Firm",
      },
      {
        id: 3,
        name: "Jack Leah",
        unit: "119 The Avenue - R3",
        days: 5,
        template: "Friendly / Firm",
      },
    ],
    "Day 7-13": [
      {
        id: 4,
        name: "Sara M.",
        unit: "5 Park View - 2B",
        days: 9,
        template: "Friendly / Firm",
      },
    ],
    "Day 14-27": [
      {
        id: 5,
        name: "Tom Walker",
        unit: "22 North Rd - R2",
        days: 18,
        template: "Firm",
      },
    ],
    "Day 28+": [
      {
        id: 6,
        name: "Amira K.",
        unit: "52 Oak St - 1F",
        days: 32,
        template: "Legal / Final",
      },
    ],
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Arrears</h1>


      </div>

      {/* Sub Header */}
      <div className="flex justify-end w-full">
        <button className="bg-[#111] border border-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-full w-full sm:w-auto transition">
          Send Scheduled Reminders
        </button>
      </div>

      {/* Filter Pills (scrollable on mobile) */}
      <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => toggleSection(s)}
            className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border transition ${
              openSection === s
                ? "border-emerald-600 text-emerald-400"
                : "border-gray-700 text-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards for Selected Section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {openSection ? (
          arrearsData[openSection]?.length > 0 ? (
            arrearsData[openSection].map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a] p-4 flex flex-col justify-between"
              >
                <div>
                  <p className="text-gray-200 font-medium mb-1 text-sm">
                    {item.name} {item.unit ? `· ${item.unit}` : ""} ({item.days}{" "}
                    days)
                  </p>
                  <p className="text-gray-400 text-xs mb-4">
                    Auto-reminder template: {item.template}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-auto">
                  <button className="text-xs flex-1 sm:flex-none text-center bg-transparent border border-emerald-700 px-3 py-1 rounded-full text-emerald-400 hover:bg-emerald-900/5 transition">
                    Open
                  </button>
                  <button className="text-xs flex-1 sm:flex-none text-center bg-[#111] border border-gray-800 px-3 py-1 rounded-full text-gray-300 hover:bg-[#222] transition">
                    Send Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm col-span-full text-center">
              No items for {openSection}
            </div>
          )
        ) : (
          <div className="text-gray-400 text-sm col-span-full text-center">
            Select a period to show arrears
          </div>
        )}
      </div>
    </div>
  );
}
