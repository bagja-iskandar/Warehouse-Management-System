"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types";

export interface ShipmentStatusStepperProps {
  status: OrderStatus | string;
  type?: "PICKUP" | "DELIVERY" | string;
  isDelayed?: boolean;
  delayReason?: string;
  className?: string;
}

export const OUTBOUND_STEPS = [
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
    description: "Driver heading to origin loading dock",
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
] as const;

export const INBOUND_STEPS = [
  {
    key: "PENDING_ASSIGNMENT",
    label: "Pickup Requested",
    shortLabel: "Requested",
    description: "Inbound pickup request submitted by customer",
  },
  {
    key: "DRIVER_ASSIGNED",
    label: "Driver Assigned",
    shortLabel: "Assigned",
    description: "Driver and fleet dispatched for pickup",
  },
  {
    key: "EN_ROUTE_PICKUP",
    label: "En Route to Supplier",
    shortLabel: "En Route",
    description: "Driver heading to customer/supplier origin",
  },
  {
    key: "PICKED_UP",
    label: "Cargo Picked Up",
    shortLabel: "Picked Up",
    description: "Goods loaded onto fleet at customer facility",
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit to Warehouse",
    shortLabel: "In Transit",
    description: "Fleet moving to destination warehouse",
  },
  {
    key: "ARRIVED_DESTINATION",
    label: "Arrived at Warehouse",
    shortLabel: "Arrived",
    description: "Shipment arrived at warehouse loading dock",
  },
  {
    key: "DELIVERED",
    label: "Received & Stored",
    shortLabel: "Received",
    description: "Admin verified receiving & goods put-away to rack",
  },
] as const;

export function getStepIndex(status: string): number {
  switch (status) {
    case "PENDING_ASSIGNMENT":
    case "QUEUED":
      return 0;
    case "DRIVER_ASSIGNED":
      return 1;
    case "EN_ROUTE_PICKUP":
      return 2;
    case "PICKED_UP":
    case "LOADING":
      return 3;
    case "IN_TRANSIT":
      return 4;
    case "ARRIVED_DESTINATION":
      return 5;
    case "DELIVERED":
    case "CONFIRMED":
      return 6;
    case "DELAYED":
      return 4;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
}

export function ShipmentStatusStepper({
  status,
  type = "DELIVERY",
  isDelayed = false,
  delayReason,
  className = "",
}: ShipmentStatusStepperProps) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "CANCELLED";
  const steps = type === "PICKUP" ? INBOUND_STEPS : OUTBOUND_STEPS;

  return (
    <div className={`bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider">
          {type === "PICKUP" ? "Inbound Pickup Progression" : "Shipment Status Progression"}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] text-slate-500 font-mono">
            Live Stage:{" "}
            <strong className="text-slate-900">{String(status).replace(/_/g, " ")}</strong>
          </span>
          {isDelayed && (
            <Badge variant="warning" className="text-[9.5px] py-0 px-1.5 bg-amber-500 text-slate-950">
              Delayed
            </Badge>
          )}
          {isCancelled && (
            <Badge variant="outline" className="text-[9.5px] py-0 px-1.5 border-rose-300 text-rose-600 bg-rose-50">
              Cancelled
            </Badge>
          )}
        </div>
      </div>

      {/* Horizontal Connected Stepper */}
      <div className="grid grid-cols-7 relative pt-0.5">
        {steps.map((step, idx) => {
          const isCompleted = !isCancelled && (idx < currentIdx || (idx === currentIdx && currentIdx === 6));
          const isCurrent = !isCancelled && idx === currentIdx && currentIdx < 6;
          const isPending = isCancelled || idx > currentIdx;

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative px-0.5">
              {/* Connecting Line to next step */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-[13px] left-1/2 w-full h-[2px] z-0 ${
                    !isCancelled && idx < currentIdx ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Step Indicator Dot */}
              <div className="mb-1 relative z-10 bg-slate-50 p-0.5 rounded-full">
                {isCompleted ? (
                  <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                ) : isCurrent ? (
                  <div className="h-5 w-5 rounded-full border-2 border-amber-500 bg-amber-50 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping" />
                  </div>
                ) : isCancelled && idx === 0 ? (
                  <div className="h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm">
                    <XCircle className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`text-[9.5px] sm:text-[10.5px] font-semibold leading-tight relative z-10 ${
                  isCompleted
                    ? "text-slate-700 font-bold"
                    : isCurrent
                    ? "text-amber-900 font-extrabold"
                    : "text-slate-400"
                }`}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Delay / Incident Alert Notice if present */}
      {isDelayed && (
        <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-[10.5px]">
            <strong>Delay Alert:</strong> {delayReason || "Vehicle delayed due to traffic congestion on delivery corridor."}
          </span>
        </div>
      )}
    </div>
  );
}
