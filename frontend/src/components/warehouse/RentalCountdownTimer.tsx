"use client";

import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface RentalCountdownTimerProps {
  endDateStr?: string;
  status?: string;
}

/**
 * Compact Rental Countdown Component (Days Remaining Only)
 */
export function RentalCountdownTimer({
  endDateStr,
  status,
}: RentalCountdownTimerProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!endDateStr) return;

    const targetDate = new Date(endDateStr).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0 || status === "EXPIRED") {
        setIsExpired(true);
        setDaysRemaining(0);
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days);
    };

    calculate();
    // Check every minute since we only display days remaining
    const interval = setInterval(calculate, 60000);
    return () => clearInterval(interval);
  }, [endDateStr, status]);

  if (!mounted) {
    return (
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <span className="text-xs font-mono text-slate-400">
          Loading countdown...
        </span>
      </div>
    );
  }

  const formattedDate = endDateStr
    ? new Date(endDateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  if (isExpired) {
    return (
      <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-900 leading-tight">
              Rental Expired
            </p>
            <p className="text-[10.5px] text-rose-600 leading-tight mt-0.5">
              Agreement ended on {formattedDate}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-white text-rose-700 border-rose-300 text-[10px] shrink-0 font-medium"
        >
          Contract Ended
        </Badge>
      </div>
    );
  }

  const displayText =
    daysRemaining === null
      ? "Calculating..."
      : daysRemaining === 0
      ? "Less than 1 Day Remaining"
      : `${daysRemaining} ${daysRemaining === 1 ? "Day" : "Days"} Remaining`;

  return (
    <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl shadow-xs border border-indigo-900/40 space-y-1">
      <div className="flex items-center justify-between text-[10.5px] text-indigo-200 font-semibold">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span>Rental Time Remaining</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync</span>
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-2 pt-0.5">
        <h4 className="text-sm font-extrabold text-white tracking-tight">
          {displayText}
        </h4>
        <span className="text-[10.5px] text-slate-300 font-mono shrink-0">
          Agreement expires on{" "}
          <strong className="text-white font-medium">
            {formattedDate} at 23:59 WIB
          </strong>
        </span>
      </div>
    </div>
  );
}
