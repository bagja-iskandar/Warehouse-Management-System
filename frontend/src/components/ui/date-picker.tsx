"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value?: string; // "YYYY-MM-DD" or ISO string
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  disabled?: boolean;
  className?: string;
  label?: string;
  presetMode?: "expiry" | "dispatch";
  placement?: "auto" | "top" | "bottom";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select Date",
  minDate,
  maxDate,
  disabled = false,
  className = "",
  label,
  presetMode = "expiry",
  placement = "auto",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [computedPlacement, setComputedPlacement] = useState<"top" | "bottom">(
    placement === "top" ? "top" : "bottom"
  );
  const [horizontalAlign, setHorizontalAlign] = useState<"left" | "right">("left");

  // Parse initial selected date
  const parsedDate = value ? new Date(value) : null;
  const validDate = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;

  // View state for Month and Year
  const [viewDate, setViewDate] = useState<Date>(validDate || new Date());

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
        const popoverHeight = 340;
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
      const popoverWidth = 300;
      if (rect.left + popoverWidth > window.innerWidth - 20) {
        setHorizontalAlign("right");
      } else {
        setHorizontalAlign("left");
      }
    }
  }, [isOpen, placement]);

  // Update view when value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [value]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Helper to format display string (e.g. "25 Aug 2026")
  const formatDisplay = (d: Date | null) => {
    if (!d) return "";
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Format ISO date string "YYYY-MM-DD"
  const formatIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(currentYear, currentMonth, day);
    onChange(formatIso(selected));
    setIsOpen(false);
  };

  const handleMonthPreset = (monthsToAdd: number) => {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, now.getDate());
    onChange(formatIso(future));
    setIsOpen(false);
  };

  const handleDayPreset = (daysToAdd: number) => {
    const now = new Date();
    const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
    onChange(formatIso(future));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  // Calendar matrix calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const minD = minDate ? new Date(minDate) : null;
  const maxD = maxDate ? new Date(maxDate) : null;

  const isDayDisabled = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day, 23, 59, 59);
    if (minD && checkDate < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate())) {
      return true;
    }
    if (maxD && checkDate > new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate(), 23, 59, 59)) {
      return true;
    }
    return false;
  };

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
          <CalendarIcon className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span className={`font-mono text-xs ${validDate ? "text-slate-900 font-bold" : "text-slate-400 font-normal"}`}>
            {validDate ? formatDisplay(validDate) : placeholder}
          </span>
        </div>

        {validDate && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="h-4 w-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Clear date"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Popover Calendar Grid */}
      {isOpen && (
        <div
          className={`absolute z-50 ${positionClasses} ${alignClasses} w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-xs animate-in fade-in-50 zoom-in-95 duration-100`}
        >
          {/* Header Month / Year */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="font-bold text-slate-900 text-xs tracking-tight">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center font-bold text-[10px] text-slate-400">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Day Cells Matrix */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Prev month days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => {
              const prevDay = daysInPrevMonth - firstDayOfMonth + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-7 w-7 mx-auto flex items-center justify-center text-[11px] text-slate-300 font-mono"
                >
                  {prevDay}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                validDate &&
                validDate.getFullYear() === currentYear &&
                validDate.getMonth() === currentMonth &&
                validDate.getDate() === day;

              const isToday =
                new Date().getFullYear() === currentYear &&
                new Date().getMonth() === currentMonth &&
                new Date().getDate() === day;

              const disabledDay = isDayDisabled(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 mx-auto rounded-lg flex items-center justify-center text-[11px] font-mono font-medium transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/30"
                      : isToday
                      ? "border border-indigo-200 text-indigo-700 font-bold bg-indigo-50/50"
                      : disabledDay
                      ? "text-slate-200 cursor-not-allowed"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
            {presetMode === "dispatch" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleDayPreset(0)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDayPreset(1)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => handleDayPreset(3)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleDayPreset(7)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  +1 Wk
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleMonthPreset(3)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  +3 Mos
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthPreset(6)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  +6 Mos
                </button>
                <button
                  type="button"
                  onClick={() => handleMonthPreset(12)}
                  className="px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
                >
                  +1 Year
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export { TimePicker } from "./time-picker";
