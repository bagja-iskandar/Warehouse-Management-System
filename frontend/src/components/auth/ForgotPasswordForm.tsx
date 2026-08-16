"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setValidationError("Silakan masukkan email kerja atau username terdaftar.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setValidationError("Format email tidak valid (contoh: nama@perusahaan.com).");
      return;
    }

    setIsPending(true);

    // Simulate async recovery instruction delivery
    setTimeout(() => {
      setIsPending(false);
      setIsSubmitted(true);
      toast.success("Instruksi Terkirim", {
        description: `Tautan pemulihan kata sandi telah dikirimkan ke ${emailTrimmed}.`,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Centered Recovery Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-6 sm:p-8 md:p-10 shadow-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm mb-3">
            <Layers className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            WMS Nusantara
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Enterprise Warehouse & Logistics Platform
          </p>
          <div className="w-full h-px bg-slate-100 my-4" />
          <h2 className="text-sm font-semibold text-slate-800">
            Pemulihan Kata Sandi Akun
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Masukkan email terdaftar Anda. Kami akan mengirimkan tautan dan kode instruksi pemulihan kata sandi.
          </p>
        </div>

        {/* Error Feedback State */}
        {validationError && (
          <div className="mt-4 animate-in fade-in duration-200">
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium leading-tight">
                {validationError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success Confirmation State */}
        {isSubmitted ? (
          <div className="mt-6 text-center py-4 space-y-4 animate-in fade-in">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Instruksi Pemulihan Terkirim
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Kami telah mengirimkan instruksi ke <span className="font-semibold font-mono text-slate-800">{email}</span>. Silakan periksa folder inbox atau spam email Anda.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-left text-xs space-y-1">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                <span>Simulasi Demo Token:</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Kode token verifikasi sementara: <code className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">WMS-RESET-2026</code>
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-sm">
                  Kembali ke Halaman Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Email Input Field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="forgot-email"
                className="text-xs font-semibold text-slate-700"
              >
                Email Terdaftar / Username
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  disabled={isPending}
                  className="pl-9 text-xs h-10 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                  required
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Instruksi...</span>
                </>
              ) : (
                <>
                  <span>Kirim Instruksi Pemulihan</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Support Help Note */}
        {!isSubmitted && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-sm">
            <p className="text-[11px] text-slate-500 leading-normal">
              Kendala akses? Hubungi Super Admin pergudangan di{" "}
              <a
                href="mailto:admin@wms.id"
                className="text-indigo-600 hover:underline font-medium"
              >
                admin@wms.id
              </a>
            </p>
          </div>
        )}

        {/* Link back to Login */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Login</span>
          </Link>
        </div>
      </div>

      {/* Enterprise Security Compliance Footer */}
      <div className="mt-6 text-center text-slate-400 flex items-center justify-center gap-1.5 text-[11px]">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        <span>
          Enkripsi End-to-End 256-bit • Akses Terotentikasi WMS Multi-Role • v1.0.0
        </span>
      </div>
    </div>
  );
}
