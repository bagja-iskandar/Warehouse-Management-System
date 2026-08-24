"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  User,
  Loader2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { ShipmentStatusStepper } from "@/components/logistics/ShipmentStatusStepper";
import { useDeliveryOrder, useUpdateOrderStatus } from "@/hooks/use-logistics";
import { toast } from "sonner";

export default function DriverTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const { data: order, isLoading } = useDeliveryOrder(taskId);
  const updateStatusMutation = useUpdateOrderStatus();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: any, successMsg: string, redirectUrl?: string) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: order.id,
        status: newStatus,
      });
      toast.success(successMsg);
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      toast.error("Failed to update shipment status", {
        description: err?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          Loading delivery assignment manifest from PostgreSQL...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-sm font-bold text-slate-900">Task Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">
            The requested delivery order #{taskId} was not found or is not assigned to your driver account.
          </p>
        </div>
        <Link href="/driver/tasks">
          <Button variant="outline" size="sm" className="text-xs">
            Back to Tasks Queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb={`Driver Workstation > Task #${order.orderNumber}`}
        title="Delivery Instruction & Task Manifest"
        subtitle={`Customer: ${order.customerName || "Tenant Customer"} • Scheduled: ${
          order.scheduledDate
            ? new Date(order.scheduledDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Schedule not set"
        }${order.scheduledTimeSlot ? ` • ${order.scheduledTimeSlot}` : ""}`}
        badgeText={order.status.replace(/_/g, " ")}
        badgeColor={
          order.status === "DELIVERED" || order.status === "CONFIRMED"
            ? "bg-emerald-600 text-white"
            : order.status === "IN_TRANSIT"
            ? "bg-amber-500 text-slate-950 font-bold"
            : "bg-indigo-600 text-white"
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/driver/tasks">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                ← Back to Tasks
              </Button>
            </Link>
            {order.status === "IN_TRANSIT" && (
              <Link href={`/driver/transit?orderId=${order.id}`}>
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 gap-1.5 shadow-sm">
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Navigate Route</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Shipment Status Progression (Consistent Stepper Design) */}
      <ShipmentStatusStepper
        status={order.status}
        isDelayed={order.isDelayed}
        delayReason={order.delayReason}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Recipient & Route Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Route & Recipient Information
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Origin Loading Facility</span>
                  <p className="font-bold text-slate-900 text-sm">{order.originAddress}</p>
                  <span className="text-slate-500 text-[11px]">{order.originCity}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Drop-off Destination</span>
                  <p className="font-bold text-slate-900 text-sm">{order.destinationAddress}</p>
                  <span className="text-slate-500 text-[11px]">{order.destinationCity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-bold text-slate-800">{order.customerName || "Recipient PIC"}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{order.customerPhone || "-"}</p>
                  </div>
                </div>

                {order.customerPhone && (
                  <a href={`tel:${order.customerPhone}`}>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call PIC</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Manifest Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Loaded Cargo Manifest {order.requiresReefer && "(Reefer Cold Storage)"}
              </h2>
              <span className="text-xs font-mono text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {order.totalVolumeM3 ? Number(order.totalVolumeM3).toFixed(2) : "0.00"} m³ • {order.totalWeightKg ? Number(order.totalWeightKg).toFixed(0) : "0"} kg
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {item.barcode || "SKU"} • {item.requiresColdStorage ? "❄️ Sub-Zero Cold Storage" : "Standard Dry"}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-indigo-600 text-sm">
                      {item.quantity} {item.unit || "Packages"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{order.goodsSummary || "WMS Cargo Package"}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {order.requiresReefer ? "❄️ Cold Storage Reefer Cargo" : "Standard Freight Cargo"}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {order.totalVolumeM3 ? Math.round(Number(order.totalVolumeM3) * 20) : 10} Packages
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Driver Action Center (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Delivery Action Lifecycle
            </h2>

            {/* Allocated Fleet Info */}
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Truck className="h-4 w-4 text-amber-700" />
                <span>Dedicated Vehicle:</span>
              </div>
              <p className="font-mono font-bold text-amber-950 text-[11px]">
                {order.vehiclePlate || "Fleet Unit Allocated"} ({order.vehicleType?.replace(/_/g, " ") || "Reefer Truck"})
              </p>
              {order.requiresReefer && (
                <span className="text-[10px] text-sky-800 font-semibold block">
                  ❄️ -18.0°C Reefer System Active
                </span>
              )}
            </div>

            {/* Dynamic Status Action Button depending on current OrderStatus */}
            <div className="space-y-2.5 pt-2">
              {order.status === "DRIVER_ASSIGNED" && (
                <Button
                  onClick={() =>
                    handleStatusUpdate(
                      "EN_ROUTE_PICKUP",
                      "Status updated: En Route to Origin Loading Dock."
                    )
                  }
                  disabled={isUpdating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span>Start Route to Origin Dock →</span>
                </Button>
              )}

              {order.status === "EN_ROUTE_PICKUP" && (
                <Button
                  onClick={() =>
                    handleStatusUpdate(
                      "PICKED_UP",
                      "Status updated: Cargo loaded onto vehicle dock."
                    )
                  }
                  disabled={isUpdating}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Boxes className="h-4 w-4" />}
                  <span>Confirm Cargo Loaded (Dock) →</span>
                </Button>
              )}

              {order.status === "PICKED_UP" && (
                <Button
                  onClick={() =>
                    handleStatusUpdate(
                      "IN_TRANSIT",
                      "Status updated: Departed loading dock. In Transit.",
                      `/driver/transit?orderId=${order.id}`
                    )
                  }
                  disabled={isUpdating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  <span>Depart & Start Live Transit (GPS) →</span>
                </Button>
              )}

              {order.status === "IN_TRANSIT" && (
                <>
                  <Link href={`/driver/transit?orderId=${order.id}`} className="block">
                    <Button
                      variant="outline"
                      className="w-full text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>View Live Route Navigation Map</span>
                    </Button>
                  </Link>

                  <Button
                    onClick={() =>
                      handleStatusUpdate(
                        "ARRIVED_DESTINATION",
                        order.type === "PICKUP"
                          ? "Status updated: Arrived at destination warehouse loading dock."
                          : "Status updated: Arrived at destination drop-off facility."
                      )
                    }
                    disabled={isUpdating}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    <span>
                      {order.type === "PICKUP"
                        ? "Arrived at Warehouse Loading Dock →"
                        : "Arrived at Destination Dock →"}
                    </span>
                  </Button>
                </>
              )}

              {order.status === "ARRIVED_DESTINATION" && (
                order.type === "PICKUP" ? (
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-center space-y-1.5">
                    <div className="flex items-center justify-center gap-1.5 text-teal-800 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-teal-600" />
                      <span>Arrived at Warehouse Loading Dock</span>
                    </div>
                    <p className="text-[11px] text-teal-700 leading-relaxed">
                      Kargo telah tiba di loading dock gudang. Menunggu proses receiving dan verifikasi fisik oleh Admin Gudang.
                    </p>
                  </div>
                ) : (
                  <Link href={`/driver/pod?orderId=${order.id}`} className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 animate-pulse">
                      <FileCheck className="h-4 w-4" />
                      <span>Upload Digital POD & Signature →</span>
                    </Button>
                  </Link>
                )
              )}

              {(order.status === "DELIVERED" || order.status === "CONFIRMED") && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      {order.type === "PICKUP"
                        ? "Inbound Shipment Received & Verified"
                        : "Delivery Completed & Verified"}
                    </span>
                  </div>
                  {order.type === "PICKUP" ? (
                    <p className="text-[11px] text-emerald-700">
                      Barang telah diterima dan diverifikasi oleh Admin Gudang.
                    </p>
                  ) : order.proofOfDeliveryUrl ? (
                    <a
                      href={order.proofOfDeliveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 underline font-semibold block"
                    >
                      View Digital POD Receipt ↗
                    </a>
                  ) : (
                    <p className="text-[11px] text-emerald-700">
                      Penerimaan telah selesai.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
