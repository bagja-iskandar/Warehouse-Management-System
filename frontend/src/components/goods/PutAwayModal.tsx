"use client";

import React, { useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWarehouse } from "@/hooks/use-warehouses";
import { useUpdateGoodsStatus } from "@/hooks/use-goods";
import { GoodsItem } from "@/types";
import { toast } from "sonner";

export interface PutAwayModalProps {
  item: GoodsItem;
  onClose: () => void;
}

export function PutAwayModal({ item, onClose }: PutAwayModalProps) {
  const { data: warehouseDetail, isLoading } = useWarehouse(item.warehouseId);
  const updateStatusMutation = useUpdateGoodsStatus();
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [putAwayNote, setPutAwayNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = warehouseDetail?.slots || [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      toast.error("Please select a destination rack slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: item.id,
        status: "STORED",
        slotId: selectedSlotId,
        note:
          putAwayNote ||
          `Put-Away allocated to rack slot ${selectedSlot?.code || ""}`,
      });

      toast.success("Put-Away Successful", {
        description: `Item "${item.name}" allocated to slot ${selectedSlot?.code} (${
          warehouseDetail?.name || item.warehouseName
        }).`,
      });
      onClose();
    } catch (err: any) {
      toast.error("Put-Away Failed", {
        description: err?.message || "Failed to allocate rack slot.",
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
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Put-Away to Warehouse Storage Slot
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {item.barcode} • {item.name}
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white text-[10px]">
            Rack Allocation
          </Badge>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Goods & Requirements summary */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">
                Facility:
              </span>
              <span className="font-bold text-slate-800">
                {warehouseDetail?.name || item.warehouseName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">
                Required Storage:
              </span>
              <span className="font-bold text-slate-800">
                {item.requiresColdStorage
                  ? "Cold Storage (-18°C Sub-zero)"
                  : "Standard Rack (Ambient)"}
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
            <div>
              <span className="text-slate-500 block text-[11px]">
                Quantity:
              </span>
              <span className="font-bold text-slate-800">
                {item.quantity} Packages
              </span>
            </div>
          </div>

          {/* Slot Selection from PostgreSQL */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Select Candidate Storage Slot (Real PostgreSQL Slots)
            </label>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading available rack slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No storage slots registered in this warehouse facility.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
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
                  const isCompatible =
                    isZoneMatch && hasCapacity && slot.status !== "MAINTENANCE";
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isCompatible) setSelectedSlotId(slot.id);
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
                            name="targetSlot"
                            checked={isSelected}
                            disabled={!isCompatible}
                            onChange={() => setSelectedSlotId(slot.id)}
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

          {/* Optional Put-Away Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Put-Away Operational Note
            </label>
            <input
              type="text"
              placeholder="e.g. Placed in Level 2 west lane, ambient temperature."
              value={putAwayNote}
              onChange={(e) => setPutAwayNote(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || !selectedSlotId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Boxes className="h-3.5 w-3.5" />
              )}
              <span>Confirm Put-Away</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
