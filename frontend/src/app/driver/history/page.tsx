"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  FileCheck,
  Truck,
  CheckCircle2,
  Calendar,
  Star,
  MapPin,
  Search,
  Filter,
  Download,
  Boxes,
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

interface DriverTripHistory {
  id: string;
  doNumber: string;
  recipientName: string;
  recipientAddress: string;
  vehiclePlate: string;
  itemsSummary: string;
  totalKoli: number;
  deliveryDate: string;
  customerRating: number;
  status: "DELIVERED";
}

const DRIVER_TRIPS: DriverTripHistory[] = [
  {
    id: "dt-1",
    doNumber: "DO-2026-000",
    recipientName: "Super Indo Kelapa Gading",
    recipientAddress: "Jl. Boulevard Raya Blok LA No. 1, North Jakarta",
    vehiclePlate: "B 9821 TKN",
    itemsSummary: "80 Packages Dairy Butter & Mozzarella Cheese",
    totalKoli: 80,
    deliveryDate: "Aug 15, 2026, 14:00 WIB",
    customerRating: 5.0,
    status: "DELIVERED",
  },
  {
    id: "dt-2",
    doNumber: "DO-2026-998",
    recipientName: "GrandLucky Superstore SCBD",
    recipientAddress: "Sudirman Central Business District Lot 28, South Jakarta",
    vehiclePlate: "B 9821 TKN",
    itemsSummary: "120 Packages Australian Sirloin & Ribeye Beef",
    totalKoli: 120,
    deliveryDate: "Aug 14, 2026, 10:30 WIB",
    customerRating: 4.9,
    status: "DELIVERED",
  },
  {
    id: "dt-3",
    doNumber: "DO-2026-995",
    recipientName: "Hotel Mulia Senayan",
    recipientAddress: "Jl. Asia Afrika Senayan, Central Jakarta",
    vehiclePlate: "B 9821 TKN",
    itemsSummary: "60 Packages Norwegian Salmon & Scallop",
    totalKoli: 60,
    deliveryDate: "Aug 12, 2026, 11:15 WIB",
    customerRating: 5.0,
    status: "DELIVERED",
  },
];

export default function DriverDeliveryHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrips = DRIVER_TRIPS.filter(
    (t) =>
      t.doNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalDeliveredKoli = DRIVER_TRIPS.reduce((acc, t) => acc + t.totalKoli, 0);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Delivery History"
        title="My Delivery Trip History"
        subtitle="Historical log of all successfully delivered orders along with customer satisfaction ratings."
        badgeText="Driver Log"
        badgeColor="bg-amber-500 text-slate-950"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export History (CSV)</span>
            </Button>
          </div>
        }
      />

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Completed Trips"
          value={`${DRIVER_TRIPS.length} Trips`}
          icon={Truck}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              100% POD
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              Verified customer signatures
            </span>
          }
        />

        <MetricCard
          label="Average Driver Rating"
          value="4.96 / 5.0"
          icon={Star}
          theme="amber"
          badge={
            <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] py-0">
              Top Rated
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-amber-700 font-medium">
              Based on customer reviews
            </span>
          }
        />

        <MetricCard
          label="Total Cargo Delivered"
          value={`${totalDeliveredKoli} Packages`}
          icon={Boxes}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              Physical units handled
            </span>
          }
        />

        <MetricCard
          label="On-Time Delivery Rate"
          value="98.5%"
          icon={CheckCircle2}
          theme="sky"
          subtext={
            <span className="text-[11px] text-slate-400">
              Fleet schedule adherence
            </span>
          }
        />
      </div>

      {/* 3. Main History Table Card */}
      <SectionCard
        title="Completed Delivery Manifests & Ratings"
        subtitle="Search previous shipments, review drop-off locations, and check customer satisfaction feedback"
        icon={History}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="relative w-full sm:w-80">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search DO #, recipient, cargo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredTrips.length} completed manifests
            </span>
          </div>

          {filteredTrips.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No Delivery Trips Found"
              description="No historical delivery trips match your search query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3">Order Number & Vehicle</th>
                    <th className="py-3 px-3">Recipient & Destination</th>
                    <th className="py-3 px-3">Cargo Summary</th>
                    <th className="py-3 px-3">Completion Time</th>
                    <th className="py-3 px-3">Customer Rating</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-indigo-600 block text-xs">
                          {trip.doNumber}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">
                          {trip.vehiclePlate}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {trip.recipientName}
                        </span>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5 max-w-[200px] truncate">
                          {trip.recipientAddress}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-slate-800 font-medium block">
                          {trip.itemsSummary}
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          Total: {trip.totalKoli} Packages
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-slate-700">{trip.deliveryDate}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 font-bold text-slate-900">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span>{trip.customerRating}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <Badge variant="success" className="text-[10.5px]">
                          Completed (POD)
                        </Badge>
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
