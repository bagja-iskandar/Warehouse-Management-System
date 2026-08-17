"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  Navigation,
  FileCheck,
  Thermometer,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Active Vehicle & Telemetry Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  Isuzu Giga FVR Reefer Truck
                </span>
                <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded">
                  B 9821 TKN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Specialized Cold Storage Refrigerated Fleet (Capacity: 12 m³)
              </p>
            </div>
          </div>

          <Link href="/driver/vehicle/select">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-50 text-slate-700 h-8.5"
            >
              Change Vehicle
            </Button>
          </Link>
        </div>

        {/* Cold Storage Sensor Telemetry Pill */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100">
            <span className="text-[11px] text-sky-800 font-semibold block">Reefer Box Temp</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Thermometer className="h-4.5 w-4.5 text-sky-600" />
              <span className="text-xl font-extrabold text-sky-900 font-mono">-18.2°C</span>
            </div>
            <span className="text-[10px] text-sky-700 font-medium block mt-0.5">Target: -18.0°C to -20.0°C</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] text-emerald-800 font-semibold block">Reefer Unit Status</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-900">Optimal Active</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Reefer compressor running normally</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Total Active Cargo</span>
            <span className="text-sm font-bold text-slate-900 mt-1 block">
              150 Packages (Wagyu & Salmon)
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Equivalent 75 m³ • DO-2026-001</span>
          </div>
        </div>
      </div>

      {/* Active Delivery Task Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900">
              Active Delivery Assignment
            </h2>
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              DO-2026-001
            </span>
            <Badge variant="warning" className="text-[10px]">
              In Transit
            </Badge>
          </div>
          <span className="text-xs font-bold text-amber-700 font-mono">
            Estimated: 35 Mins
          </span>
        </div>

        {/* Route Steps */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Origin Location (Pickup)
              </span>
              <p className="text-xs font-bold text-slate-800">
                Cakung Logistics Central Hub (JKT-01) — Loading Dock 2
              </p>
              <span className="text-[10.5px] text-emerald-600 font-medium block mt-0.5">
                ✓ Cargo Loading Completed (08:15 WIB)
              </span>
            </div>
          </div>

          <div className="w-0.5 h-6 bg-slate-200 ml-4" />

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Delivery Destination
              </span>
              <p className="text-xs font-bold text-slate-800">
                FreshMarket Superstore BSD, South Tangerang
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Recipient: Mr. Hendra (0812-9988-7766)
              </p>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <Link href="/driver/transit">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-10 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20">
              <Navigation className="h-4 w-4" />
              <span>Open GPS Route Navigation</span>
            </Button>
          </Link>

          <Link href="/driver/pod">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
              <FileCheck className="h-4 w-4" />
              <span>Upload Proof of Delivery & Signature</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
