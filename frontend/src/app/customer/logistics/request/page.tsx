"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  MapPin,
  Calendar,
  Clock,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateDeliveryOrder } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function LogisticsRequestPage() {
  const { user } = useAuth();
  const createOrderMutation = useCreateDeliveryOrder();
  const [requestType, setRequestType] = useState<"OUTBOUND" | "INBOUND">("OUTBOUND");
  const [recipientName, setRecipientName] = useState("FreshMarket Superstore BSD");
  const [recipientPhone, setRecipientPhone] = useState("0812-9988-7766");
  const [recipientAddress, setRecipientAddress] = useState("Jl. Pahlawan Seribu No. 88, BSD City, South Tangerang");
  const [vehicleType, setVehicleType] = useState<"REEFER" | "BOX">("REEFER");
  const [selectedItems, setSelectedItems] = useState("BAR-FRESH-001 (Wagyu Beef 100 Packages)");
  const [scheduledDate, setScheduledDate] = useState("2026-08-18");
  const [scheduledTime, setScheduledTime] = useState("08:30");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrderMutation.mutateAsync({
        type: requestType === "OUTBOUND" ? "DELIVERY" : "PICKUP",
        customerId: user?.id || "usr-cust-1",
        customerName: user?.name || "Customer",
        customerPhone: recipientPhone,
        goodsSummary: selectedItems,
        originAddress: requestType === "OUTBOUND" ? "Cakung Logistics Central Hub" : recipientAddress,
        originCity: requestType === "OUTBOUND" ? "East Jakarta" : "South Jakarta",
        destinationAddress: requestType === "OUTBOUND" ? recipientAddress : "Cakung Logistics Central Hub",
        destinationCity: requestType === "OUTBOUND" ? "South Tangerang" : "East Jakarta",
        scheduledDate,
        scheduledTimeSlot: `${scheduledTime} WIB`,
        requiresReefer: vehicleType === "REEFER",
      });
      setIsSubmitted(true);
      toast.success("Logistics Delivery Request Created Successfully");
    } catch (err: any) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Schedule Logistics Request & Fleet Dispatch
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Dispatch Request
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Request warehouse outbound shipment or inbound goods pickup with Reefer / Box trucks.
          </p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Logistics Request Submitted Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Shipment ticket <span className="font-mono font-bold text-indigo-600">DO-2026-REQ-009</span> has entered the Admin dispatch queue. A <span className="font-semibold">{vehicleType === "REEFER" ? "Refrigerated Reefer Truck" : "Box Truck"}</span> will be allocated according to schedule.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
            <p>Destination: {recipientName}</p>
            <p>Schedule: {scheduledDate} at {scheduledTime} WIB</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Back to Dashboard →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="text-xs h-9"
            >
              Create Another Request
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                1. Logistics Service Type
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType("OUTBOUND")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestType === "OUTBOUND"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="text-xs block">Outbound Delivery</span>
                  <span className="text-[10.5px] font-normal text-slate-500 block mt-0.5">
                    Ship goods from warehouse to your store or customer
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType("INBOUND")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestType === "INBOUND"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="text-xs block">Inbound Pickup</span>
                  <span className="text-[10.5px] font-normal text-slate-500 block mt-0.5">
                    Pick up goods from supplier to store in warehouse
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Recipient Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                2. Recipient Details & Delivery Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recipient Name / Company
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recipient Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Destination Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Step 3: Vehicle & Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                3. Fleet Vehicle & Schedule
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Fleet Truck Type
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setVehicleType("REEFER")}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        vehicleType === "REEFER"
                          ? "border-sky-500 bg-sky-50 font-bold text-sky-950"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>Reefer Cold Truck (-18°C)</span>
                      <Badge className="bg-sky-100 text-sky-800 text-[9.5px]">Cold</Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicleType("BOX")}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        vehicleType === "BOX"
                          ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-950"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>Standard Dry Box Truck</span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[9.5px]">Dry</Badge>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Delivery Time (WIB)
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary Card (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Logistics Request Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Service Type:</span>
                  <span className="font-bold text-slate-900">{requestType} Delivery</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fleet Type:</span>
                  <span className="font-bold text-slate-900">
                    {vehicleType === "REEFER" ? "Reefer Truck (-18°C)" : "Box Truck Dry"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">
                    {recipientName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Schedule:</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {scheduledDate}, {scheduledTime} WIB
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Submit Dispatch Request
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
