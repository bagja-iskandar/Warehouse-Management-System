"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Warehouse,
  Boxes,
  Grid3X3,
  Snowflake,
  Thermometer,
  MapPin,
  User,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Activity,
  Layers,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWarehouses } from "@/hooks/use-warehouses";

interface HubFacility {
  id: string;
  code: string;
  name: string;
  location: string;
  picName: string;
  status: "NORMAL" | "WARNING" | "MAINTENANCE";
  totalCapacityM3: number;
  usedCapacityM3: number;
  coldCapacityM3: number;
  coldUsedM3: number;
  coldTemp: string;
  standardCapacityM3: number;
  standardUsedM3: number;
  standardTemp: string;
  totalSlots: number;
  occupiedSlots: number;
  activeTenantsCount: number;
}

const HUBS_DATA: HubFacility[] = [
  {
    id: "hub-ckg",
    code: "WH-CKG-01",
    name: "Gudang Utama Cakung Logistics Hub",
    location: "Kawasan Industri Pulo Gadung, Jakarta Timur",
    picName: "Hendra Wijaya (0812-3344-5566)",
    status: "NORMAL",
    totalCapacityM3: 5000,
    usedCapacityM3: 3150,
    coldCapacityM3: 2000,
    coldUsedM3: 1700,
    coldTemp: "-18.4°C",
    standardCapacityM3: 3000,
    standardUsedM3: 1450,
    standardTemp: "24.0°C",
    totalSlots: 40,
    occupiedSlots: 35,
    activeTenantsCount: 4,
  },
  {
    id: "hub-bdg",
    code: "WH-BDG-01",
    name: "Hub Distribusi Jawa Barat Gedebage",
    location: "Kawasan Logistik Terpadu Gedebage, Bandung",
    picName: "Asep Sunandar (0813-7788-9900)",
    status: "NORMAL",
    totalCapacityM3: 3000,
    usedCapacityM3: 1400,
    coldCapacityM3: 1000,
    coldUsedM3: 600,
    coldTemp: "-20.1°C",
    standardCapacityM3: 2000,
    standardUsedM3: 800,
    standardTemp: "22.5°C",
    totalSlots: 25,
    occupiedSlots: 14,
    activeTenantsCount: 2,
  },
];

export default function WarehouseOverviewPage() {
  const { data: liveWarehouses } = useWarehouses();
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeHubs: HubFacility[] =
    liveWarehouses && liveWarehouses.length > 0
      ? liveWarehouses.map((w) => ({
          id: w.id,
          code: w.code,
          name: w.name,
          location: `${w.address}, ${w.city}`,
          picName: `${w.managerName} (${w.contactPhone})`,
          status: "NORMAL" as const,
          totalCapacityM3: w.totalCapacityM3,
          usedCapacityM3: w.usedCapacityM3,
          coldCapacityM3: w.zones?.coldStorageCapacityM3 || 0,
          coldUsedM3: Math.round(
            (w.zones?.coldStorageCapacityM3 || 0) *
              (w.usedCapacityM3 / (w.totalCapacityM3 || 1))
          ),
          coldTemp: "-18.4°C",
          standardCapacityM3: w.zones?.standardCapacityM3 || 0,
          standardUsedM3: Math.round(
            (w.zones?.standardCapacityM3 || 0) *
              (w.usedCapacityM3 / (w.totalCapacityM3 || 1))
          ),
          standardTemp: "24.0°C",
          totalSlots: w.slotsCount || 0,
          occupiedSlots: w.occupiedSlotsCount || 0,
          activeTenantsCount: 4,
        }))
      : HUBS_DATA;

  const filteredHubs = activeHubs.filter((hub) => {
    const matchTab =
      selectedTab === "ALL" ||
      (selectedTab === "CKG" && hub.code === "WH-CKG-01") ||
      (selectedTab === "BDG" && hub.code === "WH-BDG-01");
    const matchSearch =
      hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hub.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalCapacitySum = activeHubs.reduce((acc, h) => acc + h.totalCapacityM3, 0);
  const totalUsedSum = activeHubs.reduce((acc, h) => acc + h.usedCapacityM3, 0);
  const totalSlotsSum = activeHubs.reduce((acc, h) => acc + h.totalSlots, 0);
  const totalOccupiedSlotsSum = activeHubs.reduce((acc, h) => acc + h.occupiedSlots, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Overview Fasilitas & Jaringan Pergudangan
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Multi-Hub Network
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring utilisasi kapasitas fisik, alokasi zona cold & standard storage, serta status operasional seluruh hub.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Laporan Kapasitas</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Tambah Fasilitas Gudang</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedTab === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Semua Fasilitas (2 Hub)
          </button>
          <button
            onClick={() => setSelectedTab("CKG")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedTab === "CKG"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Gudang Utama Cakung (WH-CKG-01)
          </button>
          <button
            onClick={() => setSelectedTab("BDG")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedTab === "BDG"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Gudang Gedebage Bandung (WH-BDG-01)
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari hub gudang atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Kapasitas Fisik */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Kapasitas Jaringan
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">
              {totalCapacitySum.toLocaleString("id-ID")} m³
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-mono">Total</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {totalUsedSum.toLocaleString("id-ID")} m³ Terpakai
            </span>
            <span className="font-bold text-indigo-600 font-mono">
              {((totalUsedSum / totalCapacitySum) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${(totalUsedSum / totalCapacitySum) * 100}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Ruang Tersedia */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Ruang Masih Tersedia
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Warehouse className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">
              {(totalCapacitySum - totalUsedSum).toLocaleString("id-ID")} m³
            </span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold ml-1.5">
              Kosong
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Standard Storage:
              </span>
              <span className="font-bold text-slate-700">2.750 m³</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Cold Storage:
              </span>
              <span className="font-bold text-slate-700">700 m³</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Slot Rak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Slot Rak Fisik
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Grid3X3 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">
              {totalSlotsSum} Slot
            </span>
          </div>
          <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
            <span className="text-indigo-600 font-bold">{totalOccupiedSlotsSum} Terisi</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">
              {totalSlotsSum - totalOccupiedSlotsSum - 1} Tersedia
            </span>
            <span>•</span>
            <span className="text-amber-600 font-bold">1 Maint</span>
          </div>
        </div>

        {/* KPI 4: Status Operasional Hub */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Status Operasional Hub
            </span>
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">2 Hub</span>
            <Badge variant="success" className="text-[10px]">
              Aktif Normal
            </Badge>
          </div>
          <div className="space-y-1 text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>0 Peringatan Suhu Sensor</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>99.8% Uptime Jaringan Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Hub Facilities Detail List & Telemetry Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Hub Facility Cards (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Fasilitas Gudang & Utilisasi Zona
          </h2>

          <div className="space-y-4">
            {filteredHubs.map((hub) => {
              const usedPercentage = ((hub.usedCapacityM3 / hub.totalCapacityM3) * 100).toFixed(1);
              const coldPercentage = ((hub.coldUsedM3 / hub.coldCapacityM3) * 100).toFixed(1);
              const stdPercentage = ((hub.standardUsedM3 / hub.standardCapacityM3) * 100).toFixed(1);

              return (
                <div
                  key={hub.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 hover:border-slate-300 transition-colors"
                >
                  {/* Hub Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-bold text-slate-900">
                          {hub.name}
                        </h3>
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {hub.code}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Operasional Normal
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{hub.location}</span>
                        <span>•</span>
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>PIC: {hub.picName}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href="/admin/warehouse/capacity">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm h-8.5 px-3 flex items-center gap-1.5">
                          <Grid3X3 className="h-3.5 w-3.5" />
                          <span>Visualisasi Rak</span>
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Capacity & Zone Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Capacity Progress */}
                    <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Total Kapasitas Fisik</span>
                        <span className="font-bold text-slate-900">
                          {hub.usedCapacityM3.toLocaleString("id-ID")} / {hub.totalCapacityM3.toLocaleString("id-ID")} m³ ({usedPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${usedPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Penyewa Aktif: {hub.activeTenantsCount} Perusahaan</span>
                        <span>Slot: {hub.occupiedSlots} / {hub.totalSlots} Terisi</span>
                      </div>
                    </div>

                    {/* Zone Breakdown Stats */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Cold Zone */}
                      <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-sky-900 flex items-center gap-1">
                            <Snowflake className="h-3 w-3 text-sky-600" />
                            <span>Cold Storage</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                            {hub.coldTemp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          {hub.coldUsedM3} / {hub.coldCapacityM3} m³
                        </p>
                        <p className="text-[10.5px] text-sky-700 font-medium">
                          {coldPercentage}% Terisi
                        </p>
                      </div>

                      {/* Standard Zone */}
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                            <Warehouse className="h-3 w-3 text-emerald-600" />
                            <span>Standard</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            {hub.standardTemp}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          {hub.standardUsedM3} / {hub.standardCapacityM3} m³
                        </p>
                        <p className="text-[10.5px] text-emerald-700 font-medium">
                          {stdPercentage}% Terisi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Hub Monitoring & Maintenance Schedule (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Telemetry Health Monitor Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Monitoring Sensor Jaringan
              </h2>
              <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Hub Cakung (JKT-01)</span>
                  <span className="text-sky-600 font-mono">-18.4°C</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Node Sensor: SN-CKG-001 (Cold A) & SN-CKG-002 (Std B)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Hub Gedebage (BDG-01)</span>
                  <span className="text-sky-600 font-mono">-20.1°C</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Node Sensor: SN-BDG-001 (Cold A) & SN-BDG-002 (Std B)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Facility Audit Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Jadwal Audit & Pemeliharaan
              </h2>
              <Badge variant="outline" className="text-[10px]">
                Q3 2026
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Kalibrasi Sensor Suhu Cold Storage</p>
                  <p className="text-[11px] text-slate-500">Hub Cakung • Jadwal: 20 Agu 2026</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-amber-50 text-amber-600 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Inspeksi Struktur Rak Slot A-02-03</p>
                  <p className="text-[11px] text-slate-500">Dalam Perbaikan • Teknisi PT ColdTech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
