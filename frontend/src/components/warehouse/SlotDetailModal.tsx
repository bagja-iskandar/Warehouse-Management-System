"use client";

import React, { useState } from "react";
import {
  X,
  Thermometer,
  Boxes,
  QrCode,
  ArrowRightLeft,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Loader2,
  Printer,
  ChevronRight,
  Search,
  Copy,
  Check,
  Weight,
  Layers,
  Snowflake,
  Info,
  Scale,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageSlot, StorageZoneType, StoredGoodDetail } from "@/types/warehouse.types";
import { useTransferGoodsSlot } from "@/hooks/use-goods";
import { toast } from "sonner";

export interface SlotData {
  id: string;
  code: string;
  warehouseId?: string;
  warehouseName?: string;
  zone: "A" | "B" | "C" | string;
  zoneName: string;
  zoneType: StorageZoneType;
  temperature: string;
  humidity?: string;
  status: "OCCUPIED" | "PARTIAL" | "AVAILABLE" | "MAINTENANCE" | string;
  capacityM3: number;
  usedM3: number;
  availableM3?: number;
  volumeUtilizationPercent?: number;
  maxWeightKg?: number;
  usedWeightKg?: number;
  availableWeightKg?: number;
  weightUtilizationPercent?: number;
  capacityStatus?: string;
  customerCount?: number;
  totalPackagesCount?: number;
  currentGoodsCount?: number;
  tenantName?: string;
  tenantPic?: string;
  itemSku?: string;
  itemName?: string;
  itemQuantity?: string;
  storedGoods?: StoredGoodDetail[];
  lastUpdated?: string;
}

interface SlotDetailModalProps {
  slot: SlotData | null;
  isOpen: boolean;
  onClose: () => void;
  availableSlots?: StorageSlot[];
  onTransferSuccess?: () => void;
}

export function SlotDetailModal({
  slot,
  isOpen,
  onClose,
  availableSlots = [],
  onTransferSuccess,
}: SlotDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedGoodId, setSelectedGoodId] = useState<string>("");
  const [targetSlotId, setTargetSlotId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferNote, setTransferNote] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const transferMutation = useTransferGoodsSlot();

  if (!isOpen || !slot) return null;

  // Base goods list from slot data
  const goodsList: StoredGoodDetail[] = slot.storedGoods || [];

  // Filtered goods by search query
  const filteredGoods = goodsList.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.barcode.toLowerCase().includes(q) ||
      g.customerName.toLowerCase().includes(q) ||
      (g.customerCompany && g.customerCompany.toLowerCase().includes(q))
    );
  });

  // Calculate Capacity Metrics
  const capacityM3 = Number(slot.capacityM3) || 100;
  const usedM3 = Number(slot.usedM3) || 0;
  const availableM3 = Math.max(0, Number((capacityM3 - usedM3).toFixed(2)));
  const volPct = capacityM3 > 0 ? Number(((usedM3 / capacityM3) * 100).toFixed(1)) : 0;

  const maxWeightKg = Number(slot.maxWeightKg) || capacityM3 * 50;
  const usedWeightKg =
    Number(slot.usedWeightKg) ||
    goodsList.reduce((sum, g) => sum + (Number(g.weightKg) || 0), 0);
  const availableWeightKg = Math.max(0, Number((maxWeightKg - usedWeightKg).toFixed(1)));
  const weightPct = maxWeightKg > 0 ? Number(((usedWeightKg / maxWeightKg) * 100).toFixed(1)) : 0;

  // Distinct customer count & total package count
  const customerCount =
    slot.customerCount ?? new Set(goodsList.map((g) => g.customerId || g.customerName)).size;
  const totalPackages =
    slot.totalPackagesCount ?? goodsList.reduce((sum, g) => sum + (g.quantity || 1), 0);

  // Overall Bottleneck Capacity Status Badge
  const getCapacityStatusBadge = () => {
    if (volPct >= 100 || weightPct >= 100) {
      return (
        <Badge className="bg-rose-600 text-white text-[10.5px] gap-1 py-0.5 px-2 font-semibold shadow-2xs">
          <AlertTriangle className="h-3 w-3" />
          {volPct >= 100 && weightPct >= 100
            ? "Fully Saturated"
            : volPct >= 100
            ? "Volume Full"
            : "Weight Load Full"}
        </Badge>
      );
    }
    if (weightPct >= 85 && weightPct >= volPct) {
      return (
        <Badge className="bg-amber-500 text-slate-950 text-[10.5px] gap-1 py-0.5 px-2 font-bold shadow-2xs">
          <Scale className="h-3 w-3" />
          Near Weight Capacity ({weightPct}%)
        </Badge>
      );
    }
    if (volPct >= 85 && volPct > weightPct) {
      return (
        <Badge className="bg-amber-500 text-slate-950 text-[10.5px] gap-1 py-0.5 px-2 font-bold shadow-2xs">
          <Boxes className="h-3 w-3" />
          Near Volume Capacity ({volPct}%)
        </Badge>
      );
    }
    if (volPct > 0 || weightPct > 0) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10.5px] gap-1 py-0.5 px-2 font-semibold">
          <CheckCircle2 className="h-3 w-3" />
          Active Stored ({Math.max(volPct, weightPct)}%)
        </Badge>
      );
    }
    return (
      <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-[10.5px] py-0.5 px-2">
        Vacant / Ready
      </Badge>
    );
  };

  const getSlotStatusBadge = () => {
    switch (slot.status) {
      case "OCCUPIED":
        return <Badge className="bg-indigo-600 text-white text-[10.5px] px-2 font-semibold">Occupied / Stored</Badge>;
      case "PARTIAL":
        return <Badge className="bg-emerald-600 text-white text-[10.5px] px-2 font-semibold">Partially Stored</Badge>;
      case "AVAILABLE":
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-300 text-[10.5px] px-2 font-medium">
            Vacant Available
          </Badge>
        );
      case "MAINTENANCE":
        return <Badge className="bg-amber-500 text-slate-950 text-[10.5px] px-2 font-bold">Rack Maintenance</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 text-[10.5px] px-2">{slot.status}</Badge>;
    }
  };

  // Compatible target slots (same warehouse, not current slot, not maintenance)
  const candidateSlots = availableSlots.filter(
    (s) => s.id !== slot.id && s.status !== "MAINTENANCE"
  );

  const handleOpenTransfer = (goodId?: string) => {
    const targetGood = goodId || (goodsList.length > 0 ? goodsList[0].id : "");
    setSelectedGoodId(targetGood);
    setTargetSlotId(candidateSlots.length > 0 ? candidateSlots[0].id : "");
    setTransferReason("Rack space optimization and load balancing");
    setTransferNote("");
    setTransferError(null);
    setShowTransferForm(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (!selectedGoodId) {
      setTransferError("Please select an item to transfer.");
      toast.error("Please select an item to transfer.");
      return;
    }
    if (!targetSlotId) {
      setTargetSlotId(candidateSlots.length > 0 ? candidateSlots[0].id : "");
      if (candidateSlots.length === 0) {
        setTransferError("No available candidate slots found.");
        toast.error("No available candidate slots found.");
        return;
      }
    }
    if (!transferReason || transferReason.trim().length < 3) {
      setTransferError("Transfer reason must be at least 3 characters.");
      toast.error("Transfer reason must be at least 3 characters.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: selectedGoodId,
        targetSlotId: targetSlotId || candidateSlots[0].id,
        reason: transferReason.trim(),
        note: transferNote.trim() || undefined,
      });

      toast.success("Rack Transfer Successful", {
        description: `Item successfully relocated to the new rack slot with dual capacity recalculation.`,
      });
      setShowTransferForm(false);
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || "An error occurred while transferring the rack slot.";
      setTransferError(errMsg);
      toast.error("Transfer Failed", { description: errMsg });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    toast.success(`Copied SKU: ${text}`);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Spacious Modal Container: w-[94vw] max-w-[1360px] with zero horizontal table scrollbar */}
      <div className="w-[94vw] max-w-[1360px] max-h-[88vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col my-auto">
        
        {/* ========================================================================= */}
        {/* 1. CLEAN COMPACT HEADER (Fixed at top)                                    */}
        {/* ========================================================================= */}
        <div className="px-7 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm shadow-indigo-600/20 shrink-0">
              {slot.code.split("-")[0] || "RK"}
            </div>
            <div>
              {/* Row 1: COLD-B02 · Rack Slot + Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {slot.code}
                </span>
                <span className="text-xs sm:text-sm font-medium text-slate-300">·</span>
                <span className="text-xs sm:text-sm font-semibold text-slate-600">Rack Slot</span>
                <div className="flex items-center gap-1.5 ml-1 flex-wrap">
                  {getSlotStatusBadge()}
                  {getCapacityStatusBadge()}
                </div>
              </div>
              {/* Row 2: Breadcrumb Context */}
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>{slot.zoneName}</span>
                <span>·</span>
                <span>{slot.warehouseName || "Warehouse Facility"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUMMARY INFORMATION STRIP (Fixed 4 Cards)                               */}
        {/* ========================================================================= */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {/* Card 1: Volume Capacity */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <Boxes className="h-3.5 w-3.5 text-indigo-600" />
                  Volume Capacity
                </span>
                <span className="font-bold text-indigo-600 font-mono text-[11.5px]">
                  {volPct}%
                </span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-tight">
                  {usedM3} <span className="text-xs font-normal text-slate-400 font-sans">/ {capacityM3} m³</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5 font-mono">
                  {availableM3} m³ Available
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    volPct >= 100 ? "bg-rose-500" : volPct >= 85 ? "bg-amber-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, volPct))}%` }}
                />
              </div>
            </div>

            {/* Card 2: Weight Load Capacity */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <Scale className="h-3.5 w-3.5 text-amber-600" />
                  Weight Load Capacity
                </span>
                <span className="font-bold text-amber-700 font-mono text-[11.5px]">
                  {weightPct}%
                </span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-tight">
                  {usedWeightKg.toLocaleString("en-US")}{" "}
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    / {maxWeightKg.toLocaleString("en-US")} kg
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5 font-mono">
                  {availableWeightKg.toLocaleString("en-US")} kg Available
                </p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    weightPct >= 100 ? "bg-rose-500" : weightPct >= 85 ? "bg-amber-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, weightPct))}%` }}
                />
              </div>
            </div>

            {/* Card 3: Tenant & Packages */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <Building2 className="h-3.5 w-3.5 text-sky-600" />
                  Tenant & Packages
                </span>
                <Badge className="bg-slate-100 text-slate-700 text-[9.5px] py-0 px-1.5 font-medium">
                  Multi-Tenant
                </Badge>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-tight">
                  {totalPackages} <span className="text-xs font-semibold text-slate-600 font-sans">Packages</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <strong>{customerCount}</strong> Tenant(s) · <strong>{goodsList.length}</strong> Active SKU(s)
                </p>
              </div>
              <div className="text-[10.5px] text-slate-400 font-medium truncate">
                {goodsList.length > 0 ? "Active Verified Inventory" : "No Cargo Stored"}
              </div>
            </div>

            {/* Card 4: Sensor Telemetry */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <Thermometer className="h-3.5 w-3.5 text-emerald-600" />
                  Sensor Telemetry
                </span>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-tight">
                  {slot.temperature}
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5 font-mono">
                  {slot.humidity || "60% RH"} · Sensor Online
                </p>
              </div>
              <div className="text-[10.5px] text-slate-400 font-medium">
                Calibrated Sub-Zero Sensor
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. STORED INVENTORY MAIN BODY (Scrollable Section)                        */}
        {/* ========================================================================= */}
        <div className="px-7 py-5 overflow-y-auto flex-1 flex flex-col min-h-0 space-y-4">
          {showTransferForm ? (
            /* Relocation Form Overlay View */
            <form onSubmit={handleExecuteTransfer} className="space-y-4 max-w-2xl mx-auto py-2 w-full animate-in fade-in duration-150">
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center gap-3 text-indigo-950 text-xs">
                <ArrowRightLeft className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Intra-Rack Goods Relocation</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Move an inventory item from Slot <strong>{slot.code}</strong> to another compatible
                    slot. Both volume (m³) and weight (kg) constraints will be verified in real time.
                  </p>
                </div>
              </div>

              {transferError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{transferError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Item to Relocate (SKU) *
                </label>
                {goodsList.length > 1 ? (
                  <select
                    value={selectedGoodId}
                    onChange={(e) => setSelectedGoodId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    {goodsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.barcode} — {g.name} ({g.quantity} {g.unit || "pkgs"} • {g.volumeM3} m³ •{" "}
                        {g.weightKg} kg) [Owner: {g.customerCompany || g.customerName}]
                      </option>
                    ))}
                  </select>
                ) : goodsList.length === 1 ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{goodsList[0].name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {goodsList[0].quantity} pkgs • {goodsList[0].volumeM3} m³ • {goodsList[0].weightKg} kg •
                        Owner: {goodsList[0].customerCompany || goodsList[0].customerName}
                      </span>
                    </div>
                    <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {goodsList[0].barcode}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-rose-600">No items currently stored in this slot.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Destination Rack Slot *
                </label>
                {candidateSlots.length > 0 ? (
                  <select
                    value={targetSlotId}
                    onChange={(e) => setTargetSlotId(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    {candidateSlots.map((s) => {
                      const availM3 = Math.max(0, Number(s.capacityM3) - Number(s.usedM3)).toFixed(1);
                      const maxWt = Number(s.capacityM3) * 50;
                      const availWt = Math.max(0, maxWt - (Number(s.usedWeightKg) || 0)).toFixed(0);
                      const isColdMatch =
                        slot.zoneType === "COLD_STORAGE" ? s.zone === "COLD_STORAGE" : true;
                      return (
                        <option key={s.id} value={s.id}>
                          Slot {s.code} ({s.zone}) • Avail: {availM3} m³ / {availWt} kg{" "}
                          {s.status === "AVAILABLE" ? "[VACANT]" : "[PARTIAL]"}
                          {!isColdMatch ? " ⚠️ NOT COLD STORAGE" : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                    No other candidate slots available in this facility.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Transfer Reason *
                </label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Rack capacity optimization and load distribution in cold storage bay"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Relocated to lower tier for quick forklift access"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferForm(false)}
                  className="text-xs h-9 px-4 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={transferMutation.isPending || candidateSlots.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  {transferMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying & Relocating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirm Relocation</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : showQrModal ? (
            /* Print Slot QR Label View */
            <div className="space-y-4 text-center py-4 max-w-sm mx-auto animate-in fade-in duration-150">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 shadow-sm">
                <div className="h-44 w-44 bg-white border-2 border-slate-900 border-dashed rounded-2xl mx-auto flex flex-col items-center justify-center p-3 shadow-xs">
                  <QrCode className="h-20 w-20 text-slate-900 stroke-[1.5]" />
                  <span className="text-xs font-mono font-bold text-slate-900 mt-2">
                    SLOT-{slot.code}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Rack Slot Location {slot.code}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {slot.zoneName}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Cap: {capacityM3} m³ • Max Load: {maxWeightKg.toLocaleString("en-US")} kg
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setShowQrModal(false)}
                  className="text-xs h-9 rounded-xl border-slate-300"
                >
                  Back to Details
                </Button>
                <Button
                  onClick={() => {
                    toast.success(`Slot QR Label ${slot.code} ready to print.`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print QR Label</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Main Inventory List View */
            <>
              {/* Section Header with Horizontal Search Alignment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Stored Inventory in Rack
                    </h3>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                      {goodsList.length} Items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical items currently stored and verified in this rack slot.
                  </p>
                </div>

                {goodsList.length > 0 && (
                  <div className="relative w-full sm:w-80 shrink-0">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search inventory, SKU, tenant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-indigo-600 shadow-2xs transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Table Container with zero horizontal scrolling */}
              {filteredGoods.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white flex-1 flex flex-col min-h-0">
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 z-10">
                        <tr className="text-slate-600 font-semibold text-[11.5px]">
                          <th className="py-3 px-4 w-[20%]">Customer / Tenant</th>
                          <th className="py-3 px-4 w-[20%]">Goods / Item</th>
                          <th className="py-3 px-4 w-[16%] whitespace-nowrap">SKU / Barcode</th>
                          <th className="py-3 px-4 text-right w-[8%] whitespace-nowrap">Quantity</th>
                          <th className="py-3 px-4 text-right w-[8%] whitespace-nowrap">Volume</th>
                          <th className="py-3 px-4 text-right w-[8%] whitespace-nowrap">Weight</th>
                          <th className="py-3 px-4 text-center w-[10%] whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 text-center w-[5%] whitespace-nowrap">Temp</th>
                          <th className="py-3 px-4 text-right w-[5%] whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredGoods.map((item) => {
                          const isCold =
                            item.category === "COLD_FOOD" ||
                            item.name.toLowerCase().includes("frozen") ||
                            item.name.toLowerCase().includes("salmon") ||
                            item.name.toLowerCase().includes("wagyu");
                          const isCopied = copiedSku === item.barcode;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* 1. Customer / Tenant */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 block leading-tight text-[12.5px]">
                                    {item.customerCompany || item.customerName}
                                  </span>
                                  {item.customerCompany && item.customerName !== item.customerCompany && (
                                    <span className="text-[11px] text-slate-500 block">
                                      PIC: {item.customerName}
                                    </span>
                                  )}
                                  {item.customerPhone && (
                                    <span className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1">
                                      <Phone className="h-2.5 w-2.5" />
                                      {item.customerPhone}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 2. Goods / Item */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1.5">
                                  <span className="font-bold text-slate-900 block text-[12.5px]">
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isCold ? (
                                      <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] gap-1 py-0.5 px-2 font-medium">
                                        <Snowflake className="h-2.5 w-2.5" />
                                        Cold Storage
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] py-0.5 px-2 font-medium">
                                        Standard Dry
                                      </Badge>
                                    )}
                                    {item.dimensions && item.dimensions.lengthCm > 0 && (
                                      <span className="text-[10.5px] font-mono text-slate-400">
                                        {item.dimensions.lengthCm}×{item.dimensions.widthCm}×{item.dimensions.heightCm} cm
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 3. SKU / Barcode (Single Line No Wrap) */}
                              <td className="py-3.5 px-4 align-top font-mono whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 text-[11.5px] tracking-tight whitespace-nowrap">
                                    {item.barcode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.barcode)}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                                    title="Copy SKU code"
                                  >
                                    {isCopied ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 4. Quantity */}
                              <td className="py-3.5 px-4 align-top text-right font-mono">
                                <span className="font-bold text-slate-900 block text-[13px]">
                                  {item.quantity}
                                </span>
                                <span className="text-[10.5px] text-slate-400 font-sans">
                                  {item.unit || "Packages"}
                                </span>
                              </td>

                              {/* 5. Volume */}
                              <td className="py-3.5 px-4 align-top text-right font-mono">
                                <span className="font-bold text-slate-900 block text-[13px]">
                                  {item.volumeM3} m³
                                </span>
                                {item.unitVolumeM3 && (
                                  <span className="text-[10.5px] text-slate-400 block">
                                    {item.unitVolumeM3} m³/pkg
                                  </span>
                                )}
                              </td>

                              {/* 6. Weight */}
                              <td className="py-3.5 px-4 align-top text-right font-mono">
                                <span className="font-bold text-slate-900 block text-[13px]">
                                  {item.weightKg} kg
                                </span>
                                {item.unitWeightKg && (
                                  <span className="text-[10.5px] text-slate-400 block">
                                    {item.unitWeightKg} kg/pkg
                                  </span>
                                )}
                              </td>

                              {/* 7. Status */}
                              <td className="py-3.5 px-4 align-top text-center whitespace-nowrap">
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10.5px] font-semibold py-0.5 px-2.5">
                                  Stored in Rack
                                </Badge>
                              </td>

                              {/* 8. Temperature */}
                              <td className="py-3.5 px-4 align-top text-center font-mono">
                                <span className="text-[12px] font-bold text-slate-700">
                                  {item.currentTemp != null ? `${item.currentTemp}°C` : slot.temperature}
                                </span>
                              </td>

                              {/* 9. Action */}
                              <td className="py-3.5 px-4 align-top text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenTransfer(item.id)}
                                  className="h-8 px-3 text-[11px] rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 font-semibold shadow-2xs"
                                >
                                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                                  <span>Move</span>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : goodsList.length > 0 ? (
                /* Search Not Found State */
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 flex-1 flex flex-col items-center justify-center">
                  <Search className="h-7 w-7 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-700">No matching inventory items found</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Try searching with a different SKU barcode, commodity name, or tenant company.
                  </p>
                </div>
              ) : (
                /* Vacant Rack Empty State */
                <div className="py-12 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 space-y-2.5 flex-1 flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                    <Boxes className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      This Rack Slot is Vacant and Ready for Put-Away
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      A volume capacity of <strong>{capacityM3} m³</strong> and weight load limit of{" "}
                      <strong>{maxWeightKg.toLocaleString("en-US")} kg</strong> are available for
                      incoming customer inbound allocations.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. CLEAN STICKY FOOTER (Fixed at bottom with ample corner margin)          */}
        {/* ========================================================================= */}
        {!showTransferForm && !showQrModal && (
          <div className="px-7 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs h-9.5 px-5 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-medium whitespace-nowrap shrink-0 shadow-2xs"
            >
              Close
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowQrModal(true)}
                className="text-xs h-9.5 px-4 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-2 font-medium shadow-2xs whitespace-nowrap shrink-0"
              >
                <QrCode className="h-4 w-4 text-slate-500" />
                <span>Print Slot QR</span>
              </Button>

              {goodsList.length > 0 && (
                <Button
                  onClick={() => handleOpenTransfer()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9.5 px-5 rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap shrink-0"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Relocate Cargo</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
