"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  QrCode,
  Plus,
  Minus,
  Snowflake,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  Sparkles,
  Loader2,
  Scale,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/dashboard";
import { useCreateGoods } from "@/hooks/use-goods";
import { useCustomerActiveWarehouses } from "@/hooks/use-warehouses";
import { useAuth } from "@/hooks/use-auth";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { calculateVolumeM3 } from "@/lib/utils";

interface NumberStepperProps {
  label: string;
  unit?: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  buttonStep?: number;
  allowDecimals?: boolean;
  highlight?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

function NumberStepper({
  label,
  unit,
  value,
  onChange,
  min = 1,
  max = 99999,
  buttonStep = 1,
  allowDecimals = false,
  highlight = false,
  isError = false,
  errorMessage,
}: NumberStepperProps) {
  const [displayValue, setDisplayValue] = useState(String(value));

  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    if (raw === "") return;
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (displayValue === "" || isNaN(Number(displayValue)) || Number(displayValue) < min) {
      setDisplayValue(String(min));
      onChange(min);
    } else if (Number(displayValue) > max) {
      setDisplayValue(String(max));
      onChange(max);
    } else {
      const parsed = allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10);
      setDisplayValue(String(parsed));
      onChange(parsed);
    }
  };

  const handleDecrement = () => {
    const stepAmount = buttonStep || 1;
    const next = Math.max(
      min,
      allowDecimals
        ? Number((value - stepAmount).toFixed(2))
        : Math.round(value - stepAmount)
    );
    setDisplayValue(String(next));
    onChange(next);
  };

  const handleIncrement = () => {
    const stepAmount = buttonStep || 1;
    const next = Math.min(
      max,
      allowDecimals
        ? Number((value + stepAmount).toFixed(2))
        : Math.round(value + stepAmount)
    );
    setDisplayValue(String(next));
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-700 block">
          {label}
        </label>
        {unit && (
          <span className="text-[10.5px] font-mono font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>

      <div
        className={`flex items-center rounded-xl transition-all overflow-hidden shadow-2xs ${
          isError
            ? "bg-rose-50 border-2 border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20"
            : "bg-slate-50 border border-slate-200 hover:border-slate-300 focus-within:border-indigo-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10"
        }`}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-9 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 active:bg-slate-300/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer shrink-0"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3 w-3" />
        </button>

        <input
          type="number"
          min={min}
          max={max}
          step={allowDecimals ? "any" : "1"}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`w-full h-9 bg-transparent text-center text-xs font-mono font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            isError
              ? "text-rose-700 font-extrabold"
              : highlight
              ? "text-indigo-600"
              : "text-slate-900"
          }`}
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-9 w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 active:bg-slate-300/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer shrink-0"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {errorMessage && (
        <p className="text-[10px] text-rose-600 font-medium leading-tight">{errorMessage}</p>
      )}
    </div>
  );
}

export default function GoodsRegistrationPage() {
  const { user } = useAuth();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } =
    useCustomerActiveWarehouses();
  const createGoodsMutation = useCreateGoods();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(10);
  const [lengthCm, setLengthCm] = useState<number>(50);
  const [widthCm, setWidthCm] = useState<number>(40);
  const [heightCm, setHeightCm] = useState<number>(30);
  const [weightKg, setWeightKg] = useState<number>(15);
  const [batchNo, setBatchNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredBarcode, setRegisteredBarcode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default warehouse once loaded
  useEffect(() => {
    if (warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].id || warehouses[0].code);
    }
  }, [warehouses, warehouseId]);

  const selectedWh = warehouses.find((w) => w.id === warehouseId || w.code === warehouseId);
  const rental = selectedWh?.customerRental;
  const utilization = selectedWh?.customerUtilization;

  // Derive storage capability strictly from selected warehouse rental agreement
  const storageType: "COLD_STORAGE" | "STANDARD" | "HEAVY_DUTY" =
    rental?.storageType ||
    (selectedWh?.name?.toLowerCase().includes("cold") ? "COLD_STORAGE" : "STANDARD");
  const isColdStorage = storageType === "COLD_STORAGE";

  // Capacity Limits
  const rentedVolumeM3 = rental?.rentedVolumeM3 || 50.0;
  const rentedWeightKg = rental?.rentedWeightKg || Number((rentedVolumeM3 * 100).toFixed(2));
  const usedVolumeM3 = utilization?.usedVolumeM3 || 0;
  const usedWeightKg = utilization?.usedWeightKg || 0;
  const remainingVolumeM3 = Math.max(0, Number((rentedVolumeM3 - usedVolumeM3).toFixed(4)));
  const remainingWeightKg = Math.max(0, Number((rentedWeightKg - usedWeightKg).toFixed(2)));

  // Auto-calculated volume & weight in m3 / kg
  const volumePerUnitM3 = calculateVolumeM3(lengthCm, widthCm, heightCm);
  const totalVolumeM3 = Number((volumePerUnitM3 * quantity).toFixed(4));
  const totalWeightKg = Number((weightKg * quantity).toFixed(2));

  // Capacity Exceeded Checks
  const isVolumeExceeded = totalVolumeM3 > remainingVolumeM3 + 0.0001;
  const isWeightExceeded = totalWeightKg > remainingWeightKg + 0.01;
  const isRentalExpired = Boolean(rental?.isExpired);
  const isBlocked = isVolumeExceeded || isWeightExceeded || isRentalExpired;

  // Projected utilization progress calculations
  const projectedVolumeM3 = usedVolumeM3 + totalVolumeM3;
  const projectedVolumePct = rentedVolumeM3 > 0
    ? Math.min(100, Math.round((projectedVolumeM3 / rentedVolumeM3) * 100))
    : 0;

  const projectedWeightKg = usedWeightKg + totalWeightKg;
  const projectedWeightPct = rentedWeightKg > 0
    ? Math.min(100, Math.round((projectedWeightKg / rentedWeightKg) * 100))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("You must be logged in to register goods.");
      return;
    }

    if (!warehouseId) {
      setErrorMessage("Please select a destination warehouse facility.");
      return;
    }

    if (lengthCm < 1 || widthCm < 1 || heightCm < 1) {
      setErrorMessage("Length, width, and height must each be at least 1 cm.");
      return;
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      setErrorMessage("Package quantity must be a whole number of at least 1 package.");
      return;
    }

    if (weightKg < 0.1) {
      setErrorMessage("Unit weight must be at least 0.1 kg.");
      return;
    }

    if (isRentalExpired) {
      setErrorMessage("Your warehouse rental agreement has expired. Please renew your rental space first.");
      return;
    }

    if (isVolumeExceeded) {
      setErrorMessage(
        `Warehouse rental capacity exceeded. You only have ${remainingVolumeM3.toFixed(2)} m³ remaining in your rental agreement. Requested: ${totalVolumeM3.toFixed(2)} m³.`
      );
      return;
    }

    if (isWeightExceeded) {
      setErrorMessage(
        `Warehouse rental weight limit exceeded. You only have ${remainingWeightKg.toFixed(2)} kg remaining in your rental agreement. Requested: ${totalWeightKg.toFixed(2)} kg.`
      );
      return;
    }

    try {
      const created = await createGoodsMutation.mutateAsync({
        input: {
          name,
          category: isColdStorage ? "COLD_FOOD" : "GENERAL_ELECTRONICS",
          description:
            batchNo || expiryDate
              ? `Batch ${batchNo || "N/A"}, Exp: ${expiryDate || "N/A"}`
              : isColdStorage
              ? "Cold chain perishable inventory"
              : "Standard dry inventory",
          dimensions: {
            lengthCm,
            widthCm,
            heightCm,
            weightKg: totalWeightKg,
          },
          quantity,
          unit: "Packages",
          requiresColdStorage: isColdStorage,
          warehouseId,
          pickupRequired: false,
        },
        customerId: user.id,
        customerName: user.name || user.companyName || "Customer",
      });

      const finalBarcode = created?.barcode || sku || "BARCODE-GEN";
      setRegisteredBarcode(finalBarcode);
      setIsRegistered(true);
      toast.success("Goods Registered Successfully", {
        description: `SKU ${finalBarcode} successfully registered to PostgreSQL.`,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to register goods. Please verify your inputs.");
    }
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Goods Intake"
        title="Goods Registration & Dimension Calculator"
        subtitle="Register new inventory items with dynamic rental capacity limits, real-time volume calculations, and ISO-standard date selection."
        badgeText="SKU Registration & Capacity Guardrails"
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/goods">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                View Goods List
              </Button>
            </Link>
            <Link href="/customer/rental">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                Rented Warehouses
              </Button>
            </Link>
          </div>
        }
      />

      {!isLoadingWarehouses && warehouses.length === 0 ? (
        <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Warehouse className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            No Active Storage Space Found
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            You do not have an active warehouse storage rental contract in WMS Nusantara yet. Please reserve a storage space (Rental Space) first before registering your inventory.
          </p>
          <div className="pt-2">
            <Link href="/customer/rental">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 font-semibold shadow-sm">
                Rent Warehouse Space Now →
              </Button>
            </Link>
          </div>
        </div>
      ) : isRegistered ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Goods Successfully Registered to the System!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            SKU <span className="font-mono font-bold text-indigo-600">{registeredBarcode}</span> ({name}) with {quantity} Packages ({totalVolumeM3.toFixed(2)} m³, {totalWeightKg.toFixed(1)} kg) has been registered at {selectedWh?.name || "Warehouse"} and is ready for rack slot allocation.
          </p>

          {/* QR Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto text-center space-y-2">
            <div className="h-32 w-32 bg-white border-2 border-slate-800 border-dashed rounded-lg mx-auto flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-slate-800">
                [ QR CODE ]<br />
                {registeredBarcode}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              QR Label Ready to Print & Attach to Master Box
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/goods">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                View in My Inventory →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setIsRegistered(false);
                setName("");
                setSku("");
                setBatchNo("");
              }}
              className="text-xs h-9"
            >
              Register Another Good
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Fields & Calculator (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Master Goods Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Master Goods Information & Destination Facility
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Product / Goods Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frozen Beef Ribeye A5"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Destination Warehouse Facility *
                  </label>
                  {warehouses.length > 0 ? (
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code}) — {wh.customerRental?.rentedVolumeM3 ? `${wh.customerRental.rentedVolumeM3} m³ Rented` : wh.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                      <span>No active rented warehouse</span>
                      <Link
                        href="/customer/rental"
                        className="text-emerald-700 font-bold underline text-[11px]"
                      >
                        Rent Space →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage Condition (Determined by Active Warehouse Rental) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Storage Condition Requirement
                </label>
                {isColdStorage ? (
                  <div className="p-3.5 bg-sky-50/90 border border-sky-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                        <Snowflake className="h-5 w-5 animate-pulse text-sky-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-sky-950">
                            ❄️ Cold Storage Sub-zero (-18°C)
                          </span>
                          <Badge className="bg-sky-600 text-white text-[10px] font-semibold border-0">
                            Cold Chain Enforced
                          </Badge>
                        </div>
                        <p className="text-[11px] text-sky-700/90 mt-0.5">
                          Determined by your active warehouse rental agreement at {selectedWh?.name || "Facility"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-mono font-bold text-sky-900 bg-white/80 px-2.5 py-1 rounded-md border border-sky-200 shadow-2xs">
                        Target: -22°C ~ -18°C
                      </span>
                    </div>
                  </div>
                ) : storageType === "HEAVY_DUTY" ? (
                  <div className="p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                        <Scale className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-950">
                            🏗️ Heavy Duty High Payload Storage
                          </span>
                          <Badge className="bg-indigo-600 text-white text-[10px] font-semibold border-0">
                            High Load Zone
                          </Badge>
                        </div>
                        <p className="text-[11px] text-indigo-700/90 mt-0.5">
                          Determined by your active warehouse rental agreement at {selectedWh?.name || "Facility"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-mono font-bold text-indigo-900 bg-white/80 px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs">
                        Ambient Load Zone
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                        <Warehouse className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-950">
                            📦 Standard Dry Storage (24°C Ambient)
                          </span>
                          <Badge className="bg-emerald-600 text-white text-[10px] font-semibold border-0">
                            Ambient Dry Zone
                          </Badge>
                        </div>
                        <p className="text-[11px] text-emerald-700/90 mt-0.5">
                          Determined by your active warehouse rental agreement at {selectedWh?.name || "Facility"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-mono font-bold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
                        Ambient: ~24°C
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Batch & Custom DatePicker for Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Production Batch Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH-2026-08"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                {/* Light-themed DatePicker */}
                <DatePicker
                  label="Product Expiry Date"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  placeholder="Select Expiry Date"
                  minDate={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Dynamic Physical Dimensions & Volume Calculator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      Physical Dimensions & Volume Calculator
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Per unit: <strong className="font-mono text-slate-700">{volumePerUnitM3.toFixed(4)} m³</strong> • Formula: (L × W × H / 10⁶) × Qty
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold shadow-2xs ${
                      isVolumeExceeded
                        ? "bg-rose-100 border border-rose-300 text-rose-700"
                        : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {totalVolumeM3.toFixed(2)} m³ Total
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold shadow-2xs ${
                      isWeightExceeded
                        ? "bg-rose-100 border border-rose-300 text-rose-700"
                        : "bg-indigo-50 border border-indigo-200 text-indigo-700"
                    }`}
                  >
                    {totalWeightKg.toFixed(1)} kg Total
                  </span>
                </div>
              </div>

              {/* Live Rental Capacity Comparison Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Customer Rental Allocation ({selectedWh?.name || "Warehouse"})</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Remaining: <strong className="text-emerald-700">{remainingVolumeM3.toFixed(2)} m³</strong> / <strong className="text-indigo-700">{remainingWeightKg.toLocaleString()} kg</strong>
                  </span>
                </div>

                {/* Progress Visuals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  {/* Volume Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Volume Utilization:</span>
                      <span className={`font-mono font-bold ${isVolumeExceeded ? "text-rose-600" : "text-slate-900"}`}>
                        {projectedVolumeM3.toFixed(2)} / {rentedVolumeM3.toFixed(2)} m³ ({projectedVolumePct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isVolumeExceeded
                            ? "bg-rose-500"
                            : projectedVolumePct >= 80
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                        style={{ width: `${projectedVolumePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Weight Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Weight Utilization:</span>
                      <span className={`font-mono font-bold ${isWeightExceeded ? "text-rose-600" : "text-slate-900"}`}>
                        {projectedWeightKg.toLocaleString()} / {rentedWeightKg.toLocaleString()} kg ({projectedWeightPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isWeightExceeded
                            ? "bg-rose-500"
                            : projectedWeightPct >= 80
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${projectedWeightPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Error Banners when Limit Exceeded */}
              {isRentalExpired ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 animate-in fade-in">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <span>Rental Agreement Expired</span>
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Your space rental agreement in this warehouse has expired. Please renew your contract before registering new inventory.
                  </p>
                </div>
              ) : isVolumeExceeded ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 animate-in fade-in">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Volume Capacity Exceeded</span>
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    You only have <strong className="font-mono">{remainingVolumeM3.toFixed(2)} m³</strong> remaining in your current warehouse rental. Requested: <strong className="font-mono">{totalVolumeM3.toFixed(2)} m³</strong>. Please reduce package quantity or unit dimensions.
                  </p>
                </div>
              ) : isWeightExceeded ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 animate-in fade-in">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Weight Capacity Exceeded</span>
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    You only have <strong className="font-mono">{remainingWeightKg.toFixed(2)} kg</strong> remaining in your current warehouse rental. Requested: <strong className="font-mono">{totalWeightKg.toFixed(2)} kg</strong>. Please reduce package quantity or unit weight.
                  </p>
                </div>
              ) : null}

              {/* Number Steppers Grid - Configured with consistent step=1 for integers and step="any" for decimals */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
                <NumberStepper
                  label="Length"
                  unit="cm"
                  value={lengthCm}
                  onChange={setLengthCm}
                  min={1}
                  max={5000}
                  buttonStep={5}
                  allowDecimals={false}
                  isError={isVolumeExceeded || lengthCm < 1}
                  errorMessage={lengthCm < 1 ? "Min 1 cm" : undefined}
                />

                <NumberStepper
                  label="Width"
                  unit="cm"
                  value={widthCm}
                  onChange={setWidthCm}
                  min={1}
                  max={5000}
                  buttonStep={5}
                  allowDecimals={false}
                  isError={isVolumeExceeded || widthCm < 1}
                  errorMessage={widthCm < 1 ? "Min 1 cm" : undefined}
                />

                <NumberStepper
                  label="Height"
                  unit="cm"
                  value={heightCm}
                  onChange={setHeightCm}
                  min={1}
                  max={5000}
                  buttonStep={5}
                  allowDecimals={false}
                  isError={isVolumeExceeded || heightCm < 1}
                  errorMessage={heightCm < 1 ? "Min 1 cm" : undefined}
                />

                <NumberStepper
                  label="Package Quantity"
                  unit="Pkgs"
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={99999}
                  buttonStep={1}
                  allowDecimals={false}
                  highlight
                  isError={isVolumeExceeded || isWeightExceeded || quantity < 1}
                  errorMessage={quantity < 1 ? "Min 1 pkg" : undefined}
                />

                <NumberStepper
                  label="Unit Weight"
                  unit="kg"
                  value={weightKg}
                  onChange={setWeightKg}
                  min={0.1}
                  max={50000}
                  buttonStep={1}
                  allowDecimals={true}
                  isError={isWeightExceeded || weightKg < 0.1}
                  errorMessage={weightKg < 0.1 ? "Min 0.1 kg" : undefined}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Preview & QR (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                SKU & QR Label Preview
              </h2>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <div className="h-28 w-28 bg-white border-2 border-slate-800 border-dashed rounded-lg mx-auto flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-slate-800" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-indigo-600">Auto-Generated Barcode</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{name || "Product Name"}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    {quantity} Packages • {totalVolumeM3.toFixed(2)} m³ • {totalWeightKg.toFixed(1)} kg
                  </p>
                </div>
              </div>

              {/* Status Notice */}
              {isBlocked && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-amber-600" />
                    <span>Submission Blocked</span>
                  </p>
                  <p>
                    {isRentalExpired
                      ? "Rental agreement has expired."
                      : isVolumeExceeded
                      ? "Requested volume exceeds remaining rental capacity."
                      : "Requested weight exceeds remaining rental limit."}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={createGoodsMutation.isPending || !name || isBlocked}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createGoodsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering Goods...</span>
                  </>
                ) : isBlocked ? (
                  <span>Capacity Exceeded (Blocked)</span>
                ) : (
                  <span>Save & Register SKU</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </PageContainer>
  );
}
