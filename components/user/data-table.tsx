"use client";

import React from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export default function DataTable<T extends { id: number | string }>(
  { columns, data }: DataTableProps<T>
) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl bg-[#0B0B0B] border border-[#1a1a1a]">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="text-gray-400 text-left bg-[#0f0f0f] border-b border-[#151515]">
            {columns.map((col, idx) => (
              <th
                key={col.key as string}
                className={`py-4 px-6 font-medium whitespace-nowrap text-xs md:text-sm ${
                  idx === 0 ? "rounded-tl-2xl" : ""
                } ${idx === columns.length - 1 ? "rounded-tr-2xl text-right" : ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t border-[#151515] hover:bg-[#0e0e0e] transition"
            >
              {columns.map((col, idx) => (
                <td
                  key={col.key as string}
                  className={`py-4 px-6 text-gray-300 ${
                    idx === columns.length - 1 ? "text-right" : "text-sm"
                  }`}
                >
                  {col.render ? col.render(item) : (item[col.key as keyof T] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
