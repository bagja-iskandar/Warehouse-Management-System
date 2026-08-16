"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Truck,
  ShieldCheck,
  Star,
  CheckCircle2,
  Calendar,
  Save,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DriverProfilePage() {
  const [name, setName] = useState("Ahmad Subarjo");
  const [phone, setPhone] = useState("0812-3456-7890");
  const [simType, setSimType] = useState("SIM B2 Umum");
  const [simExpiry, setSimExpiry] = useState("14 Agu 2028");
  const [emergencyContact, setEmergencyContact] = useState("Siti Rahma (Istri) — 0813-9988-1122");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Profil Pengemudi & Data Lisensi
            </h1>
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
              Driver Terverifikasi
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data lisensi mengemudi (SIM), nomor darurat, armada yang terpasang, dan sertifikasi penanganan rantai dingin.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Data profil pengemudi berhasil diperbarui!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Pribadi & Kontak
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Golongan SIM
                </label>
                <input
                  type="text"
                  required
                  value={simType}
                  onChange={(e) => setSimType(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Masa Berlaku SIM
                </label>
                <input
                  type="text"
                  required
                  value={simExpiry}
                  onChange={(e) => setSimExpiry(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Kontak Darurat
              </label>
              <input
                type="text"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Badge & Prestasi Pengemudi
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold">
                <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                <span>Driver Teladan Bintang 5</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 font-bold">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <span>Sertifikasi Cold Chain Cargo</span>
              </div>

              <div className="pt-2 flex justify-between text-slate-600 font-medium">
                <span>Total Pengiriman Selesai:</span>
                <span className="font-bold text-slate-900 font-mono">142 Trip</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10 rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan Profil</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
