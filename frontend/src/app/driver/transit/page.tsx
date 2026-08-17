"use client";

import React from "react";
import Link from "next/link";
import {
  Navigation,
  MapPin,
  Truck,
  Thermometer,
  Clock,
  AlertTriangle,
  Phone,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverTransitPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Route Navigation & Live Transit GPS Status
            </h1>
            <Badge variant="warning" className="text-[10px] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
              <span>In-Transit Active</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            GPS dispatch route navigation, in-transit reefer box temperature monitoring, and incident reporting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/pod">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
              <FileCheck className="h-4 w-4" />
              <span>Arrive at Destination & Upload POD</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Estimated Time of Arrival (ETA)</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-amber-600 font-mono">35 Mins</p>
            <Badge variant="outline" className="text-[10px]">Smooth Traffic</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Arriving approx. 09:45 WIB</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">In-Transit Reefer Box Temperature</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600 font-mono">-18.2°C</p>
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">Cold Chain Quality Maintained</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Current Vehicle Location</span>
          <p className="text-sm font-bold text-slate-900 mt-1">JORR W2S Toll Road (KM 18)</p>
          <p className="text-[11px] text-slate-400">Heading towards BSD Serpong Toll Exit</p>
        </div>
      </div>

      {/* GPS Map Visualizer Mockup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4.5 w-4.5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Live GPS Route Navigation Map
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">Remaining Distance: 22.4 km</span>
        </div>

        {/* Map Canvas Box */}
        <div className="h-72 w-full bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center p-6 text-white border border-slate-800">
          {/* Simulated Route Line */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/50 animate-bounce">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono text-indigo-300">
                [ LIVE GPS NAVIGATION SIMULATION ]
              </p>
              <p className="text-sm font-bold text-slate-100 mt-0.5">
                JORR Toll KM 18 → FreshMarket BSD
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Speed: 62 km/h • GPS Sensor Lock: 12 Satellites
              </p>
            </div>
          </div>
        </div>

        {/* Emergency & Incident Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Real-time telemetry is automatically streamed to Admin Dispatch Central</span>
          </div>

          <Button
            variant="outline"
            className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 h-8.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            <span>Report Road Issue / Emergency Incident</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
