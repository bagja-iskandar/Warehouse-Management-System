"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ClipboardList,
  MapPin,
  Truck,
  Phone,
  Thermometer,
  Boxes,
  Navigation,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverTaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Instruksi Pengiriman & Manifest Tugas
            </h1>
            <Badge variant="warning" className="text-[10px]">
              DO-2026-001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manifest muatan dingin, panduan serah terima, kontak PIC penerima, dan checklist Digital POD.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Kembali
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Recipient Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Penerima & Titik Drop-off
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Tujuan Drop-off</span>
                  <p className="font-bold text-slate-900 text-sm">FreshMarket Superstore BSD</p>
                  <p className="text-slate-500 mt-0.5">
                    Jl. Pahlawan Seribu No. 88, BSD City, Tangerang Selatan (Area Loading Dock Belakang)
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="font-bold text-slate-800">Pak Hendra (Supervisor Receiving)</p>
                    <p className="text-[11px] text-slate-500 font-mono">0812-9988-7766</p>
                  </div>
                </div>

                <a href="tel:081299887766">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Hubungi PIC</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Manifest Items */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Manifest Barang yang Dimuat (Cold Storage Reefer)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Daging Sapi Wagyu A5 Import</span>
                  <span className="text-[11px] text-slate-500 font-mono">BAR-FRESH-001 • Batch: BATCH-WGY-2026-08</span>
                </div>
                <span className="font-mono font-bold text-indigo-600 text-sm">100 Koli</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Salmon Fillet Premium Norwegia</span>
                  <span className="text-[11px] text-slate-500 font-mono">BAR-FRESH-002 • Batch: BATCH-SLM-2026-08</span>
                </div>
                <span className="font-mono font-bold text-indigo-600 text-sm">50 Koli</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Aksi Pengemudi
            </h2>

            <Link href="/driver/transit" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20">
                <Navigation className="h-4 w-4" />
                <span>Buka GPS Rute Pengiriman</span>
              </Button>
            </Link>

            <Link href="/driver/pod" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
                <FileCheck className="h-4 w-4" />
                <span>Upload Bukti POD & TTD</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
