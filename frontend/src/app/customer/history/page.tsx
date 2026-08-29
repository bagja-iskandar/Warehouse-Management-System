"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Clean Redirect: Routes legacy /customer/history to Customer Billing & Invoices (/customer/billing)
 */
export default function CustomerHistoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customer/billing");
  }, [router]);

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      <p className="text-xs font-medium">Redirecting to Billing & Invoices...</p>
    </div>
  );
}
