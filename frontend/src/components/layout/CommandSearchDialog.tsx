"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Grid3X3,
  Boxes,
  Truck,
  Receipt,
  Users,
  Car,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  Thermometer,
  ShieldCheck,
  Building2,
  Package,
  Calendar,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommandSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = "All" | "Pages" | "Goods & SKU" | "Rack Slots" | "Fleet" | "Billing";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Pages" | "Goods & SKU" | "Rack Slots" | "Fleet" | "Billing";
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "nav-dash",
    title: "Operations Command Center",
    subtitle: "Real-time warehouse telemetry, capacity utilization, and dispatch queue",
    category: "Pages",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: "Admin",
  },
  {
    id: "nav-cap",
    title: "Rack Capacity Visualizer & Grid",
    subtitle: "Interactive 3D/2D slot matrix across Cold Storage and Standard Dry zones",
    category: "Rack Slots",
    href: "/admin/warehouse/capacity",
    icon: Grid3X3,
    badge: "Real-Time",
  },
  {
    id: "nav-goods",
    title: "Inventory & Goods Catalog",
    subtitle: "Inbound registration, SKU barcodes, slot put-away, and stock movements",
    category: "Goods & SKU",
    href: "/admin/goods",
    icon: Boxes,
  },
  {
    id: "nav-logistics",
    title: "Fleet Dispatch & Route Logistics",
    subtitle: "Driver assignment, transit status, reefer temperature monitoring, and POD",
    category: "Fleet",
    href: "/admin/logistics",
    icon: Truck,
    badge: "Live Fleet",
  },
  {
    id: "nav-billing",
    title: "Tenant Billing & Invoices",
    subtitle: "Monthly warehouse lease invoicing, payment receipts, and reconciliation",
    category: "Billing",
    href: "/admin/billing",
    icon: Receipt,
  },
  {
    id: "nav-customers",
    title: "Customers & Tenants Directory",
    subtitle: "Manage enterprise customer accounts, leased space, and contact profiles",
    category: "Pages",
    href: "/admin/customers",
    icon: Users,
  },
  {
    id: "nav-drivers",
    title: "Driver Couriers & Logistics Fleet",
    subtitle: "Fleet personnel, active assignments, and vehicle telematics",
    category: "Fleet",
    href: "/admin/drivers",
    icon: Car,
  },
  {
    id: "nav-cust-dash",
    title: "Customer Warehouse Portal",
    subtitle: "Tenant view of stored inventory, delivery orders, and storage leases",
    category: "Pages",
    href: "/customer/dashboard",
    icon: Building2,
    badge: "Tenant",
  },
  {
    id: "nav-driver-dash",
    title: "Driver Task Manifest & GPS Route",
    subtitle: "Daily delivery stops, waypoint navigation, and digital POD capture",
    category: "Pages",
    href: "/driver/dashboard",
    icon: Compass,
    badge: "Driver",
  },
  {
    id: "sku-1",
    title: "Beras Premium BOSSS 25kg (BRG-202608-001)",
    subtitle: "Standard Dry Zone • Slot RAK-F01 • Haidar Logistics",
    category: "Goods & SKU",
    href: "/admin/goods",
    icon: Package,
    badge: "6 m³",
  },
  {
    id: "sku-2",
    title: "Wagyu Beef Ribeye A5 (BAR-FRESH-001)",
    subtitle: "Cold Storage Zone A • Slot A-01-01 • -18.4°C Optimal",
    category: "Goods & SKU",
    href: "/admin/goods",
    icon: Thermometer,
    badge: "Cold Box",
  },
  {
    id: "rack-1",
    title: "Slot RAK-F01 (Gudang Utama Cakung)",
    subtitle: "Standard Dry Zone • Occupied 6 / 200 m³ • Beras Premium BOSSS",
    category: "Rack Slots",
    href: "/admin/warehouse/capacity",
    icon: Grid3X3,
    badge: "Occupied",
  },
  {
    id: "rack-2",
    title: "Slot COLD-A01 (Cold Storage Hub)",
    subtitle: "Freezer Zone Alpha • -18.0°C • Capacity 200 m³",
    category: "Rack Slots",
    href: "/admin/warehouse/capacity",
    icon: SnowflakeIcon,
    badge: "Vacant",
  },
  {
    id: "fleet-1",
    title: "Isuzu Giga Reefer Truck (B 9876 XYZ)",
    subtitle: "Reefer Box -18.2°C • Driver: Agus Pratama • Route Active",
    category: "Fleet",
    href: "/admin/fleet",
    icon: Car,
    badge: "In Transit",
  },
  {
    id: "inv-1",
    title: "Invoice #INV-202608-9863 (Rp 150.000.000)",
    subtitle: "Customer: Haidar • Cakung Hub Rental • Status: PAID",
    category: "Billing",
    href: "/admin/billing",
    icon: Receipt,
    badge: "PAID",
  },
];

function SnowflakeIcon({ className }: { className?: string }) {
  return <Thermometer className={className} />;
}

const CATEGORIES: SearchCategory[] = [
  "All",
  "Pages",
  "Goods & SKU",
  "Rack Slots",
  "Fleet",
  "Billing",
];

export function CommandSearchDialog({ isOpen, onClose }: CommandSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
      setSelectedCategory("All");
    }
  }, [isOpen]);

  // Global shortcut listener (Cmd + K or Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = SEARCH_ITEMS.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Handle keyboard navigation inside search list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex].href);
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Search className="h-4.5 w-4.5 stroke-[2.2]" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Search goods, SKUs, rack slots, fleet, or invoices..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-50 max-h-[380px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No results found</p>
              <p className="text-[11px] text-slate-400">
                No matching results for &quot;{query}&quot; in category &quot;{selectedCategory}&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-50/80 border border-indigo-200/80 shadow-xs"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                          : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-indigo-950" : "text-slate-800"
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <Badge
                            className={`text-[9.5px] px-1.5 py-0 font-medium ${
                              isSelected
                                ? "bg-indigo-200 text-indigo-900 hover:bg-indigo-200"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                      {item.category}
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform ${
                        isSelected
                          ? "text-indigo-600 translate-x-0.5"
                          : "text-slate-300 group-hover:text-indigo-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-xs">
                ↓
              </kbd>
              <span className="ml-1">to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-xs">
                ↵ Enter
              </kbd>
              <span className="ml-1">to open</span>
            </span>
          </div>

          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500 shadow-xs">
              ESC
            </kbd>
            <span className="ml-1">to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
