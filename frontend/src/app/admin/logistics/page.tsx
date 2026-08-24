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
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useDeliveryOrders, useVehicles, useUpdateOrderStatus, useReceiveInboundOrder } from "@/hooks/use-logistics";
import { useDrivers } from "@/hooks/use-users";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useWarehouseStore } from "@/store/warehouse.store";
import { ShipmentStatusStepper } from "@/components/logistics/ShipmentStatusStepper";
import { Phone, ExternalLink, UserCheck, ShieldCheck, Sparkles, Loader2, Warehouse, ArrowUpDown, Boxes, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type LogisticsSortOption =
  | "NEWEST_CREATED"
  | "SCHEDULED_SOONEST"
  | "SCHEDULED_LATEST"
  | "OLDEST_CREATED";

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
  rawStatus: string;
  rawType: string;
  status: "QUEUED" | "LOADING" | "IN_TRANSIT" | "DELIVERED";
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  createdAt: string;
  hasDigitalPod: boolean;
  requiresReefer: boolean;
  originAddress: string;
  destinationAddress: string;
}

export default function LogisticsManagementPage() {
  const { data: warehouses = [] } = useWarehouses();
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<LogisticsSortOption>("NEWEST_CREATED");

  const querySortParam =
    sortOption === "SCHEDULED_SOONEST"
      ? { sortBy: "scheduledDate", sortOrder: "asc" as const }
      : sortOption === "SCHEDULED_LATEST"
      ? { sortBy: "scheduledDate", sortOrder: "desc" as const }
      : sortOption === "NEWEST_CREATED"
      ? { sortBy: "createdAt", sortOrder: "desc" as const }
      : { sortBy: "createdAt", sortOrder: "asc" as const };

  const { data: liveOrders = [], isLoading: isLoadingOrders } = useDeliveryOrders({
    warehouseId: selectedWarehouseFilter === "ALL" ? undefined : selectedWarehouseFilter,
    ...querySortParam,
  });
  const { data: liveVehicles = [] } = useVehicles();
  const { data: liveDrivers = [] } = useDrivers();
  const updateStatusMutation = useUpdateOrderStatus();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Dispatch Assignment Modal State
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [assignDriverId, setAssignDriverId] = useState<string>("");
  const [assignVehicleId, setAssignVehicleId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Inbound Receiving Modal State
  const receiveInboundMutation = useReceiveInboundOrder();
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [missingQty, setMissingQty] = useState<number>(0);
  const [receivingCondition, setReceivingCondition] = useState<string>("GOOD");
  const [receivingNotes, setReceivingNotes] = useState<string>("");
  const [receivingError, setReceivingError] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);

  const selectedOrder = liveOrders?.find((o) => o.id === selectedOrderId);
  const assigningOrder = liveOrders?.find((o) => o.id === assigningOrderId);
  const receivingOrder = liveOrders?.find((o) => o.id === receivingOrderId);

  // Set default driver and vehicle when opening assignment modal
  React.useEffect(() => {
    if (assigningOrder) {
      if (liveDrivers.length > 0 && !assignDriverId) {
        setAssignDriverId(liveDrivers[0].id);
      }
      if (liveVehicles.length > 0 && !assignVehicleId) {
        // Prefer reefer truck if required
        const preferredVehicle = assigningOrder.requiresReefer
          ? liveVehicles.find((v) => v.hasRefrigeration || v.type === "REEFER_TRUCK") || liveVehicles[0]
          : liveVehicles[0];
        setAssignVehicleId(preferredVehicle.id);
      }
    }
  }, [assigningOrder, liveDrivers, liveVehicles, assignDriverId, assignVehicleId]);

  const handleAssignDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !assignDriverId || !assignVehicleId) {
      toast.error("Please select both a Driver and a Vehicle for assignment.");
      return;
    }

    setIsAssigning(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: assigningOrder.id,
        status: "DRIVER_ASSIGNED",
        driverId: assignDriverId,
        vehicleId: assignVehicleId,
      });

      toast.success("Dispatch Assigned Successfully", {
        description: `Order #${assigningOrder.orderNumber} assigned to driver and queued for pickup.`,
      });
      setAssigningOrderId(null);
    } catch (err: any) {
      toast.error("Failed to assign dispatch", {
        description: err?.message || "An unexpected error occurred while assigning dispatch.",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReceiveInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;

    setReceivingError(null);

    const expectedQty =
      receivingOrder.totalPackages ||
      (receivingOrder.items && receivingOrder.items.length > 0
        ? receivingOrder.items.reduce((s, it) => s + (it.quantity || 0), 0)
        : 1);
    const totalCounted = Number(receivedQty) + Number(damagedQty) + Number(missingQty);

    if (totalCounted !== expectedQty) {
      const msg = `Total counted (${totalCounted}) must match expected manifest quantity (${expectedQty}).`;
      setReceivingError(msg);
      toast.error("Validation Error", {
        description: msg,
      });
      return;
    }

    setIsReceiving(true);
    try {
      await receiveInboundMutation.mutateAsync({
        orderId: receivingOrder.id,
        data: {
          receivedQuantity: Number(receivedQty),
          damagedQuantity: Number(damagedQty),
          missingQuantity: Number(missingQty),
          condition: receivingCondition,
          receivingNotes: receivingNotes || undefined,
        },
      });

      toast.success("Inbound Receiving Verified Successfully", {
        description: `Order #${receivingOrder.orderNumber} is now marked as RECEIVED. Goods are ready for Put-Away.`,
      });
      setReceivingError(null);
      setReceivingOrderId(null);
    } catch (err: any) {
      const msg =
        err?.message ||
        "An unexpected error occurred during receiving. Please check your inputs and try again.";
      setReceivingError(msg);
      toast.error("Receiving failed", {
        description: msg,
      });
    } finally {
      setIsReceiving(false);
    }
  };

  const activeOrders: DispatchOrder[] =
    liveOrders != null
      ? liveOrders
          .map((o) => ({
            id: o.id,
            doNumber: o.orderNumber,
            tenantName: o.customerName || "PT Fresh Foods Indonesia",
            recipientName: `${o.destinationAddress} (${o.customerName || "Recipient"})`,
            recipientAddress: o.destinationAddress,
            originAddress: o.originAddress,
            destinationAddress: o.destinationAddress,
            itemsSummary: o.goodsSummary || "WMS Cargo Commodities",
            totalKoli:
              o.totalPackages ||
              (o.items && o.items.length > 0
                ? o.items.reduce((s, it) => s + (it.quantity || 0), 0)
                : 1),
            assignedDriver: o.driverName || "Waiting for Assignment",
            assignedVehicle: o.vehicleType || "Not Allocated",
            vehiclePlate: o.vehiclePlate || "No Plate",
            rawStatus: o.status,
            rawType: o.type || "DELIVERY",
            requiresReefer: Boolean(o.requiresReefer),
            status:
              o.status === "DELIVERED" || o.status === "CONFIRMED"
                ? ("DELIVERED" as const)
                : o.status === "IN_TRANSIT" || o.status === "EN_ROUTE_PICKUP" || o.status === "DRIVER_ASSIGNED"
                ? ("IN_TRANSIT" as const)
                : o.status === "PICKED_UP"
                ? ("LOADING" as const)
                : ("QUEUED" as const),
            scheduledDate: o.scheduledDate,
            scheduledTimeSlot: o.scheduledTimeSlot,
            createdAt: o.createdAt,
            hasDigitalPod: Boolean(o.proofOfDeliveryUrl),
          }))
          .sort((a, b) => {
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
          })
      : [];

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

  const queuedCount = activeOrders.filter((o) => o.rawStatus === "PENDING_ASSIGNMENT").length;
  const inTransitCount = activeOrders.filter((o) => o.status === "IN_TRANSIT").length;
  const loadingCount = activeOrders.filter((o) => o.status === "LOADING").length;
  const deliveredCount = activeOrders.filter((o) => o.status === "DELIVERED").length;
  const totalPackagesSum = activeOrders.reduce((acc, o) => acc + o.totalKoli, 0);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Logistics Dispatch"
        title="Logistics & Dispatch Delivery Order Queue"
        subtitle="Fleet dispatch schedules, loading dock allocations, live GPS route tracking, and digital proof of delivery (Digital POD)."
        badgeText="Active Dispatch"
        badgeColor="bg-indigo-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/fleet">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
              >
                <Car className="h-3.5 w-3.5 text-indigo-600" />
                <span>Vehicle Fleet</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Total DO Assignments"
          value={`${activeOrders.length} Tasks`}
          icon={Truck}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Total {totalPackagesSum} Packages Cargo
            </span>
          }
        />

        <MetricCard
          label="In Transit GPS"
          value={`${inTransitCount} Fleet`}
          icon={Navigation}
          theme="amber"
          badge={
            <Badge variant="warning" className="text-[10px]">In-Transit</Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Live route tracking active
            </span>
          }
        />

        <MetricCard
          label="Awaiting Driver Assignment"
          value={`${queuedCount} Orders`}
          icon={Clock}
          theme="purple"
          badge={
            queuedCount > 0 ? (
              <Badge className="bg-purple-100 text-purple-800 text-[10px] font-semibold">
                Pending
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Orders queued for fleet allocation
            </span>
          }
        />

        <MetricCard
          label="Verified Digital POD"
          value={`${deliveredCount} Drops`}
          icon={FileCheck}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              100% On-Time
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Digital signature on record
            </span>
          }
        />
      </div>

      {/* 3. Main Dispatch Queue Table & Filters */}
      <SectionCard
        title="Delivery Order (DO) Dispatch Manifest"
        subtitle="Manage dispatch status, assign drivers & vehicles, and verify inbound receiving"
        icon={Truck}
      >
        <div className="space-y-4">
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
              All Statuses ({activeOrders.length})
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

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-9 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as LogisticsSortOption)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="NEWEST_CREATED">Sort: Newest DO (Baru Dibuat)</option>
                <option value="SCHEDULED_SOONEST">Sort: Scheduled Soonest (Terdekat)</option>
                <option value="SCHEDULED_LATEST">Sort: Scheduled Latest (Terjauh)</option>
                <option value="OLDEST_CREATED">Sort: Oldest DO (DO Lama)</option>
              </select>
            </div>

            {/* Warehouse Facility Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-9 text-xs">
              <Warehouse className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Facilities (Semua Gudang)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search DO number, tenant, recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
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
                <th className="py-3 px-3">Schedule & Created Date</th>
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
                    {order.rawType === "PICKUP" && order.rawStatus === "ARRIVED_DESTINATION" ? (
                      <Badge variant="warning" className="text-[10.5px] bg-amber-500 text-slate-950 font-bold animate-pulse">
                        Arrived (Receiving Required)
                      </Badge>
                    ) : order.rawType === "PICKUP" && order.rawStatus === "DELIVERED" ? (
                      <Badge variant="default" className="text-[10.5px] bg-sky-600">
                        Received (Put-Away Pending)
                      </Badge>
                    ) : order.rawType === "PICKUP" && order.rawStatus === "CONFIRMED" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Stored in Rack (Confirmed)
                      </Badge>
                    ) : order.status === "IN_TRANSIT" ? (
                      <Badge variant="warning" className="text-[10.5px]">
                        In Transit
                      </Badge>
                    ) : order.status === "LOADING" ? (
                      <Badge variant="default" className="text-[10.5px] bg-indigo-600">
                        Loading Dock 1
                      </Badge>
                    ) : order.status === "QUEUED" ? (
                      <Badge variant="outline" className="text-[10.5px] border-amber-300 text-amber-800 bg-amber-50 font-bold">
                        Pending Assignment
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10.5px]">
                        Completed (POD)
                      </Badge>
                    )}
                  </td>

                  {/* Schedule & Created Date */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-indigo-600 shrink-0" />
                        {order.scheduledDate ? (
                          <>
                            {new Date(order.scheduledDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {order.scheduledTimeSlot ? ` • ${order.scheduledTimeSlot}` : ""}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Schedule not set</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Created:{" "}
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Not recorded"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.rawStatus === "PENDING_ASSIGNMENT" && (
                        <Button
                          size="sm"
                          onClick={() => setAssigningOrderId(order.id)}
                          className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 shadow-sm rounded-lg"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Assign Driver</span>
                        </Button>
                      )}
                      {order.rawType === "PICKUP" && order.rawStatus === "ARRIVED_DESTINATION" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReceivingOrderId(order.id);
                            setReceivingError(null);
                            const ord = liveOrders?.find((o) => o.id === order.id);
                            const totalQty =
                              ord?.totalPackages ||
                              (ord?.items && ord.items.length > 0
                                ? ord.items.reduce((s, it) => s + (it.quantity || 0), 0)
                                : order.totalKoli || 1);
                            setReceivedQty(totalQty);
                            setDamagedQty(0);
                            setMissingQty(0);
                            setReceivingCondition("GOOD");
                            setReceivingNotes("");
                          }}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-sm rounded-lg"
                        >
                          <Boxes className="h-3.5 w-3.5" />
                          <span>Receive Goods</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                      >
                        Waybill →
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </SectionCard>

      {/* ===================================================================== */}
      {/* Dispatch Assignment Modal (Admin assigns Driver & Dedicated Fleet)    */}
      {/* ===================================================================== */}
      {assigningOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isAssigning) setAssigningOrderId(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Assign Driver & Fleet Dispatch
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Order #{assigningOrder.orderNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Brief */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">{assigningOrder.customerName || "Tenant"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cargo:</span>
                <span className="font-bold text-slate-800 truncate max-w-[260px]">
                  {assigningOrder.goodsSummary || "Commodities"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Destination:</span>
                <span className="font-medium text-slate-800 truncate max-w-[260px]">
                  {assigningOrder.destinationAddress}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                <span className="text-slate-500">Reefer Required:</span>
                {assigningOrder.requiresReefer ? (
                  <Badge variant="warning" className="text-[10px] bg-sky-100 text-sky-800 border-sky-200">
                    -18°C Reefer Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Standard Dry Fleet
                  </Badge>
                )}
              </div>
            </div>

            <form onSubmit={handleAssignDispatch} className="space-y-3.5">
              {/* Select Driver */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Certified Driver PIC:
                </label>
                <select
                  value={assignDriverId}
                  onChange={(e) => setAssignDriverId(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="" disabled>-- Select Driver --</option>
                  {liveDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} ({driver.phone || "No Phone"}) • {driver.driverLicenseNumber || "SIM B2"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Vehicle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Dedicated Fleet Unit:
                </label>
                <select
                  value={assignVehicleId}
                  onChange={(e) => setAssignVehicleId(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="" disabled>-- Select Vehicle --</option>
                  {liveVehicles.map((veh) => (
                    <option key={veh.id} value={veh.id}>
                      {veh.plateNumber} — {veh.name} ({veh.type.replace(/_/g, " ")}) {veh.hasRefrigeration ? "❄️ Reefer" : "📦 Box"} • {veh.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isAssigning}
                  onClick={() => setAssigningOrderId(null)}
                  className="text-xs border-slate-300 text-slate-700 h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAssigning || !assignDriverId || !assignVehicleId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Confirm Assignment & Queue</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Waybill / Tracking Detail Modal (Consistent with Customer & Driver)   */}
      {/* ===================================================================== */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderId(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl space-y-3.5 p-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
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
                    <Badge
                      variant={
                        selectedOrder.status === "DELIVERED" || selectedOrder.status === "CONFIRMED"
                          ? "success"
                          : selectedOrder.status === "IN_TRANSIT"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10.5px]"
                    >
                      {selectedOrder.status?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customer: <strong>{selectedOrder.customerName || "WMS Tenant"}</strong> • Scheduled:{" "}
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

            {/* Status Progression Timeline (Consistent Stepper) */}
            <ShipmentStatusStepper
              status={selectedOrder.status}
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

            {/* Modal Footer with Close Button */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
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

      {/* ===================================================================== */}
      {/* Inbound Receiving Modal (Admin verifies physical goods arriving)      */}
      {/* ===================================================================== */}
      {receivingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/25"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isReceiving) {
              setReceivingOrderId(null);
              setReceivingError(null);
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    Inbound Goods Receiving Verification
                  </h2>
                  <p className="text-xs text-slate-500 font-mono font-medium">
                    Order #{receivingOrder.orderNumber}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                Dock Receiving
              </Badge>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReceiveInbound} className="flex flex-col flex-1 overflow-hidden">
              {(() => {
                const exp =
                  receivingOrder.totalPackages ||
                  (receivingOrder.items && receivingOrder.items.length > 0
                    ? receivingOrder.items.reduce((s, it) => s + (it.quantity || 0), 0)
                    : 1);
                const act = Number(receivedQty) + Number(damagedQty) + Number(missingQty);
                const isValid = act === exp;

                return (
                  <>
                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                      {/* Shipment Info Card */}
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Customer / Tenant:</span>
                          <span className="font-bold text-slate-800">{receivingOrder.customerName || "Fresh Foods"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Destination Facility:</span>
                          <span className="font-semibold text-slate-800">{receivingOrder.destinationAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Driver & Vehicle:</span>
                          <span className="font-semibold text-slate-800">
                            {receivingOrder.driverName || "-"} ({receivingOrder.vehiclePlate || "No Plate"})
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5 border-t border-slate-200">
                          <span className="text-slate-700 font-bold">Expected Quantity (Manifest):</span>
                          <span className="font-bold text-indigo-700 font-mono text-sm">
                            {exp} Packages / Koli
                          </span>
                        </div>

                        {/* Manifest Item Breakdown */}
                        {receivingOrder.items && receivingOrder.items.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-200">
                            <span className="text-[11px] font-bold text-slate-600 block">
                              Manifest Cargo Breakdown ({receivingOrder.items.length} SKU):
                            </span>
                            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                              {receivingOrder.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                                >
                                  <div className="flex items-center gap-1.5 truncate mr-2">
                                    <span className="font-semibold text-slate-900 truncate">
                                      {item.name}
                                    </span>
                                    {item.barcode && (
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        ({item.barcode})
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-indigo-700 font-mono shrink-0">
                                    {item.quantity} {item.unit || "Packages"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Physical Count Verification Inputs */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                          Physical Count Verification:
                        </span>
                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                              Received (Good)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={receivedQty}
                              onChange={(e) => {
                                setReceivedQty(Math.max(0, parseInt(e.target.value) || 0));
                                setReceivingError(null);
                              }}
                              className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                              Damaged
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={damagedQty}
                              onChange={(e) => {
                                setDamagedQty(Math.max(0, parseInt(e.target.value) || 0));
                                setReceivingError(null);
                              }}
                              className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600 focus:outline-none focus:border-rose-600"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                              Missing / Short
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={missingQty}
                              onChange={(e) => {
                                setMissingQty(Math.max(0, parseInt(e.target.value) || 0));
                                setReceivingError(null);
                              }}
                              className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600 focus:outline-none focus:border-amber-600"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Realtime Count Validation Badge */}
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          isValid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isValid ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-medium">
                          {isValid
                            ? `✓ Verification Match: ${act} of ${exp} total items accounted for.`
                            : `! Count Mismatch: Total counted (${act}) does not match expected manifest (${exp}).`}
                        </span>
                      </div>

                      {/* Cargo Condition */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Overall Cargo Condition
                        </label>
                        <select
                          value={receivingCondition}
                          onChange={(e) => setReceivingCondition(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                        >
                          <option value="GOOD">GOOD — Intact seals, normal temperature & packaging</option>
                          <option value="PARTIAL">PARTIAL — Minor issues recorded but acceptable for put-away</option>
                          <option value="DAMAGED">DAMAGED — Damaged boxes/seals detected</option>
                        </select>
                      </div>

                      {/* Inspection Notes */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Receiving Dock Inspection Notes
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Contoh: Segel kargo utuh, temperatur cold storage -19.4°C terverifikasi optimal saat pembongkaran."
                          value={receivingNotes}
                          onChange={(e) => setReceivingNotes(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 resize-none"
                        />
                      </div>

                      {/* Inline Error Alert Banner */}
                      {receivingError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block">Receiving Submission Error</span>
                            <span className="text-[11px] text-rose-700">{receivingError}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Sticky Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0 rounded-b-2xl">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isReceiving}
                        onClick={() => {
                          setReceivingOrderId(null);
                          setReceivingError(null);
                        }}
                        className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isReceiving || !isValid}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        {isReceiving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Verifying & Receiving...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Confirm Receiving & Staging</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
