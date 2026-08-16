"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Warehouse,
  Boxes,
  Truck,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Filter,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportTemplate {
  id: string;
  title: string;
  category: "CAPACITY" | "INVENTORY" | "LOGISTICS" | "FINANCE";
  description: string;
  period: string;
  format: string;
  lastGenerated: string;
  fileSize: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "rep-1",
    title: "Laporan Utilisasi Kapasitas Gudang & Slot Rak",
    category: "CAPACITY",
    description: "Analisis okupansi fisik volume m³ per zona Cold Storage vs Standard di seluruh hub.",
    period: "Bulanan (Agustus 2026)",
    format: "PDF & XLSX",
    lastGenerated: "16 Agu 2026, 07:00 WIB",
    fileSize: "1.8 MB",
  },
  {
    id: "rep-2",
    title: "Laporan Mutasi Keluar/Masuk Barang (Inbound/Outbound)",
    category: "INVENTORY",
    description: "Rekap SKU terdaftar, pergerakan stock turnover, kadaluarsa batch, dan verifikasi QR.",
    period: "Mingguan (09 - 16 Agu 2026)",
    format: "XLSX & CSV",
    lastGenerated: "16 Agu 2026, 06:30 WIB",
    fileSize: "2.4 MB",
  },
  {
    id: "rep-3",
    title: "Laporan Performa On-Time Delivery & Armada Logistik",
    category: "LOGISTICS",
    description: "Evaluasi ketepatan rute transit driver, monitoring telemetri suhu reefer, dan Digital POD.",
    period: "Bulanan (Agustus 2026)",
    format: "PDF & CSV",
    lastGenerated: "15 Agu 2026, 23:59 WIB",
    fileSize: "1.2 MB",
  },
  {
    id: "rep-4",
    title: "Laporan Pendapatan Sewa Gudang, Tagihan & Rekap Denda",
    category: "FINANCE",
    description: "Rekapitulasi omzet faktur sewa m³, denda keterlambatan 5%/minggu, dan piutang jatuh tempo.",
    period: "Bulanan (Agustus 2026)",
    format: "PDF & XLSX",
    lastGenerated: "16 Agu 2026, 08:00 WIB",
    fileSize: "3.1 MB",
  },
];

export default function OperationalReportsPage() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExport = (title: string) => {
    setDownloadSuccess(`Mengunduh file: ${title}...`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Laporan Operasional & Export Data Sistem
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Analytics & Reporting
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unduh laporan eksekutif pergudangan, logistik armada, rekapitulasi mutasi inventaris, dan keuangan sewa.
          </p>
        </div>
      </div>

      {/* Notification toast if exporting */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{downloadSuccess} Berhasil diekspor!</span>
        </div>
      )}

      {/* Reports Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TEMPLATES.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    report.category === "CAPACITY"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : report.category === "INVENTORY"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : report.category === "LOGISTICS"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {report.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {report.fileSize}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {report.title}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Periode: {report.period}</span>
                <span className="font-mono text-slate-700 font-semibold">{report.format}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] text-slate-400 truncate">
                  Update: {report.lastGenerated}
                </span>

                <Button
                  onClick={() => handleExport(report.title)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm h-8.5 px-3 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
