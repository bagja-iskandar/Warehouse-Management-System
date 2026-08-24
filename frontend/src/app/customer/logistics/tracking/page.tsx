"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Navigation,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Thermometer,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Boxes,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
  Package,
  Layers,
  Sparkles,
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
import { useDeliveryOrders, useDeliveryOrder } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";
import { DeliveryOrder, OrderStatus } from "@/types";
import { ShipmentStatusStepper } from "@/components/logistics/ShipmentStatusStepper";

// =============================================================================
// Helper Functions & Status Mapping
// =============================================================================

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "PENDING_ASSIGNMENT":
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Pending Assignment
        </Badge>
      );
    case "DRIVER_ASSIGNED":
      return (
        <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Driver Assigned
        </Badge>
      );
    case "EN_ROUTE_PICKUP":
      return (
        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          En Route to Pickup
        </Badge>
      );
    case "PICKED_UP":
      return (
        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Cargo Picked Up
        </Badge>
      );
    case "IN_TRANSIT":
      return (
        <Badge className="bg-amber-500 text-slate-950 font-bold border-amber-600 text-[11px] gap-1.5 py-0.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
          In Transit
        </Badge>
      );
    case "ARRIVED_DESTINATION":
      return (
        <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
          Arrived at Dock
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] gap-1.5 py-0.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          Delivered
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] gap-1.5 py-0.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
          Completed & Confirmed
        </Badge>
      );
    case "DELAYED":
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] gap-1.5 py-0.5">
          <AlertTriangle className="h-3 w-3 text-rose-600" />
          Delayed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-400 bg-slate-100 text-[11px] py-0.5">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-[11px] py-0.5">
          {String(status).replace(/_/g, " ")}
        </Badge>
      );
  }
}

// Timeline steps definition
const TIMELINE_STEPS: { key: OrderStatus; label: string; shortLabel: string; description: string }[] = [
  {
    key: "PENDING_ASSIGNMENT",
    label: "Order Created",
    shortLabel: "Created",
    description: "Delivery request queued in WMS logistics dispatch",
  },
  {
    key: "DRIVER_ASSIGNED",
    label: "Driver Assigned",
    shortLabel: "Assigned",
    description: "Driver and dedicated vehicle allocated to task",
  },
  {
    key: "EN_ROUTE_PICKUP",
    label: "En Route Origin",
    shortLabel: "En Route",
    description: "Driver heading to warehouse loading dock",
  },
  {
    key: "PICKED_UP",
    label: "Cargo Loaded",
    shortLabel: "Loaded",
    description: "Items loaded and departure verified by dock supervisor",
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit",
    shortLabel: "In Transit",
    description: "Fleet moving along delivery route with active temperature control",
  },
  {
    key: "ARRIVED_DESTINATION",
    label: "Arrived at Dock",
    shortLabel: "Arrived",
    description: "Fleet arrived at recipient facility receiving dock",
  },
  {
    key: "DELIVERED",
    label: "Delivered & POD",
    shortLabel: "Delivered",
    description: "Cargo handed over and digital POD confirmed",
  },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "PENDING_ASSIGNMENT":
      return 0;
    case "DRIVER_ASSIGNED":
      return 1;
    case "EN_ROUTE_PICKUP":
      return 2;
    case "PICKED_UP":
      return 3;
    case "IN_TRANSIT":
      return 4;
    case "ARRIVED_DESTINATION":
      return 5;
    case "DELIVERED":
    case "CONFIRMED":
      return 6;
    case "DELAYED":
      return 4; // Treated as in transit with delay
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}

export default function CustomerTrackDeliveriesPage() {
  const { user } = useAuth();
  const { data: rawOrders = [], isLoading, refetch, isRefetching } = useDeliveryOrders();

  // Multi-tenant safe: ensure client-side filter as secondary defense
  const customerOrders = useMemo(() => {
    if (!user) return [];
    return rawOrders.filter(
      (order) => !order.customerId || order.customerId === user.id
    );
  }, [rawOrders, user]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return customerOrders.filter((order) => {
      // Search
      const searchLower = searchQuery.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.goodsSummary?.toLowerCase().includes(searchLower) ||
        order.originAddress?.toLowerCase().includes(searchLower) ||
        order.originCity?.toLowerCase().includes(searchLower) ||
        order.destinationAddress?.toLowerCase().includes(searchLower) ||
        order.destinationCity?.toLowerCase().includes(searchLower) ||
        order.driverName?.toLowerCase().includes(searchLower) ||
        order.vehiclePlate?.toLowerCase().includes(searchLower);

      // Status
      let matchStatus = true;
      if (statusFilter === "ACTIVE") {
        matchStatus = [
          "PENDING_ASSIGNMENT",
          "DRIVER_ASSIGNED",
          "EN_ROUTE_PICKUP",
          "PICKED_UP",
          "IN_TRANSIT",
          "ARRIVED_DESTINATION",
          "DELAYED",
        ].includes(order.status);
      } else if (statusFilter === "IN_TRANSIT") {
        matchStatus = order.status === "IN_TRANSIT";
      } else if (statusFilter === "DELIVERED") {
        matchStatus = order.status === "DELIVERED" || order.status === "CONFIRMED";
      } else if (statusFilter === "DELAYED") {
        matchStatus = order.status === "DELAYED" || order.isDelayed === true;
      } else if (statusFilter === "CANCELLED") {
        matchStatus = order.status === "CANCELLED";
      }

      // Type
      let matchType = true;
      if (typeFilter !== "ALL") {
        matchType = order.type === typeFilter;
      }

      return matchSearch && matchStatus && matchType;
    });
  }, [customerOrders, searchQuery, statusFilter, typeFilter]);

  // Metric stats
  const metrics = useMemo(() => {
    const total = customerOrders.length;
    const active = customerOrders.filter((o) =>
      [
        "PENDING_ASSIGNMENT",
        "DRIVER_ASSIGNED",
        "EN_ROUTE_PICKUP",
        "PICKED_UP",
        "IN_TRANSIT",
        "ARRIVED_DESTINATION",
        "DELAYED",
      ].includes(o.status)
    ).length;
    const inTransit = customerOrders.filter((o) => o.status === "IN_TRANSIT").length;
    const delivered = customerOrders.filter(
      (o) => o.status === "DELIVERED" || o.status === "CONFIRMED"
    ).length;
    const reefer = customerOrders.filter((o) => o.requiresReefer).length;

    return { total, active, inTransit, delivered, reefer };
  }, [customerOrders]);

  // Selected Order for Detail Modal
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return customerOrders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || null;
  }, [customerOrders, selectedOrderId]);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Live Route Tracking"
        title="Track Deliveries & Shipments"
        subtitle="Real-time shipment status, fleet telematics, cargo manifest, and Proof of Delivery (POD)."
        badgeText="Live Fleet GPS"
        badgeColor="bg-indigo-600 text-white"
        isFetching={isRefetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/logistics/request">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl gap-1.5 shadow-sm">
                <Truck className="h-4 w-4" />
                <span>Create Delivery</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Delivery Orders"
          value={`${metrics.total} Shipments`}
          icon={Truck}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              All registered customer dispatches
            </span>
          }
        />

        <MetricCard
          label="Active Shipments"
          value={`${metrics.active} Active`}
          icon={Navigation}
          theme="amber"
          badge={
            metrics.inTransit > 0 ? (
              <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] py-0">
                {metrics.inTransit} On Road
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-amber-700 font-medium">
              In dispatch & transit pipeline
            </span>
          }
        />

        <MetricCard
          label="Completed & Delivered"
          value={`${metrics.delivered} Shipments`}
          icon={CheckCircle2}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">
              Verified POD
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-emerald-700 font-medium">
              Successfully received & signed
            </span>
          }
        />

        <MetricCard
          label="Cold Chain Reefer Fleet"
          value={`${metrics.reefer} Reefer`}
          icon={Thermometer}
          theme="sky"
          badge={
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] py-0">
              -18°C Controlled
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-sky-700 font-medium">
              Refrigerated cargo deliveries
            </span>
          }
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order # (e.g. ORD-2026), Destination, Cargo, or Driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
            >
              <option value="ALL">All Movements</option>
              <option value="DELIVERY">Outbound Delivery</option>
              <option value="PICKUP">Inbound Pickup</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {[
            { id: "ALL", label: "All Orders", count: customerOrders.length },
            { id: "ACTIVE", label: "Active", count: metrics.active },
            { id: "IN_TRANSIT", label: "In Transit", count: metrics.inTransit },
            { id: "DELIVERED", label: "Delivered", count: metrics.delivered },
            { id: "DELAYED", label: "Delayed" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Empty State */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400 space-y-3 shadow-sm">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
          <p className="font-semibold text-slate-700">Loading delivery orders from PostgreSQL database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Clean Enterprise Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-xl mx-auto my-6">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Truck className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No matching deliveries found"
                : "No delivery orders yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "Try adjusting your search criteria or status filters to locate the delivery order."
                : "Your delivery orders will appear here once you schedule a shipment or request an inbound pickup."}
            </p>
          </div>

          <div className="pt-2">
            {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }}
                className="text-xs border-slate-300 text-slate-700 h-9"
              >
                Clear Filters
              </Button>
            ) : (
              <Link href="/customer/logistics/request">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 rounded-xl gap-1.5 shadow-sm">
                  <Truck className="h-4 w-4" />
                  <span>Create Delivery</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Delivery Orders Grid */
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCold = order.requiresReefer;
            const hasDriver = !!order.driverName;
            const hasVehicle = !!order.vehiclePlate;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {order.orderNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10.5px] border-slate-200 text-slate-700 bg-slate-50 font-semibold"
                    >
                      {order.type === "DELIVERY" ? "Outbound Delivery" : "Inbound Pickup"}
                    </Badge>
                    {getStatusBadge(order.status)}
                    {isCold && (
                      <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] gap-1 py-0.5">
                        <Thermometer className="h-3 w-3 text-sky-600" />
                        Reefer (-18°C)
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </span>
                    {order.scheduledTimeSlot && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {order.scheduledTimeSlot}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cargo Summary & Vol/Weight */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Cargo Summary:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{order.goodsSummary || "WMS Cargo Package"}</p>
                  </div>

                  <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
                    <span>
                      Vol: <strong>{order.totalVolumeM3 ? Number(order.totalVolumeM3).toFixed(2) : "0.00"} m³</strong>
                    </span>
                    <span>
                      Weight: <strong>{order.totalWeightKg ? Number(order.totalWeightKg).toFixed(1) : "0.0"} kg</strong>
                    </span>
                    {order.distanceKm > 0 && (
                      <span>
                        Dist: <strong>{order.distanceKm} km</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Origin -> Destination Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 mt-0.5 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                        Origin Point
                      </span>
                      <p className="font-semibold text-slate-800 text-xs truncate mt-0.5">
                        {order.originAddress || "Origin Logistics Hub"}
                      </p>
                      <span className="text-[11px] text-slate-500 block">{order.originCity || "Jakarta"}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Destination Facility
                      </span>
                      <p className="font-semibold text-slate-800 text-xs truncate mt-0.5">
                        {order.destinationAddress || "Recipient Destination"}
                      </p>
                      <span className="text-[11px] text-slate-500 block">{order.destinationCity || "Destination City"}</span>
                    </div>
                  </div>
                </div>

                {/* Driver & Fleet Allocation Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Driver Card */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Assigned Driver</span>
                      {hasDriver ? (
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 truncate">{order.driverName}</span>
                          {order.driverPhone && (
                            <a
                              href={`tel:${order.driverPhone}`}
                              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 shrink-0 font-mono"
                            >
                              <Phone className="h-3 w-3" />
                              {order.driverPhone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not assigned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Card */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block font-medium">Dedicated Fleet</span>
                      {hasVehicle ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[11px]">
                            {order.vehiclePlate}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate">
                            {order.vehicleType?.replace(/_/g, " ") || "Box Truck"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Not allocated yet</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delay Warning Banner if any */}
                {order.isDelayed && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Delivery Schedule Delayed:</span>
                      <span className="text-[11px]">{order.delayReason || "Traffic congestion on main toll route"}</span>
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    <span>Last updated: </span>
                    <strong className="text-slate-600 font-mono">
                      {order.updatedAt ? new Date(order.updatedAt).toLocaleString("id-ID") : "-"}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {order.type === "DELIVERY" && order.status === "DELIVERED" && (
                      <Link href="/customer/receipt/confirm">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-sm"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Confirm Receipt (POD)</span>
                        </Button>
                      </Link>
                    )}
                    <Button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-sm"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>View Tracking Details</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================== */}
      {/* Tracking Detail Modal (Compact, Non-Scrolling Enterprise Design)       */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderId(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl space-y-3.5 p-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header without duplicate X button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                      {selectedOrder.orderNumber}
                    </h2>
                    <Badge
                      variant="outline"
                      className="text-[10.5px] border-slate-200 text-slate-700 bg-slate-50 font-semibold"
                    >
                      {selectedOrder.type === "DELIVERY" ? "Outbound Delivery" : "Inbound Pickup"}
                    </Badge>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scheduled:{" "}
                    {selectedOrder.scheduledDate
                      ? new Date(selectedOrder.scheduledDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}{" "}
                    {selectedOrder.scheduledTimeSlot ? `(${selectedOrder.scheduledTimeSlot})` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Progression Timeline (Shared Reusable Component with Connecting Lines) */}
            <ShipmentStatusStepper
              status={selectedOrder.status}
              type={selectedOrder.type}
              isDelayed={selectedOrder.isDelayed}
              delayReason={selectedOrder.delayReason}
            />

            {/* 2-Column Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Card: Route & Cargo Details */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Route & Cargo Summary
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] text-slate-400 font-medium block">Origin:</span>
                      <p className="font-semibold text-slate-800 text-[11.5px] truncate">
                        {selectedOrder.originAddress || "Origin Logistics Hub"}
                      </p>
                      <span className="text-[10.5px] text-slate-500 block">{selectedOrder.originCity}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9.5px] text-slate-400 font-medium block">Destination:</span>
                      <p className="font-semibold text-slate-800 text-[11.5px] truncate">
                        {selectedOrder.destinationAddress || "Recipient Facility"}
                      </p>
                      <span className="text-[10.5px] text-slate-500 block">{selectedOrder.destinationCity}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] text-slate-400 block font-medium">Cargo:</span>
                    <p className="font-bold text-slate-800 text-[11px] truncate">
                      {selectedOrder.goodsSummary || "WMS Cargo Package"}
                    </p>
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                    {selectedOrder.totalVolumeM3 ? Number(selectedOrder.totalVolumeM3).toFixed(2) : "0.00"} m³ •{" "}
                    {selectedOrder.totalWeightKg ? Number(selectedOrder.totalWeightKg).toFixed(0) : "0"} kg
                  </div>
                </div>
              </div>

              {/* Right Card: Driver & Vehicle Allocation */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Driver & Dedicated Fleet
                </span>

                {/* Driver */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="h-7 w-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] text-slate-400 font-medium block">Driver PIC</span>
                    {selectedOrder.driverName ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">{selectedOrder.driverName}</span>
                        {selectedOrder.driverPhone && (
                          <a
                            href={`tel:${selectedOrder.driverPhone}`}
                            className="text-[10.5px] text-indigo-600 hover:underline font-mono flex items-center gap-0.5 shrink-0"
                          >
                            <Phone className="h-3 w-3" />
                            {selectedOrder.driverPhone}
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 italic">Waiting for central dispatch</span>
                    )}
                  </div>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9.5px] text-slate-400 font-medium block">Dedicated Vehicle</span>
                    {selectedOrder.vehiclePlate ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-amber-950 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded text-[10.5px]">
                            {selectedOrder.vehiclePlate}
                          </span>
                          <span className="text-[10.5px] text-slate-600 truncate">
                            {selectedOrder.vehicleType?.replace(/_/g, " ")}
                          </span>
                        </div>
                        {selectedOrder.requiresReefer && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded shrink-0">
                            -18°C Reefer
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 italic">Vehicle unit not yet allocated</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Proof of Delivery (POD) Section (If Delivered) */}
            {(selectedOrder.status === "DELIVERED" || selectedOrder.status === "CONFIRMED") && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span>
                      POD Verified {selectedOrder.recipientName ? `• Received by ${selectedOrder.recipientName}` : ""}
                    </span>
                    {selectedOrder.confirmedAt && (
                      <span className="text-[10.5px] text-emerald-700 font-normal font-mono block">
                        Timestamp: {new Date(selectedOrder.confirmedAt).toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
                {selectedOrder.proofOfDeliveryUrl && (
                  <a
                    href={selectedOrder.proofOfDeliveryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-800 underline font-semibold flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>View Receipt</span>
                  </a>
                )}
              </div>
            )}

            {/* Delay Alert if any */}
            {selectedOrder.isDelayed && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Schedule Delayed:</strong> {selectedOrder.delayReason || "Traffic congestion on delivery route"}
                </span>
              </div>
            )}

            {/* Modal Footer with Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {selectedOrder.type === "DELIVERY" && selectedOrder.status === "DELIVERED" ? (
                <Link href="/customer/receipt/confirm">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg gap-1.5 shadow-sm"
                  >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>Confirm Goods Receipt (POD) →</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              <Button
                variant="outline"
                onClick={() => setSelectedOrderId(null)}
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 px-4 font-semibold rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
