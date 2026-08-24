"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, ShieldCheck, FileText, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isAccepted?: boolean;
}

export function TermsModal({
  isOpen,
  onClose,
  onAccept,
  isAccepted = false,
}: TermsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isAccepted) {
        setHasReachedBottom(true);
      } else {
        setHasReachedBottom(false);
      }

      // Check if content fits in viewport without scrolling on mount
      const checkInitialScroll = () => {
        if (contentRef.current) {
          const { clientHeight, scrollHeight } = contentRef.current;
          if (scrollHeight <= clientHeight + 10) {
            setHasReachedBottom(true);
          }
        }
      };

      // Slight timeout to ensure layout rendering has settled
      const timer = setTimeout(checkInitialScroll, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAccepted]);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Scroll detection handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    const threshold = 10;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      setHasReachedBottom(true);
    }
  };

  const handleAcceptAndClose = () => {
    onAccept();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      {/* Modal Container Card */}
      <div
        className="w-full max-w-xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4.5 w-4.5 stroke-[2.2]" />
            </div>
            <div>
              <h2
                id="terms-modal-title"
                className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight"
              >
                Terms & Conditions of Service
              </h2>
              <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                WMS Nusantara Enterprise Warehouse & Logistics Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close Terms and Conditions"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="px-6 py-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed custom-scrollbar relative"
        >
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11.5px] text-indigo-900 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              By registering as a Corporate Customer on WMS Nusantara, your company agrees to adhere to the operational policies, warehouse safety standards, and billing terms outlined below.
            </span>
          </div>

          {/* Section 1 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              1. Account Registration & Corporate Eligibility
            </h3>
            <p className="text-[11.5px] text-slate-600">
              Customer accounts must be registered with valid corporate credentials, a designated Person-in-Charge (PIC), verified corporate email, and legal business documentation. You are responsible for safeguarding your account access credentials.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              2. Warehouse Storage & Rack Allocation
            </h3>
            <p className="text-[11.5px] text-slate-600">
              Storage capacity is allocated based on confirmed volume (m³) and facility zone availability (Standard Dry Rack or Cold Storage with temperature control from -18°C to -25°C). Space usage exceeding reserved limits will incur additional daily utilization fees.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              3. Stored Goods & Inbound Compliance
            </h3>
            <p className="text-[11.5px] text-slate-600">
              All inventory inbound to WMS Nusantara facilities must be properly packaged, labeled with compliant barcodes/QR identifiers, and classified accurately. Hazardous, combustible, or illegal items are strictly prohibited without prior authorization.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              4. Logistics Fleet & Delivery Requests
            </h3>
            <p className="text-[11.5px] text-slate-600">
              Outbound logistics dispatch orders (Delivery Orders) are scheduled based on vehicle fleet capacity and destination. Every completed dispatch requires digital Proof of Delivery (POD) confirmation signed by the authorized recipient.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              5. Billing, Invoicing & Payment Terms
            </h3>
            <p className="text-[11.5px] text-slate-600">
              Warehouse rental fees and logistics service charges are invoiced on a monthly billing cycle. Payments are due within 14 calendar days from invoice issuance. Late payments may result in temporary storage access restrictions and operational penalty interest.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              6. Tenant Responsibilities & Operational Safety
            </h3>
            <p className="text-[11.5px] text-slate-600">
              Tenants must ensure timely notification for bulk goods loading/unloading. All activities within warehouse docking bays and storage zones must strictly comply with Occupational Safety and Health (K3) standards.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              7. Data Privacy, IoT Telemetry & Security
            </h3>
            <p className="text-[11.5px] text-slate-600">
              WMS Nusantara collects real-time telemetry sensor readings (temperature, relative humidity, slot occupancy) and transaction audit logs solely for operational monitoring, quality assurance, and billing calculation.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-xs">
              8. Service Availability & System SLA
            </h3>
            <p className="text-[11.5px] text-slate-600">
              We strive to maintain 99.9% platform availability. Scheduled maintenance windows will be communicated in advance. For operational support or inquiries, contact Warehouse Operations at <span className="font-semibold text-slate-800">admin@wms.id</span>.
            </p>
          </div>

          {/* End of content marker */}
          <div className="pt-2 text-center text-[11px] text-slate-400 font-mono">
            — End of Terms of Service Document —
          </div>
        </div>

        {/* Scroll hint when not at bottom yet */}
        {!hasReachedBottom && !isAccepted && (
          <div className="px-6 py-1.5 bg-amber-50/90 border-t border-amber-100 flex items-center justify-center gap-1.5 text-[11px] text-amber-800 font-medium animate-pulse">
            <ChevronDown className="h-3.5 w-3.5 text-amber-600" />
            <span>Scroll to the bottom to acknowledge and continue</span>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Effective Date: August 2026 • Version 1.2
          </span>

          {isAccepted ? (
            <Button
              type="button"
              onClick={handleAcceptAndClose}
              className="w-full sm:w-auto h-9 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Already Accepted</span>
            </Button>
          ) : hasReachedBottom ? (
            <Button
              type="button"
              onClick={handleAcceptAndClose}
              className="w-full sm:w-auto h-9 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-in fade-in duration-200"
            >
              <Check className="h-4 w-4" />
              <span>I Have Read & Agree</span>
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              className="w-full sm:w-auto h-9 px-5 bg-slate-200 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed opacity-75 flex items-center justify-center gap-1.5"
            >
              <span>I Have Read & Agree</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
