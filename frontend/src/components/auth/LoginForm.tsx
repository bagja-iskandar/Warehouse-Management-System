"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Layers, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, DEMO_CREDENTIALS } from "@/hooks/use-auth";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginForm() {
  const { login, isPending, demoCredentials } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
  const [email, setEmail] = useState(demoCredentials.ADMIN.email);
  const [password, setPassword] = useState(demoCredentials.ADMIN.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle role tab change and autofill demo credentials
  const handleRoleChange = (roleValue: string) => {
    const role = roleValue as UserRole;
    setSelectedRole(role);
    setEmail(demoCredentials[role].email);
    setPassword(demoCredentials[role].password);
    setValidationError(null);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side basic validation
    if (!email.trim()) {
      setValidationError("Silakan masukkan email kerja atau username Anda.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Format email tidak valid (contoh: nama@perusahaan.com).");
      return;
    }

    if (!password) {
      setValidationError("Silakan masukkan kata sandi Anda.");
      return;
    }

    try {
      await login({
        email: email.trim(),
        password,
        role: selectedRole,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setValidationError(
        error.message ||
          "Kredensial atau peran yang dipilih tidak cocok. Silakan periksa kembali email & kata sandi Anda."
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Centered Login Card */}
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
            Masuk ke Portal Operasional Gudang & Logistik
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pilih konteks peran operasional Anda untuk melanjutkan:
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="mt-4">
          <Tabs
            value={selectedRole}
            onValueChange={handleRoleChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-sm">
              <TabsTrigger
                value="ADMIN"
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-sm py-1.5"
              >
                Admin
              </TabsTrigger>
              <TabsTrigger
                value="CUSTOMER"
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-sm py-1.5"
              >
                Customer
              </TabsTrigger>
              <TabsTrigger
                value="DRIVER"
                className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-sm py-1.5"
              >
                Driver
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Role Context Hint */}
          <div className="mt-2 px-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="font-medium text-slate-700">
              {demoCredentials[selectedRole].roleName}
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Demo Autofill Aktif
            </span>
          </div>
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

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Email / Username Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-slate-700"
            >
              Email Kerja / Username
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
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

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-slate-700"
              >
                Kata Sandi
              </Label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Lupa Kata Sandi?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isPending}
                className="pl-9 pr-9 text-xs h-10 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Session Row */}
          <div className="flex items-center space-x-2 pt-0.5">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <label
              htmlFor="remember"
              className="text-xs text-slate-600 select-none cursor-pointer font-normal"
            >
              Ingat sesi di perangkat ini
            </label>
          </div>

          {/* Submit Action CTA */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-sm shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Sistem Operasional</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Register Customer Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Daftar sebagai Customer
            </Link>
          </p>
        </div>

        {/* Demo Credentials Quick Switcher Footer */}
        <div className="mt-3 pt-2 text-center">
          <p className="text-[11px] text-slate-400 leading-normal">
            Akun Percobaan: <span className="text-slate-600 font-mono">{email}</span> (PW: password123)
          </p>
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
