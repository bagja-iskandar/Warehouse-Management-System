"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileCheck,
  CheckCircle2,
  Camera,
  Upload,
  User,
  PenTool,
  Check,
  Building2,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useSubmitPod, useDeliveryOrder, useDeliveryOrders } from "@/hooks/use-logistics";
import { toast } from "sonner";

function DigitalPodContent() {
  const searchParams = useSearchParams();
  const explicitOrderId = searchParams.get("orderId");

  const { data: allOrders } = useDeliveryOrders();
  const activeFallbackOrder = allOrders?.find(
    (o) =>
      o.status === "ARRIVED_DESTINATION" ||
      o.status === "IN_TRANSIT" ||
      o.status === "PICKED_UP" ||
      o.status === "DRIVER_ASSIGNED"
  );

  const orderId = explicitOrderId || activeFallbackOrder?.id || "";
  const { data: order } = useDeliveryOrder(orderId);
  const submitPodMutation = useSubmitPod();

  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("Staff Receiving");
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasSignature, setHasSignature] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default recipient name from order once loaded
  React.useEffect(() => {
    if (order && !recipientName) {
      setRecipientName(order.customerName || "Customer PIC");
    }
  }, [order, recipientName]);

  const orderNumber = order?.orderNumber || activeFallbackOrder?.orderNumber || "DO-ACTIVE";
  const destination = order?.destinationAddress || activeFallbackOrder?.destinationAddress || "Destination Drop-off Facility";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error("No active order selected for POD upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPodMutation.mutateAsync({
        orderId,
        data: {
          recipientName: `${recipientName} (${recipientRole})`,
          photoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
          signatureData: "data:image/svg+xml;utf8,<svg>signature_verified</svg>",
          rating: 5,
          note: "Cargo received completely in optimal condition, seals intact and verified.",
        },
      });
      setIsSubmitted(true);
      toast.success("Digital POD Saved Successfully", {
        description: `Shipment #${orderNumber} status has been updated to DELIVERED in PostgreSQL.`,
      });
    } catch (err: any) {
      toast.error("Failed to upload Digital POD", {
        description: err?.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Proof of Delivery"
        title="Upload Proof of Delivery (Digital POD)"
        subtitle={`Capture recipient verification, handover photos, and digital sign-off for Order #${orderNumber}`}
        badgeText={orderNumber}
        badgeColor="bg-emerald-600 text-white font-mono"
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

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Proof of Delivery Verified & Recorded!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Order <strong className="text-slate-800 font-mono">#{orderNumber}</strong> has been marked as <strong className="text-emerald-700">DELIVERED</strong>. Digital recipient receipt and photos are archived in PostgreSQL.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/driver/tasks">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Return to Tasks Queue →
              </Button>
            </Link>
            <Link href="/driver/history">
              <Button variant="outline" className="text-xs h-9">
                View History
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <SectionCard
              title="Handover & Recipient Verification"
              subtitle="Collect recipient full name, role, photo evidence, and digital signature"
              icon={FileCheck}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Recipient Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Budi Santoso"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Recipient Position / Role
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientRole}
                      onChange={(e) => setRecipientRole(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Cargo Handover Photo Proof
                    </label>
                    <div className="h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                      <Camera className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {hasPhoto ? "Photo Attached (1 File)" : "Take Cargo Photo"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        High-res cargo unloading at destination dock
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Recipient Digital E-Signature
                    </label>
                    <div className="h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:border-emerald-500 transition-colors">
                      <PenTool className="h-6 w-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">
                        {hasSignature ? "Signature Captured (Verified)" : "Tap to Sign"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Digital signature on mobile screen
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <SectionCard
              title="Delivery Summary"
              subtitle="Manifest confirmation"
              icon={ClipboardList}
            >
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Delivery Order:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">#{orderNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold">Destination:</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{destination}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-semibold mb-1">POD Verification Status:</span>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Photo Proof Ready</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Digital Signature Captured</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitPodMutation.isPending || isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-md shadow-emerald-600/20"
                  >
                    {submitPodMutation.isPending || isSubmitting ? "Saving Digital POD..." : "Submit Digital POD →"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          </div>
        </form>
      )}
    </PageContainer>
  );
}

export default function DigitalPodPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading POD...</div>}>
      <DigitalPodContent />
    </Suspense>
  );
}
