"use client";

import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
interface NewTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; rent: string; property: string }) => void;
}

export default function NewTenantModal({ open, onClose, onSubmit }: NewTenantModalProps) {
  const [name, setName] = useState("");
  const [rent, setRent] = useState("");
  const [property, setProperty] = useState("");

  const [selectedAddress, setSelectedAddress] = useState<string>("existing-0");
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Example existing addresses - in real app this should come from props or API
  const existingAddresses = [
    "119 The Avenue - R3",
    "42 Baker Street - Apt 2",
    "7 Willow Lane - Flat B",
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = { name: name.trim(), rent: rent.trim(), property: property.trim() };
    if (onSubmit) onSubmit(payload);
    // quick feedback for now
    alert(`New tenant added:\n${payload.name} — ${payload.rent} — ${payload.property}`);
    setName("");
    setRent("");
    setProperty("");
    setUseNewAddress(false);
    setSelectedAddress("existing-0");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-[#0c0c0c] border border-gray-800 rounded-2xl p-6 text-white shadow-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "tween", duration: 0.18 }}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Add new tenant</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-200 mb-1">Tenant name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                  placeholder="e.g. Jack Leah"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-200 mb-1">Rent</label>
                <input
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                  placeholder="e.g. £1200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-200 mb-1">Property address</label>
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      value={useNewAddress ? "__new" : selectedAddress}
                      onChange={(e) => {
                        if (e.target.value === "__new") {
                          setUseNewAddress(true);
                          setProperty("");
                        } else {
                          setUseNewAddress(false);
                          setSelectedAddress(e.target.value);
                          const idx = Number(e.target.value.replace("existing-", ""));
                          setProperty(existingAddresses[idx] || "");
                        }
                      }}
                      className="appearance-none w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 pr-10 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    >
                      {existingAddresses.map((a, i) => (
                        <option key={i} value={`existing-${i}`} className="bg-[#0c0c0c] text-gray-200">
                          {a}
                        </option>
                      ))}
                      <option value="__new">Enter new address...</option>
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>

                  {useNewAddress && (
                    <input
                      value={property}
                      onChange={(e) => setProperty(e.target.value)}
                      className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      placeholder="e.g. 119 The Avenue - R3"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#2A2A2A] text-sm text-gray-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full border border-emerald-700 text-sm text-emerald-300 bg-transparent hover:bg-[#0b1510]"
                >
                  Add tenant
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
