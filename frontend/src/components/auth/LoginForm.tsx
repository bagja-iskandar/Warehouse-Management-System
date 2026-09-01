"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const { login, isPending } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const emailTrimmed = email.trim();

    // Client-side validation
    if (!emailTrimmed) {
      setValidationError("Please enter your registered work email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setValidationError("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    try {
      await login({
        email: emailTrimmed,
        password,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setValidationError(
        error.message || "Invalid email or password. Please verify your credentials."
      );
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    setValidationError(null);
    try {
      await login({
        email: demoEmail,
        password: "123456",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setValidationError(
        error.message || "Failed to sign in with demo account. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-3">
            <Layers className="h-5.5 w-5.5 stroke-[2.3]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            WMS Nusantara
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Enterprise Warehouse & Logistics Platform
          </p>

          <div className="w-full h-px bg-slate-100 my-4" />

          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Sign In to Operations Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your credentials to access your operational dashboard.
          </p>
        </div>

        {/* Error Feedback State */}
        {validationError && (
          <div className="mt-4 animate-in fade-in duration-200">
            <Alert variant="destructive" className="py-2.5 rounded-xl border-rose-200 bg-rose-50 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <AlertDescription className="text-xs font-medium leading-tight">
                {validationError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-slate-700"
            >
              Work Email Address
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isPending}
                className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                autoComplete="email"
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
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[11.5px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                className="pl-10 pr-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              className="rounded-md"
            />
            <label
              htmlFor="remember"
              className="text-xs text-slate-600 select-none cursor-pointer font-normal"
            >
              Remember session on this device
            </label>
          </div>

          {/* Submit Action CTA */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in to Operations...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Quick Demo Persona Access */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Try Demo Persona
            </span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full font-semibold">
              Instant Review
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleQuickLogin("admin@wms.id")}
              className="h-9 px-2 text-xs font-semibold rounded-xl border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 transition-all cursor-pointer"
            >
              Login as Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleQuickLogin("driver@wms.id")}
              className="h-9 px-2 text-xs font-semibold rounded-xl border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 transition-all cursor-pointer"
            >
              Login as Driver
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleQuickLogin("customer@wms.id")}
              className="h-9 px-2 text-xs font-semibold rounded-xl border-slate-200 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 text-slate-700 transition-all cursor-pointer"
            >
              Login as Customer
            </Button>
          </div>
        </div>

        {/* Register Customer Link */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Register as Customer
            </Link>
          </p>
        </div>
      </div>

      {/* Enterprise Security Compliance Footer */}
      <div className="mt-6 text-center text-slate-400 flex items-center justify-center gap-1.5 text-[11px]">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        <span>
          256-bit SSL Encryption • Multi-Role Authenticated WMS Access • v1.0.0
        </span>
      </div>
    </div>
  );
}
