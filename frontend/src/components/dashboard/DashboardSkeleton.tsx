import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-72 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-96 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg" />
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-slate-100 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-7 w-36 bg-slate-200 rounded-lg" />
            <div className="h-2 w-full bg-slate-100 rounded-full" />
            <div className="h-3 w-24 bg-slate-50 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-50 rounded-xl" />
          <div className="h-32 bg-slate-50 rounded-xl" />
        </div>
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-36 bg-slate-50 rounded-xl" />
          <div className="h-36 bg-slate-50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
