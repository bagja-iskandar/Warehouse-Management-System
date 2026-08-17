"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  Thermometer,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface CustomerTopbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export function CustomerTopbar({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}: CustomerTopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (pathname.includes("/customer/rental")) return "Warehouse Space Rental";
    if (pathname.includes("/customer/goods")) return "Goods & Inventory";
    if (pathname.includes("/customer/logistics/request")) return "Request Delivery";
    if (pathname.includes("/customer/logistics/tracking")) return "Track Deliveries";
    if (pathname.includes("/customer/billing")) return "Billing & Invoices";
    if (pathname.includes("/customer/history")) return "Transaction History";
    if (pathname.includes("/customer/dashboard")) return "Customer Dashboard";
    if (pathname.includes("/profile")) return "Profile Settings";
    return "Customer Portal";
  };

  return (
    <header className="w-full h-16 bg-white border border-slate-200/90 rounded-2xl px-4 sm:px-6 flex items-center justify-between shadow-sm">
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
          <span className="font-semibold text-slate-700">Customer Portal</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-bold text-slate-900">{getPageTitle()}</span>
        </div>
      </div>

      {/* Center: Command Search Bar Trigger (Cmd + K) */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full h-9 px-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 flex items-center justify-between text-xs transition-all shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search goods SKU, rental slots, or delivery tracking #...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded-md text-slate-500 shadow-sm">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry, CTA, Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Cold Storage Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Thermometer className="h-3.5 w-3.5 text-emerald-600 ml-0.5" />
          <span>Cold Zone A: -18.4°C (Normal)</span>
        </div>

        {/* Quick CTA Button */}
        <Link href="/customer/rental" className="hidden sm:block">
          <Button className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>Rent Space</span>
          </Button>
        </Link>

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
          <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-emerald-600/20">
            {user?.name?.charAt(0) || "C"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
              {user?.companyName || user?.name || "WMS Customer"}
            </p>
            <p className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[130px]">
              {user?.email || "customer@freshfoods.id"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
