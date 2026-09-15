"use client";

import { X, Home, Users, Trash2, ChevronRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import useCreatePropertySetup from "@/hooks/useCreatePropertySetup";
import { getPayerSuggestions } from "@/lib/api/tenantsApi";
import { useTenantAddresses } from "@/hooks/useTenantAddresses";
import { useTenants } from "@/hooks/usetenants";

interface NewTenantModalProps {
  open: boolean;
  onClose: () => void;
}

type TenancyType = "single" | "hmo";
type PropertyMode = "new" | "existing";

type RoomTenant = {
  id: string;
  tenantName: string;
  rent: string;
  dueOn: number;
  moveInDate: string;
  room: string;
};

const RENT_NUMERIC = /[^0-9.]/g;

function sanitizeRentInput(value: string) {
  let cleaned = value.replace(RENT_NUMERIC, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

function newRoom(index: number): RoomTenant {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    tenantName: "",
    rent: "",
    dueOn: 1,
    moveInDate: "",
    room: `Room ${index}`,
  };
}

export default function NewTenantModal({ open, onClose }: NewTenantModalProps) {
  const [step, setStep] = useState(1);
  const [propertyMode, setPropertyMode] = useState<PropertyMode>("new");
  const [property, setProperty] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [tenancyType, setTenancyType] = useState<TenancyType>("single");
  const [singleTenant, setSingleTenant] = useState({
    tenantName: "",
    rent: "",
    dueOn: 1,
    moveInDate: "",
  });
  const [rooms, setRooms] = useState<RoomTenant[]>([newRoom(1)]);
  const [payerSuggestions, setPayerSuggestions] = useState<string[]>([]);
  /** When adding room(s) to an existing property, skip tenancy-type step */
  const [addingToExisting, setAddingToExisting] = useState(false);

  const createMutation = useCreatePropertySetup();
  const { data: existingAddresses = [] } = useTenantAddresses();
  const { data: tenantsRes } = useTenants();
  const allTenants = tenantsRes?.data ?? [];

  const propertyMeta = useMemo(() => {
    const map = new Map<
      string,
      { propertyName?: string; postcode?: string; tenancyType: TenancyType; roomCount: number }
    >();
    for (const t of allTenants) {
      const key = String(t.property || "").trim().toLowerCase();
      if (!key) continue;
      const prev = map.get(key);
      const isHmo = t.tenancyType === "hmo" || Boolean(t.room);
      map.set(key, {
        propertyName: t.propertyName || prev?.propertyName,
        postcode: t.postcode || prev?.postcode,
        tenancyType: isHmo || prev?.tenancyType === "hmo" ? "hmo" : "single",
        roomCount: (prev?.roomCount || 0) + 1,
      });
    }
    return map;
  }, [allTenants]);

  const steps = useMemo(() => {
    if (addingToExisting) {
      return [
        { id: 1, title: "Select property", subtitle: "Choose an existing address" },
        { id: 3, title: "Add room / tenant", subtitle: "New room on this property" },
      ];
    }
    return [
      { id: 1, title: "Property details", subtitle: "Address and basic information" },
      { id: 2, title: "Tenancy type", subtitle: "Single let or HMO" },
      { id: 3, title: "Tenant information", subtitle: "Add tenant(s) and rent details" },
    ];
  }, [addingToExisting]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await getPayerSuggestions();
        if (!cancelled) setPayerSuggestions(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setPayerSuggestions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const resetForm = () => {
    setStep(1);
    setPropertyMode("new");
    setAddingToExisting(false);
    setProperty("");
    setPropertyName("");
    setPostcode("");
    setTenancyType("single");
    setSingleTenant({ tenantName: "", rent: "", dueOn: 1, moveInDate: "" });
    setRooms([newRoom(1)]);
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const selectExistingProperty = (address: string) => {
    setProperty(address);
    const meta = propertyMeta.get(address.trim().toLowerCase());
    if (meta) {
      setPropertyName(meta.propertyName || "");
      setPostcode(meta.postcode || "");
      setTenancyType("hmo");
      setRooms([newRoom(meta.roomCount + 1)]);
    } else {
      setTenancyType("hmo");
      setRooms([newRoom(1)]);
    }
  };

  const filteredSuggestions = useMemo(() => payerSuggestions.slice(0, 30), [payerSuggestions]);

  const canContinueStep1 =
    propertyMode === "existing"
      ? property.trim().length > 0 &&
        existingAddresses.some((a) => a.toLowerCase() === property.trim().toLowerCase())
      : property.trim().length > 0;

  const canContinueStep2 = tenancyType === "single" || tenancyType === "hmo";

  const validateStep3 = () => {
    if (tenancyType === "single" && !addingToExisting) {
      return singleTenant.tenantName.trim().length > 0 && Number(singleTenant.rent) > 0;
    }
    return rooms.every(
      (r) => r.tenantName.trim().length > 0 && Number(r.rent) > 0 && r.room.trim().length > 0
    );
  };

  const addRoom = () => setRooms((prev) => [...prev, newRoom(prev.length + 1)]);

  const removeRoom = (id: string) => {
    setRooms((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const updateRoom = (id: string, patch: Partial<RoomTenant>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const goFromStep1 = () => {
    if (!canContinueStep1) return;
    if (propertyMode === "existing") {
      setAddingToExisting(true);
      setTenancyType("hmo");
      const meta = propertyMeta.get(property.trim().toLowerCase());
      setRooms([newRoom((meta?.roomCount || 0) + 1)]);
      setStep(3);
      return;
    }
    setAddingToExisting(false);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!validateStep3() || createMutation.isPending) return;

    const effectiveType = addingToExisting ? "hmo" : tenancyType;

    const tenants =
      effectiveType === "single"
        ? [
            {
              tenantName: singleTenant.tenantName.trim(),
              rent: Number(singleTenant.rent),
              dueOn: Number(singleTenant.dueOn) || 1,
              moveInDate: singleTenant.moveInDate || undefined,
            },
          ]
        : rooms.map((r) => ({
            tenantName: r.tenantName.trim(),
            rent: Number(r.rent),
            dueOn: Number(r.dueOn) || 1,
            moveInDate: r.moveInDate || undefined,
            room: r.room.trim(),
          }));

    createMutation.mutate(
      {
        property: property.trim(),
        propertyName: propertyName.trim() || undefined,
        postcode: postcode.trim() || undefined,
        tenancyType: effectiveType,
        tenants,
      },
      { onSuccess: () => onClose() }
    );
  };

  const inputClass =
    "w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-emerald-600";
  const labelClass = "mb-1.5 block text-xs font-medium text-gray-400";

  const headerTitle = addingToExisting ? "Add room to property" : "Add New Tenant";
  const headerSubtitle = addingToExisting
    ? "Pick an existing property and add another room tenant — no need to re-enter the address."
    : "Add the property details first, then set up the tenancy and tenant(s).";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] text-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#1a1a1a] px-5 py-5 sm:px-8">
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{headerTitle}</h2>
                <p className="mt-1 text-sm text-gray-400">{headerSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-5 sm:flex-row sm:p-8">
              <aside className="w-full shrink-0 sm:w-56">
                <ol className="relative space-y-0">
                  {steps.map((s, idx) => {
                    const active = step === s.id;
                    const done = step > s.id || (addingToExisting && s.id === 1 && step === 3);
                    return (
                      <li key={s.id} className="relative flex gap-3 pb-8 last:pb-0">
                        {idx < steps.length - 1 && (
                          <span
                            className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-px ${
                              done ? "bg-emerald-600" : "bg-[#2a2a2a]"
                            }`}
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            active
                              ? "bg-emerald-600 text-white"
                              : done
                                ? "bg-emerald-900/50 text-emerald-400 ring-1 ring-emerald-700"
                                : "bg-[#151515] text-gray-500 ring-1 ring-[#2a2a2a]"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="pt-1">
                          <p className={`text-sm font-medium ${active ? "text-white" : "text-gray-400"}`}>
                            {s.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">{s.subtitle}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </aside>

              <div className="min-w-0 flex-1 space-y-5">
                {step === 1 && (
                  <section className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold">
                        1
                      </span>
                      <h3 className="font-medium">
                        {propertyMode === "existing" ? "Select property" : "Property details"}
                      </h3>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPropertyMode("new");
                          setAddingToExisting(false);
                          setProperty("");
                          setPropertyName("");
                          setPostcode("");
                        }}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                          propertyMode === "new"
                            ? "border-emerald-600 bg-emerald-950/30 text-emerald-300"
                            : "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                        }`}
                      >
                        New property
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPropertyMode("existing");
                          setProperty("");
                        }}
                        disabled={existingAddresses.length === 0}
                        className={`rounded-lg border px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          propertyMode === "existing"
                            ? "border-emerald-600 bg-emerald-950/30 text-emerald-300"
                            : "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                        }`}
                      >
                        Existing property
                      </button>
                    </div>

                    {propertyMode === "existing" ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">
                          Choose a property you already have, then add another room tenant without
                          re-entering the address.
                        </p>
                        <div>
                          <label className={labelClass}>Property</label>
                          <select
                            value={property}
                            onChange={(e) => selectExistingProperty(e.target.value)}
                            className={inputClass}
                          >
                            <option value="">Select a property…</option>
                            {existingAddresses.map((addr) => {
                              const meta = propertyMeta.get(addr.trim().toLowerCase());
                              const tag =
                                meta?.tenancyType === "hmo"
                                  ? ` (${meta.roomCount} room${meta.roomCount === 1 ? "" : "s"})`
                                  : " (single let)";
                              return (
                                <option key={addr} value={addr}>
                                  {addr}
                                  {tag}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        {property && (
                          <div className="rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 text-xs text-gray-400">
                            Address locked: <span className="text-gray-200">{property}</span>
                            {propertyName ? (
                              <>
                                {" "}
                                · <span className="text-gray-200">{propertyName}</span>
                              </>
                            ) : null}
                            {postcode ? (
                              <>
                                {" "}
                                · <span className="text-gray-200">{postcode}</span>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>Property address</label>
                          <input
                            value={property}
                            onChange={(e) => setProperty(e.target.value)}
                            placeholder="e.g. 119 The Avenue, London"
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={labelClass}>Property name (optional)</label>
                            <input
                              value={propertyName}
                              onChange={(e) => setPropertyName(e.target.value)}
                              placeholder="e.g. Avenue House"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Postcode</label>
                            <input
                              value={postcode}
                              onChange={(e) => setPostcode(e.target.value)}
                              placeholder="e.g. SW1A 1AA"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        disabled={!canContinueStep1}
                        onClick={goFromStep1}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {propertyMode === "existing" ? "Add room" : "Continue"}{" "}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                )}

                {step === 2 && !addingToExisting && (
                  <section className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold">
                        2
                      </span>
                      <h3 className="font-medium">Tenancy type</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-400">
                      Select whether this is a single let or an HMO.
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setTenancyType("single")}
                        className={`rounded-xl border p-4 text-left transition ${
                          tenancyType === "single"
                            ? "border-emerald-600 bg-emerald-950/30"
                            : "border-[#2a2a2a] bg-[#0c0c0c] hover:border-[#3a3a3a]"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Home
                            className={`h-6 w-6 ${
                              tenancyType === "single" ? "text-emerald-400" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`h-4 w-4 rounded-full border-2 ${
                              tenancyType === "single"
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-600"
                            }`}
                          />
                        </div>
                        <p className="font-medium text-white">Single let</p>
                        <p className="mt-1 text-xs text-gray-400">One tenant for the whole property.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTenancyType("hmo")}
                        className={`rounded-xl border p-4 text-left transition ${
                          tenancyType === "hmo"
                            ? "border-emerald-600 bg-emerald-950/30"
                            : "border-[#2a2a2a] bg-[#0c0c0c] hover:border-[#3a3a3a]"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Users
                            className={`h-6 w-6 ${
                              tenancyType === "hmo" ? "text-emerald-400" : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`h-4 w-4 rounded-full border-2 ${
                              tenancyType === "hmo"
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-600"
                            }`}
                          />
                        </div>
                        <p className="font-medium text-white">HMO</p>
                        <p className="mt-1 text-xs text-gray-400">Multiple rooms with different tenants.</p>
                      </button>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="rounded-lg border border-[#2a2a2a] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!canContinueStep2}
                        onClick={() => {
                          if (tenancyType === "hmo") setRooms([newRoom(1)]);
                          setStep(3);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
                      >
                        Continue <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </section>
                )}

                {step === 3 && (
                  <section className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold">
                          {addingToExisting ? 2 : 3}
                        </span>
                        <div className="flex items-center gap-2">
                          {tenancyType === "single" && !addingToExisting ? (
                            <Home className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Users className="h-4 w-4 text-emerald-400" />
                          )}
                          <h3 className="font-medium">
                            {addingToExisting
                              ? "New room tenant"
                              : tenancyType === "single"
                                ? "Single let"
                                : "HMO"}
                          </h3>
                        </div>
                      </div>
                      {(tenancyType === "hmo" || addingToExisting) && (
                        <button
                          type="button"
                          onClick={addRoom}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-950/40"
                        >
                          <Plus className="h-4 w-4" /> Add room
                        </button>
                      )}
                    </div>

                    {addingToExisting && (
                      <p className="mb-4 rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-2 text-sm text-gray-400">
                        Adding to <span className="text-white">{property}</span>
                      </p>
                    )}

                    {tenancyType === "single" && !addingToExisting ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <label className={labelClass}>Tenant name</label>
                          <input
                            list="payer-suggestions"
                            value={singleTenant.tenantName}
                            onChange={(e) =>
                              setSingleTenant((s) => ({ ...s, tenantName: e.target.value }))
                            }
                            placeholder="e.g. John Smith"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Monthly rent (£)</label>
                          <input
                            value={singleTenant.rent}
                            onChange={(e) =>
                              setSingleTenant((s) => ({
                                ...s,
                                rent: sanitizeRentInput(e.target.value),
                              }))
                            }
                            placeholder="e.g. 1200"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Due day of month</label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={singleTenant.dueOn}
                            onChange={(e) =>
                              setSingleTenant((s) => ({
                                ...s,
                                dueOn: Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Move-in date</label>
                          <input
                            type="date"
                            value={singleTenant.moveInDate}
                            onChange={(e) =>
                              setSingleTenant((s) => ({ ...s, moveInDate: e.target.value }))
                            }
                            className={`${inputClass} [color-scheme:dark]`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rooms.map((room, index) => (
                          <div
                            key={room.id}
                            className="rounded-xl border border-[#222] bg-[#0c0c0c] p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <input
                                value={room.room}
                                onChange={(e) => updateRoom(room.id, { room: e.target.value })}
                                className="w-32 rounded-md border border-[#2a2a2a] bg-transparent px-2 py-1 text-sm font-medium text-white outline-none focus:border-emerald-600"
                              />
                              {rooms.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRoom(room.id)}
                                  className="rounded-md p-1.5 text-rose-400 transition hover:bg-rose-950/40"
                                  aria-label={`Remove ${room.room || `room ${index + 1}`}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <label className={labelClass}>Tenant name</label>
                                <input
                                  list="payer-suggestions"
                                  value={room.tenantName}
                                  onChange={(e) =>
                                    updateRoom(room.id, { tenantName: e.target.value })
                                  }
                                  placeholder="e.g. John Smith"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Monthly rent (£)</label>
                                <input
                                  value={room.rent}
                                  onChange={(e) =>
                                    updateRoom(room.id, {
                                      rent: sanitizeRentInput(e.target.value),
                                    })
                                  }
                                  placeholder="e.g. 650"
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Due day</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={31}
                                  value={room.dueOn}
                                  onChange={(e) =>
                                    updateRoom(room.id, {
                                      dueOn: Math.min(
                                        31,
                                        Math.max(1, Number(e.target.value) || 1)
                                      ),
                                    })
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Move-in date</label>
                                <input
                                  type="date"
                                  value={room.moveInDate}
                                  onChange={(e) =>
                                    updateRoom(room.id, { moveInDate: e.target.value })
                                  }
                                  className={`${inputClass} [color-scheme:dark]`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <datalist id="payer-suggestions">
                      {filteredSuggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(addingToExisting ? 1 : 2)}
                        className="rounded-lg border border-[#2a2a2a] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!validateStep3() || createMutation.isPending}
                        onClick={handleSubmit}
                        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {createMutation.isPending
                          ? "Adding..."
                          : addingToExisting
                            ? "Add room"
                            : "Add property"}
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
