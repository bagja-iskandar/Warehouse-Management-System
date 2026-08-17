"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileViewProps {
  initialTab?: "profile" | "password" | "sessions";
}

export function ProfileView({ initialTab = "profile" }: ProfileViewProps) {
  const {
    user,
    isAuthenticated,
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
      setProfileError("Invalid email format.");
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

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "ADMIN":
        return {
          title: "Warehouse Admin",
          badgeClass: "bg-indigo-600 text-white",
          description: "Super User & Hub Operations Manager",
        };
      case "CUSTOMER":
        return {
          title: "Corporate Customer",
          badgeClass: "bg-emerald-600 text-white",
          description: "Warehouse Capacity Tenant & Inventory Manager",
        };
      case "DRIVER":
        return {
          title: "Logistics Driver",
          badgeClass: "bg-amber-600 text-white",
          description: "Fleet Operator & Delivery Execution",
        };
      default:
        return {
          title: "Registered User",
          badgeClass: "bg-slate-700 text-white",
          description: "Authenticated Access",
        };
    }
  };

  const roleInfo = getRoleDisplay();

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Profile & Account Settings
              </h1>
              <Badge className={roleInfo.badgeClass}>{roleInfo.title}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage PIC contact info, company data, password security, and active session logs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={
                user?.role === "ADMIN"
                  ? "/admin/dashboard"
                  : user?.role === "CUSTOMER"
                  ? "/customer/dashboard"
                  : "/driver/dashboard"
              }
            >
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Profile Summary & Vertical Navigation Tabs */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Identity Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm text-center">
              <div className="h-20 w-20 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold text-2xl flex items-center justify-center mx-auto shadow-sm">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "US"}
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-4">
                {user?.name || "User Name"}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {user?.email || "email@wms.id"}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Status: Active
                </span>
              </div>

              {user?.companyName && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold">{user.companyName}</span>
                </div>
              )}
            </div>

            {/* Vertical Navigation Tabs */}
            <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-sm space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === "profile"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <User className="h-4 w-4" />
                <span>User Profile Information</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === "password"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <KeyRound className="h-4 w-4" />
                <span>Security & Password</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sessions")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === "sessions"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <History className="h-4 w-4" />
                <span>Sessions & Activity Log</span>
              </button>
            </div>

            {/* Quick Security Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Enterprise Account Security</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Registered accounts are protected with 256-bit encryption and real-time operational audit logs.
              </p>
            </div>
          </div>

          {/* Right Column: Active Tab Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* TAB 1: Profile Information */}
            {activeTab === "profile" && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    User Profile Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update PIC representative contact info and company identity registered in the warehouse system.
                  </p>
                </div>

                {profileError && (
                  <Alert variant="destructive" className="py-2.5">
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
                          className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
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
                          className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
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
                          className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                        />
                      </div>
                    </div>

                    {/* Role (Read-only Badge) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        System Access Role
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Shield className="h-4 w-4" />
                        </div>
                        <Input
                          type="text"
                          value={`${roleInfo.title} (${user?.role || "USER"})`}
                          disabled
                          className="pl-9 text-xs h-9.5 bg-slate-50 border-slate-200 text-slate-500 font-medium rounded-sm cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-company" className="text-xs font-semibold text-slate-700">
                      Company / Business Organization Name
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
                        className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Operational Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-address" className="text-xs font-semibold text-slate-700">
                      Full Operational / Office Address
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
                        className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
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
                      className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Cancel / Reset</span>
                    </Button>

                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-sm shadow-sm flex items-center gap-1.5"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Profile Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Change Password */}
            {activeTab === "password" && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Security & Password Update
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Change your password periodically to maintain the security of your WMS operations account.
                  </p>
                </div>

                {passwordSuccess && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-xs font-medium">
                      Password successfully changed and securely stored.
                    </AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
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
                        className="pl-9 pr-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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
                        className="pl-9 pr-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
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
                        type={showNewPass ? "text" : "password"}
                        placeholder="Repeat new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        disabled={isChangingPassword}
                        className="pl-9 text-xs h-9.5 border-slate-300 focus-visible:ring-indigo-600 rounded-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Guidelines Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-600 space-y-1.5">
                    <div className="font-semibold text-slate-700">
                      Enterprise Password Guidelines:
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                      <li>Minimum 6 characters combining letters and numbers.</li>
                      <li>Avoid using full names or easily guessed personal dates.</li>
                    </ul>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-sm shadow-sm flex items-center gap-1.5"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving New Password...</span>
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
              <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Active Sessions & Access Log
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    List of devices and browsers currently having authenticated access to your account.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {/* Current Active Session */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mt-0.5">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Chrome on Windows 11 (This Device)
                          </span>
                          <Badge variant="success" className="text-[10px] py-0">
                            Active Session
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          IP: <code className="font-mono text-slate-700">192.168.1.102</code> • Location: Jakarta Hub • Last active: Just now
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Mobile Driver Device */}
                  <div className="p-4 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center mt-0.5">
                        <Laptop className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            Mobile Web App / Android Handheld
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: SES-29182
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          IP: <code className="font-mono text-slate-700">10.20.44.12</code> • Surabaya Cold Storage Hub • Last active: 2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-500 flex items-center justify-between">
                  <span>Seeing suspicious activity on your account?</span>
                  <Button
                    variant="outline"
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8"
                  >
                    Sign Out from All Other Devices
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
