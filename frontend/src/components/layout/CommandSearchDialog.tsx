"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface CommandSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Page" | "Goods & SKU" | "Rack Slot" | "Fleet";
  href: string;
  icon: React.ElementType;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "nav-dash",
    title: "Operational Dashboard",
    subtitle: "Overview of warehouse metrics, rack utilization, and fleet status",
    category: "Page",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "nav-cap",
    title: "Capacity & Rack Grid",
    subtitle: "Visualization of standard and cold storage rack slots",
    category: "Page",
    href: "/admin/warehouse/capacity",
    icon: Grid3X3,
  },
  {
    id: "nav-goods",
    title: "Goods & Inventory Management",
    subtitle: "SKU catalog, stock movements, and QR barcodes",
    category: "Page",
    href: "/admin/goods",
    icon: Boxes,
  },
  {
    id: "nav-logistics",
    title: "Logistics Dispatch & Queue",
    subtitle: "Driver assignment, delivery routes, and digital POD",
    category: "Page",
    href: "/admin/logistics",
    icon: Truck,
  },
  {
    id: "nav-billing",
    title: "Rental Billing & Invoices",
    subtitle: "Monthly payment status and overdue penalty calculations",
    category: "Page",
    href: "/admin/billing",
    icon: Receipt,
  },
  {
    id: "sku-1",
    title: "Wagyu Beef Ribeye A5 (BAR-FRESH-001)",
    subtitle: "Cold Storage Zone A • Slot A-01-01 • PT Fresh Foods",
    category: "Goods & SKU",
    href: "/admin/goods",
    icon: Boxes,
  },
  {
    id: "sku-2",
    title: "Minimalist 3-Seater Sofa (BAR-FURN-001)",
    subtitle: "Standard Zone B • Slot B-02-01 • CV Furnitur Nusantara",
    category: "Goods & SKU",
    href: "/admin/goods",
    icon: Boxes,
  },
  {
    id: "fleet-1",
    title: "Isuzu Giga Reefer Truck (B 9821 TKN)",
    subtitle: "Active Temp -18°C • Driver: Ahmad Subarjo • In Transit",
    category: "Fleet",
    href: "/admin/fleet",
    icon: Car,
  },
];

export function CommandSearchDialog({ isOpen, onClose }: CommandSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Keyboard shortcut listener (Cmd + K or Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search dialog
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = SEARCH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-4 w-4 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search features, goods SKU, fleet, or invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-12 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No search results matching &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="group flex items-center justify-between p-3 rounded-md hover:bg-indigo-50/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 group-hover:text-slate-600 leading-tight mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Navigate: <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">↓</kbd>
            </span>
            <span>
              Select: <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">Enter</kbd>
            </span>
          </div>
          <span>
            Close: <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">Esc</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
