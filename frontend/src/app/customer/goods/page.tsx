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
    name: "Daging Sapi Wagyu A5 Import",
    category: "COLD_STORAGE",
    slotCode: "A-01-01",
    zone: "Zona A Cold Storage",
    quantityKoli: 150,
    volumeM3: 75,
    temperature: "-18.4°C",
    batchNumber: "BATCH-WGY-2026-08",
    expiryDate: "12 Nov 2026",
    status: "OPTIMAL",
  },
  {
    id: "cg-2",
    sku: "BAR-FRESH-002",
    name: "Salmon Fillet Premium Norwegia",
    category: "COLD_STORAGE",
    slotCode: "A-01-02",
    zone: "Zona A Cold Storage",
    quantityKoli: 120,
    volumeM3: 60,
    temperature: "-18.2°C",
    batchNumber: "BATCH-SLM-2026-08",
    expiryDate: "28 Des 2026",
    status: "OPTIMAL",
  },
  {
    id: "cg-3",
    sku: "BAR-FRESH-004",
    name: "Frozen Seafood Assorted Mix",
    category: "COLD_STORAGE",
    slotCode: "A-02-01",
    zone: "Zona A Cold Storage",
    quantityKoli: 140,
    volumeM3: 50,
    temperature: "-18.3°C",
    batchNumber: "BATCH-SEA-2026-07",
    expiryDate: "15 Jan 2027",
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
            ? "Zona A Cold Storage"
            : "Zona B Rak Standar",
          quantityKoli: g.quantity,
          volumeM3: g.dimensions?.volumeM3 || 10,
          temperature:
            g.currentTemperature != null
              ? `${g.currentTemperature}°C`
              : g.requiresColdStorage
              ? "-18.4°C"
              : "24.0°C",
          batchNumber: `BATCH-${g.barcode.substring(0, 8)}`,
          expiryDate: "12 Nov 2026",
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
              Inventaris Barang Saya di Gudang
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              PT Fresh Foods Indonesia
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar SKU barang tersimpan di slot rak, verifikasi QR code, dan monitoring masa simpan produk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customer/goods/input">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              <span>Registrasi Barang Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total SKU Tersimpan</span>
          <p className="text-2xl font-extrabold text-slate-900">{CUSTOMER_GOODS.length} SKU</p>
          <p className="text-[11px] text-slate-400">Cold Storage Zona A (Hub Cakung)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Kuantitas Fisik</span>
          <p className="text-2xl font-extrabold text-emerald-600">{totalKoli} Koli</p>
          <p className="text-[11px] text-slate-400 font-mono">Setara {totalVolume} m³ Ruang</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Kondisi Suhu Penyimpanan</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600">-18.4°C</p>
            <Badge variant="success" className="text-[10px]">Optimal</Badge>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">Suhu Sub-zero Terjaga</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Barang & Slot Rak
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama produk, atau slot..."
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
                <th className="py-3 px-3">SKU & Nama Barang</th>
                <th className="py-3 px-3">Slot Rak</th>
                <th className="py-3 px-3">Kuantitas & Volume</th>
                <th className="py-3 px-3">Suhu Aktif</th>
                <th className="py-3 px-3">Nomor Batch</th>
                <th className="py-3 px-3">Kadaluarsa</th>
                <th className="py-3 px-3 text-right">Aksi</th>
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
                      {item.quantityKoli} Koli
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
                      title="Lihat Label QR"
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
                QR Code Label Barang
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
                Tutup
              </Button>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Cetak Label QR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
