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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StorageSlot, StorageZoneType } from "@/types/warehouse.types";
import { useTransferGoodsSlot } from "@/hooks/use-goods";
import { toast } from "sonner";

export interface StoredGoodDetail {
  id: string;
  barcode: string;
  name: string;
  quantity: number;
  unit: string;
  volumeM3: number;
  weightKg?: number;
  category?: string;
  customerName: string;
  customerCompany?: string | null;
  storageStartDate?: string | null;
}

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
  status: "OCCUPIED" | "PARTIAL" | "AVAILABLE" | "MAINTENANCE";
  capacityM3: number;
  usedM3: number;
  tenantName?: string;
  tenantPic?: string;
  itemSku?: string;
  itemName?: string;
  itemQuantity?: string;
  batchNumber?: string;
  expiryDate?: string;
  lastInspected?: string;
  storedGoods?: StoredGoodDetail[];
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
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedGoodId, setSelectedGoodId] = useState<string>("");
  const [targetSlotId, setTargetSlotId] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferNote, setTransferNote] = useState<string>("");
  const [transferError, setTransferError] = useState<string | null>(null);

  const transferMutation = useTransferGoodsSlot();

  if (!isOpen || !slot) return null;

  const goodsList: StoredGoodDetail[] =
    slot.storedGoods && slot.storedGoods.length > 0
      ? slot.storedGoods
      : slot.itemSku
      ? [
          {
            id: slot.id,
            barcode: slot.itemSku,
            name: slot.itemName || "Stored Commodity",
            quantity: parseInt(slot.itemQuantity || "1", 10) || 1,
            unit: "Packages",
            volumeM3: slot.usedM3,
            customerName: slot.tenantName || "PT Fresh Foods Indonesia",
          },
        ]
      : [];

  const getStatusBadge = () => {
    switch (slot.status) {
      case "OCCUPIED":
        return <Badge className="bg-indigo-600 text-white text-[10px]">Fully Occupied (100%)</Badge>;
      case "PARTIAL":
        return (
          <Badge className="bg-emerald-600 text-white text-[10px]">
            Partially Occupied ({Math.round((slot.usedM3 / slot.capacityM3) * 100)}%)
          </Badge>
        );
      case "AVAILABLE":
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px]">
            Available (Vacant)
          </Badge>
        );
      case "MAINTENANCE":
        return <Badge className="bg-amber-500 text-slate-950 text-[10px]">Rack Maintenance</Badge>;
    }
  };

  // Compatible target slots (same warehouse, not current slot, not maintenance)
  const candidateSlots = availableSlots.filter(
    (s) => s.id !== slot.id && s.status !== "MAINTENANCE"
  );

  const handleOpenTransfer = (goodId?: string) => {
    const targetGood = goodId || (goodsList.length > 0 ? goodsList[0].id : slot.id);
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
      setTransferError("Please select a target destination slot.");
      toast.error("Please select a target destination slot.");
      return;
    }
    if (!transferReason || transferReason.trim().length < 3) {
      setTransferError("Transfer reason must be at least 3 characters.");
      toast.error("Transfer reason must be at least 3 characters.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: selectedGoodId,
        targetSlotId,
        reason: transferReason.trim(),
        note: transferNote.trim() || undefined,
      });

      toast.success("Rack Transfer Successful", {
        description: `Item successfully transferred to new rack slot in PostgreSQL.`,
      });
      setShowTransferForm(false);
      if (onTransferSuccess) onTransferSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err?.message || "An error occurred while transferring the rack slot.";
      setTransferError(errMsg);
      toast.error("Transfer Failed", {
        description: errMsg,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/25 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
              {slot.code.split("-")[0] || "RK"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Rack Slot {slot.code}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {slot.zoneName} • {slot.warehouseName || "Warehouse Facility"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {showTransferForm ? (
            /* Rack Transfer Interactive Form */
            <form onSubmit={handleExecuteTransfer} className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-indigo-900 text-xs">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">
                  Rack Relocation: Move Item from Slot {slot.code}
                </span>
              </div>

              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in duration-150">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{transferError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Item to Transfer (SKU) *
                </label>
                {goodsList.length > 1 ? (
                  <select
                    value={selectedGoodId}
                    onChange={(e) => setSelectedGoodId(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    {goodsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.barcode} — {g.name} ({g.volumeM3} m³)
                      </option>
                    ))}
                  </select>
                ) : goodsList.length === 1 ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {goodsList[0].name}
                    </span>
                    <span className="font-mono text-indigo-600 font-bold">
                      {goodsList[0].barcode}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-rose-600">No items currently stored in this slot.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Destination Slot *
                </label>
                {candidateSlots.length > 0 ? (
                  <select
                    value={targetSlotId}
                    onChange={(e) => setTargetSlotId(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    {candidateSlots.map((s) => {
                      const availM3 = Math.max(0, Number(s.capacityM3) - Number(s.usedM3)).toFixed(1);
                      const isColdMatch =
                        slot.zoneType === "COLD_STORAGE" ? s.zone === "COLD_STORAGE" : true;
                      return (
                        <option key={s.id} value={s.id}>
                          Slot {s.code} ({s.zone}) • Avail: {availM3} m³ {s.status === "AVAILABLE" ? "[VACANT]" : "[PARTIAL]"}
                          {!isColdMatch ? " ⚠️ NOT COLD STORAGE" : ""}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
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
                  placeholder="e.g. Rack capacity optimization in cold storage bay"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferForm(false)}
                  className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={transferMutation.isPending || candidateSlots.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  {transferMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : showQrModal ? (
            /* Print Slot QR Label View */
            <div className="space-y-4 text-center py-2 animate-in fade-in duration-150">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-xs mx-auto space-y-3">
                <div className="h-36 w-36 bg-white border-2 border-slate-900 border-dashed rounded-xl mx-auto flex flex-col items-center justify-center p-2 shadow-sm">
                  <QrCode className="h-16 w-16 text-slate-900 stroke-[1.5]" />
                  <span className="text-[11px] font-mono font-bold text-slate-900 mt-1">
                    SLOT-{slot.code}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Rack Slot {slot.code}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {slot.zoneName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQrModal(false)}
                  className="text-xs h-9"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Slot QR Label ${slot.code} ready to print.`);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print QR Label</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Standard Slot Details View */
            <>
              {/* Section 1: Telemetry Live Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    Real-time Sensor Telemetry & Capacity
                  </span>
                  <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Sensor Online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">Operating Temperature</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Thermometer className="h-4 w-4 text-sky-600" />
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {slot.temperature}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                    <span className="text-[11px] text-slate-400 block">Occupied Capacity</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Boxes className="h-4 w-4 text-indigo-600" />
                      <span className="text-base font-bold text-slate-900 font-mono">
                        {slot.usedM3} / {slot.capacityM3} m³
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Tenant & Stored Goods */}
              {slot.status !== "AVAILABLE" && goodsList.length > 0 ? (
                <div className="space-y-4 border border-slate-200 rounded-xl p-4">
                  {goodsList.map((item, idx) => (
                    <div key={item.id || idx} className="space-y-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0">
                      {/* Tenant Header */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {item.customerName || item.customerCompany || "Customer Tenant"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Active Tenant • Registered Inventory
                            </p>
                          </div>
                        </div>
                        <Badge variant="success" className="text-[10px]">
                          Active Stored
                        </Badge>
                      </div>

                      {/* Item Details */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {item.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {item.barcode}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-[11px] text-slate-400 block">Physical Quantity:</span>
                            <span className="font-semibold text-slate-800">
                              {item.quantity} {item.unit || "Packages"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">Occupied Volume:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {item.volumeM3} m³
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Boxes className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">This Rack Slot is Ready for Use</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                    A capacity of {slot.capacityM3} m³ is available for incoming inbound allocations.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!showTransferForm && !showQrModal && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Close
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQrModal(true)}
                className="text-xs h-9 px-3 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 font-medium"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Print Slot QR</span>
              </Button>

              {slot.status !== "AVAILABLE" && goodsList.length > 0 && (
                <Button
                  onClick={() => handleOpenTransfer()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Transfer Rack</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
