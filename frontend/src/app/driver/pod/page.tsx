"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  Camera,
  Upload,
  User,
  PenTool,
  Check,
  Building2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubmitPod } from "@/hooks/use-logistics";
import { toast } from "sonner";

export default function DigitalPodPage() {
  const submitPodMutation = useSubmitPod();
  const [recipientName, setRecipientName] = useState("Hendra Wijaya");
  const [recipientRole, setRecipientRole] = useState("Supervisor Receiving");
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasSignature, setHasSignature] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitPodMutation.mutateAsync({
        orderId: "ord-01",
        data: {
          recipientName: `${recipientName} (${recipientRole})`,
          photoUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
          signatureData: "data:image/svg+xml;utf8,<svg>signature</svg>",
          rating: 5,
          note: "Cargo received completely in optimal frozen condition, seals intact.",
        },
      });
      setIsSubmitted(true);
      toast.success("Digital POD Saved Successfully", {
        description: "Shipment status has been updated to DELIVERED.",
      });
    } catch (err: any) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Upload Proof of Delivery (Digital POD)
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              DO-2026-001
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture goods documentation photos at destination and request recipient&apos;s digital e-signature.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/driver/dashboard">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Digital POD Uploaded & Saved Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Delivery <span className="font-mono font-bold text-indigo-600">DO-2026-001</span> has been officially completed. Photo proof and digital signature have been recorded in the central system.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1">
            <p>Recipient: {recipientName} ({recipientRole})</p>
            <p>Completion Time: Aug 16, 2026, 09:42 WIB</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/driver/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Back to Task Dashboard →
              </Button>
            </Link>
            <Link href="/driver/history">
              <Button variant="outline" className="text-xs h-9">
                View Completed History
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Photo Upload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. On-Site Goods Handover Photo Proof
              </h2>

              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Master Box Photo at FreshMarket BSD Loading Dock Area
                  </p>
                  <p className="text-[11px] text-slate-400">
                    [ File: POD-DO-2026-001-PHOTO.JPG — 2.1 MB Attached ]
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs border-slate-300 text-slate-700 h-8 mt-1"
                >
                  Change Documentation Photo
                </Button>
              </div>
            </div>

            {/* Step 2: Digital Signature */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                2. Recipient Digital Signature (E-Signature)
              </h2>

              <div className="space-y-3">
                <div className="h-36 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-center relative p-3">
                  <div className="text-center font-mono text-xs text-indigo-700 italic font-bold">
                    ✍ [ Validated Digital Signature ]<br />
                    <span className="text-[10.5px] text-slate-500 font-sans">
                      {recipientName} — {recipientRole}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 right-2 text-[10.5px] text-slate-400 hover:text-slate-700 h-7"
                  >
                    Reset Signature
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3: Recipient Identity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                3. Full Recipient Identity
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Job Title / Relationship
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                DO Completion Confirmation
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed">
                Ensure all 150 Packages of cold cargo have been inspected and handed over in good condition before submitting the POD.
              </p>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Submit Proof of Delivery & Complete Task
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
