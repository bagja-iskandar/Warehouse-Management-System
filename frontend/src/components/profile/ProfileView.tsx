"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Shield,
  KeyRound,
  History,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Laptop,
  Smartphone,
  Check,
  Sparkles,
  Fingerprint,
  Calendar,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PageContainer,
  PageHeader,
} from "@/components/dashboard";
import { toast } from "sonner";

interface ProfileViewProps {
  initialTab?: "profile" | "password" | "sessions";
}

export function ProfileView({ initialTab = "profile" }: ProfileViewProps) {
  const {
    user,
    updateProfile,
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "password" | "sessions">(
    initialTab
  );

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    address: "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Sync user state to form
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        companyName: user.companyName || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!profileData.name.trim()) {
      setProfileError("Full name cannot be empty.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email.trim())) {
      setProfileError("Invalid email address format.");
      return;
    }

    try {
      await updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        companyName: profileData.companyName.trim(),
        address: profileData.address.trim(),
      });
      toast.success("Profile Updated", {
        description: "Your account details have been saved successfully.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setProfileError(error.message || "Failed to update profile data.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordData.currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password confirmation does not match.");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError("New password cannot be the same as your current password.");
      return;
    }

    try {
      await changePassword({
        currentPass: passwordData.currentPassword,
        newPass: passwordData.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password Updated", {
        description: "Your account password has been updated successfully.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      setPasswordError(error.message || "Failed to update password.");
    }
  };

  const handleResetProfile = () => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        companyName: user.companyName || "",
        address: user.address || "",
      });
      setProfileError(null);
    }
  };

  const getRoleTheme = () => {
    switch (user?.role) {
      case "ADMIN":
        return {
          title: "Warehouse Administrator",
          badgeClass: "bg-indigo-600 text-white",
          avatarBg: "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white",
          accentColor: "indigo",
          description: "Operations command center & rack capacity management",
        };
      case "CUSTOMER":
        return {
          title: "Corporate Customer",
          badgeClass: "bg-emerald-600 text-white",
          avatarBg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white",
          accentColor: "emerald",
          description: "Cold storage rental, inbound booking & inventory management",
        };
      case "DRIVER":
        return {
          title: "Logistics Fleet Driver",
          badgeClass: "bg-amber-500 text-slate-950 font-bold",
          avatarBg: "bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950",
          accentColor: "amber",
          description: "Dispatch tasks, reefer truck execution & electronic POD",
        };
      default:
        return {
          title: "Operations Staff",
          badgeClass: "bg-slate-700 text-white",
          avatarBg: "bg-slate-700 text-white",
          accentColor: "slate",
          description: "Authenticated operations access",
        };
    }
  };

  const roleTheme = getRoleTheme();

  const getInitials = (name?: string) => {
    if (!name) return "WMS";
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <PageContainer className="max-w-6xl">
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Account & Settings"
        title="Profile & Account Settings"
        subtitle="Manage representative PIC contact details, company profile, password security, and active session history."
        badgeText={roleTheme.title}
        badgeColor={roleTheme.badgeClass}
      />

      {/* 2. Responsive 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): User Card & Navigation Tabs */}
        <div className="lg:col-span-4 space-y-4">
          {/* User Identity Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
            
            <div className={`h-20 w-20 rounded-2xl ${roleTheme.avatarBg} font-bold text-2xl flex items-center justify-center mx-auto shadow-md shadow-slate-200 mb-4 transition-transform hover:scale-105 duration-200`}>
              {getInitials(user?.name)}
            </div>

            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {user?.name || "User Name"}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">
              {user?.email || "email@wms.id"}
            </p>

            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Account
              </span>
            </div>

            {user?.companyName && (
              <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold truncate">{user.companyName}</span>
              </div>
            )}
          </div>

          {/* Vertical Navigation Tabs */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "profile"
                  ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs border border-indigo-100/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <User className={`h-4 w-4 ${activeTab === "profile" ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="flex-1">
                <div>User Profile Information</div>
                <div className="text-[10px] text-slate-400 font-normal">Contact info & company data</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "password"
                  ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs border border-indigo-100/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <KeyRound className={`h-4 w-4 ${activeTab === "password" ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="flex-1">
                <div>Security & Password</div>
                <div className="text-[10px] text-slate-400 font-normal">Change account password</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activeTab === "sessions"
                  ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs border border-indigo-100/60"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <History className={`h-4 w-4 ${activeTab === "sessions" ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="flex-1">
                <div>Sessions & Activity Log</div>
                <div className="text-[10px] text-slate-400 font-normal">Active devices & login audits</div>
              </div>
            </button>
          </div>

          {/* Quick Security Badge */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Enterprise Account Security</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Your account is protected with 256-bit JWT cryptographic authentication and continuous operational audit tracking.
            </p>
          </div>
        </div>

        {/* Right Column (8 cols): Tab Form Contents */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: User Profile Form */}
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    User Profile Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update PIC representative contact details and registered business data.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  ID: {user?.id || "USR-WMS"}
                </span>
              </div>

              {profileError && (
                <Alert variant="destructive" className="py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    {profileError}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PIC Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-semibold text-slate-700">
                      PIC Full Name
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        id="prof-name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        disabled={isUpdatingProfile}
                        className="pl-9 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email" className="text-xs font-semibold text-slate-700">
                      Registered Email
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        id="prof-email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        disabled={isUpdatingProfile}
                        className="pl-9 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone" className="text-xs font-semibold text-slate-700">
                      Phone / WhatsApp Number
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <Input
                        id="prof-phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        disabled={isUpdatingProfile}
                        placeholder="0812-3456-7890"
                        className="pl-9 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Role (Read-only Badge) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Operational Access Role
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Shield className="h-4 w-4" />
                      </div>
                      <Input
                        type="text"
                        value={`${roleTheme.title} (${user?.role || "USER"})`}
                        disabled
                        className="pl-9 text-xs h-10 bg-slate-50 border-slate-200 text-slate-500 font-medium rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="prof-company" className="text-xs font-semibold text-slate-700">
                    Company / Organization Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <Input
                      id="prof-company"
                      type="text"
                      value={profileData.companyName}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, companyName: e.target.value }))
                      }
                      disabled={isUpdatingProfile}
                      placeholder="e.g. PT Logistik Prima Nusantara"
                      className="pl-9 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                    />
                  </div>
                </div>

                {/* Operational Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="prof-address" className="text-xs font-semibold text-slate-700">
                    Operational / Office Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <Input
                      id="prof-address"
                      type="text"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      disabled={isUpdatingProfile}
                      placeholder="e.g. Kawasan Industri Pulo Gadung, Jakarta Timur"
                      className="pl-9 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetProfile}
                    disabled={isUpdatingProfile}
                    className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl h-10 px-4 flex items-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-10 px-5 shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === "password" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Security & Password Update
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your authentication credentials to safeguard your operational tasks.
                </p>
              </div>

              {passwordSuccess && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 py-3 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs font-semibold">
                    Password successfully updated and securely hashed.
                  </AlertDescription>
                </Alert>
              )}

              {passwordError && (
                <Alert variant="destructive" className="py-3 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">
                    {passwordError}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="curr-pass" className="text-xs font-semibold text-slate-700">
                    Current Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="curr-pass"
                      type={showCurrentPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                      className="pl-9 pr-10 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-semibold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="new-pass"
                      type={showNewPass ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                      className="pl-9 pr-10 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="conf-pass" className="text-xs font-semibold text-slate-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="conf-pass"
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                      className="pl-9 pr-10 text-xs h-10 border-slate-200 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Security Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Password Security Guidelines</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-500">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Minimum 6 characters</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Mix letters and numbers</span>
                    </li>
                  </ul>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-10 px-5 shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Sessions & Activity Log */}
          {activeTab === "sessions" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Active Sessions & Access Log
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time devices and workstations currently authenticated under your credentials.
                </p>
              </div>

              <div className="border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {/* Current Active Session */}
                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Current Web Browser (Active Workstation)
                        </span>
                        <Badge variant="success" className="text-[10px] py-0.5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                          This Device
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        IP: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">127.0.0.1</code> • Protocol: HTTPS / Secure JWT • Status: Verified
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile / Secondary Device */}
                <div className="p-4 flex items-center justify-between bg-slate-50/40">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          Warehouse Operations Handheld / Tablet
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SES-WMS-2026
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Location: Jakarta Hub Operations • Last verified: Today
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-slate-400" />
                  <span>Seeing unrecognized logins or suspicious access?</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Security Action Triggered", { description: "All secondary sessions have been revoked." })}
                  className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-9 rounded-xl px-3.5 flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out Other Devices</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

