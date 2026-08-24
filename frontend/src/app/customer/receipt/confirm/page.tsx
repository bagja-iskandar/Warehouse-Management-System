"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Truck,
  Car,
  Star,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/dashboard";
import { useDeliveryOrders, useUpdateOrderStatus } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function DeliveryReceiptConfirmationPage() {
  const { user } = useAuth();
  const { data: orders = [] } = useDeliveryOrders(user?.id);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [recipientNote, setRecipientNote] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const updateStatusMutation = useUpdateOrderStatus();

  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const activeOrder =
    (selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null) ||
    deliveredOrders[0] ||
    orders.find((o) => o.status === "ARRIVED_DESTINATION" || o.status === "IN_TRANSIT") ||
    orders[0];

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      await updateStatusMutation.mutateAsync({
        orderId: activeOrder.id,
        status: "CONFIRMED",
        note: recipientNote || `Rating ${rating}.0/5.0 stars. Goods condition validated.`,
      });
      setIsConfirmed(true);
      toast.success("Delivery receipt confirmed successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to confirm delivery receipt");
    }
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Receipt Verification"
        title="Goods Receipt Confirmation (Delivery Confirmation)"
        subtitle="Confirm delivery handover, verify physical goods condition, and provide driver service rating."
        badgeText="Digital Proof of Delivery"
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/logistics/track">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                Track Shipments
              </Button>
            </Link>
          </div>
        }
      />

      {!activeOrder ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
          <Truck className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5]" />
          <div>
            <h2 className="text-sm font-bold text-slate-700">No Orders to Confirm</h2>
            <p className="text-xs text-slate-400 mt-1">
              You do not have any pending or completed delivery shipments awaiting digital receipt confirmation.
            </p>
          </div>
          <Link href="/customer/logistics/request" className="inline-block pt-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
              Request Delivery Shipment →
            </Button>
          </Link>
        </div>
      ) : isConfirmed ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Goods Receipt Confirmed Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Thank you for validating shipment <span className="font-mono font-bold text-indigo-600">{activeOrder.orderNumber}</span>. Digital POD has been recorded.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Back to Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Shipment Details ({activeOrder.orderNumber})
                  </h2>
                </div>
                <Badge variant="warning" className="text-[10px]">
                  {activeOrder.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Driver & Fleet</span>
                  <p className="font-bold text-slate-900">{activeOrder.driverName || "Assigned Driver"}</p>
                  <p className="text-slate-500 font-mono">{activeOrder.vehiclePlate || "Fleet Vehicle"}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Destination</span>
                  <p className="font-bold text-slate-900 truncate">{activeOrder.destinationAddress}</p>
                  <p className="text-slate-500 font-mono">{activeOrder.destinationCity}</p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  List of Received Cargo:
                </span>
                <p className="text-xs text-slate-800 font-medium p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {activeOrder.goodsSummary || "General cargo goods"}
                </p>
              </div>
            </div>

            {/* Verification Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Goods Condition Validation & Driver Feedback
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Logistics Driver Service Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-2 font-mono">
                      {rating}.0 / 5.0 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Goods Receipt Condition Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter condition notes (e.g. seals intact, optimal temperature, etc.)..."
                    value={recipientNote}
                    onChange={(e) => setRecipientNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Final Confirmation
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                By clicking the button below, you confirm that all goods have been received in accordance with the Delivery Order manifest.
              </p>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Confirm Proof of Delivery (POD)
              </Button>
            </div>
          </div>
        </form>
      )}
    </PageContainer>
  );
}
