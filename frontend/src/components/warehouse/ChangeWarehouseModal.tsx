"use client";

import React from "react";
import { ArrowRightLeft, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Warehouse } from "@/types";

export interface ChangeWarehouseModalProps {
  transferSourceWh: Warehouse | null;
  transferTargetWhId: string;
  setTransferTargetWhId: (id: string) => void;
  transferReason: string;
  setTransferReason: (reason: string) => void;
  transferError: string | null;
  warehouses: Warehouse[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChangeWarehouseModal({
  transferSourceWh,
  transferTargetWhId,
  setTransferTargetWhId,
  transferReason,
  setTransferReason,
  transferError,
  warehouses,
  isPending,
  onClose,
  onSubmit,
}: ChangeWarehouseModalProps) {
  if (!transferSourceWh) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Change Rental Warehouse (Pre-Inbound)
              </h3>
              <p className="text-[11px] text-slate-500">
                Reassign storage facility before physical cargo receiving
                begins.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {transferError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{transferError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <span className="text-slate-500 block">
              Current Origin Facility:
            </span>
            <span className="font-bold text-slate-800 block">
              {transferSourceWh.name} ({transferSourceWh.code})
            </span>
            <span className="text-[11px] text-slate-400 block">
              {transferSourceWh.address || transferSourceWh.city}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Select New Destination Facility *
            </label>
            <select
              required
              value={transferTargetWhId}
              onChange={(e) => setTransferTargetWhId(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- Choose New Warehouse --</option>
              {warehouses
                .filter(
                  (w) =>
                    w.id !== transferSourceWh.id &&
                    w.code !== transferSourceWh.code
                )
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) — {w.city}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Reason for Transfer (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Adjusted logistics route closer to distribution point"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-indigo-600" />
              <span>Pre-Inbound Transfer Policy</span>
            </p>
            <p className="text-indigo-800 leading-relaxed">
              Your active rental invoice, payment record, and registered draft
              goods will be automatically transferred to the new facility
              without duplicate charges.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !transferTargetWhId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-xl disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Reassigning...</span>
                </>
              ) : (
                <span>Confirm Warehouse Change</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
