"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Grid3X3,
  Snowflake,
  Warehouse,
  Boxes,
  Thermometer,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlotDetailModal, SlotData } from "@/components/warehouse/SlotDetailModal";
import { useWarehouse } from "@/hooks/use-warehouses";

// Seeded Rack & Slot Data for Multi-Zones
const INITIAL_SLOTS: SlotData[] = [
  // ZONE A: COLD STORAGE
  {
    id: "slot-a1",
    code: "A-01-01",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.4°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-001",
    itemName: "Daging Sapi Wagyu A5 Import",
    itemQuantity: "150 Koli",
    batchNumber: "BATCH-WGY-2026-08",
    expiryDate: "12 Nov 2026",
    lastInspected: "15 Agu 2026",
  },
  {
    id: "slot-a2",
    code: "A-01-02",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.2°C",
    humidity: "64% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-002",
    itemName: "Salmon Fillet Premium Norwegia",
    itemQuantity: "120 Koli",
    batchNumber: "BATCH-SLM-2026-08",
    expiryDate: "28 Des 2026",
    lastInspected: "16 Agu 2026",
  },
  {
    id: "slot-a3",
    code: "A-01-03",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.5°C",
    humidity: "66% RH",
    status: "PARTIAL",
    capacityM3: 20,
    usedM3: 12,
    tenantName: "PT Sumber Frozen Makmur",
    tenantPic: "Dewi Lestari",
    itemSku: "BAR-FRESH-003",
    itemName: "Butter & Dairy Premium",
    itemQuantity: "80 Koli",
    batchNumber: "BATCH-BTR-2026-05",
    expiryDate: "10 Feb 2027",
    lastInspected: "14 Agu 2026",
  },
  {
    id: "slot-a4",
    code: "A-01-04",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.0°C",
    humidity: "65% RH",
    status: "AVAILABLE",
    capacityM3: 20,
    usedM3: 0,
  },
  {
    id: "slot-a5",
    code: "A-02-01",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.3°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-004",
    itemName: "Frozen Seafood Assorted",
    itemQuantity: "140 Koli",
    batchNumber: "BATCH-SEA-2026-07",
    expiryDate: "15 Jan 2027",
    lastInspected: "15 Agu 2026",
  },
  {
    id: "slot-a6",
    code: "A-02-02",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.1°C",
    humidity: "64% RH",
    status: "AVAILABLE",
    capacityM3: 20,
    usedM3: 0,
  },
  {
    id: "slot-a7",
    code: "A-02-03",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-17.9°C",
    humidity: "67% RH",
    status: "MAINTENANCE",
    capacityM3: 20,
    usedM3: 0,
  },
  {
    id: "slot-a8",
    code: "A-02-04",
    zone: "A",
    zoneName: "Zona A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.4°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Sumber Frozen Makmur",
    tenantPic: "Dewi Lestari",
    itemSku: "BAR-FRESH-005",
    itemName: "Keju Mozzarella Import",
    itemQuantity: "110 Koli",
    batchNumber: "BATCH-MOZ-2026-06",
    expiryDate: "20 Mei 2027",
    lastInspected: "16 Agu 2026",
  },

  // ZONE B: STANDARD STORAGE
  {
    id: "slot-b1",
    code: "B-01-01",
    zone: "B",
    zoneName: "Zona B — Rak Standar & Kering",
    zoneType: "STANDARD",
    temperature: "24.2°C",
    humidity: "50% RH",
    status: "OCCUPIED",
    capacityM3: 25,
    usedM3: 25,
    tenantName: "CV Furnitur Nusantara",
    tenantPic: "Bambang Wijaya",
    itemSku: "BAR-FURN-001",
    itemName: "Sofa Minimalis 3-Seater Velvet",
    itemQuantity: "20 Unit",
    batchNumber: "BATCH-SOF-2026-02",
    lastInspected: "12 Agu 2026",
  },
  {
    id: "slot-b2",
    code: "B-01-02",
    zone: "B",
    zoneName: "Zona B — Rak Standar & Kering",
    zoneType: "STANDARD",
    temperature: "24.0°C",
    humidity: "52% RH",
    status: "OCCUPIED",
    capacityM3: 25,
    usedM3: 25,
    tenantName: "CV Furnitur Nusantara",
    tenantPic: "Bambang Wijaya",
    itemSku: "BAR-FURN-002",
    itemName: "Meja Makan Kayu Jati Solid",
    itemQuantity: "15 Unit",
    batchNumber: "BATCH-MEJ-2026-03",
    lastInspected: "12 Agu 2026",
  },
  {
    id: "slot-b3",
    code: "B-01-03",
    zone: "B",
    zoneName: "Zona B — Rak Standar & Kering",
    zoneType: "STANDARD",
    temperature: "24.1°C",
    humidity: "51% RH",
    status: "AVAILABLE",
    capacityM3: 25,
    usedM3: 0,
  },
  {
    id: "slot-b4",
    code: "B-01-04",
    zone: "B",
    zoneName: "Zona B — Rak Standar & Kering",
    zoneType: "STANDARD",
    temperature: "24.0°C",
    humidity: "50% RH",
    status: "PARTIAL",
    capacityM3: 25,
    usedM3: 15,
    tenantName: "PT Global Retailindo",
    tenantPic: "Rina Marlina",
    itemSku: "BAR-RETAIL-001",
    itemName: "Karton Box Peralatan Elektronik",
    itemQuantity: "60 Box",
    batchNumber: "BATCH-ELK-2026-09",
    lastInspected: "10 Agu 2026",
  },

  // ZONE C: HEAVY DUTY
  {
    id: "slot-c1",
    code: "C-01-01",
    zone: "C",
    zoneName: "Zona C — Heavy Duty & Pallet",
    zoneType: "HEAVY_DUTY",
    temperature: "25.0°C",
    humidity: "55% RH",
    status: "OCCUPIED",
    capacityM3: 35,
    usedM3: 35,
    tenantName: "PT Logistik Indo Perkasa",
    tenantPic: "Surya Dharma",
    itemSku: "BAR-HVY-001",
    itemName: "Pallet Mesin Industri & Sparepart",
    itemQuantity: "12 Pallet",
    batchNumber: "BATCH-MSN-2026-01",
    lastInspected: "08 Agu 2026",
  },
  {
    id: "slot-c2",
    code: "C-01-02",
    zone: "C",
    zoneName: "Zona C — Heavy Duty & Pallet",
    zoneType: "HEAVY_DUTY",
    temperature: "25.2°C",
    humidity: "54% RH",
    status: "AVAILABLE",
    capacityM3: 35,
    usedM3: 0,
  },
];

export default function WarehouseCapacityPage() {
  const { data: warehouseDetail } = useWarehouse("wh-jkt-central");
  const [selectedZone, setSelectedZone] = useState<"A" | "B" | "C">("A");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const liveSlots: SlotData[] | null =
    warehouseDetail && warehouseDetail.slots && warehouseDetail.slots.length > 0
      ? warehouseDetail.slots.map((s) => {
          const zoneKey: "A" | "B" | "C" =
            s.zone === "COLD_STORAGE" ? "A" : s.zone === "STANDARD" ? "B" : "C";
          const statusKey: "OCCUPIED" | "PARTIAL" | "AVAILABLE" | "MAINTENANCE" =
            s.status === "OCCUPIED"
              ? s.usedM3 >= s.capacityM3
                ? "OCCUPIED"
                : "PARTIAL"
              : s.status === "MAINTENANCE"
              ? "MAINTENANCE"
              : "AVAILABLE";

          return {
            id: s.id,
            code: s.code,
            zone: zoneKey,
            zoneName:
              zoneKey === "A"
                ? "Zona A — Cold Storage"
                : zoneKey === "B"
                ? "Zona B — Rak Standar"
                : "Zona C — Heavy Duty",
            zoneType: s.zone,
            temperature: s.temperatureCelsius != null ? `${s.temperatureCelsius}°C` : "24.0°C",
            humidity: s.humidityPercent != null ? `${s.humidityPercent}% RH` : "55% RH",
            status: statusKey,
            capacityM3: s.capacityM3,
            usedM3: s.usedM3,
            tenantName: s.currentGoodsIds?.length > 0 ? "PT Fresh Foods Indonesia" : undefined,
            tenantPic: s.currentGoodsIds?.length > 0 ? "Hendra Prasetya" : undefined,
            itemSku: s.currentGoodsIds?.[0] ? `SKU-${s.currentGoodsIds[0].substring(0, 8).toUpperCase()}` : undefined,
            itemName: s.zone === "COLD_STORAGE" ? "Komoditas Cold Chain Terdaftar" : "Barang Kargo Standar",
            itemQuantity: s.currentGoodsIds?.length ? `${s.currentGoodsIds.length * 50} Koli` : undefined,
            lastInspected: "16 Agu 2026",
          };
        })
      : null;

  const activeSlots = liveSlots && liveSlots.length > 0 ? liveSlots : INITIAL_SLOTS;

  const filteredSlots = activeSlots.filter(
    (slot) =>
      slot.zone === selectedZone &&
      (statusFilter === "ALL" || slot.status === statusFilter)
  );

  const handleSlotClick = (slot: SlotData) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const getSlotStyle = (slot: SlotData) => {
    switch (slot.status) {
      case "OCCUPIED":
        return "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700";
      case "PARTIAL":
        return "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600";
      case "AVAILABLE":
        return "bg-slate-50 border-slate-300 text-slate-700 border-dashed hover:bg-slate-100 hover:border-slate-400";
      case "MAINTENANCE":
        return "bg-amber-500 border-amber-600 text-slate-950 hover:bg-amber-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Visualisasi Kapasitas Gudang & Alokasi Slot Rak
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Live 3D Grid
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status keterisian rak, telemetri suhu zona, dan detail penyewa di Gudang Cakung (JKT-01).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Zone Switcher Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tab Zona A */}
        <button
          type="button"
          onClick={() => setSelectedZone("A")}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedZone === "A"
              ? "bg-white border-sky-500 shadow-md ring-2 ring-sky-500/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-sky-600" />
              <span>ZONA A — COLD STORAGE</span>
            </span>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
              -18.4°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Penyimpanan daging, seafood & dairy beku bersuhu sub-zero.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">35 / 40 Slot Terisi</span>
            <span className="text-sky-600 font-mono">87.5%</span>
          </div>
        </button>

        {/* Tab Zona B */}
        <button
          type="button"
          onClick={() => setSelectedZone("B")}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedZone === "B"
              ? "bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Warehouse className="h-4 w-4 text-indigo-600" />
              <span>ZONA B — RAK STANDAR</span>
            </span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
              24.0°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Penyimpanan mebel, furnitur, dan produk retail kering.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">42 / 60 Slot Terisi</span>
            <span className="text-indigo-600 font-mono">70.0%</span>
          </div>
        </button>

        {/* Tab Zona C */}
        <button
          type="button"
          onClick={() => setSelectedZone("C")}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedZone === "C"
              ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-emerald-600" />
              <span>ZONA C — HEAVY DUTY</span>
            </span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              25.0°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Area pallet muatan berat & sparepart industri.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">20 / 30 Slot Terisi</span>
            <span className="text-emerald-600 font-mono">66.7%</span>
          </div>
        </button>
      </div>

      {/* Grid Canvas Card & Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Controls Bar: Filter & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Filter Status:</span>
            <div className="flex items-center gap-1.5">
              {["ALL", "OCCUPIED", "PARTIAL", "AVAILABLE"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === status
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status === "ALL"
                    ? "Semua Slot"
                    : status === "OCCUPIED"
                    ? "Terisi Penuh"
                    : status === "PARTIAL"
                    ? "Sebagian"
                    : "Tersedia"}
                </button>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-indigo-600" />
              <span>Terisi Penuh (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              <span>Terisi Sebagian</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-100 border border-dashed border-slate-300" />
              <span>Tersedia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-500" />
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        {/* Interactive Rack Visualizer Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Visualisasi Grid Rak & Bay — {selectedZone === "A" ? "Zona A (Cold)" : selectedZone === "B" ? "Zona B (Standard)" : "Zona C (Heavy Duty)"}
            </h2>
            <span className="text-xs text-slate-400">
              *Klik pada slot mana pun untuk memeriksa detail barang & penyewa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`p-4 rounded-xl border cursor-pointer transition-all transform hover:-translate-y-0.5 ${getSlotStyle(
                  slot
                )}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold">{slot.code}</span>
                  <span className="text-[10px] font-mono">{slot.temperature}</span>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-bold truncate">
                    {slot.itemName || (slot.status === "AVAILABLE" ? "Slot Kosong" : "Dalam Pemeliharaan")}
                  </p>
                  <p className="text-[10.5px] opacity-85 truncate mt-0.5">
                    {slot.tenantName || (slot.status === "AVAILABLE" ? "Siap dialokasikan" : "Teknisi bertugas")}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-mono">
                  <span>{slot.usedM3} / {slot.capacityM3} m³</span>
                  <span className="font-semibold underline">Detail →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Inspection Modal */}
      <SlotDetailModal
        slot={selectedSlot}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
