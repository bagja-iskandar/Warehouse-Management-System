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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Operations Dashboard & Warehouse Overview
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Cakung Central Hub (JKT-01)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-zone rack utilization, cold chain telemetry, and active dispatch fleet queue monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/warehouse/capacity">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
              <Grid3X3 className="h-4 w-4" />
              <span>Open Rack Visualizer</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Total Space Utilization */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Space Utilization
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">768 m³</span>
            <span className="text-xs text-slate-400 ml-1.5 font-mono">/ 1,000 m³</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="w-full bg-slate-100 rounded-full h-2 mr-3 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full w-[76.8%]" />
            </div>
            <span className="font-bold text-indigo-600 font-mono">76.8%</span>
          </div>
        </div>

        {/* KPI 2: Cold Storage Temp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Cold Storage Capacity
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Thermometer className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900">-18.4°C</span>
            <Badge variant="success" className="text-[10px] py-0">
              Stable
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            35 / 40 Slots Occupied (87.5%)
          </p>
        </div>

        {/* KPI 3: Dispatch Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Today&apos;s Dispatch Queue
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900">4 Tasks</span>
            <span className="text-xs text-amber-700 bg-amber-50 font-semibold px-2 py-0.5 rounded-md">
              2 In-Transit
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            2 reefer & 2 box trucks active
          </p>
        </div>

        {/* KPI 4: Invoices & Billing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Monthly Rental Invoices
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">IDR 48.5 M</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>92% Invoices Collected on Schedule</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Zone Capacity Breakdown & Active Dispatch Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Zone Capacity & Visualizer Link (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Zone Capacity Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4.5 w-4.5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Active Zone & Rack Capacity Utilization
                </h2>
              </div>
              <Link
                href="/admin/warehouse/capacity"
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>3D Grid Visualizer</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Zona A: Cold Storage */}
              <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                    <span>Zone A — Cold</span>
                  </span>
                  <Badge className="bg-sky-100 text-sky-800 text-[10px]">
                    -18.4°C
                  </Badge>
                </div>
                <p className="text-lg font-bold text-slate-900">35 / 40 Slots</p>
                <div className="w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-600 h-1.5 rounded-full w-[87.5%]" />
                </div>
                <p className="text-[10.5px] text-sky-700 font-medium">
                  87.5% Occupied • 5 Slots Available
                </p>
              </div>

              {/* Zona B: Standard Storage */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Zone B — Standard</span>
                  </span>
                  <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">
                    24.0°C
                  </Badge>
                </div>
                <p className="text-lg font-bold text-slate-900">42 / 60 Slots</p>
                <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-1.5 rounded-full w-[70%]" />
                </div>
                <p className="text-[10.5px] text-indigo-700 font-medium">
                  70.0% Occupied • 18 Slots Available
                </p>
              </div>

              {/* Zona C: Heavy Duty */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Boxes className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Zone C — Pallet</span>
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    25.0°C
                  </Badge>
                </div>
                <p className="text-lg font-bold text-slate-900">20 / 30 Slots</p>
                <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-1.5 rounded-full w-[66.7%]" />
                </div>
                <p className="text-[10.5px] text-emerald-700 font-medium">
                  66.7% Occupied • 10 Slots Available
                </p>
              </div>
            </div>
          </div>

          {/* Active Logistics Queue Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Logistics Queue & Fleet Assignments Today
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                4 Tasks Scheduled
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Task 1 */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Car className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">DO-2026-001</span>
                      <span className="text-[10.5px] font-mono text-slate-500">PT Fresh Foods Indonesia</span>
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                        In Transit
                      </Badge>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Isuzu Reefer Truck (B 9821 TKN) • Driver: Ahmad Subarjo • Destination: FreshMarket BSD
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    Est: 35 min left
                  </span>
                </div>
              </div>

              {/* Task 2 */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">DO-2026-002</span>
                      <span className="text-[10.5px] font-mono text-slate-500">CV Furnitur Nusantara</span>
                      <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px]">
                        Loading Dock 1
                      </Badge>
                    </div>
                    <p className="text-[11.5px] text-slate-500 mt-0.5">
                      Hino Box Truck (B 1234 XYZ) • Driver: Doni Prasetyo • Destination: Plaza Mebel Cibubur
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-500">
                    Loading Goods in Progress
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Operational Activity Feed & Dock Status (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Loading Dock Status Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Loading Dock Status
              </h2>
              <Badge variant="outline" className="text-[10px]">
                3 Gates
              </Badge>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Loading Dock 1</span>
                  <span className="text-[11px] text-indigo-600">Outbound: B 1234 XYZ</span>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Loading Dock 2</span>
                  <span className="text-[11px] text-emerald-600">Available for Unloading</span>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Loading Dock 3</span>
                  <span className="text-[11px] text-emerald-600">Available for Unloading</span>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Activity
              </h2>
              <History className="h-4 w-4 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-emerald-50 text-emerald-600 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Receiving Completed (PO-9912)</p>
                  <p className="text-[11px] text-slate-500">45 Master Boxes in Zone C • Budianto</p>
                  <span className="text-[10px] text-slate-400 font-mono">5 min ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5">
                  <Truck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Fleet Arrived (B 8812 K)</p>
                  <p className="text-[11px] text-slate-500">Check-in at Gate 2 for Outbound</p>
                  <span className="text-[10px] text-slate-400 font-mono">15 min ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-amber-50 text-amber-600 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Low Stock Warning</p>
                  <p className="text-[11px] text-slate-500">SKU: BAR-FURN-002 remaining 4 units</p>
                  <span className="text-[10px] text-slate-400 font-mono">42 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
