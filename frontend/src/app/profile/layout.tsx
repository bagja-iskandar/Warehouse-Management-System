"use client";

import React from "react";
import { useAuthStore } from "@/store/auth.store";
import { AdminShell } from "@/components/layout/AdminShell";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { DriverShell } from "@/components/layout/DriverShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  return (
    <AuthGuard allowedRoles={["ADMIN", "CUSTOMER", "DRIVER"]}>
      {user?.role === "CUSTOMER" ? (
        <CustomerShell>{children}</CustomerShell>
      ) : user?.role === "DRIVER" ? (
        <DriverShell>{children}</DriverShell>
      ) : (
        <AdminShell>{children}</AdminShell>
      )}
    </AuthGuard>
  );
}
