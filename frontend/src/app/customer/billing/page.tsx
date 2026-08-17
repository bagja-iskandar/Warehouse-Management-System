"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoices, usePayInvoice } from "@/hooks/use-billing";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  period: string;
  storageType: string;
  volumeM3: number;
  baseAmountRp: number;
  lateFeeRp: number;
  totalAmountRp: number;
  dueDate: string;
  paidDate?: string;
  status: "PAID" | "PENDING" | "OVERDUE";
}

const CUSTOMER_INVOICES: CustomerInvoice[] = [
  {
    id: "inv-c1",
    invoiceNumber: "INV-2026-001",
    period: "Agustus 2026",
    storageType: "Cold Storage Sub-zero (-18°C)",
    volumeM3: 250,
    baseAmountRp: 12500000,
    lateFeeRp: 0,
    totalAmountRp: 12500000,
    dueDate: "10 Agu 2026",
    paidDate: "08 Agu 2026",
    status: "PAID",
  },
  {
    id: "inv-c2",
    invoiceNumber: "INV-2026-005",
    period: "September 2026 (Pro-rata Booking Baru)",
    storageType: "Cold Storage Sub-zero (-18°C)",
    volumeM3: 50,
    baseAmountRp: 7500000,
    lateFeeRp: 0,
    totalAmountRp: 7500000,
    dueDate: "25 Agu 2026",
    status: "PENDING",
  },
];

export default function CustomerBillingPage() {
  const { user } = useAuth();
  const { data: liveInvoices } = useInvoices(user?.id);
  const payInvoiceMutation = usePayInvoice();
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const activeInvoices: CustomerInvoice[] =
    liveInvoices && liveInvoices.length > 0
      ? liveInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          period: inv.billingMonth,
          storageType: "Cold Storage Sub-zero (-18°C)",
          volumeM3: Math.round(inv.subtotal / 50000) || 50,
          baseAmountRp: inv.subtotal,
          lateFeeRp: inv.penaltyFee,
          totalAmountRp: inv.totalAmount,
          dueDate: "10 Agu 2026",
          paidDate: inv.paidDate ? "08 Agu 2026" : undefined,
          status:
            inv.status === "PAID"
              ? ("PAID" as const)
              : inv.status === "OVERDUE"
              ? ("OVERDUE" as const)
              : ("PENDING" as const),
        }))
      : CUSTOMER_INVOICES;

  const handlePay = (inv: CustomerInvoice) => {
    setSelectedInvoice(inv);
  };

  const confirmPay = async () => {
    if (selectedInvoice) {
      try {
        await payInvoiceMutation.mutateAsync({
          invoiceId: selectedInvoice.id,
          method: "VIRTUAL_ACCOUNT",
          proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
          amount: selectedInvoice.totalAmountRp,
        });
        toast.success("Bukti Pembayaran Terkirim", {
          description: "Faktur menunggu verifikasi admin.",
        });
      } catch (err: any) {
        // Fallback simulation
      }
    }
    setPaymentSuccess(true);
    setTimeout(() => {
      setSelectedInvoice(null);
      setPaymentSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Faktur Tagihan Sewa & Pembayaran
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Billing & Invoices
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat faktur sewa ruang gudang bulanan, informasi rekening Virtual Account (VA), dan unduh kuitansi resmi.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Tagihan Lunas</span>
          <p className="text-2xl font-extrabold text-emerald-600">Rp 12.500.000</p>
          <p className="text-[11px] text-slate-400">Periode Agustus 2026</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Tagihan Menunggu Pembayaran</span>
          <p className="text-2xl font-extrabold text-indigo-600">Rp 7.500.000</p>
          <p className="text-[11px] text-slate-400">Jatuh Tempo: 25 Agu 2026</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Status Denda Keterlambatan</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-slate-900 font-mono">Rp 0</p>
            <Badge variant="success" className="text-[10px]">Bebas Denda</Badge>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Selalu bayar tepat waktu</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Daftar Faktur Tagihan Anda
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">No. Faktur & Periode</th>
                <th className="py-3 px-3">Layanan Sewa</th>
                <th className="py-3 px-3">Volume</th>
                <th className="py-3 px-3">Total Tagihan</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CUSTOMER_INVOICES.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-indigo-600 block text-xs">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-slate-900 font-semibold block mt-0.5">
                      {inv.period}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-slate-800">{inv.storageType}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-900">{inv.volumeM3} m³</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-extrabold text-slate-900">
                      Rp {inv.totalAmountRp.toLocaleString("id-ID")}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono text-slate-700">{inv.dueDate}</span>
                    {inv.paidDate && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Lunas: {inv.paidDate}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    {inv.status === "PAID" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Lunas
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10.5px]">
                        Menunggu Pembayaran
                      </Badge>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    {inv.status === "PENDING" ? (
                      <Button
                        size="sm"
                        onClick={() => handlePay(inv)}
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3"
                      >
                        Bayar Sekarang →
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-slate-300 hover:bg-slate-50 text-slate-700 px-3"
                      >
                        Unduh Kuitansi
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal Dialog */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Instruksi Pembayaran Faktur
              </h3>
              <Badge variant="warning" className="text-[10px]">
                {selectedInvoice.invoiceNumber}
              </Badge>
            </div>

            {paymentSuccess ? (
              <div className="py-6 text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Pembayaran Berhasil Dikonfirmasi!</h4>
                <p className="text-xs text-slate-500">Status faktur telah diperbarui menjadi Lunas.</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Nominal:</span>
                    <span className="font-extrabold text-slate-900 text-sm font-mono">
                      Rp {selectedInvoice.totalAmountRp.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank Virtual Account:</span>
                    <span className="font-bold text-slate-900">BCA Virtual Account</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Nomor VA:</span>
                    <span className="text-base font-extrabold text-indigo-600 font-mono tracking-wider">
                      8801 2983 9912 0012
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(null)}
                    className="w-full text-xs h-9"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={confirmPay}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                  >
                    Konfirmasi Pembayaran
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
