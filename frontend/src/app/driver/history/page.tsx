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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Delivery Trip History
            </h1>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              Driver Log
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical log of all successfully delivered orders along with customer satisfaction ratings.
          </p>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Completed Deliveries</span>
          <p className="text-2xl font-extrabold text-slate-900">142 Trips</p>
          <p className="text-[11px] text-slate-400">100% Digital POD Verified</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Average Service Rating</span>
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <span className="text-2xl font-extrabold text-slate-900">4.95 / 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">99.2% On-Time Delivery Rate</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Cargo Delivered</span>
          <p className="text-2xl font-extrabold text-indigo-600">12,450 Packages</p>
          <p className="text-[11px] text-slate-400">Reefer Truck Fleet B 9821 TKN</p>
        </div>
      </div>

      {/* Trips Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Completed Deliveries Directory
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search DO number, recipient, or cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">DO No.</th>
                <th className="py-3 px-3">Destination & Recipient</th>
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
      </div>
    </div>
  );
}
