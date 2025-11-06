"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface TenantDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function TenantDrawer({ open, onClose }: TenantDrawerProps) {
  const [note, setNote] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Drawer */}
          <motion.div
            className="bg-[#0c0c0c] text-white w-full sm:w-[420px] h-full p-6 border-l border-gray-800 shadow-xl overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                Jack Leah – 119 The Avenue – R3
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tenant Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-black/40 border border-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-white">Monthly Rent</p>
                <p className="text-sm text-gray-400 font-medium mt-1">£1200</p>
              </div>
              <div className="bg-black/40 border border-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-white">Status</p>
                <p className="text-sm font-medium text-gray-400 mt-1">Paid</p>
              </div>
              <div className="bg-black/40 border border-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-white">Last Payment</p>
                <p className="text-sm font-medium text-gray-400 mt-1">2025-10-01</p>
              </div>
            </div>

            {/* Payment Timeline */}
            <div className="border border-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-1 text-gray-300">
                Payment Timeline
              </p>
              <p className="text-xs text-gray-500">
                All previous months are paid since Oct 2024
              </p>
            </div>

            {/* Comms Log */}
            <div className="border border-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-2 text-gray-300">Comms Log</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>System: Payment received £1200 (Oct).</li>
                <li>System: Payment received £1200 (Oct).</li>
                <li>System: Payment received £1200 (Oct).</li>
              </ul>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-sm font-medium mb-2 text-gray-300">
                Description
              </p>
              <input
                type="text"
                placeholder="Send a note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
              />
            </div>

            <button
              onClick={() => {
                alert(`Note sent: ${note}`);
                setNote("");
              }}
              className="w-full bg-[#1a1a1a] text-sm border border-gray-700 rounded-lg py-2 hover:bg-[#222] transition"
            >
              Send
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
