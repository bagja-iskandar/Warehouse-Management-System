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
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useVehicles } from "@/hooks/use-logistics";

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
    name: "Isuzu Giga FVR Reefer Truck",
    plateNumber: "B 9821 TKN",
    type: "REEFER_TRUCK",
    capacityM3: 12,
    maxWeightKg: 5000,
    hasReefer: true,
    reeferTemp: "-18.4°C",
    reeferStatus: "COOLING_OPTIMAL",
    assignedDriver: "Agus Pratama",
    assignedDriverPhone: "0812-9988-7766",
    status: "IN_TRANSIT",
    hubBase: "Cakung Hub (JKT-01)",
    kirExpiry: "15 Jan 2027",
    odometerKm: 45210,
  },
  {
    id: "veh-2",
    name: "Hino Dutro 130 HD Box Truck",
    plateNumber: "B 9412 KLU",
    type: "BOX_TRUCK",
    capacityM3: 8,
    maxWeightKg: 3000,
    hasReefer: false,
    assignedDriver: "Dedi Kurniawan",
    assignedDriverPhone: "0813-1122-3344",
    status: "AVAILABLE",
    hubBase: "Cakung Hub (JKT-01)",
    kirExpiry: "28 Mar 2027",
    odometerKm: 32100,
  },
  {
    id: "veh-3",
    name: "Daihatsu GranMax 1.5 Blind Van",
    plateNumber: "B 9103 JKT",
    type: "BLIND_VAN",
    capacityM3: 4,
    maxWeightKg: 1000,
    hasReefer: false,
    assignedDriver: "Rian Hidayat",
    assignedDriverPhone: "0815-4433-2211",
    status: "AVAILABLE",
    hubBase: "Cakung Hub (JKT-01)",
    kirExpiry: "04 Feb 2027",
    odometerKm: 21400,
  },
  {
    id: "veh-4",
    name: "Mitsubishi Fuso Fighter Reefer Truck",
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
    hubBase: "Bandung Hub (BDG-01)",
    kirExpiry: "22 Nov 2026",
    odometerKm: 34100,
  },
];

export default function FleetManagementPage() {
  const { data: liveVehicles } = useVehicles();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const activeFleet: FleetVehicle[] =
    liveVehicles && liveVehicles.length > 0
      ? liveVehicles.map((v) => ({
          id: v.id,
          name: v.name,
          plateNumber: v.plateNumber,
          type:
            v.type === "REEFER_TRUCK"
              ? "REEFER_TRUCK"
              : v.type === "VAN"
              ? "BLIND_VAN"
              : "BOX_TRUCK",
          capacityM3: v.maxVolumeM3 || 10,
          maxWeightKg: v.maxWeightKg || 3000,
          hasReefer: Boolean(v.hasRefrigeration),
          reeferTemp: v.hasRefrigeration ? "-18.4°C" : undefined,
          reeferStatus: v.hasRefrigeration ? "COOLING_OPTIMAL" : undefined,
          assignedDriver: v.currentDriverName || undefined,
          assignedDriverPhone: "0812-9988-7766",
          status:
            v.status === "IN_SERVICE"
              ? "IN_TRANSIT"
              : v.status === "MAINTENANCE"
              ? "MAINTENANCE"
              : "AVAILABLE",
          hubBase: v.locationCity || "Cakung Hub (JKT-01)",
          kirExpiry: "15 Jan 2027",
          odometerKm: 45000,
        }))
      : FLEET_DATA;

  const filteredFleet = activeFleet.filter((vehicle) => {
    const matchType = typeFilter === "ALL" || vehicle.type === typeFilter;
    const matchSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.assignedDriver &&
        vehicle.assignedDriver
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalCapacityM3 = activeFleet.reduce((acc, v) => acc + v.capacityM3, 0);
  const reeferCount = activeFleet.filter((v) => v.hasReefer).length;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Vehicle Fleet"
        title="Logistics Fleet & Vehicle Management"
        subtitle="Refrigerated truck fleet (Reefer), box trucks, periodic roadworthiness tests (KIR), and driver dispatch."
        badgeText="Fleet Center"
        badgeColor="bg-amber-500 text-slate-950"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/logistics">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Truck className="h-4 w-4" />
                <span>Dispatch Queue</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active Fleet"
          value={`${activeFleet.length} Units`}
          icon={Truck}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Operational logistics trucks & vans
            </span>
          }
        />

        <MetricCard
          label="Reefer Fleet (Cold Box)"
          value={`${reeferCount} Units`}
          icon={Thermometer}
          theme="sky"
          badge={
            <Badge variant="success" className="text-[10px]">Sub-zero Temp</Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Equipped with telematics sensors
            </span>
          }
        />

        <MetricCard
          label="Total Cargo Capacity"
          value={`${totalCapacityM3} m³`}
          icon={Boxes}
          theme="amber"
          subtext={
            <span className="text-[11px] text-slate-500">
              Simultaneous payload volume
            </span>
          }
        />

        <MetricCard
          label="Roadworthiness (KIR)"
          value="100% Passed"
          icon={ShieldCheck}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Certified
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Periodic safety inspection certified
            </span>
          }
        />
      </div>

      {/* 3. Main Fleet Registry Table & Filters */}
      <SectionCard
        title="Fleet Vehicle Registry & Telematics Status"
        subtitle="Manage fleet units, cold chain box temperatures, and active driver assignments"
        icon={Truck}
      >
        <div className="space-y-4">
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
              All Types ({activeFleet.length})
            </button>
            <button
              onClick={() => setTypeFilter("REEFER_TRUCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "REEFER_TRUCK"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Reefer Trucks (Cold)
            </button>
            <button
              onClick={() => setTypeFilter("BOX_TRUCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "BOX_TRUCK"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Box Trucks
            </button>
            <button
              onClick={() => setTypeFilter("BLIND_VAN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                typeFilter === "BLIND_VAN"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Blind Vans
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle model, license plate, or driver..."
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
                <th className="py-3 px-3">Vehicle Model & Plate</th>
                <th className="py-3 px-3">Capacity & Type</th>
                <th className="py-3 px-3">Reefer Temp</th>
                <th className="py-3 px-3">Assigned Driver</th>
                <th className="py-3 px-3">Operating Status</th>
                <th className="py-3 px-3">Hub Base & KIR Expiry</th>
                <th className="py-3 px-3 text-right">Action</th>
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
                      Max: {vehicle.maxWeightKg.toLocaleString("en-US")} kg
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
                          ● Optimal Cooling
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
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {vehicle.status === "IN_TRANSIT" ? (
                      <Badge variant="warning" className="text-[10.5px]">
                        In Transit
                      </Badge>
                    ) : vehicle.status === "LOADING" ? (
                      <Badge variant="default" className="text-[10.5px] bg-indigo-600">
                        Loading Goods
                      </Badge>
                    ) : vehicle.status === "AVAILABLE" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Pool Standby
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
                      KIR exp: {vehicle.kirExpiry}
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
      </SectionCard>
    </PageContainer>
  );
}
