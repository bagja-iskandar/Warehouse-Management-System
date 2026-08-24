"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Loader2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useDeliveryOrders, useDeliveryOrder, useUpdateOrderStatus } from "@/hooks/use-logistics";
import { toast } from "sonner";

function DriverPickupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const explicitOrderId = searchParams.get("orderId");

  const { data: allOrders } = useDeliveryOrders();
  const activeFallbackOrder = allOrders?.find(
    (o) => o.status === "DRIVER_ASSIGNED" || o.status === "EN_ROUTE_PICKUP" || o.status === "PICKED_UP"
  );

  const orderId = explicitOrderId || activeFallbackOrder?.id || "";
  const { data: order, isLoading } = useDeliveryOrder(orderId);
  const updateStatusMutation = useUpdateOrderStatus();

  const [dockVerified, setDockVerified] = useState(true);
  const [sealVerified, setSealVerified] = useState(true);
  const [tempVerified, setTempVerified] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeparted, setIsDeparted] = useState(false);

  const handleDepart = async () => {
    if (!orderId) {
      toast.error("No active delivery order selected.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: "IN_TRANSIT",
      });
      setIsDeparted(true);
      toast.success("Departure Confirmed", {
        description: `Order #${order?.orderNumber || "DO"} is now IN_TRANSIT. Live GPS tracking active.`,
      });
    } catch (err: any) {
      toast.error("Failed to confirm departure", {
        description: err?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const orderNumber = order?.orderNumber || activeFallbackOrder?.orderNumber || "DO-ACTIVE";
  const origin = order?.originAddress || activeFallbackOrder?.originAddress || "Logistics Loading Dock";
  const destination = order?.destinationAddress || activeFallbackOrder?.destinationAddress || "Destination Facility";
  const goodsSummary = order?.goodsSummary || activeFallbackOrder?.goodsSummary || "WMS Cargo Commodities";

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Inbound/Dock Pickup"
        title="Cargo Loading & Departure Confirmation"
        subtitle={`Origin: ${origin} → Destination: ${destination}`}
        badgeText={orderNumber}
        badgeColor="bg-indigo-600 text-white font-mono"
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
          </div>
        }
      />

      {isDeparted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Cargo Departed! Vehicle In Transit
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Order #{orderNumber} has been transitioned to <strong className="text-slate-800">IN_TRANSIT</strong>. Live telemetry and real-time transit status are broadcasting to Customer & Dispatcher portals.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href={`/driver/transit?orderId=${orderId}`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-5 gap-1.5 shadow-sm">
                <Navigation className="h-4 w-4" />
                <span>Open Route Navigation →</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <SectionCard
              title="Cargo Manifest & Loading Summary"
              subtitle="Verify all cargo items and temperature specifications before departure"
              icon={Boxes}
            >
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase block">Assigned Goods:</span>
                  <p className="font-bold text-slate-900 text-sm leading-snug">{goodsSummary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Origin Loading Bay:</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{origin}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Destination Facility:</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{destination}</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <SectionCard
              title="Mandatory Departure Checklist"
              subtitle="All safety items must be verified before releasing vehicle from gate"
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={dockVerified}
                      onChange={(e) => setDockVerified(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Physical Cargo Count & Packaging Verified
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Packages match the DO manifest count with zero outer damage.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={sealVerified}
                      onChange={(e) => setSealVerified(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Container Security Seal Locked
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        High-security bolt seal attached and number logged with warehouse supervisor.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={tempVerified}
                      onChange={(e) => setTempVerified(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Reefer Compressor Pre-cooled & Temperature Locked
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Cold chain sensor verified at sub-zero before gate exit.
                      </span>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={handleDepart}
                  disabled={!dockVerified || !sealVerified || !tempVerified || isSubmitting || !orderId}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>Confirm Cargo Loaded & Depart (In Transit)</span>
                </Button>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function DriverPickupPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading pickup screen...</p>
        </div>
      }
    >
      <DriverPickupContent />
    </Suspense>
  );
}
