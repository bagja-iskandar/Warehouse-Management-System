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
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  FilterBar,
  EmptyState,
} from "@/components/dashboard";
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

export default function WarehouseOverviewPage() {
  const { data: liveWarehouses, isFetching, refetch } = useWarehouses();
  const [selectedTab, setSelectedTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeHubs: HubFacility[] = (liveWarehouses || []).map((w) => {
    const rawSlots = w.slots || [];
    const activeTenants = new Set(
      rawSlots.flatMap((s) => (s.storedGoods || []).map((g) => g.customerId)).filter(Boolean)
    );

    return {
      id: w.id,
      code: w.code,
      name: w.name,
      location: `${w.address}, ${w.city}`,
      picName: `${w.managerName} (${w.contactPhone})`,
      status: "NORMAL" as const,
      totalCapacityM3: Number(w.totalCapacityM3 || 0),
      usedCapacityM3: Number(w.usedCapacityM3 || 0),
      coldCapacityM3: Number(w.zones?.coldStorageCapacityM3 || 0),
      coldUsedM3: Math.round(
        Number(w.zones?.coldStorageCapacityM3 || 0) *
          (Number(w.usedCapacityM3 || 0) / (Number(w.totalCapacityM3) || 1))
      ),
      coldTemp: "-18.4°C",
      standardCapacityM3: Number(w.zones?.standardCapacityM3 || 0),
      standardUsedM3: Math.round(
        Number(w.zones?.standardCapacityM3 || 0) *
          (Number(w.usedCapacityM3 || 0) / (Number(w.totalCapacityM3) || 1))
      ),
      standardTemp: "24.0°C",
      totalSlots: w.slotsCount || rawSlots.length || 0,
      occupiedSlots: w.occupiedSlotsCount || 0,
      activeTenantsCount: activeTenants.size,
    };
  });

  const filteredHubs = activeHubs.filter((hub) => {
    const matchTab =
      selectedTab === "ALL" || selectedTab === hub.code || selectedTab === hub.id;
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
  const totalAvailableSpace = Math.max(0, totalCapacitySum - totalUsedSum);
  const totalAvailableSlots = Math.max(0, totalSlotsSum - totalOccupiedSlotsSum);

  const totalStandardCap = activeHubs.reduce((acc, h) => acc + h.standardCapacityM3, 0);
  const totalStandardUsed = activeHubs.reduce((acc, h) => acc + h.standardUsedM3, 0);
  const totalStandardVacant = Math.max(0, totalStandardCap - totalStandardUsed);

  const totalColdCap = activeHubs.reduce((acc, h) => acc + h.coldCapacityM3, 0);
  const totalColdUsed = activeHubs.reduce((acc, h) => acc + h.coldUsedM3, 0);
  const totalColdVacant = Math.max(0, totalColdCap - totalColdUsed);

  const utilizationRate = totalCapacitySum > 0 ? (totalUsedSum / totalCapacitySum) * 100 : 0;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Multi-Hub Overview"
        title="Facility Overview & Warehouse Network"
        subtitle="Monitor physical capacity utilization, cold & standard storage zone allocations, and multi-hub operational health."
        badgeText="Multi-Hub Network"
        badgeColor="bg-indigo-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/warehouse/capacity">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Grid3X3 className="h-4 w-4" />
                <span>Rack Visualizer</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Network Capacity"
          value={`${totalUsedSum.toLocaleString("en-US")} m³`}
          subvalue={`/ ${totalCapacitySum.toLocaleString("en-US")} m³`}
          icon={Boxes}
          theme="indigo"
          progress={{ value: utilizationRate }}
          badge={
            <span className="font-bold text-indigo-600 font-mono text-xs">
              {utilizationRate.toFixed(1)}%
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Occupied volume</span>
              <span className="font-semibold text-emerald-600">{totalAvailableSpace.toLocaleString("en-US")} m³ Available</span>
            </span>
          }
        />

        <MetricCard
          label="Available Rack Slots"
          value={`${totalAvailableSlots} Slots`}
          subvalue={`/ ${totalSlotsSum}`}
          icon={Warehouse}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] py-0 font-semibold">
              Available
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Across {activeHubs.length} operational warehouse hubs
            </span>
          }
        />

        <MetricCard
          label="Cold Storage Network"
          value={`${totalColdUsed} m³`}
          subvalue={`/ ${totalColdCap} m³`}
          icon={Snowflake}
          theme="sky"
          progress={{ value: totalColdCap > 0 ? (totalColdUsed / totalColdCap) * 100 : 0 }}
          badge={
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
              -18.4°C Optimal
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Vacant: {totalColdVacant} m³ cold storage space
            </span>
          }
        />

        <MetricCard
          label="Standard Dry Storage"
          value={`${totalStandardUsed} m³`}
          subvalue={`/ ${totalStandardCap} m³`}
          icon={Layers}
          theme="amber"
          progress={{ value: totalStandardCap > 0 ? (totalStandardUsed / totalStandardCap) * 100 : 0 }}
          badge={
            <span className="text-xs text-amber-800 bg-amber-100 font-semibold px-2 py-0.5 rounded-md">
              {totalStandardCap > 0 ? ((totalStandardUsed / totalStandardCap) * 100).toFixed(0) : 0}% Used
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Vacant: {totalStandardVacant} m³ standard space
            </span>
          }
        />
      </div>

      {/* 3. Filter Bar & Facility Tabs */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search facility name, code, or city..."
      >
        <button
          onClick={() => setSelectedTab("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedTab === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Facilities ({activeHubs.length})
        </button>
        {activeHubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => setSelectedTab(hub.code)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedTab === hub.code
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {hub.name} ({hub.code})
          </button>
        ))}
      </FilterBar>

      {/* 4. Main Section: Facility Hub Cards Grid or Empty State */}
      {filteredHubs.length === 0 ? (
        <EmptyState
          title="No Facilities Found"
          description={
            searchQuery || selectedTab !== "ALL"
              ? "No warehouse facilities match the selected filter criteria."
              : "No warehouse facilities are registered in PostgreSQL yet."
          }
          icon={Building2}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHubs.map((hub) => {
          const hubUtil = hub.totalCapacityM3 > 0 ? (hub.usedCapacityM3 / hub.totalCapacityM3) * 100 : 0;
          return (
            <SectionCard
              key={hub.id}
              title={hub.name}
              subtitle={hub.location}
              icon={Building2}
              badge={
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold">
                  {hub.code}
                </Badge>
              }
              headerAction={
                <Link href="/admin/warehouse/capacity">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                    Slot Matrix →
                  </Button>
                </Link>
              }
            >
              <div className="space-y-4">
                {/* Total Capacity Bar */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">Total Volumetric Usage</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {hub.usedCapacityM3} / {hub.totalCapacityM3} m³ ({hubUtil.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, hubUtil))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>{hub.occupiedSlots} / {hub.totalSlots} Rack Slots Occupied</span>
                    <span className="text-emerald-700 font-semibold">{hub.totalCapacityM3 - hub.usedCapacityM3} m³ Available</span>
                  </div>
                </div>

                {/* Storage Zones Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-950 flex items-center gap-1.5">
                        <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                        Cold Storage
                      </span>
                      <span className="font-mono text-sky-800 text-[11px] font-bold">{hub.coldTemp}</span>
                    </div>
                    <p className="text-[11px] text-sky-700 font-mono mt-1">
                      {hub.coldUsedM3} / {hub.coldCapacityM3} m³
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Warehouse className="h-3.5 w-3.5 text-amber-600" />
                        Standard Storage
                      </span>
                      <span className="font-mono text-amber-800 text-[11px] font-bold">{hub.standardTemp}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 font-mono mt-1">
                      {hub.standardUsedM3} / {hub.standardCapacityM3} m³
                    </p>
                  </div>
                </div>

                {/* PIC Info */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                  <span>Manager PIC: {hub.picName}</span>
                  <span className="text-indigo-600 font-semibold">{hub.activeTenantsCount} Active Tenants</span>
                </div>
              </div>
            </SectionCard>
          );
        })}
        </div>
      )}
    </PageContainer>
  );
}
