"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WMS AppError] Client route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40 text-center space-y-6">
        {/* Brand Icon */}
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-3">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Halaman Mengalami Kendala
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            Terjadi kendala saat merender komponen halaman ini. Anda dapat mencoba memuat ulang atau kembali ke dashboard.
          </p>
        </div>

        {/* Technical Digest */}
        {error.digest && (
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-mono text-slate-500">
            Error ID: <span className="text-slate-800 font-semibold">{error.digest}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Coba Muat Ulang Halaman</span>
          </Button>

          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full h-10 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
