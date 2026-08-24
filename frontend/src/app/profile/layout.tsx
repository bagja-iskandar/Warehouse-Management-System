"use client";

import React from "react";
import { useAuthStore } from "@/store/auth.store";
import { AdminShell } from "@/components/layout/AdminShell";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { DriverShell } from "@/components/layout/DriverShell";
import { Loader2 } from "lucide-react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user?.role === "CUSTOMER") {
    return <CustomerShell>{children}</CustomerShell>;
  }

  if (user?.role === "DRIVER") {
    return <DriverShell>{children}</DriverShell>;
  }

  // Default to AdminShell for ADMIN and other authenticated staff
  return <AdminShell>{children}</AdminShell>;
}
