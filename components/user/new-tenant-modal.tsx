"use client";

import { X, Home, Users, Trash2, ChevronRight, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import useCreatePropertySetup from "@/hooks/useCreatePropertySetup";
import { assignTenantToRoom, endTenancy, getPayerSuggestions } from "@/lib/api/tenantsApi";
import { useTenantAddresses } from "@/hooks/useTenantAddresses";
import { useTenants } from "@/hooks/usetenants";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/redux/useAuthUser";
import toast from "react-hot-toast";
import RentScheduleFields, {
  buildRentSchedulePayload,
  type RentAdjustmentRow,
} from "@/components/user/rent-schedule-fields";

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
  /** Already on this property — shown read-only when adding more rooms */
  isExisting?: boolean;
  /** New room kept empty (no occupant yet) */
  vacant?: boolean;
  /** DB id for existing room tenancy */
  tenantId?: string;
  /** Editing an existing vacant room to assign an occupant */
  assigning?: boolean;
  /** Optional: record deposit taken (info only — not rent) */
  hasDeposit?: boolean;
  depositAmount?: string;
  rentAdjustments?: RentAdjustmentRow[];
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

/** Letters, spaces, hyphens, apostrophes only — no digits or other symbols. */
function sanitizeTenantNameInput(value: string) {
  return value.replace(/[^\p{L}\s'-]/gu, "");
}

function formatTenantNames(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(", ");
  if (typeof value === "string") return value;
  return value != null ? String(value) : "";
}

function roomNumberFromLabel(label: string): number {
  const match = String(label || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function nextRoomIndex(rooms: RoomTenant[]): number {
  const max = rooms.reduce((acc, r) => Math.max(acc, roomNumberFromLabel(r.room)), 0);
  return max + 1;
}

/** Days in the month of a YYYY-MM-DD date; defaults to 31 if unset. */
function daysInMonthForDate(dateStr: string): number {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 31;
  const [year, month] = dateStr.split("-").map(Number);
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function clampDueOn(dueOn: number, moveInDate: string): number {
  const max = daysInMonthForDate(moveInDate);
  return Math.min(max, Math.max(1, Number(dueOn) || 1));
}

function dueDayOptions(moveInDate: string): number[] {
  const max = daysInMonthForDate(moveInDate);
  return Array.from({ length: max }, (_, i) => i + 1);
}

function newRoom(index: number): RoomTenant {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    tenantName: "",
    rent: "",
    dueOn: 1,
    moveInDate: "",
    room: `Room ${index}`,
    isExisting: false,
    vacant: false,
    hasDeposit: false,
    depositAmount: "",
    rentAdjustments: [],
  };
}

function buildExistingRoomsForProperty(address: string, tenants: any[]): RoomTenant[] {
  const key = address.trim().toLowerCase();
  if (!key) return [];

  return tenants
    .filter((t) => String(t.property || "").trim().toLowerCase() === key)
    .filter((t) => t.tenancyStatus !== "ended")
    .map((t, i) => ({
      id: `existing-${t._id || i}`,
      tenantId: t._id ? String(t._id) : undefined,
      tenantName: formatTenantNames(t.tenantName),
      rent: t.rent != null && t.rent !== "" ? String(t.rent) : "",
      dueOn: Number(t.dueOn) || 1,
      moveInDate: t.moveInDate ? String(t.moveInDate).slice(0, 10) : "",
      room: t.room ? String(t.room).trim() : "",
      isExisting: true,
      vacant: t.tenancyStatus === "vacant",
      assigning: false,
      hasDeposit: Number(t.depositAmount) > 0,
      depositAmount: Number(t.depositAmount) > 0 ? String(t.depositAmount) : "",
    }))
    .sort((a, b) => {
      const aNum = roomNumberFromLabel(a.room);
      const bNum = roomNumberFromLabel(b.room);
      if (aNum && bNum) return aNum - bNum;
      if (aNum) return -1;
      if (bNum) return 1;
      return a.tenantName.localeCompare(b.tenantName);
    })
    .map((room, i) => ({
      ...room,
      room: room.room || `Room ${i + 1}`,
    }));
}

function roomsForExistingProperty(address: string, tenants: any[]): RoomTenant[] {
  const existing = buildExistingRoomsForProperty(address, tenants);
  return [...existing, newRoom(nextRoomIndex(existing))];
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
    hasDeposit: false,
    depositAmount: "",
    rentAdjustments: [] as RentAdjustmentRow[],
  });
  const [rooms, setRooms] = useState<RoomTenant[]>([newRoom(1)]);
  const [payerSuggestions, setPayerSuggestions] = useState<string[]>([]);
  /** When adding room(s) to an existing property, skip tenancy-type step */
  const [addingToExisting, setAddingToExisting] = useState(false);

  const createMutation = useCreatePropertySetup();
  const { data: existingAddresses = [] } = useTenantAddresses(open);
  const { data: tenantsRes } = useTenants();
  const allTenants = tenantsRes?.data ?? [];
  const qc = useQueryClient();
  const authUser = useAuthUser();
  const userId = authUser?.id || authUser?._id || authUser?.userId;
  const [removingRoomId, setRemovingRoomId] = useState<string | null>(null);
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);

  const propertyMeta = useMemo(() => {
    const map = new Map<
      string,
      {
        propertyName?: string;
        postcode?: string;
        tenancyType: TenancyType;
        roomCount: number;
        vacantCount: number;
        occupiedCount: number;
      }
    >();
    for (const t of allTenants) {
      if (t.tenancyStatus === "ended") continue;
      const key = String(t.property || "").trim().toLowerCase();
      if (!key) continue;
      const prev = map.get(key);
      const isHmo = t.tenancyType === "hmo" || Boolean(t.room);
      const isVacant = t.tenancyStatus === "vacant";
      map.set(key, {
        propertyName: t.propertyName || prev?.propertyName,
        postcode: t.postcode || prev?.postcode,
        tenancyType: isHmo || prev?.tenancyType === "hmo" ? "hmo" : "single",
        roomCount: (prev?.roomCount || 0) + 1,
        vacantCount: (prev?.vacantCount || 0) + (isVacant ? 1 : 0),
        occupiedCount: (prev?.occupiedCount || 0) + (isVacant ? 0 : 1),
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
    setSingleTenant({
      tenantName: "",
      rent: "",
      dueOn: 1,
      moveInDate: "",
      hasDeposit: false,
      depositAmount: "",
      rentAdjustments: [],
    });
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
    }
    setTenancyType("hmo");
    setRooms(roomsForExistingProperty(address, allTenants));
  };

  const filteredSuggestions = useMemo(() => payerSuggestions.slice(0, 30), [payerSuggestions]);

  const canContinueStep1 =
    propertyMode === "existing"
      ? property.trim().length > 0 &&
        existingAddresses.some((a) => a.toLowerCase() === property.trim().toLowerCase())
      : property.trim().length > 0;

  const canContinueStep2 = tenancyType === "single" || tenancyType === "hmo";

  const newRooms = useMemo(() => rooms.filter((r) => !r.isExisting), [rooms]);

  const validateStep3 = () => {
    if (tenancyType === "single" && !addingToExisting) {
      if (!(singleTenant.tenantName.trim().length > 0 && Number(singleTenant.rent) > 0)) return false;
      if (singleTenant.hasDeposit) {
        const d = Number(singleTenant.depositAmount);
        if (!Number.isFinite(d) || d <= 0) return false;
      }
      return true;
    }
    const editable = addingToExisting ? newRooms : rooms;
    return (
      editable.length > 0 &&
      editable.every((r) => {
        if (!r.room.trim()) return false;
        if (r.vacant) {
          const rentVal = r.rent.trim();
          return rentVal === "" || Number(rentVal) >= 0;
        }
        if (!(r.tenantName.trim().length > 0 && Number(r.rent) > 0)) return false;
        if (r.hasDeposit) {
          const d = Number(r.depositAmount);
          if (!Number.isFinite(d) || d <= 0) return false;
        }
        return true;
      })
    );
  };

  const addRoom = () => setRooms((prev) => [...prev, newRoom(nextRoomIndex(prev))]);

  const removeRoom = (id: string) => {
    setRooms((prev) => {
      const target = prev.find((r) => r.id === id);
      if (!target || target.isExisting) return prev;
      const next = prev.filter((r) => r.id !== id);
      if (next.filter((r) => !r.isExisting).length === 0) return prev;
      return next;
    });
  };

  const removeExistingVacantRoom = async (room: RoomTenant) => {
    if (!room.isExisting || !room.vacant || !room.tenantId || removingRoomId) return;
    setRemovingRoomId(room.id);
    try {
      await endTenancy(room.tenantId);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      qc.invalidateQueries({ queryKey: ["tenantAddresses"] });
      toast.success(`${room.room || "Room"} removed`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to remove room");
    } finally {
      setRemovingRoomId(null);
    }
  };

  const startAssignExistingVacant = (room: RoomTenant) => {
    if (!room.isExisting || !room.vacant || !room.tenantId) return;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === room.id
          ? {
              ...r,
              assigning: true,
              tenantName: "",
              moveInDate: new Date().toISOString().slice(0, 10),
              rent: r.rent && Number(r.rent) > 0 ? r.rent : "",
            }
          : { ...r, assigning: false }
      )
    );
  };

  const cancelAssignExistingVacant = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              assigning: false,
              tenantName: "",
              moveInDate: "",
            }
          : r
      )
    );
  };

  const saveAssignExistingVacant = async (room: RoomTenant) => {
    if (!room.tenantId || assigningRoomId) return;
    const name = sanitizeTenantNameInput(room.tenantName).trim().replace(/\s+/g, " ");
    if (!name || !/^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u.test(name)) {
      toast.error("Enter a valid tenant name (letters only).");
      return;
    }
    const rentNum = Number(room.rent);
    if (!Number.isFinite(rentNum) || rentNum <= 0) {
      toast.error("Enter a positive monthly rent.");
      return;
    }
    if (!room.moveInDate) {
      toast.error("Select a move-in date.");
      return;
    }
    if (room.hasDeposit) {
      const dep = Number(room.depositAmount);
      if (!Number.isFinite(dep) || dep <= 0) {
        toast.error("Enter the deposit amount, or uncheck Record deposit.");
        return;
      }
    }

    setAssigningRoomId(room.id);
    try {
      await assignTenantToRoom(room.tenantId, {
        tenantName: [name],
        rent: rentNum,
        dueOn: clampDueOn(room.dueOn, room.moveInDate),
        moveInDate: room.moveInDate,
        rentSchedule: buildRentSchedulePayload(room.rentAdjustments || []),
        ...(room.hasDeposit && Number(room.depositAmount) > 0
          ? { depositAmount: Number(room.depositAmount) }
          : { depositAmount: 0 }),
      });
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? {
                ...r,
                vacant: false,
                assigning: false,
                tenantName: name,
                rent: String(rentNum),
              }
            : r
        )
      );
      qc.invalidateQueries({ queryKey: ["tenants", userId] });
      toast.success("Tenant assigned");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign tenant");
    } finally {
      setAssigningRoomId(null);
    }
  };

  const updateRoom = (id: string, patch: Partial<RoomTenant>) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // Existing occupied rooms stay read-only; vacant can edit while assigning
        if (r.isExisting && !r.assigning) return r;
        const next = { ...r, ...patch };
        if (Object.prototype.hasOwnProperty.call(patch, "moveInDate")) {
          next.dueOn = clampDueOn(next.dueOn, next.moveInDate);
        }
        if (Object.prototype.hasOwnProperty.call(patch, "dueOn")) {
          next.dueOn = clampDueOn(next.dueOn, next.moveInDate);
        }
        return next;
      })
    );
  };

  const goFromStep1 = () => {
    if (!canContinueStep1) return;
    if (propertyMode === "existing") {
      setAddingToExisting(true);
      setTenancyType("hmo");
      setRooms(roomsForExistingProperty(property, allTenants));
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
              depositAmount:
                singleTenant.hasDeposit && Number(singleTenant.depositAmount) > 0
                  ? Number(singleTenant.depositAmount)
                  : 0,
              rentSchedule: buildRentSchedulePayload(singleTenant.rentAdjustments || []),
            },
          ]
        : (addingToExisting ? newRooms : rooms).map((r) => ({
            tenantName: r.vacant ? [] : r.tenantName.trim(),
            rent: r.vacant ? (r.rent.trim() === "" ? 0 : Number(r.rent)) : Number(r.rent),
            dueOn: r.vacant ? undefined : Number(r.dueOn) || 1,
            moveInDate: r.vacant ? undefined : r.moveInDate || undefined,
            room: r.room.trim(),
            vacant: Boolean(r.vacant),
            depositAmount:
              r.vacant || !r.hasDeposit || !(Number(r.depositAmount) > 0)
                ? 0
                : Number(r.depositAmount),
            rentSchedule: r.vacant ? [] : buildRentSchedulePayload(r.rentAdjustments || []),
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
            className="flex max-h-[92vh] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0c0c0c] text-white shadow-2xl"
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

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden p-5 sm:flex-row sm:p-8 sm:pt-6 sm:pb-0">
              <aside className="hidden w-56 shrink-0 sm:block">
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

              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-4" style={{ scrollbarWidth: "thin" }}>
                <div className="space-y-5">
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
                          {existingAddresses.length === 0 ? (
                            <p className="rounded-lg border border-[#222] bg-[#0c0c0c] px-3 py-3 text-sm text-gray-500">
                              No existing properties yet.
                            </p>
                          ) : (
                            <div className="max-h-64 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                              {existingAddresses.map((addr) => {
                                const meta = propertyMeta.get(addr.trim().toLowerCase());
                                const selected =
                                  property.trim().toLowerCase() === addr.trim().toLowerCase();
                                const isHmo = meta?.tenancyType === "hmo";
                                const vacant = meta?.vacantCount || 0;
                                const occupied = meta?.occupiedCount || 0;

                                const occupancyLabel = !isHmo
                                  ? occupied > 0
                                    ? "Single let · occupied"
                                    : vacant > 0
                                      ? "Single let · vacant"
                                      : "Single let"
                                  : `${occupied} occupied · ${vacant} vacant`;

                                return (
                                  <button
                                    key={addr}
                                    type="button"
                                    onClick={() => selectExistingProperty(addr)}
                                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                                      selected
                                        ? "border-emerald-700 bg-emerald-950/30"
                                        : "border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a]"
                                    }`}
                                  >
                                    <p className="min-w-0 truncate text-sm text-gray-200">
                                      {addr}
                                      <span className="text-gray-500"> · {occupancyLabel}</span>
                                    </p>
                                    {selected && (
                                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
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
                        {" — "}existing rooms are shown below (vacant ones can be assigned or removed). New rooms only are saved with Add room.
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
                              setSingleTenant((s) => ({
                                ...s,
                                tenantName: sanitizeTenantNameInput(e.target.value),
                              }))
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
                          <label className={labelClass}>Move-in date</label>
                  <input
                    type="date"
                            value={singleTenant.moveInDate}
                            onChange={(e) => {
                              const moveInDate = e.target.value;
                              setSingleTenant((s) => ({
                                ...s,
                                moveInDate,
                                dueOn: clampDueOn(s.dueOn, moveInDate),
                              }));
                            }}
                            className={`${inputClass} [color-scheme:dark]`}
                          />
                        </div>
                <div>
                          <label className={labelClass}>Due day of month</label>
                  <select
                            value={clampDueOn(singleTenant.dueOn, singleTenant.moveInDate)}
                            onChange={(e) =>
                              setSingleTenant((s) => ({
                                ...s,
                                dueOn: clampDueOn(Number(e.target.value) || 1, s.moveInDate),
                              }))
                            }
                            className={`${inputClass} [color-scheme:dark]`}
                          >
                            {dueDayOptions(singleTenant.moveInDate).map((day) => (
                              <option key={day} value={day} className="bg-[#0a0a0a] text-white">
                                {day}
                              </option>
                            ))}
                  </select>
                          {!singleTenant.moveInDate && (
                            <p className="mt-1 text-[11px] text-gray-500">
                              Select a move-in date to limit days for that month.
                            </p>
                          )}
                </div>
                        <div className="md:col-span-2 xl:col-span-4">
                          <RentScheduleFields
                            baseRent={singleTenant.rent}
                            onBaseRentChange={(rent) => setSingleTenant((s) => ({ ...s, rent }))}
                            adjustments={singleTenant.rentAdjustments || []}
                            onAdjustmentsChange={(rentAdjustments) =>
                              setSingleTenant((s) => ({ ...s, rentAdjustments }))
                            }
                            hideBaseRent
                            labelClass={labelClass}
                            inputClass={inputClass}
                          />
                        </div>
                        <div className="md:col-span-2 xl:col-span-4">
                          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                            <input
                              type="checkbox"
                              checked={singleTenant.hasDeposit}
                              onChange={(e) =>
                                setSingleTenant((s) => ({
                                  ...s,
                                  hasDeposit: e.target.checked,
                                  depositAmount: e.target.checked ? s.depositAmount : "",
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                            />
                            Record deposit
                          </label>
                          <p className="mt-1 text-[11px] text-gray-500">
                            Optional — saved for records only. Does not affect rent history or balances.
                          </p>
                          {singleTenant.hasDeposit && (
                            <div className="mt-2 max-w-xs">
                              <label className={labelClass}>Deposit amount (£)</label>
                              <input
                                value={singleTenant.depositAmount}
                                onChange={(e) =>
                                  setSingleTenant((s) => ({
                                    ...s,
                                    depositAmount: sanitizeRentInput(e.target.value),
                                  }))
                                }
                                placeholder="e.g. 780"
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rooms.map((room, index) => {
                          const isExisting = Boolean(room.isExisting);
                          const isVacant = Boolean(room.vacant);
                          const isAssigning = Boolean(room.assigning);
                          const canRemoveNew =
                            !isExisting && newRooms.length > 1;
                          const canRemoveVacant =
                            isExisting && isVacant && Boolean(room.tenantId);
                          const fieldsLocked =
                            (isExisting && !isAssigning) || (!isExisting && isVacant);
                          const showVacantBadge = isVacant && !isAssigning;

                          return (
                          <div
                            key={room.id}
                            className={`rounded-xl border p-4 ${
                              isExisting && !isAssigning
                                ? "border-[#2a2a2a] bg-[#111] opacity-90"
                                : isVacant || isAssigning
                                  ? "border-amber-900/50 bg-[#0c0c0c]"
                                  : "border-[#222] bg-[#0c0c0c]"
                            }`}
                          >
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  value={room.room}
                                  onChange={(e) => updateRoom(room.id, { room: e.target.value })}
                                  disabled={isExisting}
                                  className="w-32 rounded-md border border-[#2a2a2a] bg-transparent px-2 py-1 text-sm font-medium text-white outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:text-gray-400"
                                />
                                {isExisting && (
                                  <span className="rounded-full border border-[#333] px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                                    Existing
                                  </span>
                                )}
                                {showVacantBadge && (
                                  <span className="rounded-full border border-amber-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                                    Vacant
                                  </span>
                                )}
                                {!isExisting && (
                                  <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-xs text-gray-400">
                                    <input
                                      type="checkbox"
                                      checked={isVacant}
                                      onChange={(e) =>
                                        updateRoom(room.id, {
                                          vacant: e.target.checked,
                                          tenantName: e.target.checked ? "" : room.tenantName,
                                          moveInDate: e.target.checked ? "" : room.moveInDate,
                                          hasDeposit: e.target.checked ? false : room.hasDeposit,
                                          depositAmount: e.target.checked ? "" : room.depositAmount,
                                        })
                                      }
                                      className="h-3.5 w-3.5 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                                    />
                                    Keep vacant
                                  </label>
                                )}
                                {canRemoveVacant && !isAssigning && (
                                  <button
                                    type="button"
                                    onClick={() => startAssignExistingVacant(room)}
                                    className="rounded-full border border-emerald-800 px-2.5 py-0.5 text-[11px] text-emerald-300 hover:bg-emerald-950/40"
                                  >
                                    Assign tenant
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isAssigning && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => cancelAssignExistingVacant(room.id)}
                                      className="rounded-full border border-[#333] px-2.5 py-1 text-[11px] text-gray-400 hover:bg-white/5"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => saveAssignExistingVacant(room)}
                                      disabled={assigningRoomId === room.id}
                                      className="rounded-full border border-emerald-700 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
                                    >
                                      {assigningRoomId === room.id ? "Saving..." : "Save"}
                                    </button>
                                  </>
                                )}
                                {(canRemoveNew || canRemoveVacant) && !isAssigning && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      canRemoveVacant
                                        ? removeExistingVacantRoom(room)
                                        : removeRoom(room.id)
                                    }
                                    disabled={removingRoomId === room.id}
                                    className="rounded-md p-1.5 text-rose-400 transition hover:bg-rose-950/40 disabled:opacity-50"
                                    aria-label={`Remove ${room.room || `room ${index + 1}`}`}
                                    title={canRemoveVacant ? "Remove vacant room" : "Remove room"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <label className={labelClass}>Tenant name</label>
                                <input
                                  list={fieldsLocked ? undefined : "payer-suggestions"}
                                  value={isVacant && !isAssigning ? "" : room.tenantName}
                                  onChange={(e) =>
                                    updateRoom(room.id, {
                                      tenantName: sanitizeTenantNameInput(e.target.value),
                                    })
                                  }
                                  disabled={fieldsLocked}
                                  placeholder={
                                    isVacant && !isAssigning ? "No tenant yet" : "e.g. John Smith"
                                  }
                                  className={`${inputClass} disabled:cursor-not-allowed disabled:text-gray-400`}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>
                                  {isVacant && !isAssigning
                                    ? "Expected rent (£)"
                                    : "Monthly rent (£)"}
                                </label>
                                <input
                                  value={room.rent}
                                  onChange={(e) =>
                                    updateRoom(room.id, {
                                      rent: sanitizeRentInput(e.target.value),
                                    })
                                  }
                                  disabled={isExisting && !isAssigning}
                                  placeholder={
                                    isVacant && !isAssigning ? "Optional" : "e.g. 650"
                                  }
                                  className={`${inputClass} disabled:cursor-not-allowed disabled:text-gray-400`}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Move-in date</label>
                                <input
                                  type="date"
                                  value={
                                    isVacant && !isAssigning ? "" : room.moveInDate
                                  }
                                  onChange={(e) =>
                                    updateRoom(room.id, { moveInDate: e.target.value })
                                  }
                                  disabled={fieldsLocked}
                                  className={`${inputClass} [color-scheme:dark] disabled:cursor-not-allowed disabled:text-gray-400`}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Due day</label>
                                <select
                                  value={clampDueOn(room.dueOn, room.moveInDate)}
                                  onChange={(e) =>
                                    updateRoom(room.id, {
                                      dueOn: Number(e.target.value) || 1,
                                    })
                                  }
                                  disabled={fieldsLocked}
                                  className={`${inputClass} [color-scheme:dark] disabled:cursor-not-allowed disabled:text-gray-400`}
                                >
                                  {dueDayOptions(room.moveInDate).map((day) => (
                                    <option key={day} value={day} className="bg-[#0a0a0a] text-white">
                                      {day}
                                    </option>
                                  ))}
                                </select>
                                {!fieldsLocked && !room.moveInDate && (
                                  <p className="mt-1 text-[11px] text-gray-500">
                                    Select a move-in date to limit days for that month.
                                  </p>
                                )}
                              </div>
                              {!(isExisting && !isAssigning) && !isVacant && (
                                <div className="md:col-span-2 xl:col-span-4">
                                  <RentScheduleFields
                                    baseRent={room.rent}
                                    onBaseRentChange={(rent) => updateRoom(room.id, { rent })}
                                    adjustments={room.rentAdjustments || []}
                                    onAdjustmentsChange={(rentAdjustments) =>
                                      updateRoom(room.id, { rentAdjustments })
                                    }
                                    hideBaseRent
                                    disabled={fieldsLocked}
                                    labelClass={labelClass}
                                    inputClass={inputClass}
                                  />
                                </div>
                              )}
                              {isVacant && isAssigning && (
                                <div className="md:col-span-2 xl:col-span-4">
                                  <RentScheduleFields
                                    baseRent={room.rent}
                                    onBaseRentChange={(rent) => updateRoom(room.id, { rent })}
                                    adjustments={room.rentAdjustments || []}
                                    onAdjustmentsChange={(rentAdjustments) =>
                                      updateRoom(room.id, { rentAdjustments })
                                    }
                                    hideBaseRent
                                    labelClass={labelClass}
                                    inputClass={inputClass}
                                  />
                                </div>
                              )}
                              {!fieldsLocked && (
                                <div className="md:col-span-2 xl:col-span-4">
                                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(room.hasDeposit)}
                                      onChange={(e) =>
                                        updateRoom(room.id, {
                                          hasDeposit: e.target.checked,
                                          depositAmount: e.target.checked ? room.depositAmount : "",
                                        })
                                      }
                                      className="h-4 w-4 rounded border-gray-600 bg-transparent text-emerald-600 focus:ring-emerald-600"
                                    />
                                    Record deposit
                                  </label>
                                  <p className="mt-1 text-[11px] text-gray-500">
                                    Optional — records only; does not change rent due or balance.
                                  </p>
                                  {room.hasDeposit && (
                                    <div className="mt-2 max-w-xs">
                                      <label className={labelClass}>Deposit amount (£)</label>
                                      <input
                                        value={room.depositAmount || ""}
                                        onChange={(e) =>
                                          updateRoom(room.id, {
                                            depositAmount: sanitizeRentInput(e.target.value),
                                          })
                                        }
                                        placeholder="e.g. 650"
                                        className={inputClass}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              {fieldsLocked && Number(room.depositAmount) > 0 && (
                                <div className="md:col-span-2 xl:col-span-4">
                                  <p className="text-xs text-gray-500">
                                    Deposit on record:{" "}
                                    <span className="text-gray-300">£{Number(room.depositAmount).toFixed(2)}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}

                    <datalist id="payer-suggestions">
                      {filteredSuggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </section>
                )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1a1a1a] bg-[#0c0c0c] px-5 py-4 sm:px-8">
              {step === 1 ? (
                <>
                  <span />
                  <button
                    type="button"
                    disabled={!canContinueStep1}
                    onClick={goFromStep1}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {propertyMode === "existing" ? "Add room" : "Continue"}{" "}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : step === 2 ? (
                <>
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
