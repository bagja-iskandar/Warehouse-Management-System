"use client";

import React, { useState } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWarehouse } from "@/hooks/use-warehouses";
import { useTransferGoodsSlot } from "@/hooks/use-goods";
import { GoodsItem } from "@/types";
import { toast } from "sonner";

export interface AdminRackTransferModalProps {
  item: GoodsItem;
  onClose: () => void;
}

export function AdminRackTransferModal({
  item,
  onClose,
}: AdminRackTransferModalProps) {
  const { data: warehouseDetail, isLoading } = useWarehouse(item.warehouseId);
  const transferMutation = useTransferGoodsSlot();
  const [targetSlotId, setTargetSlotId] = useState<string>("");
  const [reason, setReason] = useState<string>(
    "Warehouse cargo rack space optimization"
  );
  const [note, setNote] = useState<string>("" );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = (warehouseDetail?.slots || []).filter(
    (s) => s.id !== item.slotId && s.status !== "MAINTENANCE"
  );
  const selectedSlot = slots.find((s) => s.id === targetSlotId);

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlotId) {
      toast.error("Please select a target rack slot.");
      return;
    }
    if (!reason || reason.trim().length < 3) {
      toast.error("Transfer reason must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await transferMutation.mutateAsync({
        id: item.id,
        targetSlotId,
        reason: reason.trim(),
        note: note.trim() || undefined,
      });

      toast.success("Rack Transfer Successful", {
        description: `Item "${item.name}" transferred to slot ${selectedSlot?.code}.`,
      });
      onClose();
    } catch (err: any) {
      toast.error("Transfer Failed", {
        description: err?.message || "Failed to transfer rack slot.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Intra-Warehouse Rack Transfer (Stock Movement)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {item.barcode} • {item.name}
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white text-[10px]">
            Slot {item.slotCode || "Current"}
          </Badge>
        </div>

        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">
                Source Slot:
              </span>
              <span className="font-bold text-slate-800">
                Slot {item.slotCode || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">
                Item Volume:
              </span>
              <span className="font-bold text-indigo-600 font-mono">
                {item.dimensions?.volumeM3 || 0} m³
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Select New Target Rack Slot *
            </label>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading candidate slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No alternative rack slots available in this facility.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {slots.map((slot) => {
                  const isColdRequired = item.requiresColdStorage;
                  const isZoneMatch = isColdRequired
                    ? slot.zone === "COLD_STORAGE"
                    : true;
                  const availableM3 = Math.max(
                    0,
                    Number(
                      (
                        Number(slot.capacityM3) - Number(slot.usedM3)
                      ).toFixed(2)
                    )
                  );
                  const hasCapacity =
                    availableM3 >= (item.dimensions?.volumeM3 || 0);
                  const isCompatible = isZoneMatch && hasCapacity;
                  const isSelected = targetSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isCompatible) setTargetSlotId(slot.id);
                      }}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        !isCompatible
                          ? "opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-50 border-indigo-500 shadow-sm cursor-pointer"
                          : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="targetTransferSlot"
                            checked={isSelected}
                            disabled={!isCompatible}
                            onChange={() => setTargetSlotId(slot.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-bold text-slate-900">
                            Slot {slot.code}
                          </span>
                          <Badge
                            variant={
                              slot.zone === "COLD_STORAGE"
                                ? "default"
                                : "outline"
                            }
                            className={`text-[9.5px] ${
                              slot.zone === "COLD_STORAGE"
                                ? "bg-sky-600 text-white"
                                : "text-slate-600"
                            }`}
                          >
                            {slot.zone?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 text-[11px] block">
                            Avail: {availableM3} / {slot.capacityM3} m³
                          </span>
                          {!isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Incompatible Zone (Requires Cold)
                            </span>
                          )}
                          {!hasCapacity && isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Insufficient Capacity
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Transfer Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reorganizing cold corridor racks for forklift efficiency"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Executed via reefer forklift unit 02"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !targetSlotId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-3.5 w-3.5" />
              )}
              <span>Confirm Rack Transfer</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
