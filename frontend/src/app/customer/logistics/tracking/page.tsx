"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  MessageSquare,
  History,
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
import { useDeliveryOrders, useDeliveryOrder, useMarkOrderMessageAsRead } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";
import { DeliveryOrder, OrderStatus } from "@/types";
import { ShipmentStatusStepper } from "@/components/logistics/ShipmentStatusStepper";
import { OrderStatusBadge } from "@/components/common/StatusBadge";


// =============================================================================
// Helper Functions & Status Mapping
// =============================================================================

const getStatusBadge = (status: OrderStatus) => (
  <OrderStatusBadge status={status} />
);


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

function TrackDeliveriesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId") || searchParams.get("order");
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

  // Automatically filter or focus to order when navigated via query param (e.g. from Notification Center)
  useEffect(() => {
    if (queryOrderId && customerOrders.length > 0) {
      const match = customerOrders.find(
        (o) => o.id === queryOrderId || o.orderNumber?.toLowerCase() === queryOrderId.toLowerCase()
      );
      if (match) {
        setSearchQuery(match.orderNumber);
        const el = document.getElementById(`order-${match.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [queryOrderId, customerOrders]);

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

  // Auto-mark unread messages as read when order cards are viewed
  const markMessageReadMutation = useMarkOrderMessageAsRead();
  const readMessageIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    customerOrders.forEach((order) => {
      if (order.messages && order.messages.length > 0) {
        const unread = order.messages.filter(
          (m) => !m.isRead && !readMessageIdsRef.current.has(m.id)
        );
        unread.forEach((m) => {
          readMessageIdsRef.current.add(m.id);
          markMessageReadMutation.mutate({
            orderId: order.id,
            messageId: m.id,
          });
        });
      }
    });
  }, [customerOrders, markMessageReadMutation]);


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
        /* Full-Content Delivery Orders List (Direct in-card progression & details, no popup modal needed!) */
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isCold = order.requiresReefer;
            const hasDriver = !!order.driverName;
            const hasVehicle = !!order.vehiclePlate;

            return (
              <div
                key={order.id}
                id={`order-${order.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* 1. Card Header */}
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
                      {order.scheduledDate
                        ? new Date(order.scheduledDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                    {order.scheduledTimeSlot && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {order.scheduledTimeSlot}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Live Shipment Progression Stepper (Direct in-card!) */}
                <div className="pt-0.5">
                  <ShipmentStatusStepper
                    status={order.status}
                    type={order.type}
                    isDelayed={order.isDelayed}
                    delayReason={order.delayReason}
                  />
                </div>

                {/* 3. Dual-Column Summary Grid: Route & Cargo (Left) + Driver & Fleet (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-1">
                  {/* Left Box: Route & Cargo Summary */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5 text-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Route & Cargo Summary
                      </span>

                      <div className="space-y-2">
                        {/* Origin */}
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 font-medium block">Origin:</span>
                            <p className="font-semibold text-slate-800 text-xs truncate">
                              {order.originAddress || "Origin Logistics Hub"}
                            </p>
                            <span className="text-[11px] text-slate-500 block">{order.originCity || "Jakarta"}</span>
                          </div>
                        </div>

                        {/* Destination */}
                        <div className="flex items-start gap-2">
                          <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-slate-400 font-medium block">Destination:</span>
                            <p className="font-semibold text-slate-800 text-xs truncate">
                              {order.destinationAddress || "Recipient Destination"}
                            </p>
                            <span className="text-[11px] text-slate-500 block">{order.destinationCity || "Destination City"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cargo Volume & Weight */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-medium">Cargo:</span>
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {order.goodsSummary || "WMS Cargo Package"}
                        </p>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                        {order.totalVolumeM3 ? Number(order.totalVolumeM3).toFixed(2) : "0.00"} m³ ·{" "}
                        {order.totalWeightKg ? Number(order.totalWeightKg).toFixed(1) : "0.0"} kg
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Assigned Driver & Dedicated Fleet */}
                  <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5 text-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Assigned Driver & Dedicated Fleet
                      </span>

                      <div className="space-y-2">
                        {/* Driver Card */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block font-medium">Driver PIC</span>
                              {hasDriver ? (
                                <span className="font-bold text-slate-900 text-xs truncate block">{order.driverName}</span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Pending driver assignment</span>
                              )}
                            </div>
                          </div>

                          {hasDriver && order.driverPhone && (
                            <a
                              href={`tel:${order.driverPhone}`}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 font-mono bg-indigo-50/60 px-2 py-1 rounded-md border border-indigo-100 font-semibold"
                            >
                              <Phone className="h-3 w-3" />
                              <span>{order.driverPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Dedicated Vehicle Card */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                              <Truck className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block font-medium">Dedicated Vehicle</span>
                              {hasVehicle ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-slate-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded text-[11px]">
                                    {order.vehiclePlate}
                                  </span>
                                  <span className="text-[11px] text-slate-600 font-medium truncate">
                                    {order.vehicleType?.replace(/_/g, " ") || "Box Truck"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Pending fleet allocation</span>
                              )}
                            </div>
                          </div>

                          {hasVehicle && isCold && (
                            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[9.5px] py-0 px-1.5 font-semibold shrink-0">
                              -18°C Reefer
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fleet Telematics Status */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Fleet Telematics:</span>
                      <span className="font-semibold text-slate-700">
                        {hasVehicle ? "Active GPS Tracking" : "Awaiting Dispatch"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Admin Follow-up (Inline on Order Card) */}
                {order.latestMessage && (
                  <div
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      !order.latestMessage.isRead
                        ? "bg-amber-50/75 border-amber-200/90 text-amber-950 shadow-2xs"
                        : "bg-slate-50/90 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <MessageSquare
                          className={`h-3.5 w-3.5 ${
                            !order.latestMessage.isRead ? "text-amber-600" : "text-slate-500"
                          }`}
                        />
                        <span className="font-bold text-[11.5px] text-slate-900">
                          Admin Follow-up
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9.5px] py-0 px-1.5 font-semibold ${
                            !order.latestMessage.isRead
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {order.latestMessage.title || order.latestMessage.messageType.replace(/_/g, " ")}
                        </Badge>
                        {!order.latestMessage.isRead && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            New update
                          </span>
                        )}
                      </div>

                      <span className="text-[10.5px] text-slate-400 font-mono">
                        {order.latestMessage.senderName ? `${order.latestMessage.senderName} • ` : "Admin • "}
                        {new Date(order.latestMessage.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </span>
                    </div>

                    <p
                      className={`text-[11.5px] leading-relaxed font-sans ${
                        !order.latestMessage.isRead ? "text-amber-900" : "text-slate-700"
                      }`}
                    >
                      {'“'}{order.latestMessage.content}{'"'}
                    </p>
                  </div>
                )}

                {/* Delay Warning Banner if any */}
                {order.isDelayed && !order.latestMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Delivery Schedule Delayed:</span>
                      <span className="text-[11px]">{order.delayReason || "Traffic congestion on main toll route"}</span>
                    </div>
                  </div>
                )}

                {/* 5. Proof of Delivery (POD) Verified Banner */}
                {(order.status === "DELIVERED" || order.status === "CONFIRMED") && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span>
                          POD Verified {order.recipientName ? `• Received by ${order.recipientName}` : ""}
                        </span>
                        {order.confirmedAt && (
                          <span className="text-[10.5px] text-emerald-700 font-normal font-mono block">
                            Timestamp: {new Date(order.confirmedAt).toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>
                    {order.proofOfDeliveryUrl && (
                      <a
                        href={order.proofOfDeliveryUrl}
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

                {/* 6. Card Footer (Last Updated & Action Button if Outbound Delivered) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400">
                    <span>Last updated: </span>
                    <strong className="text-slate-600 font-mono">
                      {order.updatedAt ? new Date(order.updatedAt).toLocaleString("id-ID") : "-"}
                    </strong>
                  </div>

                  {order.type === "DELIVERY" && order.status === "DELIVERED" && (
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <Link href="/customer/receipt/confirm">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-sm"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Confirm Receipt (POD)</span>
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

export default function CustomerTrackDeliveriesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <span>Loading delivery tracking...</span>
        </div>
      }
    >
      <TrackDeliveriesContent />
    </Suspense>
  );
}
