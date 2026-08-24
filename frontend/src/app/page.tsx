"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { Loader2, ArrowRight, ShieldAlert } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Safety fallback timer if redirection is stalled
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    switch (user.role) {
      case "ADMIN":
        router.replace("/admin/dashboard");
        break;
      case "CUSTOMER":
        router.replace("/customer/dashboard");
        break;
      case "DRIVER":
        router.replace("/driver/dashboard");
        break;
      default:
        router.replace("/login");
        break;
    }
  }, [user, hasHydrated, router]);

  const targetHref = !user
    ? "/login"
    : user.role === "ADMIN"
    ? "/admin/dashboard"
    : user.role === "CUSTOMER"
    ? "/customer/dashboard"
    : user.role === "DRIVER"
    ? "/driver/dashboard"
    : "/login";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-600">
          Redirecting to WMS Nusantara Portal...
        </p>

        {showFallback && (
          <div className="mt-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>Redirect taking longer than expected?</span>
            </div>
            <Link
              href={targetHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <span>Continue Directly</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
