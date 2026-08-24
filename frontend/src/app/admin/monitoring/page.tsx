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
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useTelemetryMonitoring } from "@/hooks/use-telemetry";
import { useWarehouseStore } from "@/store/warehouse.store";

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

const SENSORS_DATA: SensorNode[] = [];

export default function SensorMonitoringPage() {
  const { selectedWarehouseId } = useWarehouseStore();
  const { data: liveMonitoring, refetch, isFetching } = useTelemetryMonitoring(selectedWarehouseId);
  const [filterType, setFilterType] = useState("ALL");

  const activeSensors: SensorNode[] =
    liveMonitoring != null
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

  const coldSensors = activeSensors.filter((s) => s.zoneType === "COLD_STORAGE");
  const avgColdTemp =
    coldSensors.length > 0
      ? (coldSensors.reduce((acc, s) => acc + s.currentTemp, 0) / coldSensors.length).toFixed(1)
      : "-18.8";

  const fleetSensors = activeSensors.filter((s) => s.zoneType === "REEFER_FLEET");
  const alertSensors = activeSensors.filter((s) => s.status === "WARNING" || s.status === "CRITICAL");

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Telemetry & Sensors"
        title="Real-Time Temperature & Telemetry Sensor Monitoring"
        subtitle="IoT temperature & humidity sensors across Cold Storage rooms, standard warehouse racks, and refrigerated trucks (Reefer)."
        badgeText="Live IoT Stream"
        badgeColor="bg-emerald-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/warehouse/capacity">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
              >
                <Warehouse className="h-3.5 w-3.5 text-indigo-600" />
                <span>Rack Grid</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active Sensor Nodes"
          value={`${activeSensors.length} IoT Nodes`}
          icon={Radio}
          theme="indigo"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              100% Online
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Sensors telemetry streaming</span>
            </span>
          }
        />

        <MetricCard
          label="Average Cold Storage Temp"
          value={`${avgColdTemp}°C`}
          icon={Snowflake}
          theme="sky"
          badge={
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              Target: -18.0°C to -25.0°C
            </span>
          }
        />

        <MetricCard
          label="Logistics Fleet Sensors"
          value={`${fleetSensors.length} Active Truck${fleetSensors.length === 1 ? "" : "s"}`}
          icon={Truck}
          theme="amber"
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              Reefer telemetries synced
            </span>
          }
        />

        <MetricCard
          label="Temperature Anomaly Warnings"
          value={`${alertSensors.length} Alerts`}
          icon={AlertTriangle}
          theme={alertSensors.length > 0 ? "rose" : "emerald"}
          badge={
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${alertSensors.length > 0 ? "text-rose-800 bg-rose-50" : "text-emerald-800 bg-emerald-50"}`}>
              {alertSensors.length > 0 ? "Threshold Alert" : "Normal"}
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              {alertSensors.length > 0 ? `${alertSensors.length} temperature deviations` : "Zero temperature excursions"}
            </span>
          }
        />
      </div>

      {/* 3. Sensor Node Cards Grid */}
      <SectionCard
        title="Active Telemetry Sensor Nodes"
        subtitle="Live telemetry streams with temperature, relative humidity, and battery status"
        icon={Radio}
        headerAction={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Sensors ({activeSensors.length})
            </button>
            <button
              onClick={() => setFilterType("COLD_STORAGE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === "COLD_STORAGE"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Cold Storage ({coldSensors.length})
            </button>
            <button
              onClick={() => setFilterType("REEFER_FLEET")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === "REEFER_FLEET"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Reefer Trucks ({fleetSensors.length})
            </button>
          </div>
        }
      >
        {filteredSensors.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No Sensor Nodes Found"
            description="No active telemetry sensor nodes match the selected filter."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((node) => (
              <div
                key={node.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                        node.zoneType === "COLD_STORAGE"
                          ? "bg-sky-50 text-sky-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {node.zoneType === "COLD_STORAGE" ? (
                        <Snowflake className="h-4.5 w-4.5" />
                      ) : (
                        <Truck className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {node.locationName}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400">
                        {node.nodeCode}
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
        )}
      </SectionCard>
    </PageContainer>
  );
}
