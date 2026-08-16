"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Warehouse,
  Truck,
  TrendingUp,
  Plus,
  ArrowRight,
  Thermometer,
  QrCode,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Snowflake,
  Building2,
  Calendar,
  CreditCard,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal Layanan Pergudangan & Logistik
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              PT Fresh Foods Indonesia
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola ruang sewa gudang, inventaris barang bersuhu dingin, dan jadwalkan logistik armada.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customer/rental">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              <span>Sewa Ruang Baru</span>
            </Button>
          </Link>

          <Link href="/customer/goods/input">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Registrasi Barang</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ruang Sewa Aktif */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ruang Sewa Aktif</span>
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Warehouse className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">250 m³</span>
            <span className="text-xs text-slate-400 ml-1.5 font-mono">Disewa</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">185 m³ Terpakai (74%)</span>
            <span className="font-bold text-emerald-600">Sisa 65 m³</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-600 h-2 rounded-full w-[74%]" />
          </div>
        </div>

        {/* KPI 2: Total Barang Disimpan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Barang Disimpan</span>
            <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">450 Koli</span>
          </div>
          <p className="text-[11px] text-slate-400">
            3 SKU Aktif (Daging Wagyu, Salmon, Dairy)
          </p>
        </div>

        {/* KPI 3: Telemetri Suhu Cold Storage */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Suhu Ruang Sewa Anda</span>
            <div className="h-8.5 w-8.5 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Thermometer className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">-18.4°C</span>
            <Badge variant="success" className="text-[10px]">Stabil</Badge>
          </div>
          <p className="text-[11px] text-sky-700 font-medium">
            Zona A Cold Storage • Hub Cakung
          </p>
        </div>

        {/* KPI 4: Status Faktur Tagihan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Faktur Sewa Bulan Ini</span>
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-slate-900">Rp 12.5 Jt</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Lunas (INV-2026-001)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory & Logistics Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inventory Stored (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="h-4.5 w-4.5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Ringkasan Barang Tersimpan di Gudang
                </h2>
              </div>
              <Link
                href="/customer/goods"
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua SKU</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Item 1 */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Snowflake className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Daging Sapi Wagyu A5 Import
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                        BAR-FRESH-001
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lokasi: Slot A-01-01 (Zona A Cold Storage) • Kadaluarsa: 12 Nov 2026
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono block">
                    150 Koli (75 m³)
                  </span>
                  <span className="text-[10.5px] text-sky-600 font-mono">-18.4°C</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Snowflake className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Salmon Fillet Premium Norwegia
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                        BAR-FRESH-002
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lokasi: Slot A-01-02 (Zona A Cold Storage) • Kadaluarsa: 28 Des 2026
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 font-mono block">
                    120 Koli (60 m³)
                  </span>
                  <span className="text-[10.5px] text-sky-600 font-mono">-18.2°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Delivery Status (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Status Pengiriman Aktif
                </h2>
              </div>
              <Badge variant="warning" className="text-[10px]">
                In-Transit
              </Badge>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900">
                  DO-2026-001
                </span>
                <span className="text-[10.5px] text-amber-700 font-mono font-semibold">
                  Est: 35 Menit
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">
                  Tujuan: FreshMarket Superstore BSD
                </p>
                <p className="text-[11px] text-slate-500">
                  Armada: Truk Reefer Isuzu (B 9821 TKN)
                </p>
                <p className="text-[11px] text-slate-500">
                  Driver: Ahmad Subarjo (0812-3456-7890)
                </p>
              </div>

              <Link href="/customer/logistics/request" className="block pt-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8.5 rounded-lg">
                  Lacak Pengiriman →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
