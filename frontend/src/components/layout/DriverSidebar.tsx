"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Navigation,
  Car,
  FileCheck,
  History,
  Truck,
  Layers,
  LogOut,
  ChevronDown,
  Building2,
  X,
  Thermometer,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOperationalCounts } from "@/hooks/use-operational-counts";
import { useDriverSummary, analyticsKeys } from "@/hooks/use-analytics";
import { useQueryClient } from "@tanstack/react-query";
import { logisticsKeys } from "@/hooks/use-logistics";
import { analyticsService } from "@/services/analytics.service";
import { logisticsService } from "@/services/logistics.service";

interface DriverSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function DriverSidebar({ isOpen, onClose }: DriverSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: counts } = useOperationalCounts();
  const { data: driverSummary } = useDriverSummary(user?.id);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const prefetchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePrefetch = (href: string) => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      try {
        if (href === "/driver/dashboard") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.driverSummary(user?.id),
            queryFn: () => analyticsService.getDriverSummary(user?.id || undefined),
            staleTime: 1000 * 45,
          });
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.orders(user?.id),
            queryFn: () => logisticsService.getOrders(user?.id || undefined),
            staleTime: 1000 * 60,
          });
        } else if (href === "/driver/transit" || href === "/driver/pod" || href === "/driver/history") {
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.orders(user?.id),
            queryFn: () => logisticsService.getOrders(user?.id || undefined),
            staleTime: 1000 * 60,
          });
        } else if (href === "/driver/vehicle/select") {
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.vehicles(),
            queryFn: () => logisticsService.getVehicles(),
            staleTime: 1000 * 60 * 5,
          });
        }
      } catch {
        // safe fallback
      }
    }, 80);
  };

  const handleCancelPrefetch = () => {
    if (prefetchTimerRef.current) {
      clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = null;
    }
  };

  const driverNavGroups: NavGroup[] = [
    {
      group: "DRIVER OPERATIONS",
      items: [
        {
          title: "Delivery Tasks",
          href: "/driver/dashboard",
          icon: ClipboardList,
          badge:
            counts && counts.driverActiveTasksCount > 0
              ? `${counts.driverActiveTasksCount} Active`
              : undefined,
        },
        {
          title: "Route & Live Transit",
          href: "/driver/transit",
          icon: Navigation,
        },
        {
          title: "Fleet & Vehicles",
          href: "/driver/vehicle/select",
          icon: Car,
        },
      ],
    },
    {
      group: "DOCUMENTS & PROOF",
      items: [
        {
          title: "Submit Digital POD",
          href: "/driver/pod",
          icon: FileCheck,
        },
        {
          title: "Delivery History",
          href: "/driver/history",
          icon: History,
        },
      ],
    },
  ];

  const assignedVehicle = driverSummary?.assignedVehicle;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Clean White Rounded Floating Navigation Panel */}
      <aside
        className={`fixed top-4 bottom-4 left-4 z-50 w-64 bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-2xl shadow-slate-300/60 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)] lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 bg-white flex-shrink-0">
          <Link href="/driver/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 tracking-tight leading-none block">
                WMS Nusantara
              </span>
              <span className="text-[10px] text-amber-700 font-semibold leading-tight block mt-0.5">
                Driver Fleet & Dispatch
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Active Vehicle Tile */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
          <Link
            href="/driver/vehicle/select"
            className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-all shadow-sm block"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6.5 w-6.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Car className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {assignedVehicle?.name || "No Assigned Fleet"}
                </p>
                <p className="text-[9.5px] text-amber-600 font-mono font-medium leading-tight">
                  {assignedVehicle?.plateNumber
                    ? `${assignedVehicle.plateNumber} • ${assignedVehicle.currentTemp != null ? `${assignedVehicle.currentTemp}°C` : "Active"}`
                    : "Tap to Select Vehicle"}
                </p>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
          </Link>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {(() => {
            const allHrefs = driverNavGroups.flatMap((g) => g.items.map((i) => i.href));
            return driverNavGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <p className="px-2.5 text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.group}
                </p>
                <div className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const isExact = pathname === item.href;
                    const hasMoreSpecificMatch = allHrefs.some(
                      (other) =>
                        other !== item.href &&
                        other.length > item.href.length &&
                        (pathname === other || pathname.startsWith(`${other}/`))
                    );
                    const isActive =
                      isExact ||
                      (!hasMoreSpecificMatch &&
                        item.href !== "/driver/dashboard" &&
                        pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onMouseEnter={() => handlePrefetch(item.href)}
                        onMouseLeave={handleCancelPrefetch}
                        onTouchStart={() => handlePrefetch(item.href)}
                        onClick={onClose}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 transition-colors ${
                              isActive
                                ? "text-slate-950"
                                : "text-slate-400 group-hover:text-amber-600"
                            }`}
                          />
                          <span className="text-[11.5px]">{item.title}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                              isActive
                                ? "bg-slate-950 text-amber-400 font-bold"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>

        {/* Dedicated Interactive Logout Action Tile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:bg-rose-100/80 font-semibold text-xs transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Logout from driver portal"
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-600 transition-colors flex-shrink-0" />
            <span className="leading-none">{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
