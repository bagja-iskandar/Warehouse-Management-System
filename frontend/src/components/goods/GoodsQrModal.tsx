"use client";

import React from "react";
import { QrCode, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoodsItem } from "@/types";
import { toast } from "sonner";

export interface GoodsQrModalProps {
  selectedQrItem: GoodsItem | null;
  onClose: () => void;
}

export function GoodsQrModal({ selectedQrItem, onClose }: GoodsQrModalProps) {
  if (!selectedQrItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900">
            QR Code Master Box
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-44 w-44 bg-white border-2 border-slate-900 border-dashed rounded-xl mx-auto flex flex-col items-center justify-center p-3 shadow-sm">
          <QrCode className="h-24 w-24 text-slate-900 stroke-[1.5]" />
          <span className="text-[10px] font-mono font-bold text-slate-900 mt-2">
            {selectedQrItem.barcode}
          </span>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-900">
            {selectedQrItem.name}
          </p>
          <p className="text-[11px] text-slate-500">
            {selectedQrItem.warehouseName}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
          >
            Close
          </Button>
          <Button
            onClick={() =>
              toast.success(
                `QR Label ${selectedQrItem.barcode} ready to print.`
              )
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Label</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
