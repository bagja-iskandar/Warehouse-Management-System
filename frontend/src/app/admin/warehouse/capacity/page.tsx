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
    zoneName: "Zone A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.4°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-001",
    itemName: "Import Wagyu Beef Ribeye A5",
    itemQuantity: "150 Packages",
    batchNumber: "BATCH-WGY-2026-08",
    expiryDate: "12 Nov 2026",
    lastInspected: "15 Aug 2026",
  },
  {
    id: "slot-a2",
    code: "A-01-02",
    zone: "A",
    zoneName: "Zone A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.2°C",
    humidity: "64% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-002",
    itemName: "Premium Norwegian Salmon Fillet",
    itemQuantity: "120 Packages",
    batchNumber: "BATCH-SLM-2026-08",
    expiryDate: "28 Dec 2026",
    lastInspected: "16 Aug 2026",
  },
  {
    id: "slot-a3",
    code: "A-01-03",
    zone: "A",
    zoneName: "Zone A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.5°C",
    humidity: "66% RH",
    status: "PARTIAL",
    capacityM3: 20,
    usedM3: 12,
    tenantName: "PT Sumber Frozen Makmur",
    tenantPic: "Dewi Lestari",
    itemSku: "BAR-FRESH-003",
    itemName: "Premium Butter & Dairy",
    itemQuantity: "80 Packages",
    batchNumber: "BATCH-BTR-2026-05",
    expiryDate: "10 Feb 2027",
    lastInspected: "14 Aug 2026",
  },
  {
    id: "slot-a4",
    code: "A-01-04",
    zone: "A",
    zoneName: "Zone A — Cold Storage",
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
    zoneName: "Zone A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.3°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Fresh Foods Indonesia",
    tenantPic: "Hendra Prasetya",
    itemSku: "BAR-FRESH-004",
    itemName: "Assorted Frozen Seafood",
    itemQuantity: "140 Packages",
    batchNumber: "BATCH-SEA-2026-07",
    expiryDate: "15 Jan 2027",
    lastInspected: "15 Aug 2026",
  },
  {
    id: "slot-a6",
    code: "A-02-02",
    zone: "A",
    zoneName: "Zone A — Cold Storage",
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
    zoneName: "Zone A — Cold Storage",
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
    zoneName: "Zone A — Cold Storage",
    zoneType: "COLD_STORAGE",
    temperature: "-18.4°C",
    humidity: "65% RH",
    status: "OCCUPIED",
    capacityM3: 20,
    usedM3: 20,
    tenantName: "PT Sumber Frozen Makmur",
    tenantPic: "Dewi Lestari",
    itemSku: "BAR-FRESH-005",
    itemName: "Import Mozzarella Cheese",
    itemQuantity: "110 Packages",
    batchNumber: "BATCH-MOZ-2026-06",
    expiryDate: "20 May 2027",
    lastInspected: "16 Aug 2026",
  },

  // ZONE B: STANDARD STORAGE
  {
    id: "slot-b1",
    code: "B-01-01",
    zone: "B",
    zoneName: "Zone B — Standard & Dry Rack",
    zoneType: "STANDARD",
    temperature: "24.2°C",
    humidity: "50% RH",
    status: "OCCUPIED",
    capacityM3: 25,
    usedM3: 25,
    tenantName: "CV Furnitur Nusantara",
    tenantPic: "Bambang Wijaya",
    itemSku: "BAR-FURN-001",
    itemName: "3-Seater Velvet Sofa",
    itemQuantity: "20 Units",
    batchNumber: "BATCH-SOF-2026-02",
    lastInspected: "12 Aug 2026",
  },
  {
    id: "slot-b2",
    code: "B-01-02",
    zone: "B",
    zoneName: "Zone B — Standard & Dry Rack",
    zoneType: "STANDARD",
    temperature: "24.0°C",
    humidity: "52% RH",
    status: "OCCUPIED",
    capacityM3: 25,
    usedM3: 25,
    tenantName: "CV Furnitur Nusantara",
    tenantPic: "Bambang Wijaya",
    itemSku: "BAR-FURN-002",
    itemName: "Solid Teak Wood Dining Table",
    itemQuantity: "15 Units",
    batchNumber: "BATCH-MEJ-2026-03",
    lastInspected: "12 Aug 2026",
  },
  {
    id: "slot-b3",
    code: "B-01-03",
    zone: "B",
    zoneName: "Zone B — Standard & Dry Rack",
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
    zoneName: "Zone B — Standard & Dry Rack",
    zoneType: "STANDARD",
    temperature: "24.0°C",
    humidity: "50% RH",
    status: "PARTIAL",
    capacityM3: 25,
    usedM3: 15,
    tenantName: "PT Global Retailindo",
    tenantPic: "Rina Marlina",
    itemSku: "BAR-RETAIL-001",
    itemName: "Electronic Equipment Master Cartons",
    itemQuantity: "60 Boxes",
    batchNumber: "BATCH-ELK-2026-09",
    lastInspected: "10 Aug 2026",
  },

  // ZONE C: HEAVY DUTY
  {
    id: "slot-c1",
    code: "C-01-01",
    zone: "C",
    zoneName: "Zone C — Heavy Duty & Pallet",
    zoneType: "HEAVY_DUTY",
    temperature: "25.0°C",
    humidity: "55% RH",
    status: "OCCUPIED",
    capacityM3: 35,
    usedM3: 35,
    tenantName: "PT Logistik Indo Perkasa",
    tenantPic: "Surya Dharma",
    itemSku: "BAR-HVY-001",
    itemName: "Industrial Machinery Pallet & Spareparts",
    itemQuantity: "12 Pallets",
    batchNumber: "BATCH-MSN-2026-01",
    lastInspected: "08 Aug 2026",
  },
  {
    id: "slot-c2",
    code: "C-01-02",
    zone: "C",
    zoneName: "Zone C — Heavy Duty & Pallet",
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
                ? "Zone A — Cold Storage"
                : zoneKey === "B"
                ? "Zone B — Standard Rack"
                : "Zone C — Heavy Duty",
            zoneType: s.zone,
            temperature: s.temperatureCelsius != null ? `${s.temperatureCelsius}°C` : "24.0°C",
            humidity: s.humidityPercent != null ? `${s.humidityPercent}% RH` : "55% RH",
            status: statusKey,
            capacityM3: s.capacityM3,
            usedM3: s.usedM3,
            tenantName: s.currentGoodsIds?.length > 0 ? "PT Fresh Foods Indonesia" : undefined,
            tenantPic: s.currentGoodsIds?.length > 0 ? "Hendra Prasetya" : undefined,
            itemSku: s.currentGoodsIds?.[0] ? `SKU-${s.currentGoodsIds[0].substring(0, 8).toUpperCase()}` : undefined,
            itemName: s.zone === "COLD_STORAGE" ? "Registered Cold Chain Commodity" : "Standard Cargo Goods",
            itemQuantity: s.currentGoodsIds?.length ? `${s.currentGoodsIds.length * 50} Packages` : undefined,
            lastInspected: "16 Aug 2026",
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
              Warehouse Capacity Visualization & Rack Slot Allocation
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Live 3D Grid
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor rack occupancy status, zone temperature telemetry, and tenant allocation at Cakung Hub (JKT-01).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Back to Dashboard
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
              <span>ZONE A — COLD STORAGE</span>
            </span>
            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
              -18.4°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Sub-zero storage for frozen beef, seafood & dairy commodities.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">35 / 40 Slots Occupied</span>
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
              <span>ZONE B — STANDARD RACK</span>
            </span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
              24.0°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Storage for furniture, apparel, and dry retail products.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">42 / 60 Slots Occupied</span>
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
              <span>ZONE C — HEAVY DUTY</span>
            </span>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
              25.0°C
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Heavy cargo pallet area & industrial spare parts.
          </p>
          <div className="mt-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">20 / 30 Slots Occupied</span>
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
                    ? "All Slots"
                    : status === "OCCUPIED"
                    ? "Fully Occupied"
                    : status === "PARTIAL"
                    ? "Partial"
                    : "Available"}
                </button>
              ))}
            </div>
          </div>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-indigo-600" />
              <span>Fully Occupied (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              <span>Partially Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-slate-100 border border-dashed border-slate-300" />
              <span>Available</span>
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
              Rack & Bay Grid Visualization — {selectedZone === "A" ? "Zone A (Cold)" : selectedZone === "B" ? "Zone B (Standard)" : "Zone C (Heavy Duty)"}
            </h2>
            <span className="text-xs text-slate-400">
              *Click on any slot to inspect goods & tenant details
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
                    {slot.itemName || (slot.status === "AVAILABLE" ? "Vacant Slot" : "Under Maintenance")}
                  </p>
                  <p className="text-[10.5px] opacity-85 truncate mt-0.5">
                    {slot.tenantName || (slot.status === "AVAILABLE" ? "Ready to allocate" : "Technician on duty")}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-mono">
                  <span>{slot.usedM3} / {slot.capacityM3} m³</span>
                  <span className="font-semibold underline">Details →</span>
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
