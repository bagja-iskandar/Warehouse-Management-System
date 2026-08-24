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
import { useOperationalCounts } from "@/hooks/use-operational-counts";

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
  const { data: counts } = useOperationalCounts();
  const allHrefs = DRIVER_NAV_ITEMS.map((i) => i.href);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-full text-slate-300 py-1 px-2.5 shadow-2xl shadow-slate-950/60">
      <div className="grid grid-cols-5 gap-1">
        {DRIVER_NAV_ITEMS.map((item) => {
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
          const showBadge = item.href === "/driver/dashboard" && counts && counts.driverActiveTasksCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-full text-[9.5px] font-semibold transition-all ${
                isActive
                  ? "text-amber-400 bg-amber-500/15 font-bold shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-4.5 w-4.5 mb-0.5 ${
                    isActive ? "text-amber-400 scale-105" : "text-slate-400"
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 h-3.5 min-w-[14px] px-0.5 rounded-full bg-amber-500 text-slate-950 text-[8px] font-bold flex items-center justify-center font-mono shadow-xs">
                    {counts.driverActiveTasksCount}
                  </span>
                )}
              </div>
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
