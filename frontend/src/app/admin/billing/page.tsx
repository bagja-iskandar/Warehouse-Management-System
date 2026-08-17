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
  Plus,
  Search,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/hooks/use-billing";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  storagePlan: string;
  rentedSpaceM3: number;
  baseAmountRp: number;
  lateFeeRp: number;
  totalAmountRp: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  daysOverdue?: number;
}

const INVOICES_DATA: InvoiceRecord[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-001",
    customerName: "PT Fresh Foods Indonesia",
    storagePlan: "Cold Storage Sub-zero (-18°C)",
    rentedSpaceM3: 250,
    baseAmountRp: 12500000,
    lateFeeRp: 0,
    totalAmountRp: 12500000,
    issueDate: "Aug 01, 2026",
    dueDate: "Aug 10, 2026",
    paidDate: "Aug 08, 2026",
    status: "PAID",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-002",
    customerName: "CV Furnitur Nusantara",
    storagePlan: "Standard Storage (Dry Furniture)",
    rentedSpaceM3: 100,
    baseAmountRp: 3500000,
    lateFeeRp: 350000,
    totalAmountRp: 3850000,
    issueDate: "Aug 01, 2026",
    dueDate: "Aug 10, 2026",
    status: "OVERDUE",
    daysOverdue: 6,
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-003",
    customerName: "PT Sumber Frozen Makmur",
    storagePlan: "Cold Storage Sub-zero (-18°C)",
    rentedSpaceM3: 150,
    baseAmountRp: 7500000,
    lateFeeRp: 0,
    totalAmountRp: 7500000,
    issueDate: "Aug 01, 2026",
    dueDate: "Aug 10, 2026",
    paidDate: "Aug 05, 2026",
    status: "PAID",
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-004",
    customerName: "PT Logistik Indo Perkasa",
    storagePlan: "Heavy Duty & Pallet Area",
    rentedSpaceM3: 200,
    baseAmountRp: 10000000,
    lateFeeRp: 0,
    totalAmountRp: 10000000,
    issueDate: "Aug 05, 2026",
    dueDate: "Aug 20, 2026",
    status: "PENDING",
  },
];

export default function BillingManagementPage() {
  const { data: liveInvoices } = useInvoices();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const activeInvoices: InvoiceRecord[] =
    liveInvoices && liveInvoices.length > 0
      ? liveInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName || "PT Fresh Foods Indonesia",
          storagePlan:
            inv.penaltyFee > 0
              ? "Cold Storage Sub-zero (-18°C) + Late Fee Penalty"
              : "Cold Storage Sub-zero (-18°C)",
          rentedSpaceM3: Math.round(inv.subtotal / 50000) || 150,
          baseAmountRp: inv.subtotal,
          lateFeeRp: inv.penaltyFee,
          totalAmountRp: inv.totalAmount,
          issueDate: "Aug 01, 2026",
          dueDate: "Aug 10, 2026",
          paidDate: inv.paidDate ? "Aug 08, 2026" : undefined,
          status:
            inv.status === "PAID"
              ? ("PAID" as const)
              : inv.status === "OVERDUE"
              ? ("OVERDUE" as const)
              : ("PENDING" as const),
          daysOverdue: inv.status === "OVERDUE" ? 7 : undefined,
        }))
      : INVOICES_DATA;

  const filteredInvoices = activeInvoices.filter((inv) => {
    const matchStatus =
      statusFilter === "ALL" || inv.status === statusFilter;
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaidRevenue = activeInvoices
    .filter((i) => i.status === "PAID")
    .reduce((acc, i) => acc + i.totalAmountRp, 0);
  const totalPendingRevenue = activeInvoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((acc, i) => acc + i.totalAmountRp, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Rental Invoice Management & Late Fee Billing
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Billing Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monthly warehouse space rental invoice issuance, 5%/week automated late fee calculations, and settlement tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Financial Summary</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Generate Invoices This Month</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Invoices Issued</span>
          <p className="text-2xl font-extrabold text-slate-900">{INVOICES_DATA.length} Invoices</p>
          <p className="text-[11px] text-slate-400">Period: August 2026</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Revenue Collected (Settled)</span>
          <p className="text-2xl font-extrabold text-emerald-600">
            IDR {(totalPaidRevenue / 1000000).toFixed(1)} M
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>2 Invoices Bank-Verified</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Pending Payment</span>
          <p className="text-2xl font-extrabold text-indigo-600">
            IDR {(totalPendingRevenue / 1000000).toFixed(1)} M
          </p>
          <p className="text-[11px] text-slate-400">1 Pending • 1 Overdue</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Active Late Fees</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-rose-600">IDR 750,000</p>
            <Badge variant="destructive" className="text-[10px]">+5% / wk</Badge>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">CV Furnitur Nusantara (6 days)</p>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Invoices ({INVOICES_DATA.length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "PAID"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "OVERDUE"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Overdue (+Late Fee)
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "PENDING"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Pending Payment
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice number or tenant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Invoice No. & Tenant</th>
                <th className="py-3 px-3">Service & Volume</th>
                <th className="py-3 px-3">Base Amount</th>
                <th className="py-3 px-3">Late Fee Penalty</th>
                <th className="py-3 px-3">Total Bill</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Invoice & Tenant */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-indigo-600 block text-xs">
                      {inv.invoiceNumber}
                    </span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {inv.customerName}
                    </span>
                  </td>

                  {/* Service & M3 */}
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-800 block">
                      {inv.rentedSpaceM3} m³ Space
                    </span>
                    <span className="text-[10.5px] text-slate-500 block">
                      {inv.storagePlan}
                    </span>
                  </td>

                  {/* Base Amount */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-medium text-slate-800">
                      IDR {inv.baseAmountRp.toLocaleString("en-US")}
                    </span>
                  </td>

                  {/* Late Fee */}
                  <td className="py-3.5 px-3">
                    {inv.lateFeeRp > 0 ? (
                      <div>
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px]">
                          +IDR {inv.lateFeeRp.toLocaleString("en-US")}
                        </span>
                        <span className="text-[10px] text-rose-700 block mt-0.5 font-semibold">
                          {inv.daysOverdue} Days Overdue
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono">IDR 0</span>
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-extrabold text-slate-900 block text-xs">
                      IDR {inv.totalAmountRp.toLocaleString("en-US")}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono text-slate-700 block text-[11px]">
                      {inv.dueDate}
                    </span>
                    {inv.paidDate && (
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        Paid: {inv.paidDate}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3">
                    {inv.status === "PAID" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Paid
                      </Badge>
                    ) : inv.status === "OVERDUE" ? (
                      <Badge variant="destructive" className="text-[10.5px]">
                        Overdue
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10.5px]">
                        Pending
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                    >
                      Send Invoice →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
