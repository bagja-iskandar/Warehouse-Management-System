"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Camera,
  Upload,
  User,
  PenTool,
  Check,
  Building2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DigitalPodPage() {
  const [recipientName, setRecipientName] = useState("Hendra Wijaya");
  const [recipientRole, setRecipientRole] = useState("Supervisor Receiving");
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasSignature, setHasSignature] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Upload Bukti Serah Terima (Digital POD)
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              DO-2026-001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ambil foto dokumentasi barang di lokasi tujuan dan minta tanda tangan digital penerima.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Digital POD Berhasil Diunggah & Disimpan!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Pengiriman <span className="font-mono font-bold text-indigo-600">DO-2026-001</span> telah resmi diselesaikan. Bukti foto dan tanda tangan digital telah tercatat di sistem pusat.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
            <p>Penerima: {recipientName} ({recipientRole})</p>
            <p>Waktu Selesai: 16 Agu 2026, 09:42 WIB</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/driver/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Kembali ke Dashboard Tugas →
              </Button>
            </Link>
            <Link href="/driver/history">
              <Button variant="outline" className="text-xs h-9">
                Lihat Riwayat Selesai
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Photo Upload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. Foto Bukti Penyerahan Barang di Lokasi
              </h2>

              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Foto Master Box di Area Loading Dock FreshMarket BSD
                  </p>
                  <p className="text-[11px] text-slate-400">
                    [ File: POD-DO-2026-001-FOTO.JPG — 2.1 MB Terlampir ]
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300 text-slate-700 h-8 mt-1"
                >
                  Ganti Foto Dokumentasi
                </Button>
              </div>
            </div>

            {/* Step 2: Digital Signature */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                2. Tanda Tangan Digital Penerima (E-Signature)
              </h2>

              <div className="space-y-3">
                <div className="h-36 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center relative p-3">
                  <div className="text-center font-mono text-xs text-indigo-700 italic font-bold">
                    ✍ [ Tanda Tangan Digital Tervalidasi ]<br />
                    <span className="text-[10.5px] text-slate-500 font-sans">
                      {recipientName} — {recipientRole}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2 text-[10.5px] text-slate-400 hover:text-slate-700 h-7"
                  >
                    Reset Tanda Tangan
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3: Recipient Identity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                3. Identitas Lengkap Penerima
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Lengkap Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jabatan / Hubungan
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Konfirmasi Penyelesaian DO
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                Pastikan seluruh 150 Koli muatan dingin telah diperiksa dan diserahterimakan dalam keadaan baik sebelum mengirim POD.
              </p>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Kirim Bukti POD & Selesaikan Tugas
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
