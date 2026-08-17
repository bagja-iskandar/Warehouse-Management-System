"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Truck,
  Car,
  Star,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DeliveryReceiptConfirmationPage() {
  const [rating, setRating] = useState<number>(5);
  const [recipientNote, setRecipientNote] = useState("Goods received in optimal frozen condition, seals intact.");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmed(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Goods Receipt Confirmation (Delivery Confirmation)
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Digital Proof of Delivery
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Confirm delivery handover, verify physical goods condition, and provide driver service rating.
          </p>
        </div>
      </div>

      {isConfirmed ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Goods Receipt Confirmed Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Thank you for validating shipment <span className="font-mono font-bold text-indigo-600">DO-2026-001</span>. Digital POD has been recorded in the central system.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Back to Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Delivery Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4.5 w-4.5 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Shipment Details (DO-2026-001)
                  </h2>
                </div>
                <Badge variant="warning" className="text-[10px]">Arrived on Site</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Driver & Fleet</span>
                  <p className="font-bold text-slate-900">Ahmad Subarjo</p>
                  <p className="text-slate-500 font-mono">Isuzu Reefer Truck (B 9821 TKN)</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Cargo Box Temperature</span>
                  <p className="font-bold text-sky-700 font-mono text-sm">-18.2°C</p>
                  <p className="text-emerald-600 font-medium">Cold Chain Perfectly Maintained</p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 block mb-1">
                  List of Received Cargo:
                </span>
                <p className="text-xs text-slate-800 font-medium p-3 bg-slate-50 rounded-xl border border-slate-100">
                  150 Packages Import Wagyu Beef Ribeye A5 (BAR-FRESH-001) & Salmon (BAR-FRESH-002)
                </p>
              </div>
            </div>

            {/* Verification Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Goods Condition Validation & Driver Feedback
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Logistics Driver Service Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-2 font-mono">
                      {rating}.0 / 5.0 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Goods Receipt Condition Notes
                  </label>
                  <textarea
                    rows={3}
                    value={recipientNote}
                    onChange={(e) => setRecipientNote(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Final Confirmation
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                By clicking the button below, you confirm that all goods have been received in accordance with the Delivery Order manifest.
              </p>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Confirm Proof of Delivery (POD)
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
