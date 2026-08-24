"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/dashboard";
import { SlotDetailModal, SlotData } from "@/components/warehouse/SlotDetailModal";
import { useWarehouses, useWarehouse } from "@/hooks/use-warehouses";
import { useWarehouseStore } from "@/store/warehouse.store";
import { StorageZoneType } from "@/types/warehouse.types";

export default function WarehouseCapacityPage() {
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouseStore();
  const { data: warehouseList = [], isLoading: isLoadingList } = useWarehouses();

  const [activeWhId, setActiveWhId] = useState<string>("");

  useEffect(() => {
    if (selectedWarehouseId) {
      setActiveWhId(selectedWarehouseId);
    } else if (warehouseList.length > 0) {
      setActiveWhId(warehouseList[0].id);
      setSelectedWarehouseId(warehouseList[0].id);
    }
  }, [selectedWarehouseId, warehouseList, setSelectedWarehouseId]);

  const {
    data: warehouseDetail,
    isLoading: isLoadingDetail,
    refetch: refetchWarehouse,
    isFetching,
  } = useWarehouse(activeWhId);

  const [selectedZone, setSelectedZone] = useState<"COLD_STORAGE" | "STANDARD" | "HEAVY_DUTY">(
    "STANDARD"
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rawSlots = warehouseDetail?.slots || [];

  const mappedSlots: SlotData[] = rawSlots.map((s) => {
    const usedM3 = Number(s.usedM3 || 0);
    const capacityM3 = Number(s.capacityM3 || 0);
    const isMaintenance = s.status === "MAINTENANCE";

    const statusKey: "OCCUPIED" | "PARTIAL" | "AVAILABLE" | "MAINTENANCE" =
      isMaintenance
        ? "MAINTENANCE"
        : usedM3 === 0
        ? "AVAILABLE"
        : usedM3 >= capacityM3
        ? "OCCUPIED"
        : "PARTIAL";

    const firstGood = s.storedGoods && s.storedGoods.length > 0 ? s.storedGoods[0] : null;

    return {
      id: s.id,
      code: s.code,
      warehouseId: s.warehouseId,
      warehouseName: warehouseDetail?.name || "Warehouse Facility",
      zone: s.zone === "COLD_STORAGE" ? "A" : s.zone === "STANDARD" ? "B" : "C",
      zoneName:
        s.zone === "COLD_STORAGE"
          ? "Zone A — Cold Storage (-18°C)"
          : s.zone === "STANDARD"
          ? "Zone B — Standard & Dry Rack (24°C)"
          : "Zone C — Heavy Duty & Pallet",
      zoneType: s.zone,
      temperature:
        s.temperatureCelsius != null
          ? `${s.temperatureCelsius}°C`
          : s.zone === "COLD_STORAGE"
          ? "-18.4°C"
          : "24.0°C",
      humidity: s.humidityPercent != null ? `${s.humidityPercent}% RH` : "60% RH",
      status: statusKey,
      capacityM3,
      usedM3,
      tenantName: firstGood ? firstGood.customerName : undefined,
      goodsName: firstGood ? firstGood.name : undefined,
      goodsBarcode: firstGood ? firstGood.barcode : undefined,
      packageCount: firstGood ? firstGood.quantity : undefined,
      unit: firstGood ? firstGood.unit : undefined,
      allGoods: (s.storedGoods || []).map((g) => ({
        id: g.id,
        name: g.name,
        barcode: g.barcode,
        customerName: g.customerName,
        quantity: g.quantity,
        unit: g.unit,
        volumeM3: g.volumeM3 || 0,
      })),
      lastUpdated: (s as any).updatedAt || new Date().toISOString(),
    };
  });

  const handleSlotClick = (slot: SlotData) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleTransferSuccess = () => {
    refetchWarehouse();
  };

  // Dynamic Zone Statistics
  const coldSlots = mappedSlots.filter((s) => s.zoneType === "COLD_STORAGE");
  const coldUsedM3 = Number(coldSlots.reduce((sum, s) => sum + s.usedM3, 0).toFixed(2));
  const coldCapM3 = Number(coldSlots.reduce((sum, s) => sum + s.capacityM3, 0).toFixed(2));
  const coldOccupied = coldSlots.filter((s) => s.usedM3 > 0).length;
  const coldPct = coldCapM3 > 0 ? (coldUsedM3 / coldCapM3) * 100 : 0;

  const stdSlots = mappedSlots.filter((s) => s.zoneType === "STANDARD");
  const stdUsedM3 = Number(stdSlots.reduce((sum, s) => sum + s.usedM3, 0).toFixed(2));
  const stdCapM3 = Number(stdSlots.reduce((sum, s) => sum + s.capacityM3, 0).toFixed(2));
  const stdOccupied = stdSlots.filter((s) => s.usedM3 > 0).length;
  const stdPct = stdCapM3 > 0 ? (stdUsedM3 / stdCapM3) * 100 : 0;

  const heavySlots = mappedSlots.filter((s) => s.zoneType === "HEAVY_DUTY");
  const heavyUsedM3 = Number(heavySlots.reduce((sum, s) => sum + s.usedM3, 0).toFixed(2));
  const heavyCapM3 = Number(heavySlots.reduce((sum, s) => sum + s.capacityM3, 0).toFixed(2));
  const heavyOccupied = heavySlots.filter((s) => s.usedM3 > 0).length;
  const heavyPct = heavyCapM3 > 0 ? (heavyUsedM3 / heavyCapM3) * 100 : 0;

  // Real Dynamic Warehouse Accounting
  const totalCapM3 = warehouseDetail?.totalCapacityM3
    ? Number(warehouseDetail.totalCapacityM3)
    : mappedSlots.reduce((sum, s) => sum + s.capacityM3, 0);

  const usedCapM3 = Number(
    mappedSlots.reduce((sum, s) => sum + s.usedM3, 0).toFixed(2)
  );
  const remainingCapM3 = Math.max(0, Number((totalCapM3 - usedCapM3).toFixed(2)));
  const occupancyRate = totalCapM3 > 0 ? ((usedCapM3 / totalCapM3) * 100).toFixed(1) : "0.0";
  const totalOccupiedSlotsCount = mappedSlots.filter((s) => s.usedM3 > 0).length;

  if ((isLoadingList && warehouseList.length === 0) || (isLoadingDetail && !warehouseDetail)) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* 1. Standard Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Capacity & Rack Grid"
        title="Warehouse Capacity & Visual Rack Slot Allocation"
        subtitle="Real-time rack occupancy status, telemetry, tenant allocation, and intra-warehouse goods relocation."
        badgeText="Live 3D Matrix"
        badgeColor="bg-indigo-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetchWarehouse()}
        actions={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 h-9 shadow-sm">
              <Building2 className="h-4 w-4 text-indigo-600" />
              <select
                value={activeWhId}
                onChange={(e) => {
                  setActiveWhId(e.target.value);
                  setSelectedWarehouseId(e.target.value);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {warehouseList.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
            <Link href="/admin/goods">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Boxes className="h-4 w-4" />
                <span>Goods Registry</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Standardized 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Warehouse Capacity"
          value={`${usedCapM3.toLocaleString("en-US")} m³`}
          subvalue={`/ ${totalCapM3.toLocaleString("en-US")} m³`}
          icon={Boxes}
          theme="indigo"
          progress={{ value: Number(occupancyRate) }}
          badge={
            <span className="font-bold text-indigo-600 font-mono text-xs">
              {occupancyRate}%
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Occupied volume</span>
              <span className="font-semibold text-indigo-600">{totalOccupiedSlotsCount} / {mappedSlots.length} Slots</span>
            </span>
          }
        />

        <MetricCard
          label="Remaining Available Space"
          value={`${remainingCapM3.toLocaleString("en-US")} m³`}
          icon={Warehouse}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] py-0 font-semibold">
              Available
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Ready for immediate customer put-away
            </span>
          }
        />

        <MetricCard
          label="Cold Storage Zone"
          value={`${coldUsedM3} m³`}
          subvalue={`/ ${coldCapM3} m³`}
          icon={Snowflake}
          theme="sky"
          progress={{ value: coldPct }}
          badge={
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
              -18.4°C Optimal
            </Badge>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px] font-mono">
              <span>{coldOccupied} / {coldSlots.length} Slots Occupied</span>
              <span className="font-semibold text-sky-700">{coldPct.toFixed(1)}%</span>
            </span>
          }
        />

        <MetricCard
          label="Standard Dry Storage"
          value={`${stdUsedM3} m³`}
          subvalue={`/ ${stdCapM3} m³`}
          icon={Layers}
          theme="amber"
          progress={{ value: stdPct }}
          badge={
            <span className="text-xs text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded-md">
              {stdPct.toFixed(1)}% Used
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px] font-mono">
              <span>{stdOccupied} / {stdSlots.length} Slots Occupied</span>
              <span className="font-semibold text-amber-700">{stdSlots.length - stdOccupied} Vacant</span>
            </span>
          }
        />
      </div>

      {/* 3. Main Section: Zone Tabs + Filter Controls + Slot Grid */}
      <SectionCard
        title="Physical Rack Matrix & Zone Allocation Grid"
        subtitle={`Viewing ${warehouseDetail?.name || "Facility"} • Click any slot to view cargo details or execute intra-rack relocation.`}
        icon={Grid3X3}
      >
        <div className="space-y-5">
          {/* Zone Selector Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedZone("STANDARD")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedZone === "STANDARD"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Warehouse className="h-3.5 w-3.5 text-amber-400" />
                <span>Zone B: Standard Dry ({stdSlots.length} Slots)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedZone("COLD_STORAGE")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedZone === "COLD_STORAGE"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Snowflake className="h-3.5 w-3.5" />
                <span>Zone A: Cold Storage ({coldSlots.length} Slots)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedZone("HEAVY_DUTY")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedZone === "HEAVY_DUTY"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Zone C: Heavy Duty ({heavySlots.length} Slots)</span>
              </button>
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Slots</option>
                <option value="AVAILABLE">Vacant / Available</option>
                <option value="PARTIAL">Partially Stored</option>
                <option value="OCCUPIED">Full / Occupied</option>
              </select>
            </div>
          </div>

          {/* Slot Grid Container */}
          {mappedSlots.filter(
            (s) =>
              s.zoneType === selectedZone &&
              (statusFilter === "ALL" || s.status === statusFilter)
          ).length === 0 ? (
            <EmptyState
              icon={Grid3X3}
              title="No Rack Slots Found"
              description={`No slots match the current zone (${selectedZone}) and status filter (${statusFilter}).`}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mappedSlots
                .filter(
                  (s) =>
                    s.zoneType === selectedZone &&
                    (statusFilter === "ALL" || s.status === statusFilter)
                )
                .map((slot) => {
                  const isOccupied = slot.usedM3 > 0;
                  const isFull = slot.usedM3 >= slot.capacityM3;
                  const pct = slot.capacityM3 > 0 ? (slot.usedM3 / slot.capacityM3) * 100 : 0;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] shadow-xs ${
                        isFull
                          ? "bg-rose-50/40 border-rose-200 hover:border-rose-400"
                          : isOccupied
                          ? "bg-indigo-50/40 border-indigo-200 hover:border-indigo-400"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {slot.code}
                        </span>
                        <Badge
                          className={`text-[9.5px] font-semibold ${
                            isFull
                              ? "bg-rose-600 text-white"
                              : isOccupied
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isFull ? "Occupied" : isOccupied ? "Partial" : "Vacant"}
                        </Badge>
                      </div>

                      <div className="my-3 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-500">
                          <span>Volume Used</span>
                          <span className="font-bold text-slate-800">
                            {slot.usedM3} / {slot.capacityM3} m³
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isFull
                                ? "bg-rose-500"
                                : isOccupied
                                ? "bg-indigo-600"
                                : "bg-slate-200"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[120px]">
                          {slot.tenantName || "No Cargo"}
                        </span>
                        <span className="font-mono text-slate-500">{slot.temperature}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Slot Detail & Relocation Modal */}
      {selectedSlot && (
        <SlotDetailModal
          slot={selectedSlot}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onTransferSuccess={handleTransferSuccess}
        />
      )}
    </PageContainer>
  );
}
