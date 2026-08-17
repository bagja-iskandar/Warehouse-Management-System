"use client";

import React from "react";
import Link from "next/link";
import {
  Thermometer,
  Snowflake,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTelemetryMonitoring } from "@/hooks/use-telemetry";

export default function CustomerTemperatureMonitoringPage() {
  const { data: liveMonitoring } = useTelemetryMonitoring();
  const primarySlot = liveMonitoring?.slots?.[0];
  const currentTemp = primarySlot?.currentTempCelsius ?? -18.4;
  const humidity = primarySlot?.humidityPercent ?? 65;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Monitoring Suhu Cold Storage Saya
            </h1>
            <Badge className="bg-sky-600 text-white text-[10px] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Live Sensor Stream</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau kestabilan temperatur ruang sewa Cold Storage Anda (Zona A Hub Cakung) secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Sertifikat Suhu</span>
          </Button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Suhu Terkini (Real-time)</span>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-extrabold text-sky-600 font-mono">
              {currentTemp > 0 ? `+${currentTemp}` : currentTemp}°C
            </p>
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          </div>
          <p className="text-[11px] text-slate-400">Target Range: -18.0°C s/d -25.0°C</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Kelembaban Udara (Humidity)</span>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{humidity}% RH</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Kelembaban Stabil Terkendali</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Status Node Sensor</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold mt-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Online ({primarySlot?.slotCode ? `SN-${primarySlot.slotCode}` : "SN-CKG-001"})</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Sinkronisasi: Tiap 5 Detik</p>
        </div>
      </div>

      {/* Sensor Detail & Historical Graph Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Grafik Kestabilan Suhu 24 Jam Terakhir
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Rata-rata: -18.35°C • Deviasi: ±0.3°C
          </span>
        </div>

        {/* Visual Bar Chart Mockup */}
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
            {[
              { time: "00:00", temp: "-18.5" },
              { time: "03:00", temp: "-18.4" },
              { time: "06:00", temp: "-18.2" },
              { time: "09:00", temp: "-18.1" },
              { time: "12:00", temp: "-18.3" },
              { time: "15:00", temp: "-18.4" },
              { time: "18:00", temp: "-18.5" },
              { time: "21:00", temp: "-18.4" },
            ].map((pt, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono font-bold text-sky-700">{pt.temp}°C</span>
                <div className="w-full max-w-[36px] bg-sky-500 rounded-t-md h-28" />
                <span className="text-[10px] text-slate-500 font-mono">{pt.time}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[10.5px] text-slate-400 font-mono pt-2 border-t border-slate-200">
            Kondisi suhu ruang konsisten di bawah ambang batas maksimal (-18.0°C) tanpa anomali.
          </p>
        </div>
      </div>
    </div>
  );
}
