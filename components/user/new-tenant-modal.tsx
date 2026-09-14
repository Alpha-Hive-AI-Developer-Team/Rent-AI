"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import useCreateTenant from "@/hooks/useCreateTenant";
import { useTenantAddresses } from "@/hooks/useTenantAddresses";
import { getPayerSuggestions } from "@/lib/api/tenantsApi";

interface NewTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; rent: string; property: string; dueOn?: number; moveInDate?: string }) => void;
}

const RENT_NUMERIC = /[^0-9.]/g;

function sanitizeRentInput(value: string) {
  // allow digits and a single decimal point
  let cleaned = value.replace(RENT_NUMERIC, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

export default function NewTenantModal({ open, onClose, onSubmit }: NewTenantModalProps) {
  const [tenantNames, setTenantNames] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState("");
  const [rent, setRent] = useState("");
  const [property, setProperty] = useState("");
  const [dueOn, setDueOn] = useState<number>(1);
  const [moveInDate, setMoveInDate] = useState<string>("");
  const [payerSuggestions, setPayerSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);

  const { data: existingAddresses = [], isLoading: isAddrLoading } = useTenantAddresses();

  useEffect(() => {
    if (open) {
      if (property.trim()) return;
      if (existingAddresses.length > 0) {
        setProperty(existingAddresses[0]);
      } else {
        setProperty("");
      }
    }
  }, [open, existingAddresses, property]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingSuggestions(true);
        const list = await getPayerSuggestions();
        if (!cancelled) setPayerSuggestions(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setPayerSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const [addrFilter, setAddrFilter] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownUp, setDropdownUp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nameContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredPayerSuggestions = useMemo(() => {
    const q = currentName.trim().toLowerCase();
    const already = new Set(tenantNames.map((n) => n.toLowerCase()));
    return payerSuggestions
      .filter((s) => !already.has(s.toLowerCase()))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 40);
  }, [payerSuggestions, currentName, tenantNames]);

  const resetForm = () => {
    setTenantNames([]);
    setCurrentName("");
    setRent("");
    setProperty("");
    setDueOn(1);
    setMoveInDate("");
    setAddrFilter("");
    setDropdownOpen(false);
    setNameDropdownOpen(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const createMutation = useCreateTenant();
  const createMutate = createMutation.mutate;

  const tryAddName = (raw: string) => {
    const v = String(raw || "").trim();
    if (!v) return;
    if (tenantNames.some((n) => n.toLowerCase() === v.toLowerCase())) {
      setCurrentName("");
      setNameDropdownOpen(false);
      return;
    }
    setTenantNames((p) => [...p, v]);
    setCurrentName("");
    setNameDropdownOpen(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const names = [...tenantNames];
    if (currentName.trim()) names.push(currentName.trim());
    if (names.length === 0) {
      alert("Please add at least one tenant name.");
      return;
    }

    const rentValue = sanitizeRentInput(rent.trim());
    const rentNum = Number(rentValue);
    if (!rentValue || Number.isNaN(rentNum) || rentNum <= 0) {
      alert("Rent must be a positive number.");
      return;
    }

    const payload = {
      name: names.join(", "),
      rent: rentValue,
      property: property.trim(),
      dueOn,
      moveInDate,
    };
    if (onSubmit) onSubmit(payload);
    if (createMutate) {
      createMutate({
        tenantName: names,
        property: payload.property,
        rent: rentNum,
        dueOn,
        moveInDate: moveInDate ? new Date(moveInDate).toISOString() : undefined,
      });
    }
    resetForm();
    onClose();
  };

  useEffect(() => {
    function checkPosition() {
      if (!containerRef.current || !dropdownOpen) return;
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const approxDropdownNeeded = 240;
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

  useEffect(() => {
    if (!nameDropdownOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (nameContainerRef.current && target && !nameContainerRef.current.contains(target)) {
        setNameDropdownOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setNameDropdownOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [nameDropdownOpen]);

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
              <button onClick={() => { resetForm(); onClose(); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-200 mb-1">Tenant name(s)</label>
                <div className="relative mb-2" ref={nameContainerRef}>
                  <div className="flex gap-2">
                    <input
                      value={currentName}
                      onChange={(e) => {
                        setCurrentName(e.target.value);
                        setNameDropdownOpen(true);
                      }}
                      onFocus={() => setNameDropdownOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          tryAddName(currentName);
                        }
                      }}
                      className="flex-1 bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                      placeholder="Type or select a payer name"
                      inputMode="text"
                    />
                    <button
                      type="button"
                      onClick={() => tryAddName(currentName)}
                      className="px-3 py-2 rounded-full border border-emerald-700 text-sm text-emerald-300 bg-transparent hover:bg-[#0b1510]"
                    >
                      Add
                    </button>
                  </div>

                  {nameDropdownOpen && (
                    <div className="absolute z-30 mt-2 w-full max-h-56 overflow-auto rounded-lg bg-[#0B0B0B] border border-[#222] shadow-lg">
                      {loadingSuggestions && (
                        <div className="px-3 py-2 text-sm text-gray-400">Loading payer names…</div>
                      )}
                      {!loadingSuggestions && filteredPayerSuggestions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          {payerSuggestions.length === 0
                            ? "No payer names from transactions yet"
                            : "No matching payer names"}
                        </div>
                      )}
                      <ul className="divide-y divide-[#151515]">
                        {filteredPayerSuggestions.map((name) => (
                          <li
                            key={name}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => tryAddName(name)}
                            className="cursor-pointer px-3 py-2 hover:bg-[#111] text-sm text-gray-200"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Suggestions use unique payers from your bank feed.
                </p>

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
                  onChange={(e) => setRent(sanitizeRentInput(e.target.value))}
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  className="w-full bg-transparent border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
                  placeholder="e.g. 1200"
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
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-200 mb-1">Property address</label>
                <div className="space-y-2">
                  <div className="relative" ref={containerRef}>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={property}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProperty(val);
                          setAddrFilter(val);
                          setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = property.trim();
                            if (!v) return;
                            const matchIndex = existingAddresses.findIndex((a) => a.toLowerCase() === v.toLowerCase());
                            if (matchIndex >= 0) {
                              setProperty(existingAddresses[matchIndex]);
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
                      <div className={`absolute z-20 w-full max-h-56 overflow-auto rounded-lg bg-[#0B0B0B] border border-[#222] shadow-lg ${dropdownUp ? "bottom-full mb-2" : "mt-2"}`}>
                        <ul className="divide-y divide-[#151515]">
                          {isAddrLoading && (
                            <li className="px-3 py-2 text-gray-400">Loading addresses...</li>
                          )}
                          {!isAddrLoading && existingAddresses.filter((a) => a.toLowerCase().includes(((addrFilter || property) || "").trim().toLowerCase())).length === 0 && (
                            <li className="px-3 py-2 text-gray-400">No addresses found</li>
                          )}
                          {!isAddrLoading &&
                            existingAddresses
                              .filter((a) => a.toLowerCase().includes(((addrFilter || property) || "").trim().toLowerCase()))
                              .slice(0, 50)
                              .map((a, i) => (
                                <li
                                  key={i}
                                  onClick={() => {
                                    setProperty(a);
                                    setDropdownOpen(false);
                                    setAddrFilter("");
                                  }}
                                  className="cursor-pointer px-3 py-2 hover:bg-[#111] text-gray-200"
                                >
                                  {a}
                                </li>
                              ))}
                        </ul>
                        {property.trim() && existingAddresses.findIndex((a) => a.toLowerCase() === property.trim().toLowerCase()) === -1 && (
                          <div className="p-2 border-t border-[#151515]">
                            <button
                              type="button"
                              onClick={() => {
                                const typed = property.trim();
                                if (!typed) return;
                                setProperty(typed);
                                setDropdownOpen(false);
                                setAddrFilter("");
                              }}
                              className="w-full text-left text-sm text-emerald-300"
                            >
                              Use &quot;{(property || addrFilter).trim()}&quot; as new address
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); onClose(); }}
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
