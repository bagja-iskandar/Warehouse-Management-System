"use client";

import React from "react";
import {
  X,
  Thermometer,
  Boxes,
  QrCode,
  ArrowRightLeft,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SlotData {
  id: string;
  code: string;
  zone: "A" | "B" | "C";
  zoneName: string;
  zoneType: "COLD_STORAGE" | "STANDARD" | "HEAVY_DUTY";
  temperature: string;
  humidity?: string;
  status: "OCCUPIED" | "PARTIAL" | "AVAILABLE" | "MAINTENANCE";
  capacityM3: number;
  usedM3: number;
  tenantName?: string;
  tenantPic?: string;
  itemSku?: string;
  itemName?: string;
  itemQuantity?: string;
  batchNumber?: string;
  expiryDate?: string;
  lastInspected?: string;
}

interface SlotDetailModalProps {
  slot: SlotData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SlotDetailModal({ slot, isOpen, onClose }: SlotDetailModalProps) {
  if (!isOpen || !slot) return null;

  const getStatusBadge = () => {
    switch (slot.status) {
      case "OCCUPIED":
        return <Badge className="bg-indigo-600 text-white">Terisi Penuh (100%)</Badge>;
      case "PARTIAL":
        return <Badge className="bg-emerald-600 text-white">Terisi Sebagian ({Math.round((slot.usedM3 / slot.capacityM3) * 100)}%)</Badge>;
      case "AVAILABLE":
        return <Badge className="bg-slate-100 text-slate-700 border border-slate-300">Tersedia (Kosong)</Badge>;
      case "MAINTENANCE":
        return <Badge className="bg-amber-500 text-slate-950">Pemeliharaan Rak</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
              {slot.code.split("-")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Slot Rak {slot.code}
                </h2>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {slot.zoneName} • Gudang Cakung (JKT-01)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Telemetry Live Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Kondisi Sensor Real-time
              </span>
              <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sensor Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-400 block">Suhu Slot</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Thermometer className="h-4 w-4 text-sky-600" />
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {slot.temperature}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
                <span className="text-[11px] text-slate-400 block">Kapasitas Terisi</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Boxes className="h-4 w-4 text-indigo-600" />
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {slot.usedM3} / {slot.capacityM3} m³
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tenant & Inventory Details */}
          {slot.status !== "AVAILABLE" ? (
            <div className="space-y-4 border border-slate-200 rounded-xl p-4">
              {/* Tenant Profile */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-2">
                  INFORMASI PENYEWA & KONTRAK
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {slot.tenantName || "PT Fresh Foods Indonesia"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PIC: {slot.tenantPic || "Hendra Prasetya"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    Sewa Aktif
                  </Badge>
                </div>
              </div>

              {/* Stored Goods Details */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-2">
                  BARANG / SKU TERSIMPAN
                </span>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {slot.itemName || "Daging Sapi Wagyu A5 Import"}
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {slot.itemSku || "BAR-FRESH-001"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Jumlah Koli:</span>
                      <span className="font-semibold text-slate-800">
                        {slot.itemQuantity || "150 Koli"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Kadaluarsa:</span>
                      <span className="font-semibold text-slate-800">
                        {slot.expiryDate || "12 Nov 2026"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Boxes className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Slot Ini Siap Digunakan</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kapasitas {slot.capacityM3} m³ tersedia untuk alokasi penerimaan barang baru.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
          >
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Cetak QR Slot</span>
            </Button>

            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Mutasi Rak</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
