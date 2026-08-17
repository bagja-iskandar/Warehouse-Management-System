"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  Truck,
  Phone,
  Thermometer,
  Boxes,
  Navigation,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeliveryOrders } from "@/hooks/use-logistics";

export default function DriverTasksListPage() {
  const { data: liveOrders } = useDeliveryOrders();

  const activeTasks =
    liveOrders && liveOrders.length > 0
      ? liveOrders
      : [
          {
            id: "ord-01",
            orderNumber: "DO-2026-001",
            goodsSummary: "150 Packages Wagyu Beef & Salmon (Reefer -18°C)",
            originAddress: "Cakung Logistics Central Hub (JKT-01) — Loading Dock 2",
            destinationAddress:
              "FreshMarket Superstore BSD, South Tangerang",
            customerName: "Mr. Hendra",
            customerPhone: "0812-9988-7766",
            status: "IN_TRANSIT" as const,
            scheduledTimeSlot: "08:30 WIB",
          },
        ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Driver Delivery Assignment Queue
            </h1>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              Dispatch Tasks
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            List of active delivery work orders, cargo route instructions, and Digital POD completion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {task.orderNumber}
                </span>
                <Badge
                  variant={
                    task.status === "DELIVERED"
                      ? "success"
                      : task.status === "IN_TRANSIT"
                      ? "warning"
                      : "secondary"
                  }
                  className="text-[10px]"
                >
                  {task.status === "DELIVERED"
                    ? "Completed"
                    : task.status === "IN_TRANSIT"
                    ? "In Transit"
                    : "Assigned"}
                </Badge>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {task.scheduledTimeSlot || "08:30 WIB"}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-800">
              {task.goodsSummary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Origin:</span>
                  <span className="font-medium">{task.originAddress}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Destination:</span>
                  <span className="font-medium">{task.destinationAddress}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Link href={`/driver/tasks/${task.id}`}>
                <Button
                  variant="outline"
                  className="text-xs border-slate-300 text-slate-700 h-8.5"
                >
                  Instruction Details
                </Button>
              </Link>
              <Link href="/driver/pod">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8.5">
                  Upload POD
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
