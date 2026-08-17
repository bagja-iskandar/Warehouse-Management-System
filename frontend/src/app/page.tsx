"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
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
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">
          Redirecting to WMS Nusantara Portal...
        </p>
      </div>
    </div>
  );
}
