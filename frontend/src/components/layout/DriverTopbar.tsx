"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Thermometer,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface DriverTopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export function DriverTopbar({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: DriverTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(true);

  const getPageTitle = () => {
    if (pathname.includes("/driver/transit")) return "Route & Live Transit";
    if (pathname.includes("/driver/vehicle")) return "Select Vehicle Fleet";
    if (pathname.includes("/driver/pod")) return "Submit Digital POD";
    if (pathname.includes("/driver/history")) return "Delivery History";
    if (pathname.includes("/driver/dashboard")) return "Delivery Tasks";
    if (pathname.includes("/profile")) return "Profile Settings";
    return "Driver Fleet";
  };

  return (
    <header className="sticky top-4 z-40 w-full h-16 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 sm:px-6 flex items-center justify-between shadow-md shadow-slate-200/60 transition-all duration-200">
      {/* Left: Mobile Toggle, History Navigation (< >) & Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* History Navigation Buttons (< >) */}
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/90 border border-slate-200/80 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Go Back (Kembali)"
            aria-label="Go Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.forward()}
            className="h-7 w-7 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-white active:scale-95 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Go Forward (Maju)"
            aria-label="Go Forward"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Driver Fleet</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">{getPageTitle()}</span>
        </div>
      </div>

      {/* Center: Command Search Bar Trigger (Cmd + K) */}
      <div className="flex-1 max-w-sm lg:max-w-md mx-2 sm:mx-4 lg:mx-6 min-w-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full h-9 px-3.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 text-slate-500 hover:text-slate-700 flex items-center justify-between text-xs transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 transition-colors flex-shrink-0" />
            <span className="truncate whitespace-nowrap text-slate-500 group-hover:text-slate-800">
              Quick search tasks, routes, manifest...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded-md text-slate-500 shadow-xs flex-shrink-0 whitespace-nowrap ml-2">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry, Duty Switcher, Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Reefer Box Telemetry Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
          <Thermometer className="h-3.5 w-3.5 text-amber-600" />
          <span>Reefer B 9821 TKN: -18.2°C</span>
        </div>

        {/* Duty Status Toggle Switcher */}
        <button
          onClick={() => setIsOnDuty(!isOnDuty)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
            isOnDuty
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span>{isOnDuty ? "On Duty" : "Off Duty"}</span>
        </button>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="View Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-600 text-white font-mono text-[9.5px] font-bold flex items-center justify-center border-2 border-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar Link */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 pl-2 hover:opacity-85 transition-opacity"
        >
          <div className="h-8 w-8 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm shadow-amber-500/20">
            {user?.name?.charAt(0) || "D"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
              {user?.name || "Ahmad Subarjo"}
            </p>
            <p className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[130px]">
              Logistics Driver
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
