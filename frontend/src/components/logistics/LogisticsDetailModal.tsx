"use client";

import React from "react";
import {
  Navigation,
  MapPin,
  User,
  Phone,
  Truck,
  FileCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryOrder } from "@/types";
import { ShipmentStatusStepper } from "./ShipmentStatusStepper";

export interface LogisticsDetailModalProps {
  selectedOrder: DeliveryOrder | null;
  onClose: () => void;
}

export function LogisticsDetailModal({
  selectedOrder,
  onClose,
}: LogisticsDetailModalProps) {
  if (!selectedOrder) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
                  {selectedOrder.type === "DELIVERY"
                    ? "Outbound Delivery"
                    : "Inbound Pickup"}
                </Badge>
                <Badge
                  variant={
                    selectedOrder.status === "DELIVERED" ||
                    selectedOrder.status === "CONFIRMED"
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
                Customer:{" "}
                <strong>{selectedOrder.customerName || "WMS Tenant"}</strong> •
                Scheduled:{" "}
                {selectedOrder.scheduledDate
                  ? new Date(selectedOrder.scheduledDate).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  : "-"}{" "}
                {selectedOrder.scheduledTimeSlot
                  ? `(${selectedOrder.scheduledTimeSlot})`
                  : ""}
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
                  <span className="text-[9.5px] text-slate-400 font-medium block">
                    Origin:
                  </span>
                  <p className="font-semibold text-slate-800 text-[11.5px] truncate">
                    {selectedOrder.originAddress || "Origin Logistics Hub"}
                  </p>
                  <span className="text-[10.5px] text-slate-500 block">
                    {selectedOrder.originCity}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9.5px] text-slate-400 font-medium block">
                    Destination:
                  </span>
                  <p className="font-semibold text-slate-800 text-[11.5px] truncate">
                    {selectedOrder.destinationAddress || "Recipient Facility"}
                  </p>
                  <span className="text-[10.5px] text-slate-500 block">
                    {selectedOrder.destinationCity}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] text-slate-400 block font-medium">
                  Cargo:
                </span>
                <p className="font-bold text-slate-800 text-[11px] truncate">
                  {selectedOrder.goodsSummary || "WMS Cargo Package"}
                </p>
              </div>
              <div className="text-[10.5px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                {selectedOrder.totalVolumeM3
                  ? Number(selectedOrder.totalVolumeM3).toFixed(2)
                  : "0.00"}{" "}
                m³ •{" "}
                {selectedOrder.totalWeightKg
                  ? Number(selectedOrder.totalWeightKg).toFixed(0)
                  : "0"}{" "}
                kg
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
                <span className="text-[9.5px] text-slate-400 font-medium block">
                  Driver PIC
                </span>
                {selectedOrder.driverName ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate">
                      {selectedOrder.driverName}
                    </span>
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
                  <span className="text-[10.5px] text-slate-400 italic">
                    Waiting for central dispatch
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <Truck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9.5px] text-slate-400 font-medium block">
                  Dedicated Vehicle
                </span>
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
                  <span className="text-[10.5px] text-slate-400 italic">
                    Vehicle unit not yet allocated
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proof of Delivery (POD) Section (If Delivered) */}
        {(selectedOrder.status === "DELIVERED" ||
          selectedOrder.status === "CONFIRMED") && (
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span>
                  POD Verified{" "}
                  {selectedOrder.recipientName
                    ? `• Received by ${selectedOrder.recipientName}`
                    : ""}
                </span>
                {selectedOrder.confirmedAt && (
                  <span className="text-[10.5px] text-emerald-700 font-normal font-mono block">
                    Timestamp:{" "}
                    {new Date(selectedOrder.confirmedAt).toLocaleString(
                      "id-ID"
                    )}
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
            onClick={onClose}
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 px-4 font-semibold rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
