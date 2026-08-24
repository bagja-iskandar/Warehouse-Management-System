"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log fatal client errors for developer observability
    console.error("[WMS GlobalError] Uncaught root fatal error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          {/* Icon Badge */}
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          {/* Error Details */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Critical System Issue
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              A fatal error occurred on the application interface. All transaction data in the database remains safe and unaffected.
            </p>
          </div>

          {/* Reference Code for Support */}
          {error.digest && (
            <div className="inline-block px-3 py-1.5 bg-slate-900/60 border border-slate-700/80 rounded-lg text-[11px] font-mono text-slate-400">
              Error Digest: <span className="text-slate-200">{error.digest}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Component</span>
            </button>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
