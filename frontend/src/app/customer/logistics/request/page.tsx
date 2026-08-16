"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  MapPin,
  Calendar,
  Clock,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LogisticsRequestPage() {
  const [requestType, setRequestType] = useState<"OUTBOUND" | "INBOUND">("OUTBOUND");
  const [recipientName, setRecipientName] = useState("FreshMarket Superstore BSD");
  const [recipientPhone, setRecipientPhone] = useState("0812-9988-7766");
  const [recipientAddress, setRecipientAddress] = useState("Jl. Pahlawan Seribu No. 88, BSD City, Tangerang Selatan");
  const [vehicleType, setVehicleType] = useState<"REEFER" | "BOX">("REEFER");
  const [selectedItems, setSelectedItems] = useState("BAR-FRESH-001 (Daging Wagyu 100 Koli)");
  const [scheduledDate, setScheduledDate] = useState("2026-08-18");
  const [scheduledTime, setScheduledTime] = useState("08:30");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Jadwalkan Permintaan Logistik & Pengiriman Armada
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Dispatch Request
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Request pengantaran barang keluar gudang (Outbound) atau penjemputan barang masuk (Inbound) dengan armada Reefer / Box.
          </p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Permintaan Logistik Berhasil Didaftarkan!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Tiket pengiriman <span className="font-mono font-bold text-indigo-600">DO-2026-REQ-009</span> telah masuk ke antrean dispatch Admin. Armada <span className="font-semibold">{vehicleType === "REEFER" ? "Truk Reefer Dingin" : "Box Truck"}</span> akan dialokasikan sesuai jadwal.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
            <p>Tujuan: {recipientName}</p>
            <p>Jadwal: {scheduledDate} pukul {scheduledTime} WIB</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Kembali ke Dashboard →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="text-xs h-9"
            >
              Buat Permintaan Lain
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                1. Tipe Layanan Logistik
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType("OUTBOUND")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestType === "OUTBOUND"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="text-xs block">Pengantaran Keluar (Outbound Delivery)</span>
                  <span className="text-[10.5px] font-normal text-slate-500 block mt-0.5">
                    Kirim barang dari gudang ke toko/klien Anda
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType("INBOUND")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestType === "INBOUND"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <span className="text-xs block">Penjemputan Masuk (Inbound Pickup)</span>
                  <span className="text-[10.5px] font-normal text-slate-500 block mt-0.5">
                    Jemput barang dari supplier untuk disimpan di gudang
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Recipient Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                2. Rincian Penerima & Lokasi Pengantaran
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Penerima / Perusahaan
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    No. Telepon Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alamat Lengkap Tujuan
                </label>
                <textarea
                  rows={2}
                  required
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Step 3: Vehicle & Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                3. Pilihan Armada & Jadwal
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    Tipe Truk Armada
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setVehicleType("REEFER")}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        vehicleType === "REEFER"
                          ? "border-sky-500 bg-sky-50 font-bold text-sky-950"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>Truk Reefer Pendingin (-18°C)</span>
                      <Badge className="bg-sky-100 text-sky-800 text-[9.5px]">Cold</Badge>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicleType("BOX")}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        vehicleType === "BOX"
                          ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-950"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>Box Truck Standard Dry</span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[9.5px]">Dry</Badge>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Tanggal Pengiriman
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Jam Pengiriman (WIB)
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Summary Card (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Ringkasan Request Logistik
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tipe Layanan:</span>
                  <span className="font-bold text-slate-900">{requestType} Delivery</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tipe Armada:</span>
                  <span className="font-bold text-slate-900">
                    {vehicleType === "REEFER" ? "Truk Reefer (-18°C)" : "Box Truck Dry"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tujuan:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[150px]">
                    {recipientName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Jadwal:</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {scheduledDate}, {scheduledTime} WIB
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Kirim Permintaan Dispatch
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
