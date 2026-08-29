"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock, Check, ChevronUp, ChevronDown, X, Sparkles } from "lucide-react";

interface TimePickerProps {
  value?: string; // "HH:mm" e.g. "09:00" or "14:30"
  onChange: (timeStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  placement?: "auto" | "top" | "bottom";
}

// Popular WMS logistics dispatch time slots
const DEFAULT_TIME_PRESETS = [
  { label: "08:00 AM", sub: "Early Shift", time: "08:00" },
  { label: "09:00 AM", sub: "Morning Shift", time: "09:00" },
  { label: "10:30 AM", sub: "Midday Slot", time: "10:30" },
  { label: "01:00 PM", sub: "Afternoon", time: "13:00" },
  { label: "02:30 PM", sub: "Peak Dispatch", time: "14:30" },
  { label: "04:00 PM", sub: "Late Afternoon", time: "16:00" },
  { label: "06:00 PM", sub: "Evening Slot", time: "18:00" },
  { label: "08:00 PM", sub: "Night Shift", time: "20:00" },
];

/**
 * Format "HH:mm" (24h) to 12h AM/PM string (e.g. "09:00 AM" or "02:30 PM")
 */
function format12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;

  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function TimePicker({
  value = "09:00",
  onChange,
  placeholder = "Select Time",
  disabled = false,
  className = "",
  label,
  placement = "auto",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [computedPlacement, setComputedPlacement] = useState<"top" | "bottom">(
    placement === "top" ? "top" : "bottom"
  );
  const [horizontalAlign, setHorizontalAlign] = useState<"left" | "right">("left");

  // Parse current hour and minute
  const [hours, setHours] = useState<number>(() => {
    if (value && value.includes(":")) {
      const h = parseInt(value.split(":")[0], 10);
      return isNaN(h) ? 9 : h;
    }
    return 9;
  });

  const [minutes, setMinutes] = useState<number>(() => {
    if (value && value.includes(":")) {
      const m = parseInt(value.split(":")[1], 10);
      return isNaN(m) ? 0 : m;
    }
    return 0;
  });

  // Sync internal state when external value changes
  useEffect(() => {
    if (value && value.includes(":")) {
      const [hStr, mStr] = value.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h)) setHours(h);
      if (!isNaN(m)) setMinutes(m);
    }
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Compute smart popover position on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === "top" || placement === "bottom") {
        setComputedPlacement(placement);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverHeight = 350;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // If not enough room below, flip to top
        if (spaceBelow < popoverHeight && spaceAbove >= 280) {
          setComputedPlacement("top");
        } else {
          setComputedPlacement("bottom");
        }
      }

      // Check horizontal bounds
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = 320;
      if (rect.left + popoverWidth > window.innerWidth - 20) {
        setHorizontalAlign("right");
      } else {
        setHorizontalAlign("left");
      }
    }
  }, [isOpen, placement]);

  const emitTime = (h: number, m: number) => {
    const clampedH = Math.max(0, Math.min(23, h));
    const clampedM = Math.max(0, Math.min(59, m));
    const timeStr = `${String(clampedH).padStart(2, "0")}:${String(clampedM).padStart(2, "0")}`;
    onChange(timeStr);
  };

  const handleSelectPreset = (presetTime: string) => {
    onChange(presetTime);
    setIsOpen(false);
  };

  const handleHourChange = (delta: number) => {
    const nextH = (hours + delta + 24) % 24;
    setHours(nextH);
    emitTime(nextH, minutes);
  };

  const handleMinuteChange = (delta: number) => {
    const nextM = (minutes + delta + 60) % 60;
    setMinutes(nextM);
    emitTime(hours, nextM);
  };

  const handleSetMinute = (m: number) => {
    setMinutes(m);
    emitTime(hours, m);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const displayTime = value ? `${value} WIB (${format12Hour(value)})` : placeholder;

  const positionClasses =
    computedPlacement === "top"
      ? "bottom-full mb-1.5 origin-bottom"
      : "top-full mt-1.5 origin-top";

  const alignClasses =
    horizontalAlign === "right" ? "right-0" : "left-0";

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          {label}
        </label>
      )}

      {/* Input / Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/10 ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""
        } ${isOpen ? "border-indigo-600 ring-2 ring-indigo-500/10 shadow-xs" : "shadow-2xs"}`}
      >
        <div className="flex items-center gap-2 text-slate-700 truncate">
          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span className={`font-mono text-xs ${value ? "text-slate-900 font-bold" : "text-slate-400 font-normal"}`}>
            {displayTime}
          </span>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="h-4 w-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Clear time"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Popover Time Selector Grid */}
      {isOpen && (
        <div
          className={`absolute z-50 ${positionClasses} ${alignClasses} w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-xs animate-in fade-in-50 zoom-in-95 duration-100 space-y-3.5`}
        >
          {/* Header Time Display */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Selected Dispatch Window
              </div>
              <div className="text-sm font-extrabold text-indigo-700 font-mono flex items-center gap-1.5 mt-0.5">
                <span>{value || "09:00"} WIB</span>
                <span className="text-[11px] font-medium text-slate-500 font-sans">
                  ({format12Hour(value || "09:00")})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              <span>Done</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Standard Logistics Dispatch Slots</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEFAULT_TIME_PRESETS.map((preset) => {
                const isSelected = value === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleSelectPreset(preset.time)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600/30"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100/70"
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs">
                        {preset.label}
                      </div>
                      <div className="text-[9.5px] text-slate-400">
                        {preset.sub}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Stepper Adjuster */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Custom Time Stepper
            </div>

            <div className="flex items-center justify-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {/* Hours Column */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleHourChange(1)}
                  className="h-6 w-8 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <div className="w-12 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-mono font-extrabold text-base text-slate-900 shadow-inner">
                  {String(hours).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => handleHourChange(-1)}
                  className="h-6 w-8 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Hours</span>
              </div>

              <span className="font-mono font-black text-xl text-slate-400 pb-4">:</span>

              {/* Minutes Column */}
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMinuteChange(5)}
                  className="h-6 w-8 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <div className="w-12 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-mono font-extrabold text-base text-slate-900 shadow-inner">
                  {String(minutes).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  onClick={() => handleMinuteChange(-5)}
                  className="h-6 w-8 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Mins</span>
              </div>

              {/* Quick Minute Chips */}
              <div className="flex flex-col gap-1 pl-2 border-l border-slate-200">
                {[0, 15, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSetMinute(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                      minutes === m
                        ? "bg-indigo-600 text-white"
                        : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    :{String(m).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
