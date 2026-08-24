"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  QrCode,
  Plus,
  Snowflake,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  Sparkles,
  Loader2,
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
import { toast } from "sonner";

export default function GoodsRegistrationPage() {
  const { user } = useAuth();
  const { data: warehouses = [], isLoading: isLoadingWarehouses } =
    useCustomerActiveWarehouses();
  const createGoodsMutation = useCreateGoods();

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"COLD" | "STANDARD">("COLD");
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

  // Auto-calculated volume in m3: (L * W * H in cm) / 1,000,000 * quantity
  const volumePerUnitM3 = (lengthCm * widthCm * heightCm) / 1000000;
  const totalVolumeM3 = (volumePerUnitM3 * quantity).toFixed(2);

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

    try {
      const created = await createGoodsMutation.mutateAsync({
        input: {
          name,
          category: category === "COLD" ? "COLD_FOOD" : "GENERAL_ELECTRONICS",
          description: batchNo || expiryDate ? `Batch ${batchNo || "N/A"}, Exp: ${expiryDate || "N/A"}` : "Stored goods",
          dimensions: {
            lengthCm,
            widthCm,
            heightCm,
            weightKg,
          },
          quantity,
          unit: "Packages",
          requiresColdStorage: category === "COLD",
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

  const selectedWh = warehouses.find((w) => w.id === warehouseId || w.code === warehouseId);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Goods Intake"
        title="Goods Registration & Dimension Calculator"
        subtitle="Register new inventory items, automatically calculate volume m³ estimates from physical dimensions, and generate QR code labels."
        badgeText="SKU Registration"
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
            SKU <span className="font-mono font-bold text-indigo-600">{registeredBarcode}</span> ({name}) with {quantity} Packages ({totalVolumeM3} m³) has been registered at {selectedWh?.name || "Warehouse"} and is ready for rack slot allocation.
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
          {/* Left: Input Fields (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Master Goods Information & Category
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
                          {wh.name} ({wh.code})
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

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Storage Condition Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory("COLD")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      category === "COLD"
                        ? "border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Snowflake className="h-4 w-4 text-sky-600" />
                    <span className="text-xs">Cold Storage (-18°C Sub-zero)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("STANDARD")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      category === "STANDARD"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Warehouse className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs">Standard Dry Storage</span>
                  </button>
                </div>
              </div>

              {/* Batch & Expiry */}
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

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dimension Calculator Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Physical Dimensions & Volume Calculator (m³)
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-600 font-bold">
                  {totalVolumeM3} m³ Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Package Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-600 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
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
                    {quantity} Packages • {totalVolumeM3} m³
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={createGoodsMutation.isPending || !name}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createGoodsMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering Goods...</span>
                  </>
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
