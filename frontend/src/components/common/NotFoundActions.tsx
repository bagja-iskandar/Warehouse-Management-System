"use client";

import React from "react";
import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

/**
 * Client component for the 404 page action buttons.
 * Isolated here so that app/not-found.tsx can remain a Server Component,
 * avoiding the compilation boundary inflation that causes ChunkLoadError.
 */
export function NotFoundActions() {
  const user = useAuthStore((s) => s.user);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      case "DRIVER":
        return "/driver/dashboard";
      default:
        return "/";
    }
  };

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      <Link href={getDashboardLink()} className="w-full">
        <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer">
          <Home className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </Link>

      <button
        onClick={() => window.history.back()}
        className="w-full h-10 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Go Back to Previous Page</span>
      </button>
    </div>
  );
}
