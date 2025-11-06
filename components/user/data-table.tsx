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

export default function DataTable<T extends { id: number | string }>({
  columns,
  data,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-gray-800/60 rounded-lg">
      <table className="w-full text-sm border-collapse border border-gray-800/60 rounded-xl overflow-hidden">
        <thead className="bg-[#0c0c0c]">
          <tr className="text-gray-400 text-left">
            {columns.map((col) => (
              <th key={col.key as string} className="py-3 px-4 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t border-gray-800 hover:bg-[#111] transition"
            >
              {columns.map((col) => (
                <td key={col.key as string} className="py-3 px-4 text-gray-300">
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
