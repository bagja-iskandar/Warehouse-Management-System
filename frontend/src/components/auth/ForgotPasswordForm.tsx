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
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setIsPending(true);

    try {
      await authService.resetPassword(emailTrimmed, newPassword);
      setIsSuccess(true);
      toast.success("Password Reset Successful", {
        description: "Your credentials have been updated. You can now sign in.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || "Failed to reset password. Please verify your email."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Centered Recovery Card */}
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

          {isSuccess ? (
            <>
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Password Successfully Reset!
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Your account password for <span className="font-semibold text-slate-800">{email}</span> has been securely updated in the database.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Reset Account Password
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your registered work email and define your new credentials directly.
              </p>
            </>
          )}
        </div>

        {/* Error Feedback State */}
        {errorMessage && (
          <div className="mt-4 animate-in fade-in duration-200">
            <Alert variant="destructive" className="py-2.5 rounded-xl border-rose-200 bg-rose-50 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <AlertDescription className="text-xs font-medium leading-tight">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Form or Success Action */}
        {isSuccess ? (
          <div className="mt-6 space-y-4 animate-in fade-in">
            <Link href="/login" className="block w-full">
              <Button className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2">
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reset-email"
                className="text-xs font-semibold text-slate-700"
              >
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

            {/* New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reset-new-pass"
                className="text-xs font-semibold text-slate-700"
              >
                New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="reset-new-pass"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
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
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reset-conf-pass"
                className="text-xs font-semibold text-slate-700"
              >
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

            {/* Password Validation Guidelines */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-700">
                Password Guidelines:
              </div>
              <ul className="text-[10px] text-slate-500 space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <Check className={`h-3 w-3 ${newPassword.length >= 6 ? "text-emerald-600 font-bold" : "text-slate-400"}`} />
                  <span>Minimum 6 characters</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className={`h-3 w-3 ${newPassword && newPassword === confirmPassword ? "text-emerald-600 font-bold" : "text-slate-400"}`} />
                  <span>Passwords match</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <KeyRound className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
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
