"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Save,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CustomerCompanyProfilePage() {
  const [companyName, setCompanyName] = useState("PT Fresh Foods Indonesia");
  const [npwp, setNpwp] = useState("01.234.567.8-012.000");
  const [picName, setPicName] = useState("Hendra Prasetya");
  const [email, setEmail] = useState("customer@freshfoods.id");
  const [phone, setPhone] = useState("0812-9988-7766");
  const [address, setAddress] = useState("Jl. Industri Raya No. 45, Jakarta Barat, DKI Jakarta");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Profil Perusahaan & Informasi Legalitas
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Verified Tenant
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Informasi entitas bisnis, nomor NPWP faktur pajak, kontak penanggung jawab (PIC), dan alamat resmi.
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Profil perusahaan berhasil diperbarui!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Data Legalitas Perusahaan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Perusahaan
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Pokok Wajib Pajak (NPWP)
                </label>
                <input
                  type="text"
                  required
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama PIC / Penanggung Jawab
                </label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Operasional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Alamat Kantor Pusat
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Status Akun & Keanggotaan
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tier Customer:</span>
                <span className="font-bold text-emerald-600">Enterprise Tenant</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Masa Kontrak Aktif:</span>
                <span className="font-mono text-slate-900 font-bold">s/d 31 Des 2026</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Total Ruang Sewa:</span>
                <span className="font-mono text-slate-900 font-bold">250 m³ (Cold)</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
