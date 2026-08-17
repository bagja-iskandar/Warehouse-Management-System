"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverPickupPage() {
  const [dockVerified, setDockVerified] = useState(true);
  const [sealVerified, setSealVerified] = useState(true);
  const [tempVerified, setTempVerified] = useState(true);
  const [isDeparted, setIsDeparted] = useState(false);

  const handleDepart = () => {
    setIsDeparted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Cargo Loading & Departure Confirmation (Pickup)
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Loading Dock 2
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verify physical cargo on loading dock, inspect container seals, and verify reefer temperature before departure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Back
            </Button>
          </Link>
        </div>
      </div>

      {isDeparted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Departure Confirmed Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Delivery status <span className="font-mono font-bold text-indigo-600">DO-2026-001</span> has been updated to <span className="font-semibold text-amber-700">In Transit</span>. Live GPS tracking is active.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/driver/transit">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9">
                Open GPS Navigation Screen →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Checklist Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Departure Inspection Checklist
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dockVerified}
                  onChange={(e) => setDockVerified(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Cargo Quantity Matches Delivery Order (150 Packages)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    100 Packages Wagyu (BAR-FRESH-001) & 50 Packages Salmon (BAR-FRESH-002)
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempVerified}
                  onChange={(e) => setTempVerified(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Reefer Box Temperature Stable Sub-zero (-18.2°C)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Cooling system operating normally & telemetry sensor is online
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealVerified}
                  onChange={(e) => setSealVerified(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Cargo Box Door Security Seal Securely Fastened
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Security Seal Number: SEAL-JKT-9921
                  </span>
                </div>
              </label>
            </div>

            <Button
              onClick={handleDepart}
              disabled={!dockVerified || !tempVerified || !sealVerified}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-indigo-600/20"
            >
              Confirm Departure & Start Route
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
