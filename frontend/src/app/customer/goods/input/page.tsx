"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  QrCode,
  Plus,
  Snowflake,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GoodsRegistrationPage() {
  const [sku, setSku] = useState("BAR-FRESH-006");
  const [name, setName] = useState("Daging Bebek Peking Frozen");
  const [category, setCategory] = useState<"COLD" | "STANDARD">("COLD");
  const [quantity, setQuantity] = useState<number>(50);
  const [lengthCm, setLengthCm] = useState<number>(60);
  const [widthCm, setWidthCm] = useState<number>(40);
  const [heightCm, setHeightCm] = useState<number>(40);
  const [weightKg, setWeightKg] = useState<number>(20);
  const [batchNo, setBatchNo] = useState("BATCH-BBK-2026-08");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");
  const [isRegistered, setIsRegistered] = useState(false);

  // Auto-calculated volume in m3: (L * W * H in cm) / 1,000,000 * quantity
  const volumePerUnitM3 = (lengthCm * widthCm * heightCm) / 1000000;
  const totalVolumeM3 = (volumePerUnitM3 * quantity).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistered(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Registrasi Barang & Kalkulator Dimensi
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              SKU Registration
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftarkan inventaris baru, hitung estimasi volume m³ otomatis dari dimensi fisik, dan generate label QR code.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/customer/goods">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Lihat Daftar Barang
            </Button>
          </Link>
        </div>
      </div>

      {isRegistered ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Barang Berhasil Didaftarkan ke Sistem!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            SKU <span className="font-mono font-bold text-indigo-600">{sku}</span> ({name}) sebanyak {quantity} Koli ({totalVolumeM3} m³) telah terdaftar dan siap dialokasikan ke slot rak.
          </p>

          {/* QR Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-xs mx-auto text-center space-y-2">
            <div className="h-32 w-32 bg-white border-2 border-slate-800 border-dashed rounded-lg mx-auto flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-slate-800">
                [ QR CODE ]<br />
                {sku}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Label QR Siap Dicetak & Ditempel pada Master Box
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/goods">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Lihat di Inventaris Saya →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsRegistered(false)}
              className="text-xs h-9"
            >
              Registrasi Barang Lain
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Fields (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Informasi Utama Barang & Kategori
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kode SKU Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-600 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Produk / Barang
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Kategori Kondisi Penyimpanan
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory("COLD")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      category === "COLD"
                        ? "border-sky-500 bg-sky-50 text-sky-950 font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Snowflake className="h-4 w-4 text-sky-600" />
                    <span className="text-xs">Cold Storage (-18°C Sub-zero)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("STANDARD")}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      category === "STANDARD"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Warehouse className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs">Standard Dry Storage</span>
                  </button>
                </div>
              </div>

              {/* Batch & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Batch Produksi
                  </label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Tanggal Kadaluarsa (Expiry Date)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dimension Calculator Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4.5 w-4.5 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Kalkulator Dimensi Fisik & Volume (m³)
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-600 font-bold">
                  {totalVolumeM3} m³ Total
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Panjang (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Lebar (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={widthCm}
                    onChange={(e) => setWidthCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Tinggi (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Jumlah Koli
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-600 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Preview & QR (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Preview Label SKU & QR
              </h2>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <div className="h-28 w-28 bg-white border-2 border-slate-800 border-dashed rounded-lg mx-auto flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-slate-800" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-indigo-600">{sku}</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{name}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    {quantity} Koli • {totalVolumeM3} m³
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Simpan & Registrasi SKU
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
