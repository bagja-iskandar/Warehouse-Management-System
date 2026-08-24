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
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  FilterBar,
  EmptyState,
} from "@/components/dashboard";

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
    simType: "SIM B2 General",
    simExpiry: "Aug 14, 2028",
    assignedVehicle: "Isuzu Giga Reefer Truck",
    vehiclePlate: "B 9821 TKN",
    status: "ON_DUTY",
    currentLocation: "JORR Toll KM 18 (Heading to BSD)",
    activeDeliveryOrder: "DO-2026-001",
    completedTrips: 142,
    rating: 4.9,
  },
  {
    id: "drv-2",
    name: "Doni Prasetyo",
    phone: "0813-8877-6655",
    simType: "SIM B1",
    simExpiry: "May 20, 2027",
    assignedVehicle: "Hino Dutro Box Truck",
    vehiclePlate: "B 1234 XYZ",
    status: "ON_DUTY",
    currentLocation: "Cakung Warehouse — Loading Dock 1",
    activeDeliveryOrder: "DO-2026-002",
    completedTrips: 98,
    rating: 4.8,
  },
  {
    id: "drv-3",
    name: "Rian Hidayat",
    phone: "0815-4433-2211",
    simType: "SIM A",
    simExpiry: "Oct 02, 2029",
    assignedVehicle: "Daihatsu GranMax Blind Van",
    vehiclePlate: "B 5678 KLM",
    status: "AVAILABLE",
    currentLocation: "Cakung Warehouse Fleet Pool",
    completedTrips: 64,
    rating: 4.7,
  },
  {
    id: "drv-4",
    name: "Budi Santoso",
    phone: "0819-0011-2233",
    simType: "SIM B2 General",
    simExpiry: "Jan 18, 2028",
    assignedVehicle: "Mitsubishi Fuso Reefer Truck",
    vehiclePlate: "B 3344 SBY",
    status: "RESTING",
    currentLocation: "Bandung Fleet Pool Driver Quarters",
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

  const onDutyCount = filteredDrivers.filter((d) => d.status === "ON_DUTY").length;
  const availableCount = filteredDrivers.filter((d) => d.status === "AVAILABLE").length;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Drivers & Couriers"
        title="Driver & Fleet Personnel Management"
        subtitle="List of logistics drivers, active Delivery Order (DO) assignments, driver license verification, and on-time performance."
        badgeText="Fleet Drivers"
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
          label="Total Registered Drivers"
          value={`${filteredDrivers.length} Personnel`}
          icon={Users}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              Verified SIM B1/B2/A Licenses
            </span>
          }
        />

        <MetricCard
          label="On-Duty Active Drivers"
          value={`${onDutyCount} Drivers`}
          icon={Navigation}
          theme="amber"
          badge={
            <Badge variant="warning" className="text-[10px]">In-Transit</Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              Carrying active delivery orders
            </span>
          }
        />

        <MetricCard
          label="Standby in Pool"
          value={`${availableCount} Drivers`}
          icon={Truck}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Available
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              Ready for immediate dispatch
            </span>
          }
        />

        <MetricCard
          label="Average Performance Rating"
          value="4.85 / 5.0"
          icon={Star}
          theme="purple"
          badge={
            <Badge className="bg-purple-100 text-purple-800 text-[10px] font-semibold">
              98.4% On-Time
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-emerald-600 font-semibold">
              Customer satisfaction score
            </span>
          }
        />
      </div>

      {/* 3. Main Driver Directory Table & Filters */}
      <SectionCard
        title="Fleet Personnel Roster & Duty Status"
        subtitle="Manage driver credentials, assigned vehicles, and delivery performance"
        icon={Users}
      >
        <div className="space-y-4">
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
                All Drivers ({DRIVERS_DATA.length})
              </button>
              <button
                onClick={() => setStatusFilter("ON_DUTY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === "ON_DUTY"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                On Duty ({DRIVERS_DATA.filter((d) => d.status === "ON_DUTY").length})
              </button>
              <button
                onClick={() => setStatusFilter("AVAILABLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === "AVAILABLE"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Available ({DRIVERS_DATA.filter((d) => d.status === "AVAILABLE").length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search driver name, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Drivers Table */}
          {filteredDrivers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Drivers Found"
              description="No driver personnel match the selected filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3">Driver Name & Contact</th>
                    <th className="py-3 px-3">Driving License (SIM)</th>
                    <th className="py-3 px-3">Assigned Vehicle</th>
                    <th className="py-3 px-3">Operational Status</th>
                    <th className="py-3 px-3">Last GPS Location</th>
                    <th className="py-3 px-3">Trips & Rating</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Driver Name & Contact */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {driver.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              <span>{driver.phone}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SIM */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {driver.simType}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Valid until {driver.simExpiry}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800 block">
                          {driver.assignedVehicle}
                        </span>
                        <span className="font-mono text-[11px] text-indigo-600 font-bold">
                          {driver.vehiclePlate}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {driver.status === "ON_DUTY" && (
                          <Badge variant="warning" className="text-[10px]">
                            On Duty (In Transit)
                          </Badge>
                        )}
                        {driver.status === "AVAILABLE" && (
                          <Badge variant="success" className="text-[10px]">
                            Available
                          </Badge>
                        )}
                        {driver.status === "RESTING" && (
                          <Badge className="bg-slate-200 text-slate-700 text-[10px]">
                            Off-Duty / Rest
                          </Badge>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <span className="text-slate-600 block truncate flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{driver.currentLocation}</span>
                        </span>
                        {driver.activeDeliveryOrder && (
                          <span className="text-[10.5px] font-mono text-indigo-600 font-semibold block mt-0.5">
                            Task: {driver.activeDeliveryOrder}
                          </span>
                        )}
                      </td>

                      {/* Trip & Rating */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>{driver.rating}</span>
                          <span className="text-slate-400 font-normal ml-1">
                            ({driver.completedTrips} trips)
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
          )}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
