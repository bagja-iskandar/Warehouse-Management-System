"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, SectionCard } from "@/components/dashboard";

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WMS AdminError] Page error:", error);
  }, [error]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb="WMS Admin > Error"
        title="Admin Module Loading Issue"
        subtitle="The operational module is experiencing a temporary technical issue. Your warehouse data remains safe."
        badgeText="System Notice"
        badgeColor="bg-rose-600 text-white"
      />

      <SectionCard title="Module Operational Status" className="p-8 text-center max-w-xl mx-auto space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-900">
            Unable to Load Page Component
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            An error occurred while processing data on this view. Please try reloading the component or returning to the main dashboard.
          </p>
        </div>

        {error.digest && (
          <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600">
            Error ID: {error.digest}
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9.5 px-4 rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/admin/dashboard">
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9.5 px-4 rounded-xl flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-600" />
              <span>Admin Dashboard</span>
            </Button>
          </Link>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
