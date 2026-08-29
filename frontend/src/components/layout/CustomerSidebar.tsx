"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Warehouse,
  Boxes,
  Truck,
  Navigation,
  Receipt,
  Layers,
  LogOut,
  ChevronDown,
  Building2,
  X,
  Thermometer,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCustomerSummary, analyticsKeys } from "@/hooks/use-analytics";
import { useOperationalCounts } from "@/hooks/use-operational-counts";
import { useQueryClient } from "@tanstack/react-query";
import { goodsKeys } from "@/hooks/use-goods";
import { warehouseKeys } from "@/hooks/use-warehouses";
import { logisticsKeys } from "@/hooks/use-logistics";
import { billingKeys } from "@/hooks/use-billing";
import { analyticsService } from "@/services/analytics.service";
import { goodsService } from "@/services/goods.service";
import { warehouseService } from "@/services/warehouse.service";
import { logisticsService } from "@/services/logistics.service";
import { billingService } from "@/services/billing.service";

interface CustomerSidebarProps {
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

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { data: summary } = useCustomerSummary(user?.id);
  const { data: counts } = useOperationalCounts();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();
  const prefetchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handlePrefetch = (href: string) => {
    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      try {
        if (href === "/customer/dashboard") {
          queryClient.prefetchQuery({
            queryKey: analyticsKeys.customerSummary(user?.id),
            queryFn: () => analyticsService.getCustomerSummary(user?.id || undefined),
            staleTime: 1000 * 45,
          });
        } else if (href === "/customer/goods") {
          queryClient.prefetchQuery({
            queryKey: [
              ...goodsKeys.lists(),
              { customerId: user?.id || "all", warehouseId: "all", sortBy: "createdAt", sortOrder: "desc" },
            ],
            queryFn: () => goodsService.getGoods(user?.id || undefined),
            staleTime: 1000 * 60,
          });
        } else if (href === "/customer/rental") {
          queryClient.prefetchQuery({
            queryKey: warehouseKeys.lists(),
            queryFn: () => warehouseService.getWarehouses(),
            staleTime: 1000 * 60 * 5,
          });
          queryClient.prefetchQuery({
            queryKey: warehouseKeys.customerActive(),
            queryFn: () => warehouseService.getCustomerActiveWarehouses(),
            staleTime: 1000 * 60 * 2,
          });
        } else if (href === "/customer/logistics/tracking" || href === "/customer/logistics/request") {
          queryClient.prefetchQuery({
            queryKey: logisticsKeys.orders(undefined, user?.id),
            queryFn: () => logisticsService.getOrders(undefined, user?.id || undefined),
            staleTime: 1000 * 60,
          });
        } else if (href === "/customer/billing") {
          queryClient.prefetchQuery({
            queryKey: billingKeys.invoices(user?.id),
            queryFn: () => billingService.getInvoices(user?.id),
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

  const hasActiveRental = Boolean(summary && summary.rentedSpaceM3 > 0);

  const customerNavGroups: NavGroup[] = [
    {
      group: "WAREHOUSE SERVICES",
      items: [
        {
          title: "Customer Dashboard",
          href: "/customer/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Warehouse Space Rental",
          href: "/customer/rental",
          icon: Warehouse,
        },
        {
          title: "Goods & Inventory",
          href: "/customer/goods",
          icon: Boxes,
        },
      ],
    },
    {
      group: "LOGISTICS & DISTRIBUTION",
      items: [
        {
          title: "Request Delivery",
          href: "/customer/logistics/request",
          icon: Truck,
        },
        {
          title: "Track Deliveries",
          href: "/customer/logistics/tracking",
          icon: Navigation,
          badge:
            counts && counts.customerInTransitDeliveriesCount > 0
              ? `${counts.customerInTransitDeliveriesCount} In Transit`
              : counts && counts.customerActiveDeliveriesCount > 0
              ? `${counts.customerActiveDeliveriesCount} Active`
              : undefined,
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold",
        },
      ],
    },
    {
      group: "FINANCE & ACCOUNT",
      items: [
        {
          title: "Billing & Invoices",
          href: "/customer/billing",
          icon: Receipt,
          badge:
            counts && counts.customerUnpaidInvoicesCount > 0
              ? `${counts.customerUnpaidInvoicesCount} Due`
              : counts && counts.customerUnderReviewInvoicesCount > 0
              ? "Under Review"
              : undefined,
          badgeColor:
            counts && counts.customerUnpaidInvoicesCount > 0
              ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
              : "bg-amber-50 text-amber-700 border-amber-200 font-bold",
        },
      ],
    },
  ];

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
          <Link href="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Layers className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 tracking-tight leading-none block">
                WMS Nusantara
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold leading-tight block mt-0.5">
                Customer & Tenant Portal
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

        {/* Active Storage Summary Tile */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
          {hasActiveRental ? (
            <Link
              href="/customer/rental"
              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Thermometer className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                    {summary?.storageLocationName || "Active Warehouse"}
                  </p>
                  <p className="text-[9.5px] text-emerald-600 font-mono font-medium leading-tight mt-0.5">
                    {summary?.rentedSpaceM3} m³ • Temp{" "}
                    {summary?.currentTempCelsius != null ? `${summary.currentTempCelsius}°C` : "Optimal"}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
            </Link>
          ) : (
            <Link
              href="/customer/rental"
              className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 border border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Warehouse className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 truncate leading-tight">
                    No Active Warehouse
                  </p>
                  <p className="text-[9.5px] text-slate-500 group-hover:text-emerald-600 font-medium leading-tight mt-0.5">
                    Click to Rent Space
                  </p>
                </div>
              </div>
              <PlusCircle className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 ml-1" />
            </Link>
          )}
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {customerNavGroups.map((group) => {
            const allHrefs = customerNavGroups.flatMap((g) => g.items.map((i) => i.href));
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
                        item.href !== "/customer/dashboard" &&
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
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-bold shadow-xs border border-emerald-100/60"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 flex-shrink-0 transition-colors ${
                              isActive
                                ? "text-emerald-600"
                                : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md flex-shrink-0 leading-none ${
                              isActive
                                ? "bg-emerald-600 text-white"
                                : item.badgeColor
                                ? item.badgeColor
                                : "bg-slate-100 text-slate-600 border border-slate-200"
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

        {/* User Account & Logout Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {user?.name || "Customer"}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                {user?.companyName || user?.email || "Tenant Account"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-all disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
