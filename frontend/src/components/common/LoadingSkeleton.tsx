"use client";

import React from "react";

export function MetricCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-8.5 w-8.5 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-8 w-24 bg-slate-200 rounded" />
      <div className="h-3 w-36 bg-slate-100 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="h-8 w-60 bg-slate-100 rounded-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 gap-4">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-7 w-16 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
