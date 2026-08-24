"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, SectionCard } from "@/components/dashboard";

export default function DriverRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WMS DriverError] Page error:", error);
  }, [error]);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb="Driver Portal > Error"
        title="Driver Task Loading Issue"
        subtitle="Fleet task data is temporarily experiencing a synchronization issue."
        badgeText="Driver Notice"
        badgeColor="bg-amber-500 text-slate-950"
      />

      <SectionCard title="Delivery Operational Status" className="p-8 text-center max-w-xl mx-auto space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-slate-900">
            Unable to Load Task List
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            An issue occurred while synchronizing routes or delivery tasks. Please reload or open the fleet dashboard.
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
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9.5 px-4 rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold h-9.5 px-4 rounded-xl flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4 text-amber-600" />
              <span>Driver Dashboard</span>
            </Button>
          </Link>
        </div>
      </SectionCard>
    </PageContainer>
  );
}
