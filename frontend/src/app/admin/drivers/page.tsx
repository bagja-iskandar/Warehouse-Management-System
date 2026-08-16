"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Truck,
  Car,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Navigation,
  Star,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  simType: string;
  simExpiry: string;
  assignedVehicle: string;
  vehiclePlate: string;
  status: "ON_DUTY" | "AVAILABLE" | "RESTING";
  currentLocation: string;
  activeDeliveryOrder?: string;
  completedTrips: number;
  rating: number;
}

const DRIVERS_DATA: DriverRecord[] = [
  {
    id: "drv-1",
    name: "Ahmad Subarjo",
    phone: "0812-3456-7890",
    simType: "SIM B2 Umum",
    simExpiry: "14 Agu 2028",
    assignedVehicle: "Truk Reefer Isuzu Giga",
    vehiclePlate: "B 9821 TKN",
    status: "ON_DUTY",
    currentLocation: "Tol JORR KM 18 (Menuju BSD)",
    activeDeliveryOrder: "DO-2026-001",
    completedTrips: 142,
    rating: 4.9,
  },
  {
    id: "drv-2",
    name: "Doni Prasetyo",
    phone: "0813-8877-6655",
    simType: "SIM B1",
    simExpiry: "20 Mei 2027",
    assignedVehicle: "Box Truck Hino Dutro",
    vehiclePlate: "B 1234 XYZ",
    status: "ON_DUTY",
    currentLocation: "Gudang Cakung — Loading Dock 1",
    activeDeliveryOrder: "DO-2026-002",
    completedTrips: 98,
    rating: 4.8,
  },
  {
    id: "drv-3",
    name: "Rian Hidayat",
    phone: "0815-4433-2211",
    simType: "SIM A",
    simExpiry: "02 Okt 2029",
    assignedVehicle: "Blind Van Daihatsu GranMax",
    vehiclePlate: "B 5678 KLM",
    status: "AVAILABLE",
    currentLocation: "Pool Armada Gudang Cakung",
    completedTrips: 64,
    rating: 4.7,
  },
  {
    id: "drv-4",
    name: "Budi Santoso",
    phone: "0819-0011-2233",
    simType: "SIM B2 Umum",
    simExpiry: "18 Jan 2028",
    assignedVehicle: "Truk Reefer Mitsubishi Fuso",
    vehiclePlate: "B 3344 SBY",
    status: "RESTING",
    currentLocation: "Mess Driver Pool Bandung",
    completedTrips: 210,
    rating: 4.9,
  },
];

export default function DriverManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredDrivers = DRIVERS_DATA.filter((driver) => {
    const matchStatus =
      statusFilter === "ALL" || driver.status === statusFilter;
    const matchSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.assignedVehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const onDutyCount = DRIVERS_DATA.filter((d) => d.status === "ON_DUTY").length;
  const availableCount = DRIVERS_DATA.filter((d) => d.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Driver & Personel Armada
            </h1>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              Fleet Drivers
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengemudi logistik, status penugasan Delivery Order (DO), verifikasi SIM, dan performa on-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Data Driver</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Registrasi Driver Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Driver Terdaftar</span>
          <p className="text-2xl font-extrabold text-slate-900">{DRIVERS_DATA.length} Personel</p>
          <p className="text-[11px] text-slate-400">Terverifikasi SIM B1/B2/A</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Sedang Bertugas (On-Duty)</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-amber-600">{onDutyCount} Driver</p>
            <Badge variant="warning" className="text-[10px]">In-Transit</Badge>
          </div>
          <p className="text-[11px] text-slate-400">Membawa delivery order aktif</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Standby di Pool</span>
          <p className="text-2xl font-extrabold text-emerald-600">{availableCount} Driver</p>
          <p className="text-[11px] text-slate-400">Siap menerima dispatch baru</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Rating Performa Rata-rata</span>
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <span className="text-2xl font-extrabold text-slate-900">4.85 / 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">98.4% On-time Delivery</p>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Semua Driver ({DRIVERS_DATA.length})
            </button>
            <button
              onClick={() => setStatusFilter("ON_DUTY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "ON_DUTY"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Sedang Bertugas
            </button>
            <button
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "AVAILABLE"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Standby di Pool
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama driver, plat truk, atau no HP..."
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
                <th className="py-3 px-3">Nama Driver</th>
                <th className="py-3 px-3">Kontak & SIM</th>
                <th className="py-3 px-3">Armada Terpasang</th>
                <th className="py-3 px-3">Status Saat Ini</th>
                <th className="py-3 px-3">Lokasi / Tugas Aktif</th>
                <th className="py-3 px-3">Total Trip & Rating</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8.5 w-8.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 font-bold">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {driver.name}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          ID: {driver.id.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Phone & SIM */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-800 font-mono block">
                      {driver.phone}
                    </span>
                    <span className="text-[10.5px] text-slate-500 block">
                      {driver.simType} • Berlaku: {driver.simExpiry}
                    </span>
                  </td>

                  {/* Vehicle */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-900 block">
                      {driver.assignedVehicle}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded inline-block mt-0.5">
                      {driver.vehiclePlate}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {driver.status === "ON_DUTY" ? (
                      <Badge variant="warning" className="text-[10.5px]">
                        Dalam Tugas
                      </Badge>
                    ) : driver.status === "AVAILABLE" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Standby Siap
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10.5px]">
                        Istirahat
                      </Badge>
                    )}
                  </td>

                  {/* Location / Active DO */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-800 block text-[11.5px] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{driver.currentLocation}</span>
                    </span>
                    {driver.activeDeliveryOrder && (
                      <span className="text-[10.5px] text-indigo-600 font-mono font-bold block mt-0.5">
                        Tugas: {driver.activeDeliveryOrder}
                      </span>
                    )}
                  </td>

                  {/* Trip & Rating */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1 text-slate-900 font-bold">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>{driver.rating}</span>
                      <span className="text-slate-400 font-normal ml-1">
                        ({driver.completedTrips} trip)
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <Link href="/admin/logistics">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                      >
                        Dispatch →
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
