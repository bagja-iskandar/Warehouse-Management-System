"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Snowflake,
  XCircle,
  Ban,
  Package,
  Weight,
  Check,
  Phone,
  ExternalLink,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Loader2,
  Warehouse,
  ArrowUpDown,
  Boxes,
  AlertCircle,
  MessageSquare,
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
import { OrderMessageModal } from "@/components/logistics/OrderMessageModal";
import { InboundReceivingModal } from "@/components/logistics/InboundReceivingModal";
import { LogisticsAssignModal } from "@/components/logistics/LogisticsAssignModal";
import { LogisticsDetailModal } from "@/components/logistics/LogisticsDetailModal";

import {
  evaluateVehicleCompatibility,
  evaluateDriverEligibility,
  formatVehicleTypeName,
  OrderCargoRequirement,
} from "@/lib/fleet-compatibility";
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
  const { data: liveVehicles = [], refetch: refetchVehicles } = useVehicles();
  const { data: liveDrivers = [], refetch: refetchDrivers } = useDrivers();
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
  const [receivingError, setReceivingError] = useState<string | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);

  // Customer Communication Modal State
  const [messagingOrderId, setMessagingOrderId] = useState<string | null>(null);

  const selectedOrder = liveOrders?.find((o) => o.id === selectedOrderId);
  const assigningOrder = liveOrders?.find((o) => o.id === assigningOrderId);
  const receivingOrder = liveOrders?.find((o) => o.id === receivingOrderId);
  const messagingOrder = liveOrders?.find((o) => o.id === messagingOrderId);

  // Count available reefer vehicles in fleet
  const availableReeferCount = useMemo(() => {
    return liveVehicles.filter(
      (v) =>
        (v.hasRefrigeration || v.type === "REEFER_TRUCK") &&
        v.status === "AVAILABLE" &&
        (!v.activeOrdersCount || v.activeOrdersCount === 0)
    ).length;
  }, [liveVehicles]);

  // Re-fetch fresh vehicle & driver availability when assignment modal opens
  useEffect(() => {
    if (assigningOrderId || messagingOrderId) {
      refetchVehicles();
      refetchDrivers();
    }
  }, [assigningOrderId, messagingOrderId, refetchVehicles, refetchDrivers]);

  // Derive Cargo Requirements from assigningOrder
  const orderCargoReq: OrderCargoRequirement = useMemo(() => {
    if (!assigningOrder) {
      return {
        requiresReefer: false,
        totalVolumeM3: 0,
        totalWeightKg: 0,
      };
    }
    return {
      requiresReefer: assigningOrder.requiresReefer,
      totalVolumeM3: Number(assigningOrder.totalVolumeM3 || 0),
      totalWeightKg: Number(assigningOrder.totalWeightKg || 0),
      requiredTempCelsius: assigningOrder.requiresReefer ? -18 : null,
    };
  }, [assigningOrder]);

  // Evaluate & sort compatibility for all fleet units (Recommended & Available at TOP)
  const vehicleOptions = useMemo(() => {
    const list = liveVehicles.map((v) => ({
      vehicle: v,
      eval: evaluateVehicleCompatibility(v, orderCargoReq),
    }));

    return list.sort((a, b) => {
      // 1. Selectable (Available & Compatible) always at top
      if (a.eval.isSelectable && !b.eval.isSelectable) return -1;
      if (!a.eval.isSelectable && b.eval.isSelectable) return 1;

      // 2. If both selectable and order requires reefer, lower min temp first
      if (a.eval.isSelectable && b.eval.isSelectable) {
        if (orderCargoReq.requiresReefer) {
          const tempA = a.vehicle.minTempCelsius != null ? Number(a.vehicle.minTempCelsius) : -18;
          const tempB = b.vehicle.minTempCelsius != null ? Number(b.vehicle.minTempCelsius) : -18;
          if (tempA !== tempB) return tempA - tempB;
        }
        return Number(a.vehicle.maxWeightKg) - Number(b.vehicle.maxWeightKg);
      }

      // 3. For non-selectable, put in-service before completely incompatible
      if (a.eval.isCompatible && !b.eval.isCompatible) return -1;
      if (!a.eval.isCompatible && b.eval.isCompatible) return 1;

      return a.vehicle.plateNumber.localeCompare(b.vehicle.plateNumber);
    });
  }, [liveVehicles, orderCargoReq]);

  // Evaluate & sort eligibility for all drivers (Available drivers at TOP)
  const driverOptions = useMemo(() => {
    const list = liveDrivers.map((d) => ({
      driver: d,
      eval: evaluateDriverEligibility(d),
    }));

    return list.sort((a, b) => {
      // 1. Selectable (Ready & Available) always at top
      if (a.eval.isSelectable && !b.eval.isSelectable) return -1;
      if (!a.eval.isSelectable && b.eval.isSelectable) return 1;

      return a.driver.name.localeCompare(b.driver.name);
    });
  }, [liveDrivers]);

  const selectableVehicles = useMemo(
    () => vehicleOptions.filter((opt) => opt.eval.isSelectable),
    [vehicleOptions]
  );

  const selectableDrivers = useMemo(
    () => driverOptions.filter((opt) => opt.eval.isSelectable),
    [driverOptions]
  );

  // Auto-select first compatible vehicle and driver upon modal opening
  useEffect(() => {
    if (assigningOrder) {
      const validVeh = selectableVehicles.find((o) => o.vehicle.id === assignVehicleId);
      if (!validVeh) {
        setAssignVehicleId(selectableVehicles.length > 0 ? selectableVehicles[0].vehicle.id : "");
      }

      const validDriver = selectableDrivers.find((o) => o.driver.id === assignDriverId);
      if (!validDriver) {
        setAssignDriverId(selectableDrivers.length > 0 ? selectableDrivers[0].driver.id : "");
      }
    }
  }, [assigningOrder, selectableVehicles, selectableDrivers, assignVehicleId, assignDriverId]);


  const handleAssignDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !assignDriverId || !assignVehicleId) {
      toast.error("Please select both a Driver and a Vehicle for assignment.");
      return;
    }

    const selectedVehOpt = vehicleOptions.find((o) => o.vehicle.id === assignVehicleId);
    if (selectedVehOpt && !selectedVehOpt.eval.isSelectable) {
      toast.error("Vehicle Not Eligible", {
        description: selectedVehOpt.eval.reason || "The selected vehicle cannot be assigned.",
      });
      return;
    }

    const selectedDrvOpt = driverOptions.find((o) => o.driver.id === assignDriverId);
    if (selectedDrvOpt && !selectedDrvOpt.eval.isSelectable) {
      toast.error("Driver Not Eligible", {
        description: selectedDrvOpt.eval.reason || "The selected driver cannot be assigned.",
      });
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
                    {order.requiresReefer && availableReeferCount === 0 && order.rawStatus === "PENDING_ASSIGNMENT" && (
                      <div className="mt-1">
                        <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-semibold gap-1 py-0.5 px-1.5 inline-flex items-center">
                          <AlertTriangle className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          <span>Reefer Vehicle Unavailable</span>
                        </Badge>
                      </div>
                    )}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessagingOrderId(order.id)}
                        className="h-8 px-2 text-xs border-slate-300 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-700 font-semibold flex items-center gap-1 shadow-2xs rounded-lg transition-colors"
                        title="Send real-time status update message to customer"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Message</span>
                      </Button>
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

      <LogisticsAssignModal
        assigningOrder={assigningOrder || null}
        vehicleOptions={vehicleOptions}
        driverOptions={driverOptions}
        selectableVehicles={selectableVehicles}
        selectableDrivers={selectableDrivers}
        liveVehicles={liveVehicles}
        liveDrivers={liveDrivers}
        assignDriverId={assignDriverId}
        setAssignDriverId={setAssignDriverId}
        assignVehicleId={assignVehicleId}
        setAssignVehicleId={setAssignVehicleId}
        isAssigning={isAssigning}
        onClose={() => setAssigningOrderId(null)}
        onSubmit={handleAssignDispatch}
      />

      <LogisticsDetailModal
        selectedOrder={selectedOrder || null}
        onClose={() => setSelectedOrderId(null)}
      />

      {/* ===================================================================== */}
      {/* Inbound Receiving Modal */}
      {receivingOrder && (
        <InboundReceivingModal
          order={receivingOrder}
          isSubmitting={isReceiving}
          error={receivingError}
          onClose={() => {
            setReceivingOrderId(null);
            setReceivingError(null);
          }}
          onSubmit={async (data) => {
            setIsReceiving(true);
            try {
              await receiveInboundMutation.mutateAsync({
                orderId: receivingOrder.id,
                data: {
                  receivedQuantity: data.receivedQty,
                  damagedQuantity: data.damagedQty,
                  missingQuantity: data.missingQty,
                  condition: data.condition,
                  receivingNotes: data.notes || undefined,
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
          }}
        />
      )}

      {/* Customer Communication / Order Message Composer Modal */}
      {messagingOrder && (
        <OrderMessageModal
          order={messagingOrder}
          isReeferUnavailable={availableReeferCount === 0}
          onClose={() => setMessagingOrderId(null)}
        />
      )}
    </PageContainer>
  );
}
