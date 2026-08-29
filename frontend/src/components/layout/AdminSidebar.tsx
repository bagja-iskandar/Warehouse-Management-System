"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Grid3X3,
  Warehouse,
  Boxes,
  Truck,
  Car,
  Activity,
  Users,
  UserCheck,
  Receipt,
  BarChart3,
  Layers,
  LogOut,
  ChevronDown,
  Building2,
  Check,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useWarehouses, warehouseKeys } from "@/hooks/use-warehouses";
import { useWarehouseStore } from "@/store/warehouse.store";
import { useOperationalCounts } from "@/hooks/use-operational-counts";
import { useQueryClient } from "@tanstack/react-query";
import { analyticsKeys } from "@/hooks/use-analytics";
import { goodsKeys } from "@/hooks/use-goods";
import { logisticsKeys } from "@/hooks/use-logistics";
import { customerKeys } from "@/hooks/use-customers";
import { billingKeys } from "@/hooks/use-billing";
import { analyticsService } from "@/services/analytics.service";
import { goodsService } from "@/services/goods.service";
import { warehouseService } from "@/services/warehouse.service";
import { logisticsService } from "@/services/logistics.service";
import { customerService } from "@/services/customer.service";
import { billingService } from "@/services/billing.service";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: counts } = useOperationalCounts();
  const { data: liveWarehouses } = useWarehouses();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouseStore();
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePrefetch = (href: string) => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      try {
        if (href === "/admin/dashboard") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.adminOverview(selectedWarehouseId),
            queryFn: () => analyticsService.getAdminOverview(selectedWarehouseId || undefined),
            staleTime: 1000 * 45,
          });
        } else if (href === "/admin/goods") {
          queryClient.prefetchQuery({
            queryKey: [
              ...goodsKeys.lists(),
              { customerId: "all", warehouseId: "all", sortBy: "createdAt", sortOrder: "desc" },
            ],
            queryFn: () => goodsService.getGoods(),
            staleTime: 1000 * 60,
          });
        } else if (href === "/admin/warehouse/capacity" || href === "/admin/warehouse") {
          queryClient.prefetchQuery({
            queryKey: warehouseKeys.lists(),
            queryFn: () => warehouseService.getWarehouses(),
            staleTime: 1000 * 60 * 5,
          });
        } else if (href === "/admin/logistics") {
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.orders(),
            queryFn: () => logisticsService.getOrders(),
            staleTime: 1000 * 60,
          });
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.vehicles(),
            queryFn: () => logisticsService.getVehicles(),
            staleTime: 1000 * 60 * 5,
          });
        } else if (href === "/admin/customers") {
          queryClient.prefetchQuery({
            queryKey: customerKeys.lists(),
            queryFn: () => customerService.getCustomers(),
            staleTime: 1000 * 60 * 2,
          });
        } else if (href === "/admin/billing") {
          queryClient.prefetchQuery({
            queryKey: billingKeys.invoices(),
            queryFn: () => billingService.getInvoices(),
            staleTime: 1000 * 60,
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

  const navGroups: NavGroup[] = [
    {
      group: "WAREHOUSE OPERATIONS",
      items: [
        {
          title: "Operational Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Capacity & Rack Grid",
          href: "/admin/warehouse/capacity",
          icon: Grid3X3,
          badge: "Live",
        },
        {
          title: "Multi-Hub Overview",
          href: "/admin/warehouse",
          icon: Warehouse,
        },
        {
          title: "Goods Management",
          href: "/admin/goods",
          icon: Boxes,
        },
      ],
    },
    {
      group: "FLEET & DISPATCH",
      items: [
        {
          title: "Logistics Dispatch",
          href: "/admin/logistics",
          icon: Truck,
          badge:
            counts && counts.logisticsQueueCount > 0
              ? `${counts.logisticsQueueCount} In Queue`
              : undefined,
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
        },
        {
          title: "Vehicle Fleet",
          href: "/admin/fleet",
          icon: Car,
        },
        {
          title: "Sensors & Telemetry",
          href: "/admin/monitoring",
          icon: Activity,
        },
      ],
    },
    {
      group: "USERS & FINANCE",
      items: [
        {
          title: "Customers & Tenants",
          href: "/admin/customers",
          icon: Users,
        },
        {
          title: "Drivers / Couriers",
          href: "/admin/drivers",
          icon: UserCheck,
        },
        {
          title: "Billing & Invoices",
          href: "/admin/billing",
          icon: Receipt,
          badge:
            counts && counts.underReviewPaymentsCount > 0
              ? `${counts.underReviewPaymentsCount} Review`
              : counts && counts.overdueInvoicesCount > 0
              ? `${counts.overdueInvoicesCount} Overdue`
              : undefined,
          badgeColor:
            counts && counts.underReviewPaymentsCount > 0
              ? "bg-amber-50 text-amber-700 border-amber-200 font-bold"
              : undefined,
        },
        {
          title: "Reports & Analytics",
          href: "/admin/reports",
          icon: BarChart3,
        },
      ],
    },
  ];

  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hubDropdownRef = useRef<HTMLDivElement>(null);

  // Available hubs from API service layer
  const availableHubs = liveWarehouses || [];

  // Active warehouse resolution
  const activeWarehouse =
    availableHubs.find((h) => h.id === selectedWarehouseId) ||
    availableHubs[0] || {
      id: selectedWarehouseId || "wh-default",
      name: "Cakung Logistics Central Hub",
      code: "WH-CKG-01",
      zones: { coldStorageCapacityM3: 1500, standardCapacityM3: 3500 },
    };

  // Helper for facility string
  const getFacilitySummary = (w?: { zones?: { coldStorageCapacityM3?: number; standardCapacityM3?: number } }) => {
    if (!w) return "Standard Dry";
    const hasCold = Boolean(w.zones?.coldStorageCapacityM3 && w.zones.coldStorageCapacityM3 > 0);
    const hasStandard = Boolean(w.zones?.standardCapacityM3 && w.zones.standardCapacityM3 > 0);
    if (hasCold && hasStandard) return "Standard & Cold";
    if (hasCold) return "Cold Storage";
    return "Standard Dry";
  };

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        hubDropdownRef.current &&
        !hubDropdownRef.current.contains(event.target as Node)
      ) {
        setIsHubDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsHubDropdownOpen(false);
      }
    }

    if (isHubDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHubDropdownOpen]);

  const handleSelectHub = (hubId: string) => {
    setSelectedWarehouseId(hubId);
    setIsHubDropdownOpen(false);
  };

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
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Layers className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 tracking-tight leading-none block">
                WMS Nusantara
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-tight block mt-0.5">
                Enterprise Logistics Hub
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

        {/* Hub Selector Tile with Interactive Dropdown */}
        <div ref={hubDropdownRef} className="p-3 border-b border-slate-100 bg-slate-50/60 relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsHubDropdownOpen((prev) => !prev)}
            aria-expanded={isHubDropdownOpen}
            aria-haspopup="listbox"
            aria-controls="hub-selector-menu"
            aria-label="Select Active Warehouse Hub"
            className="w-full flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 cursor-pointer transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group text-left"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6.5 w-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-100/70 flex items-center justify-center flex-shrink-0 transition-colors">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  {activeWarehouse.name}
                </p>
                <p className="text-[9.5px] text-indigo-600 font-mono font-medium leading-tight">
                  {activeWarehouse.code} • {getFacilitySummary(activeWarehouse)}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1 transition-transform duration-200 ${
                isHubDropdownOpen ? "rotate-180 text-indigo-600" : "group-hover:text-slate-600"
              }`}
            />
          </button>

          {/* Hub Dropdown Menu */}
          {isHubDropdownOpen && (
            <div
              id="hub-selector-menu"
              role="listbox"
              aria-label="Warehouse Hubs List"
              className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-300/50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1 text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
                Switch Active Hub
              </div>

              {availableHubs.map((hub) => {
                const isSelected = hub.id === activeWarehouse.id;

                return (
                  <button
                    key={hub.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectHub(hub.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 border border-indigo-100/90 text-indigo-950 font-bold"
                        : "hover:bg-slate-50 border border-transparent text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="text-[11.5px] leading-tight truncate font-bold text-slate-900">
                          {hub.name}
                        </p>
                        <p className="text-[9.5px] text-slate-500 font-mono leading-tight mt-0.5">
                          {hub.code} • {getFacilitySummary(hub)}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600 flex-shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navGroups.map((group) => {
            const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
            return (
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
                        item.href !== "/admin/dashboard" &&
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all group ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 transition-colors ${
                              isActive
                                ? "text-indigo-600"
                                : "text-slate-400 group-hover:text-indigo-600"
                            }`}
                          />
                          <span className="text-[11.5px]">{item.title}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                              isActive
                                ? "bg-indigo-600 text-white"
                                : item.badge === "Live"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.badgeColor
                                ? item.badgeColor
                                : "bg-slate-100 text-slate-700 border border-slate-200"
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
            );
          })}
        </div>

        {/* Dedicated Interactive Logout Action Tile */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 active:bg-rose-100/80 font-semibold text-xs transition-all duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none group disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Logout from operations portal"
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-600 transition-colors flex-shrink-0" />
            <span className="leading-none">{isLoggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
