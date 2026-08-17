"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Warehouse,
  Snowflake,
  Boxes,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function StorageRentalBookingPage() {
  const [storageType, setStorageType] = useState<"COLD" | "STANDARD">("COLD");
  const [selectedHub, setSelectedHub] = useState<"JKT-01" | "BDG-01">("JKT-01");
  const [volumeM3, setVolumeM3] = useState<number>(50);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [isBooked, setIsBooked] = useState<boolean>(false);

  const pricePerM3 = storageType === "COLD" ? 150000 : 50000;
  const monthlyTotal = volumeM3 * pricePerM3;
  const grandTotal = monthlyTotal * durationMonths;

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Warehouse Space Rental & Booking
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Self-Service Booking
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Select temperature-controlled (Cold Storage) or standard dry storage, specify volume in m³, and choose rental duration.
          </p>
        </div>
      </div>

      {isBooked ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Warehouse Space Booking Registered Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Rental booking request for {volumeM3} m³ ({storageType === "COLD" ? "Cold Storage -18°C" : "Standard Storage"}) for {durationMonths} month(s) has been received. Your invoice has been generated.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
            <p>Total Bill: IDR {grandTotal.toLocaleString("en-US")}</p>
            <p>Location: {selectedHub === "JKT-01" ? "Cakung Logistics Central Hub (JKT-01)" : "West Java Distribution Hub Gedebage (BDG-01)"}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/billing">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                View Invoices & Payment →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsBooked(false)}
              className="text-xs h-9"
            >
              Rent Another Space
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Booking Form (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Storage Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                1. Select Storage Space Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option Cold Storage */}
                <div
                  onClick={() => setStorageType("COLD")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    storageType === "COLD"
                      ? "border-sky-500 bg-sky-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Snowflake className="h-4 w-4 text-sky-600" />
                      <span>Cold Storage Sub-zero</span>
                    </span>
                    <Badge className="bg-sky-100 text-sky-800 text-[10px]">-18°C to -25°C</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Specially designed for frozen beef, seafood, dairy, and precision sub-zero goods.
                  </p>
                  <p className="text-xs font-bold text-sky-700 mt-3 font-mono">
                    IDR 150,000 / m³ / month
                  </p>
                </div>

                {/* Option Standard Storage */}
                <div
                  onClick={() => setStorageType("STANDARD")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    storageType === "STANDARD"
                      ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Warehouse className="h-4 w-4 text-emerald-600" />
                      <span>Standard Storage (Dry)</span>
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">20°C to 26°C</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    For general merchandise, furniture & woodcraft, consumer electronics, and dry retail goods.
                  </p>
                  <p className="text-xs font-bold text-emerald-700 mt-3 font-mono">
                    IDR 50,000 / m³ / month
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Hub Location */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                2. Select Warehouse Facility (Hub Base)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedHub("JKT-01")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedHub === "JKT-01"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">
                    Cakung Logistics Central Hub (JKT-01)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Pulo Gadung Industrial Zone, East Jakarta
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHub("BDG-01")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedHub === "BDG-01"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">
                    West Java Distribution Hub Gedebage (BDG-01)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Gedebage Logistics Corridor, Bandung
                  </span>
                </button>
              </div>
            </div>

            {/* Step 3: Volume & Duration Slider */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900">
                3. Required Space Volume & Contract Duration
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Required Space Volume (m³):</span>
                  <span className="text-base font-extrabold text-indigo-600 font-mono">
                    {volumeM3} m³
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={5}
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10.5px] text-slate-400 font-mono">
                  <span>10 m³</span>
                  <span>250 m³</span>
                  <span>500 m³</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Rental Duration:</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {durationMonths} Month{durationMonths > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        durationMonths === m
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {m} Month{m > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Checkout Summary (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Rental Cost Breakdown
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Storage Type:</span>
                  <span className="font-bold text-slate-900">
                    {storageType === "COLD" ? "Cold Storage (-18°C)" : "Standard Storage"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Volume:</span>
                  <span className="font-bold text-slate-900 font-mono">{volumeM3} m³</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Unit Rate:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    IDR {pricePerM3.toLocaleString("en-US")} / m³
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Monthly Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    IDR {monthlyTotal.toLocaleString("en-US")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">{durationMonths} Month{durationMonths > 1 ? "s" : ""}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Bill:</span>
                  <span className="font-extrabold text-emerald-600 text-base font-mono">
                    IDR {grandTotal.toLocaleString("en-US")}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Confirm & Book Space
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
