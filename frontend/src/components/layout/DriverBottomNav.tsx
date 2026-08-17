"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Navigation,
  Car,
  FileCheck,
  History,
} from "lucide-react";

const DRIVER_NAV_ITEMS = [
  {
    title: "Tasks",
    href: "/driver/dashboard",
    icon: ClipboardList,
  },
  {
    title: "Route",
    href: "/driver/transit",
    icon: Navigation,
  },
  {
    title: "Fleet",
    href: "/driver/vehicle/select",
    icon: Car,
  },
  {
    title: "POD Proof",
    href: "/driver/pod",
    icon: FileCheck,
  },
  {
    title: "History",
    href: "/driver/history",
    icon: History,
  },
];

export function DriverBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-full text-slate-300 py-1 px-2.5 shadow-2xl shadow-slate-950/60">
      <div className="grid grid-cols-5 gap-1">
        {DRIVER_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/driver/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-full text-[9.5px] font-semibold transition-all ${
                isActive
                  ? "text-amber-400 bg-amber-500/15 font-bold shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 mb-0.5 ${
                  isActive ? "text-amber-400 scale-105" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
