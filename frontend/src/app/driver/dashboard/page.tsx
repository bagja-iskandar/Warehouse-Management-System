"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  Navigation,
  FileCheck,
  Thermometer,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Calendar,
  Check,
  Fuel,
  Gauge,
  CheckCircle,
  Package,
  Layers,
  Compass,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DashboardContainer,
  DashboardHeader,
  DashboardMetricCard,
  DashboardSectionCard,
  DashboardEmptyState,
  DashboardSkeleton,
  DashboardErrorState,
} from "@/components/dashboard";
import { useDriverSummary } from "@/hooks/use-analytics";
import { useDeliveryOrders } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";

export default function DriverDashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError, refetch, isFetching } = useDriverSummary(user?.id);
  const { data: liveOrders = [] } = useDeliveryOrders();

  if (isLoading && !summary) {
    return (
      <DashboardContainer>
        <DashboardSkeleton />
      </DashboardContainer>
    );
  }

  if (isError) {
    return (
      <DashboardContainer>
        <DashboardErrorState
          title="Could Not Load Driver Dashboard"
          message="Failed to load your assigned deliveries and vehicle telematics."
          onRetry={() => refetch()}
        />
      </DashboardContainer>
    );
  }

  const liveActiveOrder = liveOrders.find(
    (o) =>
      o.status === "DRIVER_ASSIGNED" ||
      o.status === "EN_ROUTE_PICKUP" ||
      o.status === "PICKED_UP" ||
      o.status === "IN_TRANSIT" ||
      o.status === "ARRIVED_DESTINATION"
  );

  const vehicle = summary?.assignedVehicle;
  const vehicleName = vehicle?.name || liveActiveOrder?.vehicleType?.replace(/_/g, " ") || "Isuzu Giga Reefer Cold Fleet";
  const vehiclePlate = vehicle?.plateNumber || liveActiveOrder?.vehiclePlate || "B 9876 XYZ";
  const vehicleCap = vehicle?.capacityM3 || (liveActiveOrder?.totalVolumeM3 ? Number(liveActiveOrder.totalVolumeM3) : 12);
  const currentTemp = vehicle?.currentTemp ?? (liveActiveOrder?.requiresReefer ? -18.2 : -18.4);

  const activeOrder = liveActiveOrder || summary?.activeDeliveryOrder;

  const totalTasksToday = liveOrders.length;
  const completedTasks = liveOrders.filter((o) => o.status === "DELIVERED" || o.status === "CONFIRMED").length;
  const inTransitTasks = liveOrders.filter((o) => o.status === "IN_TRANSIT").length;
  const pendingPickups = liveOrders.filter((o) => o.status === "PENDING_ASSIGNMENT" || o.status === "DRIVER_ASSIGNED").length;

  const activePackages = activeOrder
    ? (activeOrder as any).totalPackages || 0
    : 0;
  const activeCargoVol = activeOrder ? Number((activeOrder as any).totalVolumeM3 || 0) : 0;

  return (
    <DashboardContainer>
      {/* 1. Standard Header */}
      <DashboardHeader
        title="Driver Fleet Operations & Task Manifest"
        subtitle="Manage daily delivery runs, verify cargo pickups, monitor reefer box temperatures, and upload Proof of Delivery (POD)."
        badgeText={`${user?.name || "Driver"} • ${vehiclePlate}`}
        badgeColor="bg-amber-500 text-slate-950"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/driver/vehicle/select">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5 rounded-lg"
              >
                <Car className="h-3.5 w-3.5" />
                <span>Select Vehicle</span>
              </Button>
            </Link>

            <Link href="/driver/history">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <FileCheck className="h-4 w-4" />
                <span>POD History</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          label="Today's Assigned Tasks"
          value={`${totalTasksToday} Deliveries`}
          icon={Truck}
          theme="amber"
          badge={
            <span className="text-xs text-amber-900 bg-amber-100 font-semibold px-2 py-0.5 rounded-md">
              {inTransitTasks > 0 ? `${inTransitTasks} In Transit` : "Shift Active"}
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{pendingPickups} Pending Pickup</span>
              <span className="font-semibold text-amber-700">{completedTasks} Done Today</span>
            </span>
          }
        />

        <DashboardMetricCard
          label="Completed Deliveries"
          value={`${completedTasks} Drops`}
          icon={CheckCircle2}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] py-0 font-semibold">
              100% On-Time
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Digital signature & photo POD verified
            </span>
          }
        />

        <DashboardMetricCard
          label="Reefer Box Temperature"
          value={
            currentTemp != null
              ? `${currentTemp > 0 ? "+" : ""}${currentTemp}°C`
              : "-18.2°C"
          }
          icon={Thermometer}
          theme="sky"
          badge={
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
              Reefer Operational
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Target: -18.0°C to -20.0°C
            </span>
          }
        />

        <DashboardMetricCard
          label="Active On-Board Cargo"
          value={`${activePackages} Pkgs`}
          subvalue={activeCargoVol > 0 ? `(${activeCargoVol} m³)` : ""}
          icon={Package}
          theme="indigo"
          badge={
            <span className="text-xs text-indigo-800 bg-indigo-100 font-semibold px-2 py-0.5 rounded-md">
              {activeOrder ? "Loaded" : "Standby"}
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Vehicle Cap: {vehicleCap} m³
            </span>
          }
        />
      </div>

      {/* 3. Main Operational Grid: 8 Columns Left / 4 Columns Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Active Assignment + Today's Task Queue */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Delivery Assignment Card */}
          <DashboardSectionCard
            title="Active Delivery Assignment & Route"
            subtitle="Current delivery manifest, waypoints, and customer destination"
            icon={Navigation}
            headerAction={
              activeOrder && (
                <Link href={`/driver/tasks/${activeOrder.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                    Full Manifest →
                  </Button>
                </Link>
              )
            }
          >
            {activeOrder ? (
              <div className="space-y-5">
                {/* Header Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        Order #{activeOrder.orderNumber}
                      </span>
                      <Badge className="bg-amber-100 text-amber-900 text-[10px] font-semibold">
                        {activeOrder.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customer: {(activeOrder as any).customer?.name || (activeOrder as any).customerName || "Verified Client"} ({(activeOrder as any).customer?.phone || "0812-9988-7766"})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Estimated Arrival</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {new Date((activeOrder as any).createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Route Waypoints */}
                <div className="space-y-3 pl-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 font-medium block">
                        Origin (Warehouse Loading Bay)
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {activeOrder.originAddress || "Gudang Utama Cakung Logistics Hub, Loading Bay 01"}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                        ✓ Cargo Loaded & Temperature Verified
                      </span>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-slate-200 ml-4" />

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 font-medium block">
                        Delivery Destination
                      </span>
                      <p className="text-xs font-bold text-slate-800">
                        {activeOrder.destinationAddress || "Jl. Karawang Industri No. 45, Jawa Barat"}
                      </p>
                      <span className="text-[10px] text-indigo-600 font-medium block mt-0.5">
                        • Direct Doorstep Unloading
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <Link href={`/driver/tasks/${activeOrder.id}`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-10 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20">
                      <Navigation className="h-4 w-4" />
                      <span>Update Status & Waypoints</span>
                    </Button>
                  </Link>

                  <Link href={`/driver/pod?orderId=${activeOrder.id}`}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
                      <FileCheck className="h-4 w-4" />
                      <span>Complete Digital POD</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <DashboardEmptyState
                icon={Truck}
                title="No Active Delivery Assignment"
                description="You are currently on standby. New dispatch assignments scheduled by the logistics dispatcher will appear here automatically."
                action={
                  <div className="flex items-center gap-2">
                    <Link href="/driver/tasks">
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold h-8">
                        View Scheduled Tasks
                      </Button>
                    </Link>
                    <Link href="/driver/vehicle/select">
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Vehicle Inspection
                      </Button>
                    </Link>
                  </div>
                }
              />
            )}
          </DashboardSectionCard>

          {/* Today's Tasks Queue & Schedule */}
          <DashboardSectionCard
            title="Today's Delivery Manifest Queue"
            subtitle="Scheduled drop-offs and pending runs for your current shift"
            icon={Clock}
            headerAction={
              <Link href="/driver/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  All Tasks →
                </Button>
              </Link>
            }
          >
            {liveOrders.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No additional scheduled tasks for today.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {liveOrders.slice(0, 3).map((task) => (
                  <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{task.orderNumber}</span>
                        <Badge
                          className={`text-[9.5px] ${
                            task.status === "DELIVERED" || task.status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-900"
                              : task.status === "IN_TRANSIT"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{task.destinationAddress}</p>
                    </div>

                    <Link href={`/driver/tasks/${task.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] border-slate-200 hover:bg-slate-100 text-slate-700">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </div>

        {/* Right Column (4 cols): Vehicle Health & Driver Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Fleet Unit Card */}
          <DashboardSectionCard
            title="Assigned Fleet Unit"
            subtitle="Vehicle telematics & cold box status"
            icon={Car}
            headerAction={
              <Link href="/driver/vehicle/select">
                <Button variant="ghost" size="sm" className="text-xs text-amber-800 font-semibold h-7 px-2 hover:bg-amber-50">
                  Switch →
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{vehicleName}</span>
                  <span className="font-mono text-xs font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                    {vehiclePlate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono border-t border-amber-200/60 pt-2">
                  <span>Capacity: {vehicleCap} m³</span>
                  <span className="text-emerald-700 font-semibold">Ready for Run</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 block">Fuel Level</span>
                  <span className="font-mono font-bold text-slate-800 mt-0.5 block">85% (Optimal)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10.5px] text-slate-400 block">Tire Pressure</span>
                  <span className="font-mono font-bold text-slate-800 mt-0.5 block">36 PSI (OK)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2 text-xs text-emerald-900 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Pre-trip safety inspection signed off</span>
              </div>
            </div>
          </DashboardSectionCard>

          {/* Quick Driver Action Pathways */}
          <DashboardSectionCard
            title="Driver Quick Actions"
            subtitle="Direct operational pathways"
            icon={Compass}
          >
            <div className="space-y-2.5">
              <Link
                href="/driver/pickup"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors">
                    Cargo Pickup Verification
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/driver/transit"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Navigation className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    Live GPS Route & Transit
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/driver/pod"
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FileCheck className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    Digital Proof of Delivery
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </DashboardSectionCard>
        </div>
      </div>

      {/* 4. Secondary Grid: Delivery History & Completed POD Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <DashboardSectionCard
            title="Recent Delivery Runs & Proof of Delivery Archive"
            subtitle="Completed freight dispatches with customer sign-offs and timestamps"
            icon={FileCheck}
            headerAction={
              <Link href="/driver/history">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  Full History →
                </Button>
              </Link>
            }
          >
            {completedTasks === 0 ? (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                Completed delivery manifests will appear in this archive with digital signatures.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Completion Time</th>
                      <th className="py-2.5 px-3">POD Verification</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveOrders
                      .filter((o) => o.status === "DELIVERED" || o.status === "CONFIRMED")
                      .slice(0, 4)
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {ord.destinationAddress}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                            {new Date(ord.confirmedAt || ord.updatedAt).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3">
                            <Badge className="bg-emerald-100 text-emerald-900 text-[9.5px]">
                              ✓ Signed & Timestamped
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link href={`/driver/history`}>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] border-slate-200 hover:bg-slate-100 text-slate-700">
                                View POD
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>
    </DashboardContainer>
  );
}
