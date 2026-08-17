"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  Navigation,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  Building2,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeliveryOrders } from "@/hooks/use-logistics";

interface DispatchOrder {
  id: string;
  doNumber: string;
  tenantName: string;
  recipientName: string;
  recipientAddress: string;
  itemsSummary: string;
  totalKoli: number;
  assignedDriver: string;
  assignedVehicle: string;
  vehiclePlate: string;
  status: "QUEUED" | "LOADING" | "IN_TRANSIT" | "DELIVERED";
  scheduledTime: string;
  estimatedArrival?: string;
  hasDigitalPod: boolean;
}

const DISPATCH_ORDERS: DispatchOrder[] = [
  {
    id: "do-1",
    doNumber: "DO-2026-001",
    tenantName: "PT Fresh Foods Indonesia",
    recipientName: "FreshMarket Superstore BSD (Mr. Hendra)",
    recipientAddress: "Jl. Pahlawan Seribu No. 88, BSD City, South Tangerang",
    itemsSummary: "150 Packages Wagyu Beef & Salmon (Reefer -18°C)",
    totalKoli: 150,
    assignedDriver: "Ahmad Subarjo",
    assignedVehicle: "Isuzu Giga Reefer Truck",
    vehiclePlate: "B 9821 TKN",
    status: "IN_TRANSIT",
    scheduledTime: "Aug 16, 2026, 08:30 WIB",
    estimatedArrival: "35 Minutes (09:45 WIB)",
    hasDigitalPod: false,
  },
  {
    id: "do-2",
    doNumber: "DO-2026-002",
    tenantName: "CV Furnitur Nusantara",
    recipientName: "Showroom Furniture Kemang (Mrs. Sarah)",
    recipientAddress: "Jl. Kemang Raya No. 42, South Jakarta",
    itemsSummary: "20 Sets 3-Seater Velvet Minimalist Sofa",
    totalKoli: 20,
    assignedDriver: "Doni Prasetyo",
    assignedVehicle: "Hino Dutro Box Truck",
    vehiclePlate: "B 1234 XYZ",
    status: "LOADING",
    scheduledTime: "Aug 16, 2026, 10:00 WIB",
    hasDigitalPod: false,
  },
  {
    id: "do-3",
    doNumber: "DO-2026-003",
    tenantName: "PT Global Retailindo",
    recipientName: "Retail Store Sunter Indah (Mr. Kevin)",
    recipientAddress: "Ruko Sunter Garden Blok D No. 5, North Jakarta",
    itemsSummary: "60 Boxes Household Electronic Appliances",
    totalKoli: 60,
    assignedDriver: "Rian Hidayat",
    assignedVehicle: "Daihatsu GranMax Blind Van",
    vehiclePlate: "B 5678 KLM",
    status: "QUEUED",
    scheduledTime: "Aug 16, 2026, 13:00 WIB",
    hasDigitalPod: false,
  },
  {
    id: "do-4",
    doNumber: "DO-2026-000",
    tenantName: "PT Sumber Frozen Makmur",
    recipientName: "Super Indo Kelapa Gading",
    recipientAddress: "Jl. Boulevard Raya Blok LA No. 1, North Jakarta",
    itemsSummary: "80 Packages Dairy Butter & Cheese",
    totalKoli: 80,
    assignedDriver: "Ahmad Subarjo",
    assignedVehicle: "Isuzu Giga Reefer Truck",
    vehiclePlate: "B 9821 TKN",
    status: "DELIVERED",
    scheduledTime: "Aug 15, 2026, 14:00 WIB",
    hasDigitalPod: true,
  },
];

export default function LogisticsManagementPage() {
  const { data: liveOrders } = useDeliveryOrders();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const activeOrders: DispatchOrder[] =
    liveOrders && liveOrders.length > 0
      ? liveOrders.map((o) => ({
          id: o.id,
          doNumber: o.orderNumber,
          tenantName: o.customerName || "PT Fresh Foods Indonesia",
          recipientName: `${o.destinationAddress} (${o.customerName})`,
          recipientAddress: o.destinationAddress,
          itemsSummary: o.goodsSummary || "WMS Cargo Commodities",
          totalKoli: Math.round((o.totalVolumeM3 || 1) * 20),
          assignedDriver: o.driverName || "WMS Driver",
          assignedVehicle: o.vehicleType || "Isuzu Giga Reefer Truck",
          vehiclePlate: o.vehiclePlate || "B 9821 WMS",
          status:
            o.status === "DELIVERED" || o.status === "CONFIRMED"
              ? ("DELIVERED" as const)
              : o.status === "IN_TRANSIT" || o.status === "EN_ROUTE_PICKUP"
              ? ("IN_TRANSIT" as const)
              : o.status === "PICKED_UP"
              ? ("LOADING" as const)
              : ("QUEUED" as const),
          scheduledTime: o.scheduledDate || "16 Aug 2026",
          estimatedArrival: "35 Minutes",
          hasDigitalPod: Boolean(o.proofOfDeliveryUrl),
        }))
      : DISPATCH_ORDERS;

  const filteredOrders = activeOrders.filter((order) => {
    const matchStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchSearch =
      order.doNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Logistics & Dispatch Delivery Order Queue
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Active Dispatch
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Fleet dispatch schedules, loading dock allocations, live GPS route tracking, and digital proof of delivery (Digital POD).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Manifest</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Create Delivery Order (DO)</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Today&apos;s Total DO Assignments</span>
          <p className="text-2xl font-extrabold text-slate-900">{DISPATCH_ORDERS.length} Shipments</p>
          <p className="text-[11px] text-slate-400">Total 325 Packages cargo</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">In Transit GPS</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-amber-600">1 Fleet</p>
            <Badge variant="warning" className="text-[10px]">In-Transit</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">B 9821 TKN Heading to BSD</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Loading Dock Process</span>
          <p className="text-2xl font-extrabold text-indigo-600">1 Fleet</p>
          <p className="text-[11px] text-slate-400">Loading Dock 1 — JKT-01</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Verified Digital POD</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>1 Completed & Validated</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">DO-2026-000 (Photo & Signature)</p>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Statuses ({DISPATCH_ORDERS.length})
            </button>
            <button
              onClick={() => setStatusFilter("IN_TRANSIT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "IN_TRANSIT"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              In Transit
            </button>
            <button
              onClick={() => setStatusFilter("LOADING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "LOADING"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Loading Dock
            </button>
            <button
              onClick={() => setStatusFilter("DELIVERED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "DELIVERED"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Completed (POD)
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search DO number, tenant, recipient, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">DO No. & Customer</th>
                <th className="py-3 px-3">Destination & Recipient</th>
                <th className="py-3 px-3">Cargo Details</th>
                <th className="py-3 px-3">Driver & Truck</th>
                <th className="py-3 px-3">Delivery Status</th>
                <th className="py-3 px-3">Schedule / Estimate</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* DO & Tenant */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-indigo-600 block text-xs">
                      {order.doNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800 block mt-0.5">
                      {order.tenantName}
                    </span>
                  </td>

                  {/* Recipient */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block leading-tight">
                      {order.recipientName}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5 max-w-[200px] truncate">
                      {order.recipientAddress}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-800 font-medium block leading-tight">
                      {order.itemsSummary}
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      Total: {order.totalKoli} Packages
                    </span>
                  </td>

                  {/* Driver & Vehicle */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block">
                      {order.assignedDriver}
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                      {order.vehiclePlate} ({order.assignedVehicle})
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {order.status === "IN_TRANSIT" ? (
                      <Badge variant="warning" className="text-[10.5px]">
                        In Transit
                      </Badge>
                    ) : order.status === "LOADING" ? (
                      <Badge variant="default" className="text-[10.5px] bg-indigo-600">
                        Loading Dock 1
                      </Badge>
                    ) : order.status === "QUEUED" ? (
                      <Badge variant="outline" className="text-[10.5px]">
                        Assignment Queue
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10.5px]">
                        Completed (POD)
                      </Badge>
                    )}
                  </td>

                  {/* Schedule */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-700 block font-mono text-[11px]">
                      {order.scheduledTime}
                    </span>
                    {order.estimatedArrival && (
                      <span className="text-[10.5px] text-amber-700 font-semibold block">
                        Est: {order.estimatedArrival}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                    >
                      Waybill →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
