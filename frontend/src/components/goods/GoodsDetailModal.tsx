"use client";

import React from "react";
import {
  Package,
  X,
  Boxes,
  ArrowRightLeft,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoodsItem } from "@/types";
import { GoodsStatusBadge } from "@/components/common/StatusBadge";

export interface GoodsDetailModalProps {
  detailItem: GoodsItem | null;
  onClose: () => void;
  onPutAway: (item: GoodsItem) => void;
  onTransfer: (item: GoodsItem) => void;
  onViewQr: (item: GoodsItem) => void;
}

export function GoodsDetailModal({
  detailItem,
  onClose,
  onPutAway,
  onTransfer,
  onViewQr,
}: GoodsDetailModalProps) {
  if (!detailItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {detailItem.name}
              </h2>
              <p className="text-xs font-mono text-indigo-600 font-bold">
                {detailItem.barcode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 block">
                Storage Status
              </span>
              <div className="mt-1">
                <GoodsStatusBadge status={detailItem.status} />
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">
                Item Owner (Tenant)
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-1">
                {detailItem.customerName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">
                Warehouse Facility
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-1">
                {detailItem.warehouseName}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">
                Rack Slot Allocation
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 block mt-1">
                {detailItem.slotCode
                  ? `Slot ${detailItem.slotCode}`
                  : "Receiving Dock (Pending Put-Away)"}
              </span>
            </div>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-xl p-4">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              PHYSICAL SPECIFICATIONS & CUBIC VOLUME
            </span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10.5px] text-slate-400 block">
                  Quantity
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {detailItem.quantity} {detailItem.unit || "Packages"}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10.5px] text-slate-400 block">
                  Total Volume
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {detailItem.dimensions?.volumeM3 || 0} m³
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[10.5px] text-slate-400 block">
                  Total Weight
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {detailItem.dimensions?.weightKg || 0} kg
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Unit dimensions: {detailItem.dimensions?.lengthCm || 0} x{" "}
              {detailItem.dimensions?.widthCm || 0} x{" "}
              {detailItem.dimensions?.heightCm || 0} cm
            </p>
          </div>

          {detailItem.description && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-slate-700 block">
                Description / Notes:
              </span>
              <p className="text-slate-600">{detailItem.description}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9"
          >
            Close
          </Button>
          <div className="flex items-center gap-2">
            {(detailItem.status === "INSPECTING" ||
              detailItem.status === "DRAFT") && (
              <Button
                size="sm"
                onClick={() => onPutAway(detailItem)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm"
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Allocate to Rack (Put-Away)</span>
              </Button>
            )}

            {detailItem.status === "STORED" && (
              <Button
                size="sm"
                onClick={() => onTransfer(detailItem)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span>Transfer Rack</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewQr(detailItem)}
              className="text-xs h-9 flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>View QR</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
