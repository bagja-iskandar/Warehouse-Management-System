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
  ArrowRightLeft,
  AlertTriangle,
  MapPin,
  FileText,
  Clock,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/dashboard";
import {
  useWarehouses,
  useRentSpace,
  useCustomerActiveWarehouses,
  useChangeRentalWarehouse,
} from "@/hooks/use-warehouses";
import { useGoods } from "@/hooks/use-goods";
import { useAuth } from "@/hooks/use-auth";
import { canChangeRentalWarehouse } from "@/lib/inventory-lifecycle";
import { RentSpaceResponse } from "@/services/warehouse.service";
import {
  MASTER_STORAGE_RATES,
  getStorageRatePerM3,
} from "@/lib/constants/pricing.constants";
import { toast } from "sonner";
import { RentalCountdownTimer } from "@/components/warehouse/RentalCountdownTimer";
import { StorageUtilizationDonut } from "@/components/warehouse/StorageUtilizationDonut";
import { ChangeWarehouseModal } from "@/components/warehouse/ChangeWarehouseModal";

export default function StorageRentalBookingPage() {
  const { user } = useAuth();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: activeWarehouses = [], isLoading: isLoadingActive } = useCustomerActiveWarehouses();
  const { data: allCustomerGoods = [] } = useGoods(user?.id ? { customerId: user.id } : null);

  const rentMutation = useRentSpace();
  const changeWarehouseMutation = useChangeRentalWarehouse();

  const [activeTab, setActiveTab] = useState<"MY_RENTALS" | "NEW_BOOKING">("MY_RENTALS");

  // Booking Form State
  const [storageType, setStorageType] = useState<"COLD_STORAGE" | "STANDARD">("COLD_STORAGE");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [volumeM3, setVolumeM3] = useState<number>(50);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [bookingResult, setBookingResult] = useState<RentSpaceResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Change Warehouse Modal State
  const [transferSourceWh, setTransferSourceWh] = useState<any | null>(null);
  const [transferTargetWhId, setTransferTargetWhId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);

  // Set default warehouse once loaded
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0].id || warehouses[0].code);
    }
  }, [warehouses, selectedWarehouseId]);

  // Set default tab if no active rentals exist
  useEffect(() => {
    if (!isLoadingActive && activeWarehouses.length === 0) {
      setActiveTab("NEW_BOOKING");
    }
  }, [activeWarehouses, isLoadingActive]);

  const pricePerM3 = getStorageRatePerM3(storageType);
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
      toast.success("Warehouse space successfully booked!");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to book warehouse space. Please try again.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!transferSourceWh || !transferTargetWhId) {
      setTransferError("Please select a target warehouse facility.");
      return;
    }

    try {
      const res = await changeWarehouseMutation.mutateAsync({
        sourceWarehouseId: transferSourceWh.id,
        targetWarehouseId: transferTargetWhId,
        reason: transferReason || "Customer pre-inbound location change",
      });

      toast.success(res.message || "Warehouse facility successfully changed!");
      setTransferSourceWh(null);
      setTransferTargetWhId("");
      setTransferReason("");
    } catch (err: any) {
      setTransferError(
        err?.message || "Failed to change warehouse facility. Please try again."
      );
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
        title="Warehouse Space Rental & Management"
        subtitle="Manage active rental facilities, monitor real-time utilization & capacity limits, or reserve additional storage space."
        badgeText="Rental Contracts & Space Allocation"
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
            <Link href="/customer/billing">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                Invoices & Payments
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("MY_RENTALS")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "MY_RENTALS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          My Active Rentals ({activeWarehouses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("NEW_BOOKING")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "NEW_BOOKING"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          + Rent New Warehouse Space
        </button>
      </div>

      {/* Tab 1: My Active Rentals & Overview */}
      {activeTab === "MY_RENTALS" && (
        <div className="space-y-6">
          {isLoadingActive ? (
            <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span>Loading active rental contracts...</span>
            </div>
          ) : activeWarehouses.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto space-y-4">
              <Warehouse className="h-10 w-10 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">
                  No Active Warehouse Rentals
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You haven&apos;t rented any warehouse space yet. Book your temperature-controlled cold storage or standard dry space to begin storing inventory.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("NEW_BOOKING")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
              >
                Book Space Now →
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activeWarehouses.map((wh) => {
                const goodsInWh = allCustomerGoods.filter(
                  (g) => g.warehouseId === wh.id || g.warehouseId === wh.code
                );

                const rental = wh.customerRental || {
                  rentedVolumeM3: 50.0,
                  rentedWeightKg: 5000.0,
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  durationMonths: 12,
                  status: "ACTIVE" as const,
                  isExpired: false,
                  storageType: "COLD_STORAGE" as const,
                };

                const utilization = wh.customerUtilization || {
                  storedVolumeM3: goodsInWh
                    .filter((g) => g.status === "STORED")
                    .reduce((sum, g) => sum + (g.dimensions?.volumeM3 || 0), 0),
                  storedWeightKg: goodsInWh
                    .filter((g) => g.status === "STORED")
                    .reduce((sum, g) => sum + (g.dimensions?.weightKg || 0), 0),
                  storedCount: goodsInWh.filter((g) => g.status === "STORED").length,
                  receivingVolumeM3: goodsInWh
                    .filter((g) => g.status === "INSPECTING")
                    .reduce((sum, g) => sum + (g.dimensions?.volumeM3 || 0), 0),
                  receivingWeightKg: goodsInWh
                    .filter((g) => g.status === "INSPECTING")
                    .reduce((sum, g) => sum + (g.dimensions?.weightKg || 0), 0),
                  receivingCount: goodsInWh.filter((g) => g.status === "INSPECTING").length,
                  waitingInboundVolumeM3: goodsInWh
                    .filter((g) => g.status === "DRAFT" || g.status === "PENDING_PICKUP")
                    .reduce((sum, g) => sum + (g.dimensions?.volumeM3 || 0), 0),
                  waitingInboundWeightKg: goodsInWh
                    .filter((g) => g.status === "DRAFT" || g.status === "PENDING_PICKUP")
                    .reduce((sum, g) => sum + (g.dimensions?.weightKg || 0), 0),
                  waitingInboundCount: goodsInWh.filter(
                    (g) => g.status === "DRAFT" || g.status === "PENDING_PICKUP"
                  ).length,
                  usedVolumeM3: goodsInWh.reduce(
                    (sum, g) => sum + (g.dimensions?.volumeM3 || 0),
                    0
                  ),
                  usedWeightKg: goodsInWh.reduce(
                    (sum, g) => sum + (g.dimensions?.weightKg || 0),
                    0
                  ),
                  availableVolumeM3: Math.max(
                    0,
                    rental.rentedVolumeM3 -
                      goodsInWh.reduce((sum, g) => sum + (g.dimensions?.volumeM3 || 0), 0)
                  ),
                  availableWeightKg: Math.max(
                    0,
                    rental.rentedWeightKg -
                      goodsInWh.reduce((sum, g) => sum + (g.dimensions?.weightKg || 0), 0)
                  ),
                  volumeUtilizationPercent: 0,
                  weightUtilizationPercent: 0,
                };

                const { allowed, reason } = canChangeRentalWarehouse(goodsInWh);

                const formattedStartDate = new Date(rental.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const formattedEndDate = new Date(rental.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const volumePct =
                  rental.rentedVolumeM3 > 0
                    ? Math.min(
                        100,
                        Math.round((utilization.usedVolumeM3 / rental.rentedVolumeM3) * 100)
                      )
                    : 0;
                const weightPct =
                  rental.rentedWeightKg > 0
                    ? Math.min(
                        100,
                        Math.round((utilization.usedWeightKg / rental.rentedWeightKg) * 100)
                      )
                    : 0;

                return (
                  <div
                    key={wh.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* 1. Warehouse Identity Header */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {wh.code}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{wh.city}</span>
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {wh.name}
                          </h3>
                        </div>

                        <Badge
                          className={`text-[10px] px-2.5 py-0.5 font-semibold ${
                            rental.status === "EXPIRED"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : rental.status === "EXPIRING_SOON"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {rental.status === "EXPIRED"
                            ? "Rental Expired"
                            : rental.status === "EXPIRING_SOON"
                            ? "Expiring Soon"
                            : "Rental Active"}
                        </Badge>
                      </div>

                      {/* 2. Compact Rental Countdown (Days Remaining Only) */}
                      <RentalCountdownTimer
                        endDateStr={rental.endDate}
                        status={rental.status}
                      />

                      {/* 3. Compact Storage Utilization Donut */}
                      <StorageUtilizationDonut
                        storedM3={utilization.storedVolumeM3}
                        receivingM3={utilization.receivingVolumeM3}
                        waitingM3={utilization.waitingInboundVolumeM3}
                        availableM3={utilization.availableVolumeM3}
                        totalM3={rental.rentedVolumeM3}
                        storedCount={utilization.storedCount}
                        receivingCount={utilization.receivingCount}
                        waitingCount={utilization.waitingInboundCount}
                      />

                      {/* 4. Rental Information & Rented Capacity Side-by-Side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Rental Information
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Started:</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {formattedStartDate}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Period:</span>
                            <span className="font-semibold text-slate-900">
                              {rental.durationMonths} Months
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Ends:</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {formattedEndDate}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Your Rented Capacity
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Volume:</span>
                            <span className="font-mono font-bold text-indigo-700">
                              {rental.rentedVolumeM3.toFixed(2)} m³
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Weight Limit:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {rental.rentedWeightKg.toLocaleString()} kg
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>Zone Type:</span>
                            <span className="font-medium text-slate-800">
                              {rental.storageType === "COLD_STORAGE"
                                ? "❄️ Cold Storage (-18°C)"
                                : "Standard Dry"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 5. Capacity Progress Horizontal Bars */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        {/* Volume Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-slate-600">Volume Capacity</span>
                            <span className="font-mono font-bold text-slate-900">
                              {utilization.usedVolumeM3.toFixed(2)} /{" "}
                              {rental.rentedVolumeM3.toFixed(2)} m³ ({volumePct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                volumePct >= 100
                                  ? "bg-rose-500"
                                  : volumePct >= 80
                                  ? "bg-amber-500"
                                  : "bg-indigo-600"
                              }`}
                              style={{ width: `${volumePct}%` }}
                            />
                          </div>
                        </div>

                        {/* Weight Gauge */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-medium text-slate-600">Weight Capacity</span>
                            <span className="font-mono font-bold text-slate-900">
                              {utilization.usedWeightKg.toLocaleString()} /{" "}
                              {rental.rentedWeightKg.toLocaleString()} kg ({weightPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                weightPct >= 100
                                  ? "bg-rose-500"
                                  : weightPct >= 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                              }`}
                              style={{ width: `${weightPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 6. Warehouse Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {allowed ? (
                        <Button
                          type="button"
                          onClick={() => {
                            setTransferSourceWh(wh);
                            setTransferTargetWhId("");
                            setTransferReason("");
                            setTransferError(null);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm font-semibold cursor-pointer"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          <span>Change Warehouse (Pre-Inbound)</span>
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          <Button
                            disabled
                            className="w-full bg-slate-100 text-slate-400 text-xs h-8.5 rounded-xl cursor-not-allowed border border-slate-200 flex items-center justify-center gap-1.5"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>Change Warehouse (Unavailable)</span>
                          </Button>
                          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg leading-relaxed">
                            {reason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Link href="/customer/goods/input" className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            + Register Goods
                          </Button>
                        </Link>
                        <Link href="/customer/logistics/request" className="flex-1">
                          <Button
                            variant="outline"
                            className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center justify-center gap-1"
                          >
                            <span>Request Inbound</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: New Space Rental Booking */}
      {activeTab === "NEW_BOOKING" && (
        <>
          {bookingResult ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Warehouse Space Booking Confirmed!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your space reservation for{" "}
                <strong className="text-slate-800">
                  {bookingResult.rental.volumeM3} m³
                </strong>{" "}
                (
                {bookingResult.rental.storageType === "COLD_STORAGE"
                  ? "Cold Storage -18°C"
                  : "Standard Dry Storage"}
                ) at{" "}
                <strong className="text-slate-800">
                  {bookingResult.rental.warehouseName}
                </strong>{" "}
                for{" "}
                <strong className="text-slate-800">
                  {bookingResult.rental.durationMonths} Months
                </strong>{" "}
                has been recorded.
              </p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto space-y-2 text-xs text-left">
                <div className="flex justify-between text-slate-600">
                  <span>Invoice Number:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {bookingResult.invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Period:</span>
                  <span className="font-semibold text-slate-900">
                    {bookingResult.invoice.billingMonth}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2 font-bold">
                  <span>Total Amount Due:</span>
                  <span className="text-emerald-700 font-mono">
                    Rp {bookingResult.invoice.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/customer/billing">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                    Pay Invoice Now →
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingResult(null);
                    setActiveTab("MY_RENTALS");
                  }}
                  className="text-xs h-9"
                >
                  View My Rentals
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Configuration Steps (8 Columns) */}
              <div className="lg:col-span-8 space-y-6">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Step 1: Storage Zone Type */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    1. Select Storage Zone Type & Climate Control
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setStorageType("COLD_STORAGE")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        storageType === "COLD_STORAGE"
                          ? "border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sky-600 mb-2">
                        <Snowflake className="h-5 w-5" />
                        <span className="text-xs font-bold">Cold Storage (-18°C)</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sub-zero temperature-controlled zone for frozen meat, seafood, ice cream, and pharmaceuticals.
                      </p>
                      <div className="mt-3 pt-3 border-t border-sky-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Rate:</span>
                        <span className="font-mono font-bold text-slate-800">
                          Rp {MASTER_STORAGE_RATES.COLD_STORAGE.toLocaleString("id-ID")} / m³ / month
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStorageType("STANDARD")}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        storageType === "STANDARD"
                          ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <Warehouse className="h-5 w-5" />
                        <span className="text-xs font-bold">Standard Dry Storage</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ambient humidity-controlled facility for electronics, apparel, packaged goods, and consumer items.
                      </p>
                      <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Rate:</span>
                        <span className="font-mono font-bold text-slate-800">
                          Rp {MASTER_STORAGE_RATES.STANDARD.toLocaleString("id-ID")} / m³ / month
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2: Target Warehouse Hub */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">
                    2. Choose Strategic Logistics Facility
                  </h2>

                  {isLoadingWarehouses ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Loading facilities...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {warehouses.map((wh) => (
                        <button
                          key={wh.id}
                          type="button"
                          onClick={() => setSelectedWarehouseId(wh.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            selectedWarehouseId === wh.id
                              ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20"
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
                      <span className="font-bold text-slate-900">
                        {durationMonths} Month{durationMonths > 1 ? "s" : ""}
                      </span>
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
        </>
      )}

      {/* Change Warehouse / Pre-Inbound Transfer Modal */}
      <ChangeWarehouseModal
        transferSourceWh={transferSourceWh}
        transferTargetWhId={transferTargetWhId}
        setTransferTargetWhId={setTransferTargetWhId}
        transferReason={transferReason}
        setTransferReason={setTransferReason}
        transferError={transferError}
        warehouses={warehouses}
        isPending={changeWarehouseMutation.isPending}
        onClose={() => setTransferSourceWh(null)}
        onSubmit={handleTransferSubmit}
      />

    </PageContainer>
  );
}
