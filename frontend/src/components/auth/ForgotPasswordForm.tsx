"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

type Step = "request" | "confirm" | "success";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ─── Step 1: Request reset token (Demo-safe simulation) ───────────────────
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      setErrorMessage("Please enter your registered work email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    setIsPending(true);
    try {
      // Demo-safe simulation: validate, simulate network delay, NO DB OVERWRITE
      await new Promise((resolve) => setTimeout(resolve, 600));
      const simulatedToken = `WMS-RESET-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setToken(simulatedToken);
      setStep("confirm");
      toast.info("Verification Token Generated", {
        description: `Reset token simulated for ${emailTrimmed}. You can now proceed to set a new password.`,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to request password reset. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  // ─── Step 2: Confirm reset with token (Demo-safe simulation) ────────────────
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const tokenTrimmed = token.trim();
    if (!tokenTrimmed) {
      setErrorMessage("Please enter your reset token.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsPending(true);
    try {
      // Demo-safe simulation: simulate verification delay, show success, NO DB OVERWRITE
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStep("success");
      toast.success("Password Reset Flow Verified", {
        description: "Password reset simulation completed successfully. Demo credentials remain protected.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || "Reset failed. Token may be invalid, expired, or already used."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 mb-3">
            <Layers className="h-5.5 w-5.5 stroke-[2.3]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">WMS Nusantara</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Enterprise Warehouse &amp; Logistics Platform
          </p>
          <div className="w-full h-px bg-slate-100 my-4" />

          {step === "success" ? (
            <>
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Password Successfully Reset!
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Your account password has been securely updated. Please sign in with your new
                credentials.
              </p>
            </>
          ) : step === "confirm" ? (
            <>
              <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Enter Reset Token
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter the reset token and your new password below.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Reset Account Password
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your registered work email to receive a password reset token.
              </p>
            </>
          )}
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-4 animate-in fade-in duration-200">
            <Alert
              variant="destructive"
              className="py-2.5 rounded-xl border-rose-200 bg-rose-50 text-rose-800"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <AlertDescription className="text-xs font-medium leading-tight">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* ── Step 1: Request Form ── */}
        {step === "request" && (
          <form onSubmit={handleRequestReset} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-700">
                Registered Work Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="admin@wms.id"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isPending}
                  className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Token...</span>
                </>
              ) : (
                <>
                  <span>Request Reset Token</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* ── Step 2: Confirm Form ── */}
        {step === "confirm" && (
          <form onSubmit={handleConfirmReset} className="mt-5 space-y-4">
            {/* Token Field */}
            <div className="space-y-1.5">
              <Label htmlFor="reset-token" className="text-xs font-semibold text-slate-700">
                Reset Token
              </Label>
              <Input
                id="reset-token"
                type="text"
                placeholder="Paste your reset token here"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isPending}
                className="text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl font-mono"
                required
              />
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reset-new-pass" className="text-xs font-semibold text-slate-700">
                New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="reset-new-pass"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isPending}
                  className="pl-10 pr-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="reset-conf-pass" className="text-xs font-semibold text-slate-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="reset-conf-pass"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isPending}
                  className="pl-10 pr-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-700">Password Guidelines:</div>
              <ul className="text-[10px] text-slate-500 space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <Check
                    className={`h-3 w-3 ${newPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-slate-400"}`}
                  />
                  <span>Minimum 8 characters</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check
                    className={`h-3 w-3 ${newPassword && newPassword === confirmPassword ? "text-emerald-600 font-bold" : "text-slate-400"}`}
                  />
                  <span>Passwords match</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("request");
                  setErrorMessage(null);
                  setToken("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={isPending}
                className="flex-1 h-10 text-xs rounded-xl border-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <KeyRound className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <div className="mt-6 space-y-4 animate-in fade-in">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  Demo Protection Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Untuk menjaga kemudahan uji coba portofolio, kredensial akun bawaan (Admin, Customer, Driver) tetap menggunakan password default <strong>123456</strong> sehingga tombol <em>Quick Demo</em> selalu siap digunakan.
              </p>
            </div>

            <Link href="/login" className="block w-full">
              <Button className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Back to Sign In Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Remember your password? Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
