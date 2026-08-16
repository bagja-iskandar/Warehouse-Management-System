"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  Thermometer,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Gauge,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FleetVehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: "REEFER_TRUCK" | "BOX_TRUCK" | "BLIND_VAN";
  capacityM3: number;
  maxWeightKg: number;
  hasReefer: boolean;
  reeferTemp?: string;
  reeferStatus?: "COOLING_OPTIMAL" | "STANDBY" | "OFF";
  assignedDriver?: string;
  assignedDriverPhone?: string;
  status: "IN_TRANSIT" | "LOADING" | "AVAILABLE" | "MAINTENANCE";
  hubBase: string;
  kirExpiry: string;
  odometerKm: number;
}

const FLEET_DATA: FleetVehicle[] = [
  {
    id: "veh-1",
    name: "Truk Reefer Isuzu Giga FVR",
    plateNumber: "B 9821 TKN",
    type: "REEFER_TRUCK",
    capacityM3: 12,
    maxWeightKg: 5000,
    hasReefer: true,
    reeferTemp: "-18.2°C",
    reeferStatus: "COOLING_OPTIMAL",
    assignedDriver: "Ahmad Subarjo",
    assignedDriverPhone: "0812-3456-7890",
    status: "IN_TRANSIT",
    hubBase: "Gudang Cakung (JKT-01)",
    kirExpiry: "12 Des 2026",
    odometerKm: 42350,
  },
  {
    id: "veh-2",
    name: "Box Truck Hino Dutro 130 HD",
    plateNumber: "B 1234 XYZ",
    type: "BOX_TRUCK",
    capacityM3: 16,
    maxWeightKg: 4000,
    hasReefer: false,
    assignedDriver: "Doni Prasetyo",
    assignedDriverPhone: "0813-8877-6655",
    status: "LOADING",
    hubBase: "Gudang Cakung (JKT-01)",
    kirExpiry: "18 Okt 2026",
    odometerKm: 58900,
  },
  {
    id: "veh-3",
    name: "Blind Van Daihatsu GranMax 1.5",
    plateNumber: "B 5678 KLM",
    type: "BLIND_VAN",
    capacityM3: 4,
    maxWeightKg: 1000,
    hasReefer: false,
    assignedDriver: "Rian Hidayat",
    assignedDriverPhone: "0815-4433-2211",
    status: "AVAILABLE",
    hubBase: "Gudang Cakung (JKT-01)",
    kirExpiry: "04 Feb 2027",
    odometerKm: 21400,
  },
  {
    id: "veh-4",
    name: "Truk Reefer Mitsubishi Fuso Fighter",
    plateNumber: "B 3344 SBY",
    type: "REEFER_TRUCK",
    capacityM3: 14,
    maxWeightKg: 6000,
    hasReefer: true,
    reeferTemp: "-20.0°C",
    reeferStatus: "STANDBY",
    assignedDriver: "Budi Santoso",
    assignedDriverPhone: "0819-0011-2233",
    status: "AVAILABLE",
    hubBase: "Hub Bandung (BDG-01)",
    kirExpiry: "22 Nov 2026",
    odometerKm: 34100,
  },
];

export default function FleetManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const filteredFleet = FLEET_DATA.filter((vehicle) => {
    const matchType = typeFilter === "ALL" || vehicle.type === typeFilter;
    const matchSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.assignedDriver && vehicle.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalCapacityM3 = FLEET_DATA.reduce((acc, v) => acc + v.capacityM3, 0);
  const reeferCount = FLEET_DATA.filter((v) => v.hasReefer).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Armada & Kendaraan Logistik
            </h1>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              Fleet Center
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar armada truk berpendingin (Reefer), box truck, uji KIR berkala, dan penugasan driver.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Data Armada</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Tambah Kendaraan Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Armada Aktif</span>
          <p className="text-2xl font-extrabold text-slate-900">{FLEET_DATA.length} Unit</p>
          <p className="text-[11px] text-slate-400">Truk & Van operasional</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Armada Reefer (Dingin)</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600">{reeferCount} Unit</p>
            <Badge variant="success" className="text-[10px]">Suhu Sub-zero</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Dilengkapi sensor telemetri</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Kapasitas Muatan</span>
          <p className="text-2xl font-extrabold text-indigo-600">{totalCapacityM3} m³</p>
          <p className="text-[11px] text-slate-400">Daya tampung simultan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Uji KIR & Servis</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Semua Lolos Uji KIR</span>
          </div>
          <p className="text-[11px] text-slate-400">100% Layak Jalan Operasional</p>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Semua Tipe ({FLEET_DATA.length})
            </button>
            <button
              onClick={() => setTypeFilter("REEFER_TRUCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "REEFER_TRUCK"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Truk Reefer (Dingin)
            </button>
            <button
              onClick={() => setTypeFilter("BOX_TRUCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "BOX_TRUCK"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Box Truck
            </button>
            <button
              onClick={() => setTypeFilter("BLIND_VAN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "BLIND_VAN"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Blind Van
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tipe truk, plat nomor, atau driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Nama Kendaraan & Plat</th>
                <th className="py-3 px-3">Kapasitas & Tipe</th>
                <th className="py-3 px-3">Suhu Reefer</th>
                <th className="py-3 px-3">Driver Bertugas</th>
                <th className="py-3 px-3">Status Operasi</th>
                <th className="py-3 px-3">Base Hub & KIR</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFleet.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Vehicle Name & Plate */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
                          vehicle.hasReefer
                            ? "bg-sky-50 text-sky-600 border border-sky-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {vehicle.hasReefer ? (
                          <Thermometer className="h-4 w-4" />
                        ) : (
                          <Truck className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {vehicle.name}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          {vehicle.plateNumber}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Capacity */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-indigo-600 block font-mono">
                      {vehicle.capacityM3} m³
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      Maks: {vehicle.maxWeightKg.toLocaleString("id-ID")} kg
                    </span>
                  </td>

                  {/* Reefer Temperature */}
                  <td className="py-3.5 px-3">
                    {vehicle.hasReefer ? (
                      <div>
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] border border-sky-200">
                          {vehicle.reeferTemp}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                          ● Aktif Optimal
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono">Standard Dry</span>
                    )}
                  </td>

                  {/* Assigned Driver */}
                  <td className="py-3.5 px-3">
                    {vehicle.assignedDriver ? (
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {vehicle.assignedDriver}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {vehicle.assignedDriverPhone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum ditugaskan</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {vehicle.status === "IN_TRANSIT" ? (
                      <Badge variant="warning" className="text-[10.5px]">
                        Dalam Transit
                      </Badge>
                    ) : vehicle.status === "LOADING" ? (
                      <Badge variant="default" className="text-[10.5px] bg-indigo-600">
                        Proses Loading
                      </Badge>
                    ) : vehicle.status === "AVAILABLE" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Standby Pool
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10.5px]">
                        Maintenance
                      </Badge>
                    )}
                  </td>

                  {/* Hub Base & KIR */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-700 block text-[11.5px]">
                      {vehicle.hubBase}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      KIR s/d: {vehicle.kirExpiry}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <Link href="/admin/logistics">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                      >
                        Tugaskan →
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
