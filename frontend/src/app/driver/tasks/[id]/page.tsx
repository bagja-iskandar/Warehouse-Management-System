"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ClipboardList,
  MapPin,
  Truck,
  Phone,
  Thermometer,
  Boxes,
  Navigation,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverTaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Delivery Instruction & Task Manifest
            </h1>
            <Badge variant="warning" className="text-[10px]">
              DO-2026-001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reefer cold cargo manifest, handover guide, recipient PIC contact, and Digital POD checklist.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Recipient Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Recipient Information & Drop-off Point
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Drop-off Destination</span>
                  <p className="font-bold text-slate-900 text-sm">FreshMarket Superstore BSD</p>
                  <p className="text-slate-500 mt-0.5">
                    Jl. Pahlawan Seribu No. 88, BSD City, South Tangerang (Rear Loading Dock Area)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-bold text-slate-800">Mr. Hendra (Receiving Supervisor)</p>
                    <p className="text-[11px] text-slate-500 font-mono">0812-9988-7766</p>
                  </div>
                </div>

                <a href="tel:081299887766">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Contact PIC</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Manifest Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Loaded Cargo Manifest (Reefer Cold Storage)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Import Wagyu Beef Ribeye A5</span>
                  <span className="text-[11px] text-slate-500 font-mono">BAR-FRESH-001 • Batch: BATCH-WGY-2026-08</span>
                </div>
                <span className="font-mono font-bold text-indigo-600 text-sm">100 Packages</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Premium Norwegian Salmon Fillet</span>
                  <span className="text-[11px] text-slate-500 font-mono">BAR-FRESH-002 • Batch: BATCH-SLM-2026-08</span>
                </div>
                <span className="font-mono font-bold text-indigo-600 text-sm">50 Packages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Driver Actions
            </h2>

            <Link href="/driver/transit" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20">
                <Navigation className="h-4 w-4" />
                <span>Open GPS Delivery Route</span>
              </Button>
            </Link>

            <Link href="/driver/pod" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
                <FileCheck className="h-4 w-4" />
                <span>Upload Proof of Delivery & Signature</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
