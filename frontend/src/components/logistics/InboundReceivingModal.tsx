"use client";

import React, { useState } from "react";
import { Boxes, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button as UIButton } from "@/components/ui/button";

export interface ReceivingOrderItem {
  id?: string;
  name?: string;
  barcode?: string;
  quantity?: number;
  unit?: string;
}

export interface ReceivingOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  destinationAddress: string;
  driverName?: string;
  vehiclePlate?: string;
  totalPackages?: number;
  items?: any[];
}

export interface InboundReceivingModalProps {
  order: ReceivingOrder;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: {
    receivedQty: number;
    damagedQty: number;
    missingQty: number;
    condition: string;
    notes: string;
  }) => Promise<void>;
}

export function InboundReceivingModal({
  order,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: InboundReceivingModalProps) {
  const [receivedQty, setReceivedQty] = useState<number>(() => {
    return (
      order.totalPackages ||
      (order.items && order.items.length > 0
        ? order.items.reduce((s, it) => s + (it.quantity || 0), 0)
        : 1)
    );
  });
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [missingQty, setMissingQty] = useState<number>(0);
  const [receivingCondition, setReceivingCondition] = useState<string>("GOOD");
  const [receivingNotes, setReceivingNotes] = useState<string>("");

  const expectedQty =
    order.totalPackages ||
    (order.items && order.items.length > 0
      ? order.items.reduce((s, it) => s + (it.quantity || 0), 0)
      : 1);
  const actualQty = Number(receivedQty) + Number(damagedQty) + Number(missingQty);
  const isValid = actualQty === expectedQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    await onSubmit({
      receivedQty,
      damagedQty,
      missingQty,
      condition: receivingCondition,
      notes: receivingNotes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/25"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Inbound Goods Receiving Verification
              </h2>
              <p className="text-xs text-slate-500 font-mono font-medium">
                Order #{order.orderNumber}
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
            Dock Receiving
          </Badge>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {/* Shipment Info Card */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer / Tenant:</span>
                <span className="font-bold text-slate-800">{order.customerName || "Fresh Foods"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Destination Facility:</span>
                <span className="font-semibold text-slate-800">{order.destinationAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver & Vehicle:</span>
                <span className="font-semibold text-slate-800">
                  {order.driverName || "-"} ({order.vehiclePlate || "No Plate"})
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200">
                <span className="text-slate-700 font-bold">Expected Quantity (Manifest):</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">
                  {expectedQty} Packages / Koli
                </span>
              </div>

              {/* Manifest Item Breakdown */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Manifest Cargo Breakdown ({order.items.length} SKU):
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate mr-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {item.name}
                          </span>
                          {item.barcode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({item.barcode})
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-indigo-700 font-mono shrink-0">
                          {item.quantity} {item.unit || "Packages"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Physical Count Verification Inputs */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Physical Count Verification:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                    Received (Good)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                    Damaged
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-rose-600 focus:outline-none focus:border-rose-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                    Missing / Short
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={missingQty}
                    onChange={(e) => setMissingQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600 focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Realtime Count Validation Badge */}
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                isValid
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {isValid ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">
                {isValid
                  ? `✓ Verification Match: ${actualQty} of ${expectedQty} total items accounted for.`
                  : `! Count Mismatch: Total counted (${actualQty}) does not match expected manifest (${expectedQty}).`}
              </span>
            </div>

            {/* Cargo Condition */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Overall Cargo Condition
              </label>
              <select
                value={receivingCondition}
                onChange={(e) => setReceivingCondition(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="GOOD">GOOD — Intact seals, normal temperature & packaging</option>
                <option value="PARTIAL">PARTIAL — Minor issues recorded but acceptable for put-away</option>
                <option value="DAMAGED">DAMAGED — Damaged boxes/seals detected</option>
              </select>
            </div>

            {/* Inspection Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Receiving Dock Inspection Notes
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Segel kargo utuh, temperatur cold storage -19.4°C terverifikasi optimal saat pembongkaran."
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            {/* Inline Error Alert Banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Receiving Submission Error</span>
                  <span className="text-[11px] text-rose-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Sticky Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 shrink-0 rounded-b-2xl">
            <UIButton
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Cancel
            </UIButton>
            <UIButton
              type="submit"
              disabled={isSubmitting || !isValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying & Receiving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Confirm Receiving & Staging</span>
                </>
              )}
            </UIButton>
          </div>
        </form>
      </div>
    </div>
  );
}
