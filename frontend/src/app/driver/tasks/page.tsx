"use client";

import React, { useState } from "react";
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
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useDeliveryOrders } from "@/hooks/use-logistics";

type DriverSortOption =
  | "SCHEDULED_SOONEST"
  | "SCHEDULED_LATEST"
  | "NEWEST_CREATED"
  | "OLDEST_CREATED";

export default function DriverTasksListPage() {
  const [sortOption, setSortOption] = useState<DriverSortOption>("SCHEDULED_SOONEST");

  const querySortParam =
    sortOption === "SCHEDULED_SOONEST"
      ? { sortBy: "scheduledDate", sortOrder: "asc" as const }
      : sortOption === "SCHEDULED_LATEST"
      ? { sortBy: "scheduledDate", sortOrder: "desc" as const }
      : sortOption === "NEWEST_CREATED"
      ? { sortBy: "createdAt", sortOrder: "desc" as const }
      : { sortBy: "createdAt", sortOrder: "asc" as const };

  const { data: liveOrders = [], isLoading, refetch, isFetching } = useDeliveryOrders(querySortParam);

  const activeTasks = [...liveOrders].sort((a, b) => {
    const timeSchedA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : null;
    const timeSchedB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : null;
    const timeCreatedA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeCreatedB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (sortOption === "SCHEDULED_SOONEST") {
      if (timeSchedA !== null && timeSchedB !== null) {
        if (timeSchedA !== timeSchedB) return timeSchedA - timeSchedB;
        return timeCreatedB - timeCreatedA;
      }
      if (timeSchedA !== null) return -1;
      if (timeSchedB !== null) return 1;
      return timeCreatedB - timeCreatedA;
    }

    if (sortOption === "SCHEDULED_LATEST") {
      if (timeSchedA !== null && timeSchedB !== null) {
        if (timeSchedA !== timeSchedB) return timeSchedB - timeSchedA;
        return timeCreatedB - timeCreatedA;
      }
      if (timeSchedA !== null) return -1;
      if (timeSchedB !== null) return 1;
      return timeCreatedB - timeCreatedA;
    }

    if (sortOption === "NEWEST_CREATED") {
      return timeCreatedB - timeCreatedA;
    }

    if (sortOption === "OLDEST_CREATED") {
      return timeCreatedA - timeCreatedB;
    }

    return 0;
  });

  const inTransitCount = liveOrders.filter((o) => o.status === "IN_TRANSIT").length;
  const pendingPickupCount = liveOrders.filter(
    (o) => o.status === "DRIVER_ASSIGNED" || o.status === "EN_ROUTE_PICKUP"
  ).length;
  const completedCount = liveOrders.filter(
    (o) => o.status === "DELIVERED" || o.status === "CONFIRMED"
  ).length;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Task Assignments"
        title="Driver Delivery Assignment Queue"
        subtitle="List of active delivery work orders, cargo route instructions, and Digital POD completion."
        badgeText="Active Dispatch"
        badgeColor="bg-amber-500 text-slate-950"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-600">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as DriverSortOption)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="SCHEDULED_SOONEST">Scheduled (Soonest First)</option>
                <option value="SCHEDULED_LATEST">Scheduled (Furthest Out)</option>
                <option value="NEWEST_CREATED">Created (Newest First)</option>
                <option value="OLDEST_CREATED">Created (Oldest First)</option>
              </select>
            </div>

            <Link href="/driver/transit">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-sm">
                <Navigation className="h-4 w-4" />
                <span>Live Route Navigation</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Assigned Tasks"
          value={`${liveOrders.length} Tasks`}
          icon={ClipboardList}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              Active DO queue
            </span>
          }
        />

        <MetricCard
          label="Pending Pickup"
          value={`${pendingPickupCount} Tasks`}
          icon={Truck}
          theme="amber"
          subtext={
            <span className="text-[11px] text-amber-700 font-medium">
              Awaiting driver arrival at dock
            </span>
          }
        />

        <MetricCard
          label="Currently In Transit"
          value={`${inTransitCount} En Route`}
          icon={Navigation}
          theme="sky"
          badge={
            inTransitCount > 0 ? (
              <Badge className="bg-sky-500 text-white text-[10px] animate-pulse">
                Active
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              On-road telematics live
            </span>
          }
        />

        <MetricCard
          label="Delivered & Verified"
          value={`${completedCount} Completed`}
          icon={CheckCircle2}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              POD Confirmed
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-emerald-700 font-medium">
              Digital signature recorded
            </span>
          }
        />
      </div>

      {/* 3. Task Cards List */}
      <SectionCard
        title="Delivery Order Work Orders"
        subtitle="Review assignment details, navigate delivery routes, and submit recipient signatures"
        icon={ClipboardList}
      >
        <div className="space-y-4">
          {activeTasks.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Delivery Orders in Queue"
              description="You have completed all assigned delivery work orders."
            />
          ) : (
            activeTasks.map((task) => (
              <div
                key={task.id}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4 hover:border-indigo-300 hover:bg-slate-50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      #{task.orderNumber}
                    </span>
                    <Badge
                      className={
                        task.status === "DELIVERED" || task.status === "CONFIRMED"
                          ? "bg-emerald-600 text-white text-[10px]"
                          : task.status === "IN_TRANSIT"
                          ? "bg-amber-500 text-slate-950 font-bold text-[10px]"
                          : "bg-indigo-600 text-white text-[10px]"
                      }
                    >
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                    {task.requiresReefer && (
                      <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />
                        <span>Reefer (-18°C)</span>
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      {task.scheduledDate ? (
                        <>
                          Scheduled:{" "}
                          <span className="text-slate-900 font-bold">
                            {new Date(task.scheduledDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {task.scheduledTimeSlot ? ` • ${task.scheduledTimeSlot}` : ""}
                        </>
                      ) : (
                        <span className="text-slate-400 italic">Schedule not set</span>
                      )}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Created:{" "}
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-800">
                  {task.goodsSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Origin:</span>
                      <span className="font-medium text-slate-800">{task.originAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Destination:</span>
                      <span className="font-medium text-slate-800">{task.destinationAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80">
                  <Link href={`/driver/tasks/${task.id}`}>
                    <Button
                      variant="outline"
                      className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 px-3.5 rounded-lg font-medium"
                    >
                      Instruction Details
                    </Button>
                  </Link>
                  <Link href={`/driver/pod?orderId=${task.id}`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-lg font-semibold shadow-sm">
                      Upload POD
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
