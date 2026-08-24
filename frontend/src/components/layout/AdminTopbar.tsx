"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export function AdminTopbar({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname.includes("/admin/warehouse/capacity")) return "Rack Capacity Visualization";
    if (pathname.includes("/admin/warehouse")) return "Multi-Hub Overview";
    if (pathname.includes("/admin/goods")) return "Goods Management";
    if (pathname.includes("/admin/logistics")) return "Logistics Dispatch";
    if (pathname.includes("/admin/fleet")) return "Vehicle Fleet";
    if (pathname.includes("/admin/monitoring")) return "Sensors & Telemetry";
    if (pathname.includes("/admin/customers")) return "Customers & Tenants";
    if (pathname.includes("/admin/drivers")) return "Drivers / Couriers";
    if (pathname.includes("/admin/billing")) return "Billing & Invoices";
    if (pathname.includes("/admin/reports")) return "Reports & Analytics";
    if (pathname.includes("/admin/dashboard")) return "Operational Dashboard";
    if (pathname.includes("/profile")) return "Profile Settings";
    return "Operations Portal";
  };

  return (
    <header className="sticky top-4 z-40 w-full h-16 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 sm:px-6 flex items-center justify-between shadow-md shadow-slate-200/60 transition-all duration-200">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">WMS Admin</span>
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
            <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
            <span className="truncate whitespace-nowrap text-slate-500 group-hover:text-slate-800">
              Quick search goods, rack slots, fleet, orders...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded-md text-slate-500 shadow-xs flex-shrink-0 whitespace-nowrap ml-2">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Hub Telemetry Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Live Telemetry: Normal • 22°C Hub</span>
        </div>

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
          <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-indigo-600/20">
            {user?.name?.charAt(0) || "A"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || "Warehouse Admin"}
            </p>
            <p className="text-[10px] text-slate-400 font-mono leading-tight">
              admin@wms.id
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
