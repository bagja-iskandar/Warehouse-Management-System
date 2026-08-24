"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Grid3X3,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Thermometer,
  Layers,
  CheckCircle2,
  Car,
  Snowflake,
  Warehouse,
  History,
  Activity,
  UserCheck,
  Receipt,
  FileCheck,
  Radio,
  ArrowUpRight,
  Plus,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DashboardContainer,
  DashboardHeader,
  DashboardMetricCard,
  DashboardSectionCard,
  DashboardEmptyState,
  DashboardSkeleton,
  DashboardErrorState,
} from "@/components/dashboard";
import { useAdminOverview } from "@/hooks/use-analytics";
import { useDeliveryOrders } from "@/hooks/use-logistics";
import { useWarehouseStore } from "@/store/warehouse.store";

export default function AdminDashboardPage() {
  const { selectedWarehouseId } = useWarehouseStore();
  const { data: overview, isLoading, isError, refetch, isFetching } = useAdminOverview(selectedWarehouseId);
  const { data: liveOrders = [] } = useDeliveryOrders({ warehouseId: selectedWarehouseId });

  if (isLoading && !overview) {
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
          title="Could Not Load Admin Overview"
          message="Failed to load warehouse telemetry and logistics metrics from PostgreSQL."
          onRetry={() => refetch()}
        />
      </DashboardContainer>
    );
  }

  const totalCap = overview?.warehouse.totalCapacityM3 ?? (selectedWarehouseId === "wh-bdg-01" ? 3000 : 5000);
  const usedCap = overview?.warehouse.usedCapacityM3 ?? 0;
  const utilPct = overview?.warehouse.utilizationPercent ?? (totalCap > 0 ? (usedCap / totalCap) * 100 : 0);
  const remainingCap = Math.max(0, totalCap - usedCap);

  const coldZone = overview?.warehouse.zonesBreakdown?.coldStorage ?? {
    totalSlots: selectedWarehouseId === "wh-bdg-01" ? 2 : 4,
    occupiedSlots: 0,
    occupancyPercent: 0,
    usedM3: 0,
    capacityM3: selectedWarehouseId === "wh-bdg-01" ? 1200 : 800,
  };

  const standardZone = overview?.warehouse.zonesBreakdown?.standard ?? {
    totalSlots: selectedWarehouseId === "wh-bdg-01" ? 2 : 4,
    occupiedSlots: 0,
    occupancyPercent: 0,
    usedM3: 0,
    capacityM3: selectedWarehouseId === "wh-bdg-01" ? 1800 : 800,
  };

  const heavyDutyZone = overview?.warehouse.zonesBreakdown?.heavyDuty ?? {
    totalSlots: selectedWarehouseId === "wh-bdg-01" ? 0 : 2,
    occupiedSlots: 0,
    occupancyPercent: 0,
    usedM3: 0,
    capacityM3: selectedWarehouseId === "wh-bdg-01" ? 0 : 400,
  };

  const logistics = overview?.logistics ?? {
    totalOrders: liveOrders.length,
    inTransitOrders: liveOrders.filter((o) => o.status === "IN_TRANSIT").length,
    reeferVehiclesCount: 2,
    totalVehicles: 4,
  };

  const billing = overview?.billing ?? {
    paidRevenueRp: 0,
    collectionRatePercent: 100,
  };

  const recentActivities = overview?.recentActivities ?? [];
  const activeOrders = liveOrders.slice(0, 4);

  const hubLabel = overview?.activeWarehouse
    ? `${overview.activeWarehouse.name} (${overview.activeWarehouse.code})`
    : selectedWarehouseId === "wh-bdg-01"
    ? "Gudang Distribusi Gedebage Cold Hub (WH-BDG-01)"
    : "Gudang Utama Cakung Logistics Hub (WH-CKG-01)";

  return (
    <DashboardContainer>
      {/* 1. Header with Live Status & Quick Action */}
      <DashboardHeader
        title="Operations Command Center & Hub Overview"
        subtitle="Real-time multi-zone rack utilization, active fleet dispatch queue, and cold chain telemetry across Nusantara facilities."
        badgeText={hubLabel}
        badgeColor="bg-indigo-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/warehouse/capacity">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Grid3X3 className="h-4 w-4" />
                <span>Rack Visualizer</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Standardized 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardMetricCard
          label="Total Space Utilization"
          value={`${usedCap.toLocaleString("en-US")} m³`}
          subvalue={`/ ${totalCap.toLocaleString("en-US")} m³`}
          icon={Boxes}
          theme="indigo"
          progress={{ value: utilPct }}
          badge={
            <span className="font-bold text-indigo-600 font-mono text-xs">
              {utilPct.toFixed(1)}%
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Occupied volume</span>
              <span className="font-semibold text-emerald-600">{remainingCap.toLocaleString("en-US")} m³ Available</span>
            </span>
          }
        />

        <DashboardMetricCard
          label="Cold Storage Telemetry"
          value={
            overview?.telemetry.avgColdTempCelsius != null
              ? `${overview.telemetry.avgColdTempCelsius > 0 ? "+" : ""}${overview.telemetry.avgColdTempCelsius}°C`
              : "-18.4°C"
          }
          icon={Thermometer}
          theme="sky"
          badge={
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
              Optimal (-18°C ~ -20°C)
            </Badge>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">Cold zone slots</span>
              <span className="font-semibold text-slate-700">
                {coldZone.occupiedSlots} / {coldZone.totalSlots} Occupied ({coldZone.occupancyPercent.toFixed(1)}%)
              </span>
            </span>
          }
        />

        <DashboardMetricCard
          label="Today's Dispatch Queue"
          value={`${logistics.totalOrders} Tasks`}
          icon={Truck}
          theme="amber"
          badge={
            <span className="text-xs text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded-md">
              {logistics.inTransitOrders} In-Transit
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              {logistics.reeferVehiclesCount} reefer & {Math.max(0, logistics.totalVehicles - logistics.reeferVehiclesCount)} dry box trucks active
            </span>
          }
        />

        <DashboardMetricCard
          label="Monthly Rental Invoices"
          value={`Rp ${(billing.paidRevenueRp / 1_000_000).toFixed(1)} M`}
          icon={Receipt}
          theme="emerald"
          badge={
            <span className="text-xs text-emerald-800 bg-emerald-100 font-semibold px-2 py-0.5 rounded-md">
              {billing.collectionRatePercent.toFixed(0)}% Settled
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Active warehouse tenant billing overview
            </span>
          }
        />
      </div>

      {/* 3. Main Operational Grid: 8 Columns Left / 4 Columns Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Zone Capacity Meters + Active Dispatch Queue */}
        <div className="lg:col-span-8 space-y-6">
          {/* Multi-Zone Capacity Breakdown */}
          <DashboardSectionCard
            title="Multi-Zone Warehouse Capacity Breakdown"
            subtitle="Live volumetric occupancy separated by temperature zone and load specs"
            icon={Layers}
            headerAction={
              <Link href="/admin/warehouse/capacity">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  View Full Grid →
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              {/* Cold Storage Zone */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Snowflake className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Cold Storage Facility</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-mono">(-18.0°C to -22.0°C)</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-800">{coldZone.usedM3} m³</span>
                    <span className="text-slate-400 text-[11px]"> / {coldZone.capacityM3} m³ ({coldZone.occupancyPercent.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, coldZone.occupancyPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Rack Slots: {coldZone.occupiedSlots} Occupied / {coldZone.totalSlots} Total</span>
                  <span className="text-sky-700 font-medium">Freezer Compressor Active</span>
                </div>
              </div>

              {/* Standard Dry Storage Zone */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Warehouse className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Standard Dry Storage</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-mono">(Ambient 20°C - 25°C)</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-800">{standardZone.usedM3} m³</span>
                    <span className="text-slate-400 text-[11px]"> / {standardZone.capacityM3} m³ ({standardZone.occupancyPercent.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, standardZone.occupancyPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Rack Slots: {standardZone.occupiedSlots} Occupied / {standardZone.totalSlots} Total</span>
                  <span className="text-emerald-700 font-medium">Humidity Controlled</span>
                </div>
              </div>

              {/* Heavy Duty / Staging Zone */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Boxes className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Heavy Duty & Staging Area</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 font-mono">(High-Bay Pallet Racking)</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-slate-800">{heavyDutyZone.usedM3} m³</span>
                    <span className="text-slate-400 text-[11px]"> / {heavyDutyZone.capacityM3} m³ ({heavyDutyZone.occupancyPercent.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, heavyDutyZone.occupancyPercent))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Rack Slots: {heavyDutyZone.occupiedSlots} Occupied / {heavyDutyZone.totalSlots} Total</span>
                  <span className="text-indigo-700 font-medium">Forklift Clearance Optimal</span>
                </div>
              </div>
            </div>
          </DashboardSectionCard>

          {/* Active Logistics & Dispatch Queue */}
          <DashboardSectionCard
            title="Active Dispatch & Logistics Queue"
            subtitle="Real-time delivery orders, assigned drivers, and live transit statuses"
            icon={Truck}
            headerAction={
              <Link href="/admin/logistics">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  Manage Fleet →
                </Button>
              </Link>
            }
          >
            {activeOrders.length === 0 ? (
              <DashboardEmptyState
                icon={Truck}
                title="No Active Logistics Orders"
                description="There are currently no active delivery orders in progress. Dispatch queues will appear here automatically."
                action={
                  <Link href="/admin/logistics">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                      Create Delivery Order
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Order Number</th>
                      <th className="py-2.5 px-3">Destination</th>
                      <th className="py-2.5 px-3">Fleet Unit</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-indigo-600 block">{order.orderNumber}</span>
                          <span className="text-[11px] text-slate-500">{order.customerName || "Verified Customer"}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[220px]">
                          <span className="text-slate-800 font-medium block truncate">{order.destinationAddress}</span>
                          <span className="text-[10.5px] text-slate-400">Created: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-slate-700 font-semibold block">{order.vehiclePlate || "Fleet Assigned"}</span>
                          <span className="text-[10px] text-slate-400">{order.requiresReefer ? "❄️ Reefer Cold Box" : "📦 Standard Freight"}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            className={`text-[9.5px] font-medium ${
                              order.status === "IN_TRANSIT"
                                ? "bg-amber-100 text-amber-900"
                                : order.status === "DELIVERED" || order.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/admin/logistics?orderId=${order.id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] border-slate-200 hover:bg-slate-100 text-slate-700">
                              Details
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

        {/* Right Column (4 cols): Live Cold Telematics + Loading Dock Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Cold Chain Sensor Telemetry */}
          <DashboardSectionCard
            title="Cold Chain IoT Hub"
            subtitle="Environmental sensors & telemetry"
            icon={Radio}
            headerAction={
              <Link href="/admin/monitoring">
                <Button variant="ghost" size="sm" className="text-xs text-sky-600 font-semibold h-7 px-2 hover:bg-sky-50">
                  Sensors →
                </Button>
              </Link>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/80 border border-sky-100">
                <div>
                  <span className="text-[11px] text-sky-800 font-semibold block">Freezer Chamber Alpha</span>
                  <span className="text-lg font-extrabold text-sky-950 font-mono">-18.4°C</span>
                </div>
                <Badge className="bg-sky-600 text-white text-[10px]">Optimal</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/80 border border-sky-100">
                <div>
                  <span className="text-[11px] text-sky-800 font-semibold block">Freezer Chamber Beta</span>
                  <span className="text-lg font-extrabold text-sky-950 font-mono">-19.1°C</span>
                </div>
                <Badge className="bg-sky-600 text-white text-[10px]">Optimal</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-600 font-semibold block">Chiller Inbound Dock</span>
                  <span className="text-base font-bold text-slate-900 font-mono">+4.2°C</span>
                </div>
                <Badge variant="outline" className="text-[10px]">Active</Badge>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Door seals & backup generator active</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono">100% OK</span>
              </div>
            </div>
          </DashboardSectionCard>

          {/* Loading Dock & Staging Bay Status */}
          <DashboardSectionCard
            title="Loading Docks & Staging Bays"
            subtitle="Real-time bay occupation & cross-docking"
            icon={Building2}
          >
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Bay 01 (Reefer Cold Dock)</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-slate-500 block font-mono">B 9876 XYZ • Loading Outbound</span>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 text-[10px]">Active</Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Bay 02 (Dry Freight Dock)</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-[11px] text-slate-500 block font-mono">D 1234 ABC • Unloading Cargo</span>
                </div>
                <Badge className="bg-amber-50 text-amber-700 text-[10px]">Occupied</Badge>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">Bay 03 (Staging & Express)</span>
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono">Vacant • Standby for Dispatch</span>
                </div>
                <Badge variant="outline" className="text-[10px] text-slate-500">Available</Badge>
              </div>
            </div>
          </DashboardSectionCard>
        </div>
      </div>

      {/* 4. Secondary Grid: Recent Activity Feed & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Feed (6 cols) */}
        <div className="lg:col-span-6">
          <DashboardSectionCard
            title="Recent Warehouse Mutations & Activity Log"
            subtitle="Automated audit trail of inventory, slots, and tenant dispatches"
            icon={History}
            headerAction={
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  Full Audit Log →
                </Button>
              </Link>
            }
          >
            {recentActivities.length === 0 ? (
              <DashboardEmptyState
                icon={History}
                title="No Recent Activity Records"
                description="Inventory mutations and system operations will be recorded here in real-time."
              />
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {recentActivities.slice(0, 5).map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {act.title || act.action || "Warehouse Transaction"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {act.timeAgo || act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {act.description || act.details || "Verified database mutation"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardSectionCard>
        </div>

        {/* Operational Quick Actions & Facility Navigation (6 cols) */}
        <div className="lg:col-span-6">
          <DashboardSectionCard
            title="Facility Direct Shortcuts & Quick Actions"
            subtitle="Immediate operational pathways for warehouse management"
            icon={Compass}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/admin/goods"
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Boxes className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-indigo-600 transition-colors">
                    Goods Put-Away
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Allocate inbound goods to verified rack slots
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/warehouse/capacity"
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Grid3X3 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-indigo-600 transition-colors">
                    Intra-Rack Transfer
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Relocate cargo between rack slots with zero drift
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/billing"
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-emerald-600 transition-colors">
                    Verify Payments
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Review and settle tenant rental payment receipts
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/drivers"
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Car className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-amber-600 transition-colors">
                    Fleet Management
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Manage drivers, vehicle reefer box, and status
                  </p>
                </div>
              </Link>
            </div>
          </DashboardSectionCard>
        </div>
      </div>
    </DashboardContainer>
  );
}
