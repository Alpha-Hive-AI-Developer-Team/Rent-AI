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
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange?: (n: number) => void;
  };
}

export default function CustomTable({
  data,
  columns,
  total,
  pagination,
}: CustomTableProps) {
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;
  const currentPage = pagination?.page ?? 1;
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
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-gray-400 text-xs sm:text-sm p-4 gap-3 sm:gap-0">
          <p className="text-center sm:text-left">{total}</p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white flex items-center px-3 py-1 text-xs sm:text-sm"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>

            {/* page buttons */}
            {(() => {
              const pages: (number | string)[] = [];
              const current = currentPage;

              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 4) pages.push("...");
                const start = Math.max(2, current - 2);
                const end = Math.min(totalPages - 1, current + 2);
                for (let i = start; i <= end; i++) pages.push(i);
                if (current + 2 < totalPages - 1) pages.push("...");
                pages.push(totalPages);
              }

              return pages.map((p, idx) =>
                typeof p === "number" ? (
                  <Button
                    key={idx}
                    variant={p === current ? "default" : "outline"}
                    className={`px-3 py-1 text-xs sm:text-sm ${p === current ? "bg-emerald-700 text-white" : "bg-[#111] border-gray-800 text-white"}`}
                    onClick={() => pagination.onPageChange(p)}
                  >
                    {p}
                  </Button>
                ) : (
                  <span key={idx} className="px-2 text-gray-500">{p}</span>
                )
              );
            })()}

            <Button
              variant="outline"
              className="bg-[#111] border-gray-800 text-white flex items-center px-3 py-1 text-xs sm:text-sm"
              onClick={() => pagination.onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>

            {pagination.onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange?.(Number(e.target.value))}
                className="ml-2 bg-[#111] border border-gray-800 text-sm px-2 py-1"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
