"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Hourglass,
  Download,
  Calendar,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Plus,
  QrCode,
  X,
  ExternalLink,
  Printer,
  Loader2,
  Copy,
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
import { useInvoices, usePayInvoice } from "@/hooks/use-billing";
import { useAuth } from "@/hooks/use-auth";
import { Invoice, PaymentMethod } from "@/types";
import { toast } from "sonner";

export default function CustomerBillingPage() {
  const { user } = useAuth();
  const { data: liveInvoices = [], isLoading } = useInvoices(user?.id);
  const payInvoiceMutation = usePayInvoice();

  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<Invoice | null>(null);
  const [selectedProofPreview, setSelectedProofPreview] = useState<string | null>(null);

  // Form State for Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState(
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"
  );
  const [paymentNotes, setPaymentNotes] = useState("");

  const handleOpenPay = (inv: Invoice) => {
    setSelectedInvoiceForPay(inv);
    setPaymentReference(`TRX-${Date.now().toString().slice(-8)}`);
    setPaymentNotes("");
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    try {
      await payInvoiceMutation.mutateAsync({
        invoiceId: selectedInvoiceForPay.id,
        method: paymentMethod,
        proofUrl: paymentProofUrl,
        amount: selectedInvoiceForPay.totalAmount,
        paymentReference: paymentReference || `TRX-${Date.now().toString().slice(-8)}`,
        notes: paymentNotes || "WMS space rental payment",
      });

      toast.success("Payment Submitted Successfully", {
        description:
          "Your payment is currently under review by the administrator. Please allow up to 1x24 hours for verification.",
      });
      setSelectedInvoiceForPay(null);
    } catch (err: any) {
      toast.error("Payment Submission Failed", {
        description: err?.message || "Please check your network and try again.",
      });
    }
  };

  const paidInvoicesList = liveInvoices.filter((i) => i.status === "PAID");
  const pendingInvoicesList = liveInvoices.filter(
    (i) => i.status === "PENDING_PAYMENT"
  );
  const unpaidInvoicesList = liveInvoices.filter(
    (i) => i.status === "UNPAID" || i.status === "OVERDUE"
  );

  const totalPaid = paidInvoicesList.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPendingVerification = pendingInvoicesList.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalUnpaid = unpaidInvoicesList.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPenalty = liveInvoices.reduce((acc, i) => acc + i.penaltyFee, 0);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Invoices & Billing"
        title="Rental Invoices & Payment Settlement"
        subtitle="Official warehouse space rental invoices, bank transfer proof submissions, and verified payment receipts."
        badgeText={user?.companyName || user?.name || "Customer Account"}
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/rental">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                <span>Rent Additional Space</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Settled (Paid)"
          value={`Rp ${totalPaid.toLocaleString("id-ID")}`}
          icon={Receipt}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Verified
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              {paidInvoicesList.length} Invoices Settled
            </span>
          }
        />

        <MetricCard
          label="Under Admin Review"
          value={`Rp ${totalPendingVerification.toLocaleString("id-ID")}`}
          icon={Hourglass}
          theme="amber"
          badge={
            pendingInvoicesList.length > 0 ? (
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                In Review
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-amber-700 font-medium">
              {pendingInvoicesList.length} Payments in Verification Queue
            </span>
          }
        />

        <MetricCard
          label="Payment Required (Unpaid)"
          value={`Rp ${totalUnpaid.toLocaleString("id-ID")}`}
          icon={CreditCard}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              {unpaidInvoicesList.length} Invoices Outstanding
            </span>
          }
        />

        <MetricCard
          label="Late Penalty Surcharges"
          value={`Rp ${totalPenalty.toLocaleString("id-ID")}`}
          icon={AlertTriangle}
          theme={totalPenalty > 0 ? "rose" : "indigo"}
          subtext={
            <span className="text-[11px] text-slate-400">
              {totalPenalty > 0 ? "Deterministic 5%/week overdue fee" : "All accounts in good standing"}
            </span>
          }
        />
      </div>

      {/* 3. Main Invoices Table Card */}
      <SectionCard
        title="Rental Invoice Directory & Status"
        subtitle="Review individual invoice line items, submit payment proof, and access official receipts"
        icon={Receipt}
      >
        <div className="space-y-4">

        {liveInvoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5]" />
            <div>
              <p className="text-sm font-bold text-slate-700">No Invoices Found</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                You do not have any storage space rental invoices yet. Rent warehouse space to get started.
              </p>
            </div>
            <Link href="/customer/rental" className="inline-block pt-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4">
                + Rent Warehouse Space
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Invoice No.</th>
                  <th className="py-3 px-3">Period & Storage Plan</th>
                  <th className="py-3 px-3">Base Subtotal</th>
                  <th className="py-3 px-3">Late Fee</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Invoice & Payment Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveInvoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  const isPending = inv.status === "PENDING_PAYMENT";
                  const isOverdue = inv.status === "OVERDUE";
                  const isRejected =
                    Boolean(inv.latestRejectionReason) && inv.status !== "PAID" && inv.status !== "PENDING_PAYMENT";

                  return (
                    <React.Fragment key={inv.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-indigo-600 block text-xs">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {new Date(inv.issueDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-900 block">
                            {inv.billingMonth}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {inv.items?.[0]?.description || "Warehouse Space Rental"}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-mono font-medium text-slate-800">
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
                            <div className="flex items-center gap-1.5">
                              <Badge variant="success" className="text-[10.5px] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Paid & Verified</span>
                              </Badge>
                            </div>
                          ) : isPending ? (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10.5px] flex items-center gap-1">
                                <Hourglass className="h-3 w-3" />
                                <span>Under Review</span>
                              </Badge>
                            </div>
                          ) : isOverdue ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="destructive" className="text-[10.5px] flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Overdue</span>
                              </Badge>
                            </div>
                          ) : isRejected ? (
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10.5px]">
                                Rejected — Resubmit
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="warning" className="text-[10.5px]">
                              Payment Required
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          {isPaid ? (
                            <Button
                              size="sm"
                              onClick={() => setSelectedInvoiceForReceipt(inv)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold h-8 px-3"
                            >
                              <Receipt className="h-3.5 w-3.5 mr-1" />
                              <span>View Receipt</span>
                            </Button>
                          ) : isPending ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProofPreview(inv.paymentProofUrl || null)}
                              className="border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-semibold h-8 px-3"
                            >
                              <Hourglass className="h-3.5 w-3.5 mr-1" />
                              <span>Reviewing...</span>
                            </Button>
                          ) : isRejected ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPay(inv)}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-3"
                            >
                              <span>Resubmit Payment</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPay(inv)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-3"
                            >
                              <span>Pay Invoice →</span>
                            </Button>
                          )}
                        </td>
                      </tr>

                      {/* Rejection Alert Banner Row if Rejected */}
                      {isRejected && inv.latestRejectionReason && (
                        <tr className="bg-rose-50/70 border-b border-rose-200">
                          <td colSpan={8} className="py-2.5 px-4 text-xs">
                            <div className="flex items-center gap-2 text-rose-800 font-medium">
                              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                              <span>
                                <strong>Admin Rejection Note:</strong> &ldquo;{inv.latestRejectionReason}&rdquo;. Please click &ldquo;Resubmit Payment&rdquo; to upload a valid transfer receipt.
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </SectionCard>

      {/* Payment Submission Modal */}
      {selectedInvoiceForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pay Invoice #{selectedInvoiceForPay.invoiceNumber}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Total Due: Rp {selectedInvoiceForPay.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceForPay(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Select Payment Destination Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === "BANK_TRANSFER"
                        ? "border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs block">Bank Transfer</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">BCA 8820-1928-3901</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("VIRTUAL_ACCOUNT")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === "VIRTUAL_ACCOUNT"
                        ? "border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs block">Virtual Account</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Mandiri VA WMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("QRIS")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === "QRIS"
                        ? "border-emerald-600 bg-emerald-50/50 font-bold text-emerald-950 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-xs block">QRIS Dynamic</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Instant Barcode</span>
                  </button>
                </div>
              </div>

              {/* Bank Account Info Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Destination Account:</span>
                  <strong className="font-mono text-slate-900">
                    {paymentMethod === "BANK_TRANSFER"
                      ? "BCA: 8820-1928-3901 (PT WMS Nusantara)"
                      : paymentMethod === "VIRTUAL_ACCOUNT"
                      ? "Mandiri VA: 8801-9283-4819-2019"
                      : "QRIS WMS Central Hub"}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Exact Transfer Amount:</span>
                  <strong className="font-mono text-emerald-700 text-sm">
                    Rp {selectedInvoiceForPay.totalAmount.toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>

              {/* Transaction Reference Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Reference / Mutation Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX-BCA-8891230192"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-indigo-600 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* Payment Proof URL / Upload Simulation */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Transfer Slip / Payment Proof Image URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://..."
                  value={paymentProofUrl}
                  onChange={(e) => setPaymentProofUrl(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Provide an image URL or transfer receipt screenshot to submit for admin review.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pembayaran sewa gudang Cold Storage periode Agustus"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <Hourglass className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  After clicking submit, your payment will be placed in the <strong>Under Review</strong> queue. Admin will verify bank mutations before the invoice becomes PAID.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoiceForPay(null)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={payInvoiceMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-5 flex items-center gap-1.5"
                >
                  {payInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Payment...</span>
                    </>
                  ) : (
                    <span>Submit Payment Proof</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 print:p-0 print:border-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Official Payment Receipt
                  </h3>
                  <p className="text-[10px] font-mono text-emerald-700 font-bold">
                    WMS Nusantara Financial Settlement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceForReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Official Receipt Card */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">RECEIPT NUMBER</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">
                    {selectedInvoiceForReceipt.receiptNumber || `REC-202608-${selectedInvoiceForReceipt.id.slice(0, 4).toUpperCase()}`}
                  </span>
                </div>
                <div className="text-right">
                  <Badge variant="success" className="text-[10px]">
                    SETTLED & VERIFIED
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <strong className="font-mono text-slate-900">{selectedInvoiceForReceipt.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">{selectedInvoiceForReceipt.customerName}</span>
                </div>
                {selectedInvoiceForReceipt.customerCompany && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Company:</span>
                    <span className="font-semibold text-slate-900">{selectedInvoiceForReceipt.customerCompany}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Period:</span>
                  <span className="text-slate-900 font-medium">{selectedInvoiceForReceipt.billingMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-mono text-slate-900">{selectedInvoiceForReceipt.paymentMethod || "Bank Transfer"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Date:</span>
                  <span className="font-mono text-slate-900">
                    {selectedInvoiceForReceipt.paidDate
                      ? new Date(selectedInvoiceForReceipt.paidDate).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Verified"}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Base Subtotal:</span>
                  <span className="font-mono">Rp {selectedInvoiceForReceipt.subtotal.toLocaleString("id-ID")}</span>
                </div>
                {selectedInvoiceForReceipt.penaltyFee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Late Fee Penalty:</span>
                    <span className="font-mono">+Rp {selectedInvoiceForReceipt.penaltyFee.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 text-sm font-bold pt-1 border-t border-slate-200/60">
                  <span>Total Paid:</span>
                  <span className="font-mono text-emerald-700">Rp {selectedInvoiceForReceipt.totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Verified Stamp */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>VERIFIED BY WMS FINANCE ADMINISTRATION</span>
                </div>
                <p className="text-[9.5px] text-emerald-700/80 mt-0.5 font-mono">
                  Digital Settlement Signature • Valid Tax & Ledger Proof
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoiceForReceipt(null)}
                className="w-full text-xs h-9"
              >
                Close
              </Button>
              <Button
                onClick={() => window.print()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Preview Dialog */}
      {selectedProofPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-sm font-bold text-slate-900">Submitted Payment Proof</h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-64 flex items-center justify-center">
              <img
                src={selectedProofPreview}
                alt="Payment Proof"
                className="max-h-64 object-contain w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedProofPreview(null)}
              className="w-full text-xs h-9"
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
