"use client";

import React from "react";
import { Boxes } from "lucide-react";

export interface StorageUtilizationDonutProps {
  storedM3: number;
  receivingM3: number;
  waitingM3: number;
  availableM3: number;
  totalM3: number;
  storedCount: number;
  receivingCount: number;
  waitingCount: number;
}

/**
 * Compact Storage Utilization Donut Chart Component
 */
export function StorageUtilizationDonut({
  storedM3,
  receivingM3,
  waitingM3,
  availableM3,
  totalM3,
  storedCount,
  receivingCount,
  waitingCount,
}: StorageUtilizationDonutProps) {
  const usedM3 = storedM3 + receivingM3 + waitingM3;
  const utilizationPercent =
    totalM3 > 0 ? Number(((usedM3 / totalM3) * 100).toFixed(1)) : 0;

  // SVG calculations (Radius = 32, Circumference = 2 * PI * 32 ≈ 201.06)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;

  const storedLength =
    totalM3 > 0 ? (storedM3 / totalM3) * circumference : 0;
  const receivingLength =
    totalM3 > 0 ? (receivingM3 / totalM3) * circumference : 0;
  const waitingLength =
    totalM3 > 0 ? (waitingM3 / totalM3) * circumference : 0;

  const storedOffset = 0;
  const receivingOffset = -storedLength;
  const waitingOffset = -(storedLength + receivingLength);

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5 text-indigo-600" />
          <span>Storage Utilization</span>
        </h4>
        <span className="text-[11px] font-mono font-bold text-slate-700">
          {usedM3.toFixed(1)} / {totalM3.toFixed(1)} m³ Rented
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Donut Graphic */}
        <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
          <svg
            className="h-full w-full -rotate-90 transform"
            viewBox="0 0 84 84"
          >
            {/* Background Ring (Available) */}
            <circle
              cx="42"
              cy="42"
              r={radius}
              className="stroke-slate-200"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Stored Segment */}
            {storedLength > 0 && (
              <circle
                cx="42"
                cy="42"
                r={radius}
                className="stroke-emerald-500 transition-all duration-500"
                strokeWidth="8"
                strokeDasharray={`${storedLength} ${circumference}`}
                strokeDashoffset={storedOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            )}
            {/* Receiving Segment */}
            {receivingLength > 0 && (
              <circle
                cx="42"
                cy="42"
                r={radius}
                className="stroke-amber-500 transition-all duration-500"
                strokeWidth="8"
                strokeDasharray={`${receivingLength} ${circumference}`}
                strokeDashoffset={receivingOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            )}
            {/* Waiting Inbound Segment */}
            {waitingLength > 0 && (
              <circle
                cx="42"
                cy="42"
                r={radius}
                className="stroke-indigo-500 transition-all duration-500"
                strokeWidth="8"
                strokeDasharray={`${waitingLength} ${circumference}`}
                strokeDashoffset={waitingOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-black text-slate-900 font-mono leading-none">
              {utilizationPercent}%
            </span>
            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
              Utilized
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px]">
          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Stored in Rack</span>
            </span>
            <span className="font-mono font-bold text-slate-900 ml-1 shrink-0">
              {storedM3.toFixed(1)} m³
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span className="truncate">Receiving</span>
            </span>
            <span className="font-mono font-bold text-slate-900 ml-1 shrink-0">
              {receivingM3.toFixed(1)} m³
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
              <span className="truncate">Waiting Inbound</span>
            </span>
            <span className="font-mono font-bold text-slate-900 ml-1 shrink-0">
              {waitingM3.toFixed(1)} m³
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
              <span className="truncate">Available</span>
            </span>
            <span className="font-mono font-bold text-emerald-700 ml-1 shrink-0">
              {availableM3.toFixed(1)} m³
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
