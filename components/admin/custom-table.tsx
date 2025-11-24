"use client";

import { Button } from "@/components/ui/button";
import { EllipsisVertical, ChevronRight, ChevronLeft } from "lucide-react";
import React from "react";

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface CustomTableProps {
  data: any[];
  columns: Column[];
  total?: string;
}

export default function CustomTable({
  data,
  columns,
  total,
}: CustomTableProps) {
  return (
    <div className="w-full">
      {/* Responsive wrapper for table scroll */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm text-gray-300">
          <thead className="bg-[#111] text-[#535862] ">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left p-3 sm:p-4 font-medium whitespace-nowrap X"
                >
                  {col.label}
                </th>
              ))}
              {/* <th className="text-left p-3 sm:p-4 font-medium whitespace-nowrap">
                Action
              </th> */}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-800 hover:bg-[#111] transition"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="p-3 sm:p-4 whitespace-nowrap text-xs sm:text-sm"
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {/* <td className="p-3 sm:p-4">
                  <button className="text-xs bg-transparent border border-emerald-700 px-3 py-1 rounded-full text-emerald-400 hover:bg-emerald-900/5 transition">
                    Open <span className="ml-2 text-emerald-400">›</span>
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-gray-400 text-xs sm:text-sm p-4 gap-3 sm:gap-0">
          <p className="text-center sm:text-left">{total}</p>

          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white flex items-center px-3 py-1 text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white px-3 py-1 text-xs sm:text-sm"
            >
              1
            </Button>
            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white px-3 py-1 text-xs sm:text-sm"
            >
              2
            </Button>
            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white flex items-center px-3 py-1 text-xs sm:text-sm"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
