"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hourglass,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  ShieldCheck,
  X,
  ExternalLink,
  Eye,
  Loader2,
  Check,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useInvoices, usePendingPayments, useVerifyPayment } from "@/hooks/use-billing";
import { Invoice, Payment } from "@/types";
import { toast } from "sonner";

export default function AdminBillingPage() {
  const { data: liveInvoices = [], isLoading: isInvoicesLoading } = useInvoices();
  const { data: pendingPayments = [], isLoading: isPendingLoading } = usePendingPayments();
  const verifyPaymentMutation = useVerifyPayment();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Reviewing Payment
  const [selectedInvoiceToReview, setSelectedInvoiceToReview] = useState<Invoice | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [zoomedProofUrl, setZoomedProofUrl] = useState<string | null>(null);

  const handleOpenReview = (inv: Invoice) => {
    setSelectedInvoiceToReview(inv);
    setIsRejecting(false);
    setRejectionReason("");
  };

  const handleVerify = async () => {
    if (!selectedInvoiceToReview) return;
    try {
      await verifyPaymentMutation.mutateAsync({
        invoiceId: selectedInvoiceToReview.id,
        action: "VERIFY",
        note: "Approved and verified by Admin",
      });
      toast.success("Payment Verified & Settled", {
        description: `Invoice #${selectedInvoiceToReview.invoiceNumber} is now marked as PAID. Official receipt generated.`,
      });
      setSelectedInvoiceToReview(null);
    } catch (err: any) {
      toast.error("Verification Failed", {
        description: err?.message || "Could not verify payment.",
      });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToReview) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      await verifyPaymentMutation.mutateAsync({
        invoiceId: selectedInvoiceToReview.id,
        action: "REJECT",
        rejectionReason: rejectionReason.trim(),
        note: rejectionReason.trim(),
      });
      toast.info("Payment Submission Rejected", {
        description: `Customer will be notified: "${rejectionReason.trim()}". Invoice reverted to UNPAID/OVERDUE.`,
      });
      setSelectedInvoiceToReview(null);
      setIsRejecting(false);
    } catch (err: any) {
      toast.error("Action Failed", {
        description: err?.message || "Could not reject payment.",
      });
    }
  };

  const filteredInvoices = liveInvoices.filter((inv) => {
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "UNDER_REVIEW" && inv.status === "PENDING_PAYMENT") ||
      inv.status === statusFilter;

    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerCompany && inv.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchSearch;
  });

  const paidInvoicesList = liveInvoices.filter((i) => i.status === "PAID");
  const underReviewList = liveInvoices.filter((i) => i.status === "PENDING_PAYMENT");
  const unpaidInvoicesList = liveInvoices.filter((i) => i.status === "UNPAID");
  const overdueInvoicesList = liveInvoices.filter((i) => i.status === "OVERDUE");

  const totalPaidRevenue = paidInvoicesList.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPendingRevenue = [...underReviewList, ...unpaidInvoicesList, ...overdueInvoicesList].reduce(
    (acc, i) => acc + i.totalAmount,
    0
  );
  const totalLateFees = liveInvoices.reduce((acc, i) => acc + i.penaltyFee, 0);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Billing & Invoices"
        title="Enterprise Billing & Payment Verification"
        subtitle="Real-time warehouse space rental billing, bank mutation verification, late fee penalties, and customer audit ledger."
        badgeText="Financial Control"
        badgeColor="bg-indigo-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/customers">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
              >
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                <span>Tenant Accounts</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Verified Revenue (Paid)"
          value={`Rp ${totalPaidRevenue.toLocaleString("id-ID")}`}
          icon={DollarSign}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Settled
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              {paidInvoicesList.length} Invoices Settled
            </span>
          }
        />

        <MetricCard
          label="Awaiting Admin Review"
          value={`${underReviewList.length} Invoices`}
          icon={Hourglass}
          theme="amber"
          badge={
            underReviewList.length > 0 ? (
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse">
                Action Required
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-amber-700 font-medium">
              Pending bank proof validations
            </span>
          }
        />

        <MetricCard
          label="Outstanding Invoices"
          value={`Rp ${totalPendingRevenue.toLocaleString("id-ID")}`}
          icon={Receipt}
          theme="purple"
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              {unpaidInvoicesList.length + overdueInvoicesList.length} Invoices Unpaid / Overdue
            </span>
          }
        />

        <MetricCard
          label="Late Penalty Surcharges"
          value={`Rp ${totalLateFees.toLocaleString("id-ID")}`}
          icon={AlertTriangle}
          theme={totalLateFees > 0 ? "rose" : "indigo"}
          subtext={
            <span className="text-[11px] text-slate-400">
              5% per week overdue surcharge
            </span>
          }
        />
      </div>

      {/* 3. Main Invoice Ledger Table & Filters */}
      <SectionCard
        title="Warehouse Invoices & Payment Verification Ledger"
        subtitle="Verify incoming payment transfer slips, review lease obligations, and generate tax receipts"
        icon={Receipt}
      >
        <div className="space-y-4">
        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "All Invoices", count: liveInvoices.length },
              { id: "UNDER_REVIEW", label: "Under Review", count: underReviewList.length, highlight: true },
              { id: "UNPAID", label: "Unpaid", count: unpaidInvoicesList.length },
              { id: "OVERDUE", label: "Overdue", count: overdueInvoicesList.length },
              { id: "PAID", label: "Paid", count: paidInvoicesList.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    tab.highlight && tab.count > 0
                      ? "bg-amber-500 text-white font-bold"
                      : statusFilter === tab.id
                      ? "bg-slate-700 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Invoices Table */}
        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto stroke-[1.5]" />
            <p className="font-semibold text-slate-600">No Invoices Found</p>
            <p className="text-slate-400">No billing records match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-3">Customer / Tenant</th>
                  <th className="py-3 px-3">Billing Month</th>
                  <th className="py-3 px-3">Subtotal</th>
                  <th className="py-3 px-3">Late Penalty</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  const isUnderReview = inv.status === "PENDING_PAYMENT";
                  const isOverdue = inv.status === "OVERDUE";

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isUnderReview ? "bg-amber-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-600">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-900 block">
                          {inv.customerName}
                        </span>
                        {inv.customerCompany && (
                          <span className="text-[11px] text-slate-500 block">
                            {inv.customerCompany}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {inv.billingMonth}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-medium text-slate-700">
                        Rp {inv.subtotal.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3.5 px-3">
                        {inv.penaltyFee > 0 ? (
                          <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                            +Rp {inv.penaltyFee.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Rp 0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900 text-xs">
                        Rp {inv.totalAmount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {new Date(inv.dueDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-3">
                        {isPaid ? (
                          <Badge variant="success" className="text-[10.5px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Paid</span>
                          </Badge>
                        ) : isUnderReview ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10.5px] flex items-center gap-1 w-fit animate-pulse">
                            <Hourglass className="h-3 w-3" />
                            <span>Under Review</span>
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="text-[10.5px] flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Overdue (+5%)</span>
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10.5px] w-fit">
                            Unpaid
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {isUnderReview ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenReview(inv)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8 px-3 shadow-sm flex items-center gap-1 ml-auto"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Review Payment</span>
                          </Button>
                        ) : isPaid ? (
                          <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-300 font-mono">
                            {inv.receiptNumber || "Settled"}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting Payment</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </SectionCard>

      {/* Payment Review & Verification Modal */}
      {selectedInvoiceToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payment Review & Verification
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Invoice #{selectedInvoiceToReview.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceToReview(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Invoice & Payment Metadata Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <strong className="text-slate-900">{selectedInvoiceToReview.customerName}</strong>
              </div>
              {selectedInvoiceToReview.customerCompany && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Company:</span>
                  <span className="text-slate-800 font-medium">{selectedInvoiceToReview.customerCompany}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-mono text-slate-900">{selectedInvoiceToReview.paymentMethod || "Bank Transfer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Obligation Due:</span>
                <strong className="font-mono text-emerald-700 text-sm">
                  Rp {selectedInvoiceToReview.totalAmount.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>

            {/* Payment Proof Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Submitted Payment Proof (Transfer Slip):</span>
                {selectedInvoiceToReview.paymentProofUrl && (
                  <button
                    type="button"
                    onClick={() => setZoomedProofUrl(selectedInvoiceToReview.paymentProofUrl || null)}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Zoom In Full</span>
                  </button>
                )}
              </div>
              <div
                onClick={() => setZoomedProofUrl(selectedInvoiceToReview.paymentProofUrl || null)}
                className="cursor-pointer border border-slate-200 rounded-xl overflow-hidden bg-slate-100 h-44 flex items-center justify-center relative group"
              >
                {selectedInvoiceToReview.paymentProofUrl ? (
                  <>
                    <img
                      src={selectedInvoiceToReview.paymentProofUrl}
                      alt="Transfer Proof"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Click to view full size</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">No Proof Image Uploaded</span>
                )}
              </div>
            </div>

            {/* Reject Form (Conditional) */}
            {isRejecting ? (
              <form onSubmit={handleReject} className="space-y-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>Specify Rejection Reason (Mandatory)</span>
                </div>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Bukti transfer tidak terbaca / nominal tidak sesuai / mutasi rekening belum masuk"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 bg-white border border-rose-300 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRejecting(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyPaymentMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-4"
                  >
                    {verifyPaymentMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </div>
              </form>
            ) : (
              /* Action Buttons */
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRejecting(true)}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold h-9 px-4 flex items-center gap-1.5"
                >
                  <Ban className="h-4 w-4" />
                  <span>Reject Payment</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifyPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-5 flex items-center gap-1.5 shadow-sm"
                >
                  {verifyPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Approve & Verify Payment</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zoom Full Proof Image Modal */}
      {zoomedProofUrl && (
        <div
          onClick={() => setZoomedProofUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl p-2 shadow-2xl">
            <button
              onClick={() => setZoomedProofUrl(null)}
              className="absolute top-4 right-4 bg-slate-900 text-white p-1.5 rounded-full hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={zoomedProofUrl}
              alt="Zoomed Payment Proof"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
