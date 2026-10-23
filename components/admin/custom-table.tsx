"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
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
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;
  const currentPage = pagination?.page ?? 1;

  return (
    <div className="w-full space-y-4">
      {/* Responsive wrapper for table scroll with hidden scrollbar */}
      <div className="overflow-x-auto rounded-2xl border border-gray-800/80 bg-[#111] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-full text-xs sm:text-sm text-gray-300">
          <thead className="bg-[#0c0c0c] text-gray-400 border-b border-gray-800/70 uppercase tracking-wider font-medium text-[11px] sm:text-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3.5 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-400 text-xs sm:text-sm"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-[#151515] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3.5 whitespace-nowrap text-xs sm:text-sm"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row justify-between items-center text-gray-400 text-xs sm:text-sm py-2 px-1 gap-3">
          <p className="text-center sm:text-left text-xs text-gray-400">
            {total}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5">
            <Button
              variant="outline"
              className="bg-[#141414] border-gray-800 text-white flex items-center px-2.5 py-1 text-xs rounded-xl hover:bg-white/5 disabled:opacity-40"
              onClick={() =>
                pagination.onPageChange(Math.max(1, pagination.page - 1))
              }
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>

            {/* Page number buttons */}
            {(() => {
              const pages: (number | string)[] = [];
              const current = currentPage;

              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 3) pages.push("...");
                const start = Math.max(2, current - 1);
                const end = Math.min(totalPages - 1, current + 1);
                for (let i = start; i <= end; i++) pages.push(i);
                if (current + 1 < totalPages - 1) pages.push("...");
                pages.push(totalPages);
              }

              return pages.map((p, idx) =>
                typeof p === "number" ? (
                  <button
                    key={idx}
                    className={`min-w-[30px] h-[30px] px-2 rounded-xl text-xs font-medium transition ${
                      p === current
                        ? "bg-[#027A48] text-white shadow-sm"
                        : "bg-[#141414] border border-gray-800 text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => pagination.onPageChange(p)}
                  >
                    {p}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-gray-500 text-xs">
                    {p}
                  </span>
                )
              );
            })()}

            <Button
              variant="outline"
              className="bg-[#141414] border-gray-800 text-white flex items-center px-2.5 py-1 text-xs rounded-xl hover:bg-white/5 disabled:opacity-40"
              onClick={() =>
                pagination.onPageChange(
                  Math.min(totalPages, currentPage + 1)
                )
              }
              disabled={currentPage >= totalPages}
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>

            {pagination.onPageSizeChange && (
              <select
                value={pagination.pageSize}
                onChange={(e) =>
                  pagination.onPageSizeChange?.(Number(e.target.value))
                }
                className="ml-1 bg-[#141414] border border-gray-800 text-xs text-gray-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#027A48]"
              >
                {[10, 20, 50].map((n) => (
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

