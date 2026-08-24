"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/dashboard";
import { useWarehouses, useRentSpace } from "@/hooks/use-warehouses";
import { RentSpaceResponse } from "@/services/warehouse.service";

export default function StorageRentalBookingPage() {
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
  const rentMutation = useRentSpace();

  const [storageType, setStorageType] = useState<"COLD_STORAGE" | "STANDARD">("COLD_STORAGE");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [volumeM3, setVolumeM3] = useState<number>(50);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [bookingResult, setBookingResult] = useState<RentSpaceResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default warehouse once loaded
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id || warehouses[0].code);
    }
  }, [warehouses, selectedWarehouseId]);

  const pricePerM3 = storageType === "COLD_STORAGE" ? 150000 : 50000;
  const monthlyTotal = volumeM3 * pricePerM3;
  const grandTotal = monthlyTotal * durationMonths;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedWarehouseId) {
      setErrorMessage("Please select a warehouse facility.");
      return;
    }

    try {
      const result = await rentMutation.mutateAsync({
        warehouseId: selectedWarehouseId,
        storageType,
        volumeM3,
        durationMonths,
      });
      setBookingResult(result);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to book warehouse space. Please try again.");
    }
  };

  const selectedWh = warehouses.find(
    (w) => w.id === selectedWarehouseId || w.code === selectedWarehouseId
  );

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Storage Rental"
        title="Warehouse Space Rental & Booking"
        subtitle="Select temperature-controlled (Cold Storage) or standard dry storage, specify volume in m³, and choose rental duration."
        badgeText="Real-time Reservation"
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/goods">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                My Inventory
              </Button>
            </Link>
          </div>
        }
      />

      {bookingResult ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Warehouse Space Booking Confirmed!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your space reservation for <strong className="text-slate-800">{bookingResult.rental.volumeM3} m³</strong> ({bookingResult.rental.storageType === "COLD_STORAGE" ? "Cold Storage -18°C" : "Standard Dry Storage"}) at <strong className="text-slate-800">{bookingResult.rental.warehouseName}</strong> for <strong className="text-slate-800">{bookingResult.rental.durationMonths} month(s)</strong> has been recorded in PostgreSQL.
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Number:</span>
              <span className="font-bold text-emerald-700">{bookingResult.invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoice Amount:</span>
              <span className="font-bold text-slate-900">Rp {bookingResult.invoice.totalAmount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{bookingResult.invoice.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Facility Location:</span>
              <span className="font-semibold text-slate-800">{bookingResult.rental.warehouseName}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/customer/billing" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                View Invoice & Payment →
              </Button>
            </Link>
            <Link href="/customer/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto text-xs h-9 border-slate-300">
                Go to Dashboard
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => setBookingResult(null)}
              className="text-xs h-9 text-slate-500"
            >
              Book Another Space
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Booking Form (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Step 1: Storage Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                1. Select Storage Space Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option Cold Storage */}
                <div
                  onClick={() => setStorageType("COLD_STORAGE")}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    storageType === "COLD_STORAGE"
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
                    Specially designed for frozen beef, seafood, dairy, and precision sub-zero temperature goods.
                  </p>
                  <p className="text-xs font-bold text-sky-700 mt-3 font-mono">
                    Rp 150.000 / m³ / month
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
                    For general merchandise, furniture & woodcraft, consumer electronics, and dry retail inventory.
                  </p>
                  <p className="text-xs font-bold text-emerald-700 mt-3 font-mono">
                    Rp 50.000 / m³ / month
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Hub Location */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                2. Select Warehouse Facility (Hub Base)
              </h2>

              {isLoadingWarehouses ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>Loading warehouse hubs...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {warehouses.map((wh) => (
                    <button
                      key={wh.id}
                      type="button"
                      onClick={() => setSelectedWarehouseId(wh.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedWarehouseId === wh.id || selectedWarehouseId === wh.code
                          ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {wh.name}
                        </span>
                        <Badge variant="outline" className="text-[9.5px] font-mono">
                          {wh.code}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        {wh.address || wh.city}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
                  <span className="text-slate-500">Warehouse:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">
                    {selectedWh?.name || "Select Hub"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Storage Type:</span>
                  <span className="font-bold text-slate-900">
                    {storageType === "COLD_STORAGE" ? "Cold Storage (-18°C)" : "Standard Storage"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Volume:</span>
                  <span className="font-bold text-slate-900 font-mono">{volumeM3} m³</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Unit Rate:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    Rp {pricePerM3.toLocaleString("id-ID")} / m³
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Monthly Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    Rp {monthlyTotal.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">{durationMonths} Month{durationMonths > 1 ? "s" : ""}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">Total Bill:</span>
                  <span className="font-extrabold text-emerald-600 text-base font-mono">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={rentMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {rentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Booking...</span>
                  </>
                ) : (
                  <span>Confirm & Book Space</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </PageContainer>
  );
}
