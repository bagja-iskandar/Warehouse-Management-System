"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store";
import { Badge } from "@/components/ui/badge";
import { Boxes, Bell, CheckCircle2, AlertCircle, LogIn } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Sembunyikan header global pada halaman auth dan dedicated role shells
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/customer") ||
    pathname.startsWith("/driver")
  ) {
    return null;
  }

  const getRoleBadge = () => {
    switch (user?.role) {
      case "ADMIN":
        return <Badge variant="default" className="bg-indigo-600">Admin Mode</Badge>;
      case "CUSTOMER":
        return <Badge variant="success">Customer Portal</Badge>;
      case "DRIVER":
        return <Badge variant="warning">Driver Fleet</Badge>;
      default:
        return <Badge variant="outline">Guest</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-primary tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">WMS Nusantara</span>
              <span className="text-[10px] font-normal text-muted-foreground">Smart Storage & Logistics</span>
            </div>
          </Link>
          <div className="hidden sm:block ml-2">{getRoleBadge()}</div>
        </div>



        {/* Right Nav & User profile */}
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs font-semibold leading-tight">{user?.name}</span>
            <span className="text-[11px] text-muted-foreground">{user?.email}</span>
          </div>

          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {user?.name?.charAt(0) || "U"}
          </div>
        </Link>
      </div>
    </header>
  );
}
