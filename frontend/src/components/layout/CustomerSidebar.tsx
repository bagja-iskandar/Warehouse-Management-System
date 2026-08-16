"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Warehouse,
  Boxes,
  Truck,
  Navigation,
  Receipt,
  History,
  Layers,
  LogOut,
  ChevronDown,
  Building2,
  X,
  Thermometer,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CustomerSidebarProps {
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

const CUSTOMER_NAV_GROUPS: NavGroup[] = [
  {
    group: "LAYANAN PERGUDANGAN",
    items: [
      {
        title: "Dashboard Customer",
        href: "/customer/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Sewa Ruang Gudang",
        href: "/customer/rental",
        icon: Warehouse,
        badge: "Tersedia",
      },
      {
        title: "Barang & Inventaris",
        href: "/customer/goods",
        icon: Boxes,
      },
    ],
  },
  {
    group: "LOGISTIK & DISTRIBUSI",
    items: [
      {
        title: "Request Pengiriman",
        href: "/customer/logistics/request",
        icon: Truck,
      },
      {
        title: "Lacak Pengiriman",
        href: "/customer/logistics/tracking",
        icon: Navigation,
        badge: "1 Transit",
      },
    ],
  },
  {
    group: "KEUANGAN & AKUN",
    items: [
      {
        title: "Tagihan & Faktur",
        href: "/customer/billing",
        icon: Receipt,
      },
      {
        title: "Riwayat Transaksi",
        href: "/customer/history",
        icon: History,
      },
    ],
  },
];

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
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
          <Link href="/customer/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Layers className="h-5 w-5 stroke-[2.3]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 tracking-tight leading-none block">
                WMS Nusantara
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold leading-tight block mt-0.5">
                Portal Customer & Penyewa
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

        {/* Active Storage Summary Tile */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-6.5 w-6.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Thermometer className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">
                  Cold Storage Zone A
                </p>
                <p className="text-[9.5px] text-emerald-600 font-mono font-medium leading-tight">
                  250 m³ • Suhu -18.4°C
                </p>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 ml-1" />
          </div>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {CUSTOMER_NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              <p className="px-2.5 text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
                {group.group}
              </p>
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? "text-emerald-600"
                              : "text-slate-400 group-hover:text-emerald-600"
                          }`}
                        />
                        <span className="text-[11.5px]">{item.title}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
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

        {/* User Account Quick Tile & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 shadow-sm">
            <Link
              href="/profile"
              className="flex items-center gap-2 overflow-hidden hover:opacity-85 transition-opacity pl-0.5"
            >
              <div className="h-7.5 w-7.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-600/20">
                {user?.name?.charAt(0) || "C"}
              </div>
              <div className="truncate">
                <p className="text-[11.5px] font-bold text-slate-800 truncate leading-tight">
                  {user?.companyName || user?.name || "PT Fresh Foods"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate leading-tight">
                  Customer Perusahaan
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
