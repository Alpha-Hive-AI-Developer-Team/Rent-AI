"use client";

import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import useCreateTenant from "@/hooks/useCreateTenant";
import { useTenantAddresses } from "@/hooks/useTenantAddresses";
interface NewTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; rent: string; property: string; dueOn?: number; moveInDate?: string }) => void;
}

export default function NewTenantModal({ open, onClose, onSubmit }: NewTenantModalProps) {
  const [tenantNames, setTenantNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [rent, setRent] = useState("");
  const [property, setProperty] = useState("");
  const [dueOn, setDueOn] = useState<number>(1);
  const [moveInDate, setMoveInDate] = useState<string>("");

  const [selectedAddress, setSelectedAddress] = useState<string>("existing-0");
  // single input will handle both selecting existing and adding new
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Attempt to load existing addresses from API; fall back to sample list
  const { data: addrRes } = useTenantAddresses();
  const apiAddresses: string[] = addrRes?.data ?? [];
  const fallbackAddresses = ["119 The Avenue - R3", "42 Baker Street - Apt 2", "7 Willow Lane - Flat B"];
  const existingAddresses = apiAddresses.length ? apiAddresses : fallbackAddresses;

  useEffect(() => {
    // When modal opens, choose a sensible default: use first existing address if present
    if (open) {
      if (apiAddresses.length > 0) {
        setUseNewAddress(false);
        setSelectedAddress("existing-0");
        setProperty(apiAddresses[0]);
      } else {
        setUseNewAddress(true);
        setSelectedAddress("__new");
        setProperty("");
      }
    }
  }, [open, addrRes]);
  const addrQuery = useTenantAddresses();
  const isAddrLoading = addrQuery.isLoading;
  const [addrFilter, setAddrFilter] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownUp, setDropdownUp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // create tenant mutation
  const createMutation = useCreateTenant();
  const createMutate = createMutation.mutate;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // gather names (include any typed-but-not-added name)
    const names = [...tenantNames];
    if (currentName.trim()) names.push(currentName.trim());
    if (names.length === 0) {
      alert("Please add at least one tenant name.");
      return;
    }

    const payload = { name: names.join(", "), rent: rent.trim(), property: property.trim(), dueOn, moveInDate };
    if (onSubmit) onSubmit(payload);
    // call API mutation if available
    if (createMutate) {
      const tenantPayload: any = {
        tenantName: names,
        property: payload.property,
        rent: Number(payload.rent.replace(/[^0-9.-]+/g, "")) || payload.rent,
        dueOn,
        moveInDate: moveInDate ? new Date(moveInDate).toISOString() : undefined,
      };
      createMutate(tenantPayload);
    }
    setTenantNames([]);
    setRent("");
    setProperty("");
    setDueOn(1);
    setMoveInDate("");
    setUseNewAddress(false);
    setSelectedAddress("existing-0");
    onClose();
  };

  // measure available space and render dropdown above when necessary
  useEffect(() => {
    function checkPosition() {
      if (!containerRef.current || !dropdownOpen) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const approxDropdownNeeded = 240; // px
      setDropdownUp(spaceBelow < approxDropdownNeeded);
    }

    checkPosition();
    window.addEventListener("resize", checkPosition);
    window.addEventListener("scroll", checkPosition, true);
    return () => {
      window.removeEventListener("resize", checkPosition);
      window.removeEventListener("scroll", checkPosition, true);
    };
  }, [dropdownOpen]);

  // close dropdown when clicking or focusing outside, or when pressing Escape
  useEffect(() => {
    if (!dropdownOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    }

    function onFocusIn(e: FocusEvent) {
      const target = e.target as Node | null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

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
                <label className="block text-sm text-gray-200 mb-1">Tenant name(s)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const v = currentName.trim();
                        if (v) {
                          setTenantNames((p) => [...p, v]);
                          setCurrentName("");
                        }
                      }
                    }}
                    className="flex-1 bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    placeholder="Type a name and press Enter or click Add"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = currentName.trim();
                      if (!v) return;
                      setTenantNames((p) => [...p, v]);
                      setCurrentName("");
                    }}
                    className="px-3 py-2 rounded-full border border-emerald-700 text-sm text-emerald-300 bg-transparent hover:bg-[#0b1510]"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tenantNames.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0b0b] border border-[#222] text-sm">
                      <span className="text-gray-200">{n}</span>
                      <button
                        type="button"
                        onClick={() => setTenantNames((p) => p.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-white"
                        aria-label={`Remove ${n}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-200 mb-1">Due day of month</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueOn}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) setDueOn(Math.min(Math.max(v, 1), 31));
                    }}
                    className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                    placeholder="e.g. 1 for the 1st"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-200 mb-1">Move-in date</label>
                  <input
                  min={new Date().toISOString().split("T")[0]}
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                  />
                  {/* <p className="text-xs text-gray-400 mt-1">Initial rent will be prorated from move-in to next month start; due on selected day next month.</p> */}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-200 mb-1">Property address</label>
                <div className="space-y-2">
                  <div className="relative" ref={containerRef}>
                    {/* Combobox: show selected property in an input, open dropdown to choose */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={property}
                          onChange={(e) => {
                            const val = e.target.value;
                            // allow typing to filter existing addresses but keep selection mode
                            setProperty(val);
                            setAddrFilter(val);
                            setDropdownOpen(true);
                            // when user types, check whether it exactly matches an existing address (trimmed)
                            const matchIndex = existingAddresses.findIndex(a => a.toLowerCase() === val.trim().toLowerCase());
                            if (matchIndex >= 0) {
                              // mark that there's an exact match, but do NOT overwrite the user's input
                              setUseNewAddress(false);
                              setSelectedAddress(`existing-${matchIndex}`);
                            } else {
                              setUseNewAddress(true);
                              setSelectedAddress("__typed");
                            }
                          }}
                          onFocus={() => setDropdownOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const v = property.trim();
                              if (!v) return;
                              const matchIndex = existingAddresses.findIndex(a => a.toLowerCase() === v.toLowerCase());
                              if (matchIndex >= 0) {
                                setProperty(existingAddresses[matchIndex]);
                                setSelectedAddress(`existing-${matchIndex}`);
                                setUseNewAddress(false);
                              } else {
                                // only allow creating new when no exact existing match
                                setSelectedAddress('__new');
                                setUseNewAddress(true);
                              }
                              setDropdownOpen(false);
                              setAddrFilter("");
                            }
                          }}
                          placeholder={isAddrLoading ? "Loading addresses..." : "Select or type an address"}
                          className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                          required
                        />
                      </div>

                    {dropdownOpen && (
                      <div className={`absolute z-20 w-full max-h-56 overflow-auto rounded-lg bg-[#0B0B0B] border border-[#222] shadow-lg ${dropdownUp ? 'bottom-full mb-2' : 'mt-2'}`}>
                        {/* Using the main input for filtering; no separate dropdown search input shown */}
                        <ul className="divide-y divide-[#151515]">
                          {isAddrLoading && (
                            <li className="px-3 py-2 text-gray-400">Loading addresses...</li>
                          )}
                          {!isAddrLoading && existingAddresses.filter(a => a.toLowerCase().includes(((addrFilter || property) || "").trim().toLowerCase())).length === 0 && (
                            <li className="px-3 py-2 text-gray-400">No addresses found</li>
                          )}
                          {!isAddrLoading && existingAddresses.filter(a => a.toLowerCase().includes(((addrFilter || property) || "").trim().toLowerCase())).slice(0,50).map((a, i) => (
                            <li
                              key={i}
                              onClick={() => {
                                setProperty(a);
                                setSelectedAddress(`existing-${i}`);
                                setUseNewAddress(false);
                                setDropdownOpen(false);
                                setAddrFilter("");
                              }}
                              className="cursor-pointer px-3 py-2 hover:bg-[#111] text-gray-200"
                            >
                              {a}
                            </li>
                          ))}
                        </ul>
                        {/* Show 'use as new' only when typed value is non-empty and doesn't exactly match an existing address */}
                        {property.trim() && existingAddresses.findIndex(a => a.toLowerCase() === property.trim().toLowerCase()) === -1 && (
                          <div className="p-2 border-t border-[#151515]">
                            <button
                              type="button"
                              onClick={() => {
                                const typed = property.trim();
                                if (!typed) return;
                                setProperty(typed);
                                setSelectedAddress('__new');
                                setUseNewAddress(true);
                                setDropdownOpen(false);
                                setAddrFilter("");
                              }}
                              className="w-full text-left text-sm text-emerald-300"
                            >
                              Use "{(property || addrFilter).trim()}" as new address
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* single input handles both existing selection and new entry; no extra input needed */}
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
