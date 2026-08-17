"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Thermometer,
  Snowflake,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Radio,
  RefreshCw,
  Sliders,
  Bell,
  Download,
  Building2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTelemetryMonitoring } from "@/hooks/use-telemetry";

interface SensorNode {
  id: string;
  nodeCode: string;
  locationName: string;
  zoneType: "COLD_STORAGE" | "STANDARD" | "REEFER_FLEET";
  currentTemp: number;
  targetTemp: string;
  humidity: string;
  status: "OPTIMAL" | "WARNING" | "CRITICAL";
  batteryLevel: string;
  lastUpdated: string;
}

const SENSORS_DATA: SensorNode[] = [
  {
    id: "sn-1",
    nodeCode: "SN-CKG-001",
    locationName: "Cakung Hub — Zone A (Cold Storage 1)",
    zoneType: "COLD_STORAGE",
    currentTemp: -18.4,
    targetTemp: "-18.0°C to -25.0°C",
    humidity: "65% RH",
    status: "OPTIMAL",
    batteryLevel: "98% (AC Powered)",
    lastUpdated: "5 sec ago",
  },
  {
    id: "sn-2",
    nodeCode: "SN-CKG-002",
    locationName: "Cakung Hub — Zone B (Standard Rack & Furniture)",
    zoneType: "STANDARD",
    currentTemp: 24.0,
    targetTemp: "20.0°C to 26.0°C",
    humidity: "52% RH",
    status: "OPTIMAL",
    batteryLevel: "100%",
    lastUpdated: "12 sec ago",
  },
  {
    id: "sn-3",
    nodeCode: "SN-BDG-001",
    locationName: "Bandung Hub — Zone A (Cold Storage)",
    zoneType: "COLD_STORAGE",
    currentTemp: -20.1,
    targetTemp: "-18.0°C to -25.0°C",
    humidity: "60% RH",
    status: "OPTIMAL",
    batteryLevel: "96%",
    lastUpdated: "8 sec ago",
  },
  {
    id: "sn-4",
    nodeCode: "SN-TRK-9821",
    locationName: "Reefer Truck B 9821 TKN (In-Transit BSD Toll)",
    zoneType: "REEFER_FLEET",
    currentTemp: -18.2,
    targetTemp: "-18.0°C to -20.0°C",
    humidity: "68% RH",
    status: "OPTIMAL",
    batteryLevel: "Alternator Online",
    lastUpdated: "2 sec ago",
  },
];

export default function SensorMonitoringPage() {
  const { data: liveMonitoring } = useTelemetryMonitoring();
  const [filterType, setFilterType] = useState("ALL");

  const activeSensors: SensorNode[] =
    liveMonitoring && (liveMonitoring.slots.length > 0 || liveMonitoring.vehicles.length > 0)
      ? [
          ...liveMonitoring.slots.map((s) => ({
            id: s.slotId,
            nodeCode: `SN-SLOT-${s.slotCode}`,
            locationName: `${s.warehouseName} — Slot ${s.slotCode}`,
            zoneType: "COLD_STORAGE" as const,
            currentTemp: s.currentTempCelsius,
            targetTemp: "-18.0°C to -25.0°C",
            humidity: `${s.humidityPercent || 80}% RH`,
            status:
              s.condition === "SAFE"
                ? ("OPTIMAL" as const)
                : s.condition === "WARNING"
                ? ("WARNING" as const)
                : ("CRITICAL" as const),
            batteryLevel: "98% (AC Powered)",
            lastUpdated: "Live",
          })),
          ...liveMonitoring.vehicles.map((v) => ({
            id: v.vehicleId,
            nodeCode: `SN-VEH-${v.plateNumber.replace(/\s+/g, "")}`,
            locationName: `${v.name} (${v.plateNumber})`,
            zoneType: "REEFER_FLEET" as const,
            currentTemp: v.currentTempCelsius,
            targetTemp: "-18.0°C to -25.0°C",
            humidity: "75% RH",
            status:
              v.condition === "SAFE"
                ? ("OPTIMAL" as const)
                : v.condition === "WARNING"
                ? ("WARNING" as const)
                : ("CRITICAL" as const),
            batteryLevel: "Alternator Online",
            lastUpdated: "Live",
          })),
        ]
      : SENSORS_DATA;

  const filteredSensors = activeSensors.filter((s) => {
    return filterType === "ALL" || s.zoneType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Real-Time Temperature & Telemetry Sensor Monitoring
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Live IoT Stream</span>
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            IoT temperature & humidity sensors across Cold Storage rooms, standard warehouse racks, and refrigerated trucks (Reefer).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Temp Logs</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Sliders className="h-4 w-4" />
            <span>Configure Alert Thresholds</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Active Sensor Nodes</span>
          <p className="text-2xl font-extrabold text-slate-900">{SENSORS_DATA.length} IoT Nodes</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>100% Sensors Online</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Average Cold Storage Temp</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600">-19.2°C</p>
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Target: -18°C to -25°C</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Logistics Fleet Sensors</span>
          <p className="text-2xl font-extrabold text-amber-600">1 Active Truck</p>
          <p className="text-[11px] text-slate-400 font-mono">B 9821 TKN: -18.2°C</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Temperature Anomaly Warnings</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-emerald-600">0 Alerts</p>
            <span className="text-xs text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
              Normal Condition
            </span>
          </div>
          <p className="text-[11px] text-slate-400">No temperature deviations</p>
        </div>
      </div>

      {/* Sensor Node Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4.5 w-4.5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Active Telemetry Sensor Nodes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              All Sensors
            </button>
            <button
              onClick={() => setFilterType("COLD_STORAGE")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "COLD_STORAGE"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Cold Storage
            </button>
            <button
              onClick={() => setFilterType("REEFER_FLEET")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "REEFER_FLEET"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Reefer Trucks
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSensors.map((node) => (
            <div
              key={node.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
                      node.zoneType === "COLD_STORAGE"
                        ? "bg-sky-50 text-sky-600 border border-sky-200"
                        : node.zoneType === "REEFER_FLEET"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    }`}
                  >
                    {node.zoneType === "COLD_STORAGE" ? (
                      <Snowflake className="h-4.5 w-4.5" />
                    ) : node.zoneType === "REEFER_FLEET" ? (
                      <Truck className="h-4.5 w-4.5" />
                    ) : (
                      <Warehouse className="h-4.5 w-4.5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {node.locationName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      Node: {node.nodeCode}
                    </span>
                  </div>
                </div>

                <Badge variant="success" className="text-[10px]">
                  Optimal
                </Badge>
              </div>

              {/* Temp & Humidity Display */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10.5px] text-slate-400 block font-medium">
                    Sensor Temperature
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Thermometer className="h-4 w-4 text-sky-600" />
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {node.currentTemp > 0 ? `+${node.currentTemp}` : node.currentTemp}°C
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Target: {node.targetTemp}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10.5px] text-slate-400 block font-medium">
                    Air Humidity
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Activity className="h-4 w-4 text-indigo-600" />
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {node.humidity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    Power: {node.batteryLevel}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span>Update: {node.lastUpdated}</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Sync
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
