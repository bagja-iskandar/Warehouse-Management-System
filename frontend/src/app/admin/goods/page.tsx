"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  ArrowRightLeft,
  Snowflake,
  Warehouse,
  Thermometer,
  Calendar,
  AlertTriangle,
  Building2,
  Download,
  CheckCircle2,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGoods } from "@/hooks/use-goods";

interface GoodsItem {
  id: string;
  sku: string;
  name: string;
  category: "COLD_STORAGE" | "STANDARD" | "HEAVY_DUTY";
  zone: string;
  slotCode: string;
  tenantName: string;
  quantityKoli: number;
  volumeM3: number;
  temperature: string;
  batchNumber: string;
  expiryDate: string;
  status: "GOOD" | "LOW_STOCK" | "EXPIRING_SOON";
}

const GOODS_DATA: GoodsItem[] = [
  {
    id: "g1",
    sku: "BAR-FRESH-001",
    name: "Daging Sapi Wagyu A5 Import",
    category: "COLD_STORAGE",
    zone: "Zona A — Cold Storage",
    slotCode: "A-01-01",
    tenantName: "PT Fresh Foods Indonesia",
    quantityKoli: 150,
    volumeM3: 75,
    temperature: "-18.4°C",
    batchNumber: "BATCH-WGY-2026-08",
    expiryDate: "12 Nov 2026",
    status: "GOOD",
  },
  {
    id: "g2",
    sku: "BAR-FRESH-002",
    name: "Salmon Fillet Premium Norwegia",
    category: "COLD_STORAGE",
    zone: "Zona A — Cold Storage",
    slotCode: "A-01-02",
    tenantName: "PT Fresh Foods Indonesia",
    quantityKoli: 120,
    volumeM3: 60,
    temperature: "-18.2°C",
    batchNumber: "BATCH-SLM-2026-08",
    expiryDate: "28 Des 2026",
    status: "GOOD",
  },
  {
    id: "g3",
    sku: "BAR-FURN-001",
    name: "Sofa Minimalis 3-Seater Fabric",
    category: "STANDARD",
    zone: "Zona B — Rak Standar",
    slotCode: "B-01-01",
    tenantName: "CV Furnitur Nusantara",
    quantityKoli: 8,
    volumeM3: 40,
    temperature: "24.2°C",
    batchNumber: "BATCH-SOF-2026-04",
    expiryDate: "N/A (Dry Good)",
    status: "GOOD",
  },
  {
    id: "g4",
    sku: "BAR-FURN-002",
    name: "Meja Makan Kayu Jati Solid",
    category: "STANDARD",
    zone: "Zona B — Rak Standar",
    slotCode: "B-01-02",
    tenantName: "CV Furnitur Nusantara",
    quantityKoli: 4,
    volumeM3: 25,
    temperature: "24.0°C",
    batchNumber: "BATCH-MEJ-2026-03",
    expiryDate: "N/A (Dry Good)",
    status: "LOW_STOCK",
  },
  {
    id: "g5",
    sku: "BAR-FRESH-003",
    name: "Butter & Dairy Premium Salted",
    category: "COLD_STORAGE",
    zone: "Zona A — Cold Storage",
    slotCode: "A-01-03",
    tenantName: "PT Sumber Frozen Makmur",
    quantityKoli: 80,
    volumeM3: 30,
    temperature: "-18.5°C",
    batchNumber: "BATCH-BTR-2026-05",
    expiryDate: "10 Sep 2026",
    status: "EXPIRING_SOON",
  },
  {
    id: "g6",
    sku: "BAR-HVY-001",
    name: "Pallet Mesin Industri & Sparepart",
    category: "HEAVY_DUTY",
    zone: "Zona C — Heavy Duty",
    slotCode: "C-01-01",
    tenantName: "PT Logistik Indo Perkasa",
    quantityKoli: 12,
    volumeM3: 35,
    temperature: "25.0°C",
    batchNumber: "BATCH-MSN-2026-01",
    expiryDate: "N/A",
    status: "GOOD",
  },
];

export default function GoodsManagementPage() {
  const { data: liveGoods } = useGoods();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedQrItem, setSelectedQrItem] = useState<GoodsItem | null>(null);

  const activeGoods: GoodsItem[] =
    liveGoods && liveGoods.length > 0
      ? liveGoods.map((g) => ({
          id: g.id,
          sku: g.barcode,
          name: g.name,
          category: g.requiresColdStorage ? "COLD_STORAGE" : "STANDARD",
          zone: g.requiresColdStorage
            ? "Zona A — Cold Storage"
            : "Zona B — Rak Standar",
          slotCode: g.slotCode || "A-01-01",
          tenantName: g.customerName || "Tenant WMS",
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
          status: "GOOD" as const,
        }))
      : GOODS_DATA;

  const filteredGoods = activeGoods.filter((item) => {
    const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slotCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalKoli = GOODS_DATA.reduce((acc, i) => acc + i.quantityKoli, 0);
  const totalVolume = GOODS_DATA.reduce((acc, i) => acc + i.volumeM3, 0);
  const coldCount = GOODS_DATA.filter((i) => i.category === "COLD_STORAGE").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Manajemen Barang & Inventaris Gudang
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Master SKU
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar SKU tersimpan, nomor batch kadaluarsa, verifikasi QR code, dan mutasi slot rak.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Inventaris</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Registrasi Barang Baru</span>
          </Button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total SKU Aktif</span>
          <p className="text-2xl font-extrabold text-slate-900">{GOODS_DATA.length} SKU</p>
          <p className="text-[11px] text-slate-400">Terdistribusi di 3 Zona Gudang</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Kuantitas Fisik</span>
          <p className="text-2xl font-extrabold text-slate-900">{totalKoli} Koli</p>
          <p className="text-[11px] text-slate-400 font-mono">Setara {totalVolume} m³ Ruang</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Barang Cold Storage</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-sky-600">{coldCount} SKU</p>
            <Badge variant="success" className="text-[10px]">Suhu Sub-zero</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Daging, Seafood & Dairy</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Peringatan Inventaris</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-amber-600">2 Item</p>
            <span className="text-xs text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
              Perlu Perhatian
            </span>
          </div>
          <p className="text-[11px] text-slate-400">1 Stok Rendah • 1 Mendekati Exp</p>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Semua Kategori ({GOODS_DATA.length})
            </button>
            <button
              onClick={() => setSelectedCategory("COLD_STORAGE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === "COLD_STORAGE"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Cold Storage (Sub-zero)
            </button>
            <button
              onClick={() => setSelectedCategory("STANDARD")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === "STANDARD"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Standard & Furniture
            </button>
            <button
              onClick={() => setSelectedCategory("HEAVY_DUTY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === "HEAVY_DUTY"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Heavy Duty Pallet
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama barang, slot, atau tenant..."
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
                <th className="py-3 px-3">SKU & Nama Barang</th>
                <th className="py-3 px-3">Slot Lokasi & Zona</th>
                <th className="py-3 px-3">Penyewa (Tenant)</th>
                <th className="py-3 px-3">Kuantitas & Volume</th>
                <th className="py-3 px-3">Suhu Aktif</th>
                <th className="py-3 px-3">Batch & Kadaluarsa</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGoods.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* SKU & Name */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.category === "COLD_STORAGE"
                            ? "bg-sky-50 text-sky-600"
                            : item.category === "STANDARD"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {item.category === "COLD_STORAGE" ? (
                          <Snowflake className="h-4 w-4" />
                        ) : item.category === "STANDARD" ? (
                          <Warehouse className="h-4 w-4" />
                        ) : (
                          <Boxes className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                          {item.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Slot & Zone */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {item.slotCode}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {item.zone}
                    </span>
                  </td>

                  {/* Tenant */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800 block">
                      {item.tenantName}
                    </span>
                  </td>

                  {/* Quantity & Volume */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block">
                      {item.quantityKoli} Koli
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      {item.volumeM3} m³ Ruang
                    </span>
                  </td>

                  {/* Temperature */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-800">
                      {item.temperature}
                    </span>
                  </td>

                  {/* Batch & Expiry */}
                  <td className="py-3.5 px-3">
                    <span className="text-[11px] text-slate-700 block font-mono">
                      {item.batchNumber}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block">
                      Exp: {item.expiryDate}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedQrItem(item)}
                        className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Lihat QR Code"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>

                      <Link href="/admin/warehouse/capacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Mutasi Rak"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal Dialog */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold">
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

            {/* QR Mockup Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2">
              <div className="h-40 w-40 bg-white border border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center">
                <div className="w-full h-full border-4 border-slate-900 border-dashed rounded flex items-center justify-center">
                  <span className="font-mono text-[10px] font-bold text-slate-800 text-center leading-tight">
                    [ QR SCANNER ]<br />
                    {selectedQrItem.sku}<br />
                    Slot: {selectedQrItem.slotCode}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Scan via WMS Handheld Scanner / Mobile App
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedQrItem(null)}
                className="w-full text-xs h-9"
              >
                Tutup
              </Button>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9">
                Cetak Label QR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
