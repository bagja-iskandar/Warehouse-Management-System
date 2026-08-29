"use client";

import React from "react";
import { Snowflake, Truck } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

export interface LogisticsRecipientFormProps {
  requestType: "OUTBOUND" | "INBOUND";
  recipientName: string;
  setRecipientName: (name: string) => void;
  recipientPhone: string;
  setRecipientPhone: (phone: string) => void;
  recipientAddress: string;
  setRecipientAddress: (address: string) => void;
  recipientCity: string;
  setRecipientCity: (city: string) => void;
  vehicleType: "REEFER" | "BOX";
  setVehicleType: (type: "REEFER" | "BOX") => void;
  scheduledDate: string;
  setScheduledDate: (date: string) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  requiresReefer: boolean;
}

export function LogisticsRecipientForm({
  requestType,
  recipientName,
  setRecipientName,
  recipientPhone,
  setRecipientPhone,
  recipientAddress,
  setRecipientAddress,
  recipientCity,
  setRecipientCity,
  vehicleType,
  setVehicleType,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  requiresReefer,
}: LogisticsRecipientFormProps) {
  return (
    <>
      {/* 3. Recipient & Destination Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          3.{" "}
          {requestType === "OUTBOUND"
            ? "Recipient & Delivery Destination"
            : "Pickup Point Contact & Address"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {requestType === "OUTBOUND"
                ? "Recipient Name / Store *"
                : "Pickup Contact Person *"}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PT Supermarket Retail Hub"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Contact Phone Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 0812-3456-7890"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Complete Address *
            </label>
            <input
              type="text"
              required
              placeholder="Street name, building/dock number..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              City *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jakarta Selatan"
              value={recipientCity}
              onChange={(e) => setRecipientCity(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Schedule & Fleet Selection */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          4. Fleet & Schedule Requirements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Fleet Vehicle Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVehicleType("REEFER")}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  vehicleType === "REEFER"
                    ? "border-sky-500 bg-sky-50 text-sky-950 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                <span>Reefer (-18°C)</span>
              </button>
              <button
                type="button"
                disabled={requiresReefer}
                onClick={() => setVehicleType("BOX")}
                className={`p-2.5 rounded-lg border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  vehicleType === "BOX"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs"
                    : requiresReefer
                    ? "border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Truck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Dry Box Truck</span>
              </button>
            </div>
            {requiresReefer && (
              <p className="text-[10px] text-sky-700 mt-1 font-medium">
                * Cold storage cargo detected: Reefer Truck automatically
                enforced.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <DatePicker
                label="Dispatch Date *"
                value={scheduledDate}
                onChange={setScheduledDate}
                placeholder="Select Dispatch Date"
                minDate={new Date().toISOString().split("T")[0]}
                presetMode="dispatch"
              />
            </div>
            <div>
              <TimePicker
                label="Time Slot"
                value={scheduledTime}
                onChange={setScheduledTime}
                placeholder="Select Time Slot"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
