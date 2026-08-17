"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  Snowflake,
  Warehouse,
  Thermometer,
  Calendar,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoods } from "@/hooks/use-goods";
import { useAuth } from "@/hooks/use-auth";

interface CustomerGood {
  id: string;
  sku: string;
  name: string;
  category: "COLD_STORAGE" | "STANDARD";
  slotCode: string;
  zone: string;
  quantityKoli: number;
  volumeM3: number;
  temperature: string;
  batchNumber: string;
  expiryDate: string;
  status: "OPTIMAL" | "EXPIRING_SOON";
}

const CUSTOMER_GOODS: CustomerGood[] = [
  {
    id: "cg-1",
    sku: "BAR-FRESH-001",
    name: "Import Wagyu Beef Ribeye A5",
    category: "COLD_STORAGE",
    slotCode: "A-01-01",
    zone: "Zone A Cold Storage",
    quantityKoli: 150,
    volumeM3: 75,
    temperature: "-18.4°C",
    batchNumber: "BATCH-WGY-2026-08",
    expiryDate: "Nov 12, 2026",
    status: "OPTIMAL",
  },
  {
    id: "cg-2",
    sku: "BAR-FRESH-002",
    name: "Premium Norwegian Salmon Fillet",
    category: "COLD_STORAGE",
    slotCode: "A-01-02",
    zone: "Zone A Cold Storage",
    quantityKoli: 120,
    volumeM3: 60,
    temperature: "-18.2°C",
    batchNumber: "BATCH-SLM-2026-08",
    expiryDate: "Dec 28, 2026",
    status: "OPTIMAL",
  },
  {
    id: "cg-3",
    sku: "BAR-FRESH-004",
    name: "Frozen Seafood Assorted Mix",
    category: "COLD_STORAGE",
    slotCode: "A-02-01",
    zone: "Zone A Cold Storage",
    quantityKoli: 140,
    volumeM3: 50,
    temperature: "-18.3°C",
    batchNumber: "BATCH-SEA-2026-07",
    expiryDate: "Jan 15, 2027",
    status: "OPTIMAL",
  },
];

export default function CustomerGoodsInventoryPage() {
  const { user } = useAuth();
  const { data: liveGoods } = useGoods(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQrItem, setSelectedQrItem] = useState<CustomerGood | null>(null);

  const activeGoods: CustomerGood[] =
    liveGoods && liveGoods.length > 0
      ? liveGoods.map((g) => ({
          id: g.id,
          sku: g.barcode,
          name: g.name,
          category: g.requiresColdStorage ? "COLD_STORAGE" : "STANDARD",
          slotCode: g.slotCode || "A-01-01",
          zone: g.requiresColdStorage
            ? "Zone A Cold Storage"
            : "Zone B Standard Rack",
          quantityKoli: g.quantity,
          volumeM3: g.dimensions?.volumeM3 || 10,
          temperature:
            g.currentTemperature != null
              ? `${g.currentTemperature}°C`
              : g.requiresColdStorage
              ? "-18.4°C"
              : "24.0°C",
          batchNumber: `BATCH-${g.barcode.substring(0, 8)}`,
          expiryDate: "Nov 12, 2026",
          status: "OPTIMAL" as const,
        }))
      : CUSTOMER_GOODS;

  const filteredGoods = activeGoods.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.slotCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalKoli = activeGoods.reduce((acc, g) => acc + g.quantityKoli, 0);
  const totalVolume = activeGoods.reduce((acc, g) => acc + g.volumeM3, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Goods & Inventory in Warehouse
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              PT Fresh Foods Indonesia
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            List of SKUs stored in rack slots, QR code verification, and product expiration tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customer/goods/input">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              <span>Register New Goods</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total SKUs Stored</span>
          <p className="text-2xl font-extrabold text-slate-900">{CUSTOMER_GOODS.length} SKUs</p>
          <p className="text-[11px] text-slate-400">Cold Storage Zone A (Cakung Hub)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Physical Quantity</span>
          <p className="text-2xl font-extrabold text-emerald-600">{totalKoli} Packages</p>
          <p className="text-[11px] text-slate-400 font-mono">Equivalent to {totalVolume} m³ Space</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Storage Temperature Condition</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600">-18.4°C</p>
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">Sub-zero Temp Maintained</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Goods & Rack Slots Directory
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU, product name, or slot..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">SKU & Goods Name</th>
                <th className="py-3 px-3">Rack Slot</th>
                <th className="py-3 px-3">Quantity & Volume</th>
                <th className="py-3 px-3">Active Temp</th>
                <th className="py-3 px-3">Batch Number</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGoods.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8.5 w-8.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold flex-shrink-0">
                        <Snowflake className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono text-indigo-600 font-bold">
                          {item.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.slotCode}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5">
                      {item.zone}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block font-mono">
                      {item.quantityKoli} Packages
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      {item.volumeM3} m³
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                      {item.temperature}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono text-slate-700">{item.batchNumber}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-slate-800 font-medium">{item.expiryDate}</span>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedQrItem(item)}
                      className="h-8 px-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                      title="View QR Label"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Preview Dialog */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
              <QrCode className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Goods QR Code Label
              </h3>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">
                {selectedQrItem.sku}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedQrItem.name}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2">
              <div className="h-36 w-36 bg-white border-2 border-slate-800 border-dashed rounded-lg p-3 flex flex-col items-center justify-center">
                <span className="font-mono text-[10px] font-bold text-slate-800 text-center leading-tight">
                  [ QR CODE ]<br />
                  {selectedQrItem.sku}<br />
                  Slot: {selectedQrItem.slotCode}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedQrItem(null)}
                className="w-full text-xs h-9"
              >
                Close
              </Button>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Print QR Label
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
