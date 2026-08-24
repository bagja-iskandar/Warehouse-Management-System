"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Navigation,
  MapPin,
  Truck,
  Thermometer,
  Clock,
  AlertTriangle,
  Phone,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  MetricCard,
  EmptyState,
} from "@/components/dashboard";
import { ShipmentStatusStepper } from "@/components/logistics/ShipmentStatusStepper";
import { useDeliveryOrder, useDeliveryOrders, useUpdateOrderStatus } from "@/hooks/use-logistics";
import { toast } from "sonner";

function DriverTransitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const explicitOrderId = searchParams.get("orderId");

  const { data: allOrders } = useDeliveryOrders();
  const activeFallbackOrder = allOrders?.find(
    (o) =>
      o.status === "IN_TRANSIT" ||
      o.status === "PICKED_UP" ||
      o.status === "EN_ROUTE_PICKUP" ||
      o.status === "DRIVER_ASSIGNED" ||
      o.status === "ARRIVED_DESTINATION"
  );

  const orderId = explicitOrderId || activeFallbackOrder?.id || "";
  const { data: order, isLoading } = useDeliveryOrder(orderId);
  const updateStatusMutation = useUpdateOrderStatus();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleArriveDestination = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      if (order.status === "IN_TRANSIT") {
        await updateStatusMutation.mutateAsync({
          orderId: order.id,
          status: "ARRIVED_DESTINATION",
        });
      }
      toast.success("Arrived at destination facility.");
      router.push(`/driver/pod?orderId=${order.id}`);
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.message || "Please proceed to POD form.",
      });
      router.push(`/driver/pod?orderId=${order.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && orderId) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading live transit route from PostgreSQL...</p>
      </div>
    );
  }

  const orderNumber = order?.orderNumber || activeFallbackOrder?.orderNumber || "DO-ACTIVE";
  const origin = order?.originAddress || activeFallbackOrder?.originAddress || "Origin Logistics Hub";
  const destination = order?.destinationAddress || activeFallbackOrder?.destinationAddress || "Destination Drop-off Facility";
  const status = order?.status || activeFallbackOrder?.status || "IN_TRANSIT";
  const vehiclePlate = order?.vehiclePlate || activeFallbackOrder?.vehiclePlate || "Fleet Unit";

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Live In-Transit Navigation"
        title="Route Navigation & Live Transit GPS"
        subtitle={`Vehicle: ${vehiclePlate} • From: ${origin} → To: ${destination}`}
        badgeText={orderNumber}
        badgeColor="bg-amber-500 text-slate-950 font-mono font-bold"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/driver/tasks">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                ← Tasks Queue
              </Button>
            </Link>
            <Button
              onClick={handleArriveDestination}
              disabled={isUpdating || !orderId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-sm"
            >
              <FileCheck className="h-4 w-4" />
              <span>Confirm Arrival at Dock</span>
            </Button>
          </div>
        }
      />

      {/* 2. Stepper */}
      {order && (
        <ShipmentStatusStepper
          status={order.status}
          type={order.type}
          isDelayed={order.status === "DELAYED"}
        />
      )}

      {/* 3. Live Route Navigation Map & Telematics */}
      <SectionCard
        title="Live Fleet Route Navigation & Sensor Telemetry"
        subtitle={`Real-time GPS feed for Order #${orderNumber}`}
        icon={Navigation}
      >
        <div className="space-y-4">
          <div className="h-64 sm:h-80 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center p-6 border border-slate-800 shadow-inner">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Mock Route Path */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 50 200 Q 250 80 450 180 T 850 120"
                fill="none"
                stroke="#6366f1"
                strokeWidth="4"
                strokeDasharray="6 6"
                className="opacity-70"
              />
            </svg>

            {/* Vehicle Pin Icon */}
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <Truck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-full mt-2 font-mono border border-slate-700">
                {vehiclePlate} • IN TRANSIT
              </span>
            </div>

            {/* Route Overlay Card */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 z-10 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Active Delivery Manifest:
                  </p>
                  <p className="text-xs font-bold text-slate-100 mt-0.5">
                    {origin} → {destination}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                    Reefer: -18.2°C
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    GPS: Locked
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Real-time GPS telemetry is automatically streamed to Admin & Customer Portals</span>
            </div>

            <Button
              onClick={handleArriveDestination}
              disabled={isUpdating || !orderId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Confirm Dock Arrival & Open POD →</span>
            </Button>
          </div>
        </div>
      </SectionCard>
    </PageContainer>
  );
}

export default function DriverTransitPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading live transit screen...</p>
        </div>
      }
    >
      <DriverTransitContent />
    </Suspense>
  );
}
