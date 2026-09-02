"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/types";
import { authService } from "@/services/auth.service";
import { getStoredAccessToken } from "@/lib/api-client";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hasHydrated, setUser, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const verificationInitiated = useRef(false);

  // Helper to determine destination dashboard by role
  const getRoleDashboard = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DRIVER":
        return "/driver/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      default:
        return "/login";
    }
  };

  // BFcache (Back-Forward Cache) Protection: Listen for page restoration after logout
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const token = getStoredAccessToken();
        const currentAuth = useAuthStore.getState().isAuthenticated;
        if (!token || !currentAuth) {
          router.replace("/login");
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  useEffect(() => {
    // Wait until Zustand has finished hydrating from storage
    if (!hasHydrated) return;

    const token = getStoredAccessToken();

    // 1. Unauthenticated check
    if (!isAuthenticated || !user || !token) {
      setIsAuthorized(false);
      setIsVerifying(false);
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // 2. Client-side Role Check
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      setIsAuthorized(false);
      setIsVerifying(false);
      router.replace(getRoleDashboard(user.role));
      return;
    }

    // 3. Backend Verification (Anti-tamper & Token Validity Verification)
    if (!verificationInitiated.current) {
      verificationInitiated.current = true;

      authService
        .getCurrentUser()
        .then((verifiedUser) => {
          if (!verifiedUser) {
            // Token rejected by backend
            logout();
            setIsAuthorized(false);
            setIsVerifying(false);
            router.replace("/login?expired=true");
            return;
          }

          // If role was tampered in client-side storage, sync with backend ground truth
          if (verifiedUser.role !== user.role) {
            setUser(verifiedUser);
            if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(verifiedUser.role)) {
              setIsAuthorized(false);
              setIsVerifying(false);
              router.replace(getRoleDashboard(verifiedUser.role));
              return;
            }
          }

          setIsAuthorized(true);
          setIsVerifying(false);
        })
        .catch(() => {
          // If network error occurred, allow cached verified state if role matches
          if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            router.replace(getRoleDashboard(user.role));
          } else {
            setIsAuthorized(true);
          }
          setIsVerifying(false);
        });
    } else {
      // Already verified in this session lifecycle
      setIsAuthorized(true);
      setIsVerifying(false);
    }
  }, [hasHydrated, isAuthenticated, user, allowedRoles, pathname, router, logout, setUser]);

  // Loading / Checking Authentication State (Strict zero-flicker prevention)
  if (!hasHydrated || isVerifying || !isAuthorized) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Verifying Security Session
            </h2>
            <p className="text-xs text-slate-500">
              Authenticating credentials & access privileges...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
