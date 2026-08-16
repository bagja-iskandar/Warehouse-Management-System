"use client";

import React from "react";
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
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminSidebarProps {
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

const NAV_GROUPS: NavGroup[] = [
  {
    group: "OPERASIONAL GUDANG",
    items: [
      {
        title: "Dashboard Operasional",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Kapasitas & Grid Rak",
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
        title: "Manajemen Barang",
        href: "/admin/goods",
        icon: Boxes,
      },
    ],
  },
  {
    group: "ARMADA & PENGIRIMAN",
    items: [
      {
        title: "Dispatch Logistik",
        href: "/admin/logistics",
        icon: Truck,
        badge: "4 Antrean",
      },
      {
        title: "Armada Kendaraan",
        href: "/admin/fleet",
        icon: Car,
      },
      {
        title: "Sensor & Telemetri",
        href: "/admin/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    group: "PENGGUNA & KEUANGAN",
    items: [
      {
        title: "Customer & Penyewa",
        href: "/admin/customers",
        icon: Users,
      },
      {
        title: "Driver / Kurir",
        href: "/admin/drivers",
        icon: UserCheck,
      },
      {
        title: "Tagihan & Faktur",
        href: "/admin/billing",
        icon: Receipt,
      },
      {
        title: "Laporan & Ekspor",
        href: "/admin/reports",
        icon: BarChart3,
      },
    ],
  },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
        className={`fixed top-4 bottom-4 left-4 z-50 w-64 bg-white border border-slate-200/90 rounded-2xl flex flex-col shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+2rem)] lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 bg-white">
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
              aria-label="Tutup navigasi"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Hub Selector Tile */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6.5 w-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  Gudang Cakung
                </p>
                <p className="text-[9.5px] text-indigo-600 font-mono font-medium leading-tight">
                  JKT-01 • Standard & Cold
                </p>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
          </div>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-2.5 text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
                {group.group}
              </p>
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
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
          ))}
        </div>

        {/* User Account Quick Tile & Logout (Clean White Card) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Link
              href="/profile"
              className="flex items-center gap-2 overflow-hidden hover:opacity-85 transition-opacity pl-0.5"
            >
              <div className="h-7.5 w-7.5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-600/20">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="truncate">
                <p className="text-[11.5px] font-bold text-slate-800 truncate leading-tight">
                  {user?.name || "Admin Operasional"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                  Admin Gudang
                </p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar dari sesi"
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
