"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Layers,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TermsModal } from "./TermsModal";

export function RegisterForm() {
  const { register, isRegistering } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Client-side validations
    if (!formData.name.trim()) {
      setValidationError("Please enter the PIC full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setValidationError("Please enter a valid company email address (e.g. pic@company.com).");
      return;
    }

    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      setValidationError("Phone / WhatsApp number must be at least 8 digits.");
      return;
    }

    if (!formData.companyName.trim()) {
      setValidationError("Please enter your company or business name.");
      return;
    }

    if (!formData.address.trim()) {
      setValidationError("Please enter the complete company / office address.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Password confirmation does not match.");
      return;
    }

    if (!agreeTerms) {
      setValidationError("Please read and accept the Terms & Conditions of Service to proceed.");
      return;
    }

    // Demo-only simulation: validate form, simulate network delay, show success, NO DB INSERT
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Centered Registration Card */}
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/40">
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
            Create Customer Account
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Register your company to lease warehouse storage and manage logistics operations.
          </p>
        </div>

        {/* Error Feedback Banner */}
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

        {/* Success Feedback State */}
        {isSuccess ? (
          <div className="mt-6 text-center py-6 space-y-3 animate-in fade-in">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Customer created successfully.
            </h3>
            <p className="text-xs text-slate-600">
              Registration validated in demo mode. Please use the designated Customer demo persona to explore all tenant features.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Go to Sign In & Try Customer Persona →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            {/* 2-Column Grid for Personal & Company Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PIC Name */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                  PIC Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="PIC Full Name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Company Email */}
              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-700">
                  Company Email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                  Phone / WhatsApp Number
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="081234567890"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-xs font-semibold text-slate-700">
                  Company / Business Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="PT Fresh Foods Indonesia"
                    value={formData.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Full-Width Address */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                Company / Office Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <Input
                  id="address"
                  type="text"
                  placeholder="Jl. Industri Raya No. 45, Jakarta"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={isRegistering}
                  className="pl-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* 2-Column Grid for Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="reg-password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 pr-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
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

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    disabled={isRegistering}
                    className="pl-10 pr-10 text-xs h-10 border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600/20 focus-visible:border-indigo-600 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and Agreement */}
            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => {
                  setAgreeTerms(!!checked);
                  if (validationError) setValidationError(null);
                }}
                className="mt-0.5 rounded-md"
              />
              <div className="text-xs text-slate-600 leading-tight select-none">
                <label htmlFor="agreeTerms" className="cursor-pointer">
                  I agree to the{" "}
                </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsTermsModalOpen(true);
                  }}
                  className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline cursor-pointer inline-block"
                >
                  Terms & Conditions of Service
                </button>
                <label htmlFor="agreeTerms" className="cursor-pointer">
                  {" "}of WMS Nusantara.
                </label>
              </div>
            </div>

            {/* Submit Action CTA */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating Registration...</span>
                </>
              ) : (
                <>
                  <span>Create Customer Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Link back to Login */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Sign In
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

      {/* Terms & Conditions Modal Dialog */}
      <TermsModal
        isOpen={isTermsModalOpen}
        isAccepted={agreeTerms}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => {
          setAgreeTerms(true);
          if (validationError) setValidationError(null);
        }}
      />
    </div>
  );
}
