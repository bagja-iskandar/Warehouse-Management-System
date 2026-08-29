import React from "react";
import { Badge } from "@/components/ui/badge";

export type GoodsStatus =
  | "STORED"
  | "DRAFT"
  | "INSPECTING"
  | "PENDING_PICKUP"
  | "IN_TRANSIT_INBOUND"
  | "PENDING_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | string;

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | string;

export type InvoiceStatusType =
  | "PAID"
  | "UNPAID"
  | "PENDING_PAYMENT"
  | "OVERDUE"
  | "CANCELLED"
  | string;

export type AccountStatusType =
  | "ACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION"
  | string;

/**
 * Reusable Centralized Goods Storage Status Badge
 */
export function GoodsStatusBadge({ status }: { status: GoodsStatus }) {
  switch (status) {
    case "STORED":
      return <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-600">Stored in Rack</Badge>;
    case "DRAFT":
      return (
        <Badge className="bg-slate-200 text-slate-800 text-[10px] font-semibold hover:bg-slate-200">
          Waiting for Inbound
        </Badge>
      );
    case "INSPECTING":
      return (
        <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse hover:bg-amber-500">
          Ready for Put-Away
        </Badge>
      );
    case "PENDING_PICKUP":
      return <Badge className="bg-sky-600 text-white text-[10px] hover:bg-sky-600">Pending Pickup</Badge>;
    case "IN_TRANSIT_INBOUND":
      return <Badge className="bg-indigo-600 text-white text-[10px] hover:bg-indigo-600">Inbound Transit</Badge>;
    case "PENDING_DELIVERY":
      return <Badge className="bg-purple-600 text-white text-[10px] hover:bg-purple-600">Ready for Outbound</Badge>;
    case "DELIVERED":
      return <Badge className="bg-slate-700 text-white text-[10px] hover:bg-slate-700">Delivered</Badge>;
    case "CANCELLED":
      return <Badge className="bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-600">Cancelled</Badge>;
    default:
      return <Badge className="bg-slate-200 text-slate-700 text-[10px] hover:bg-slate-200">{status}</Badge>;
  }
}

/**
 * Reusable Centralized Customer / User Account Status Badge
 */
export function AccountStatusBadge({ status }: { status: AccountStatusType }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-600">Active Tenant</Badge>;
    case "SUSPENDED":
      return <Badge className="bg-rose-600 text-white text-[10px] hover:bg-rose-600">Suspended</Badge>;
    case "PENDING_VERIFICATION":
      return <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold hover:bg-amber-500">Pending Verification</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}


/**
 * Reusable Centralized Delivery / Logistics Order Status Badge
 */
export function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING_ASSIGNMENT":
    case "PENDING":
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 text-[11px] gap-1.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Pending Assignment
        </Badge>
      );
    case "DRIVER_ASSIGNED":
    case "ASSIGNED":
      return (
        <Badge className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] gap-1.5 py-0.5 hover:bg-sky-50">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          Driver Assigned
        </Badge>
      );
    case "EN_ROUTE_PICKUP":
      return (
        <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] gap-1.5 py-0.5 hover:bg-indigo-50">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          En Route to Pickup
        </Badge>
      );
    case "PICKED_UP":
      return (
        <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] gap-1.5 py-0.5 hover:bg-amber-50">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Cargo Picked Up
        </Badge>
      );
    case "IN_TRANSIT":
      return (
        <Badge className="bg-amber-500 text-slate-950 font-bold border border-amber-600 text-[11px] gap-1.5 py-0.5 shadow-sm hover:bg-amber-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-950 animate-ping" />
          In Transit
        </Badge>
      );
    case "ARRIVED_DESTINATION":
      return (
        <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[11px] gap-1.5 py-0.5 hover:bg-teal-50">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          Arrived at Destination
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] gap-1.5 py-0.5 hover:bg-emerald-50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Delivered
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="bg-emerald-600 text-white text-[11px] gap-1.5 py-0.5 hover:bg-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
          Confirmed
        </Badge>
      );
    case "DELAYED":
      return (
        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] gap-1.5 py-0.5 hover:bg-rose-50">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Delayed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] gap-1.5 py-0.5 hover:bg-slate-100">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px] py-0.5">
          {status}
        </Badge>
      );
  }
}

/**
 * Reusable Centralized Vehicle Status Badge
 */
export function VehicleStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "AVAILABLE":
      return <Badge className="bg-emerald-600 text-white text-[10px] hover:bg-emerald-600">Available</Badge>;
    case "IN_SERVICE":
      return <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-500">In Service</Badge>;
    case "MAINTENANCE":
      return <Badge className="bg-rose-600 text-white text-[10px] hover:bg-rose-600">Maintenance</Badge>;
    case "INACTIVE":
      return <Badge className="bg-slate-400 text-white text-[10px] hover:bg-slate-400">Inactive</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}
