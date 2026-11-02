"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn, dmyToIso, isValidIsoDate, isoToDmy } from "@/lib/utils";

type DateInputProps = {
  value?: string;
  onChange: (isoDate: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
};

/** Strip letters/symbols; keep digits and date separators only. */
function sanitizeDateTyping(raw: string): string {
  return raw.replace(/[^\d/\-.]/g, "").slice(0, 10);
}

/**
 * Date field that always displays DD/MM/YYYY (UK), while emitting ISO yyyy-mm-dd
 * to match the rest of the API. Native type="date" follows OS locale (often US).
 */
export default function DateInput({
  value = "",
  onChange,
  className,
  disabled,
  id,
  name,
  placeholder = "dd/mm/yyyy",
  required,
}: DateInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => isoToDmy(value));

  useEffect(() => {
    setText(isoToDmy(value));
  }, [value]);

  const commitText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setText("");
      onChange("");
      return;
    }
    const iso = dmyToIso(trimmed);
    if (!iso || !isValidIsoDate(iso)) {
      // Revert invalid typing to the last known value
      setText(isoToDmy(value));
      return;
    }
    setText(isoToDmy(iso));
    onChange(iso);
  };

  // Width/max-width must live on the relative wrapper so the calendar icon
  // stays inside the field when callers pass max-w-* on className.
  const widthClass = className
    ?.split(/\s+/)
    .filter((c) => /^(w-|max-w-|min-w-|flex-|basis-|grow|shrink)/.test(c))
    .join(" ");
  const inputClass = className
    ?.split(/\s+/)
    .filter((c) => c && !/^(w-|max-w-|min-w-|flex-|basis-|grow|shrink)/.test(c))
    .join(" ");

  return (
    <div className={cn("relative w-full", widthClass)}>
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        value={text}
        onChange={(e) => setText(sanitizeDateTyping(e.target.value))}
        onBlur={() => commitText(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitText(text);
          }
        }}
        className={cn(inputClass, "w-full pr-10")}
      />
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        min="1970-01-01"
        max="2100-12-31"
        value={value && isValidIsoDate(value) ? value : ""}
        onChange={(e) => {
          const iso = e.target.value || "";
          if (iso && !isValidIsoDate(iso)) return;
          setText(isoToDmy(iso));
          onChange(iso);
        }}
        className="absolute inset-y-0 right-0 z-10 w-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Open calendar"
        onClick={() => {
          const el = pickerRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
          if (!el || disabled) return;
          try {
            el.showPicker?.();
          } catch {
            el.click();
          }
        }}
        className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
    </div>
  );
}
