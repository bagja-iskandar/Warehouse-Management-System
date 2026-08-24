"use client";

import React from "react";
import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";

export default function NotFoundPage() {
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
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40 text-center space-y-6">
        {/* Brand Icon */}
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
            <FileQuestion className="h-8 w-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 mb-1.5">
            Error 404 — Not Found
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            The page or resource you are looking for is not available or has been moved.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Link href={getDashboardLink()} className="w-full">
            <Button className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer">
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
      </div>
    </div>
  );
}
