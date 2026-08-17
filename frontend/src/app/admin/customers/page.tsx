"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Phone,
  Mail,
  Warehouse,
  Boxes,
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CustomerRecord {
  id: string;
  companyName: string;
  picName: string;
  email: string;
  phone: string;
  address: string;
  storageType: "COLD_STORAGE" | "STANDARD" | "MULTI_ZONE";
  rentedSpaceM3: number;
  storedItemsCount: number;
  monthlyBillingRp: number;
  paymentStatus: "PAID" | "PENDING" | "OVERDUE";
  contractValidUntil: string;
}

const CUSTOMERS_DATA: CustomerRecord[] = [
  {
    id: "cust-1",
    companyName: "PT Fresh Foods Indonesia",
    picName: "Hendra Prasetya",
    email: "customer@freshfoods.id",
    phone: "0812-9988-7766",
    address: "Jl. Industri Raya No. 45, West Jakarta",
    storageType: "COLD_STORAGE",
    rentedSpaceM3: 250,
    storedItemsCount: 450,
    monthlyBillingRp: 12500000,
    paymentStatus: "PAID",
    contractValidUntil: "31 Dec 2026",
  },
  {
    id: "cust-2",
    companyName: "CV Furnitur Nusantara",
    picName: "Bambang Wijaya",
    email: "bambang@furniturnusantara.co.id",
    phone: "0813-1122-3344",
    address: "Kawasan Industri Mebel Blok C-2, Jepara",
    storageType: "STANDARD",
    rentedSpaceM3: 300,
    storedItemsCount: 120,
    monthlyBillingRp: 15000000,
    paymentStatus: "OVERDUE",
    contractValidUntil: "30 Nov 2026",
  },
  {
    id: "cust-3",
    companyName: "PT Sumber Frozen Makmur",
    picName: "Dewi Lestari",
    email: "dewi@sumberfrozen.com",
    phone: "0811-5566-7788",
    address: "Jl. Muara Baru No. 12, North Jakarta",
    storageType: "COLD_STORAGE",
    rentedSpaceM3: 150,
    storedItemsCount: 190,
    monthlyBillingRp: 7500000,
    paymentStatus: "PAID",
    contractValidUntil: "15 Jan 2027",
  },
  {
    id: "cust-4",
    companyName: "PT Logistik Indo Perkasa",
    picName: "Surya Dharma",
    email: "surya@logistikindo.co.id",
    phone: "0817-4433-2211",
    address: "Gedung Cyber 2 Lt. 14, South Jakarta",
    storageType: "MULTI_ZONE",
    rentedSpaceM3: 200,
    storedItemsCount: 95,
    monthlyBillingRp: 10000000,
    paymentStatus: "PAID",
    contractValidUntil: "28 Feb 2027",
  },
];

export default function CustomerManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredCustomers = CUSTOMERS_DATA.filter((cust) => {
    const matchStatus =
      statusFilter === "ALL" || cust.paymentStatus === statusFilter;
    const matchSearch =
      cust.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalRentedM3 = CUSTOMERS_DATA.reduce((acc, c) => acc + c.rentedSpaceM3, 0);
  const totalRevenue = CUSTOMERS_DATA.reduce((acc, c) => acc + c.monthlyBillingRp, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Customer & Warehouse Tenant Directory
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px]">
              Active Tenants
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            List of warehouse leasing tenant companies, volume usage (m³), and monthly billing statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Data</span>
          </Button>

          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Add New Customer</span>
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Active Customers</span>
          <p className="text-2xl font-extrabold text-slate-900">{CUSTOMERS_DATA.length} Companies</p>
          <p className="text-[11px] text-slate-400">Verified lease contracts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Rented Space</span>
          <p className="text-2xl font-extrabold text-indigo-600">{totalRentedM3} m³</p>
          <p className="text-[11px] text-slate-400 font-mono">Cold & Standard Storage</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Rental Revenue</span>
          <p className="text-2xl font-extrabold text-slate-900">
            IDR {(totalRevenue / 1000000).toFixed(1)} M
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>75% Invoices Paid</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500">Payment Status</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-rose-600">1 Overdue</p>
            <span className="text-xs text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-semibold">
              + Late Fee
            </span>
          </div>
          <p className="text-[11px] text-slate-400">CV Furnitur Nusantara</p>
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
              All Customers ({CUSTOMERS_DATA.length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "PAID"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Invoices Paid
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "OVERDUE"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Overdue Invoices
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, PIC, or email..."
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
                <th className="py-3 px-3">Company Name & PIC</th>
                <th className="py-3 px-3">Contact & Email</th>
                <th className="py-3 px-3">Storage Type & Space</th>
                <th className="py-3 px-3">Stored Goods</th>
                <th className="py-3 px-3">Monthly Billing</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3">Contract Until</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Company & PIC */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8.5 w-8.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {cust.companyName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          PIC: {cust.picName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-800 font-mono block">
                      {cust.phone}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block">
                      {cust.email}
                    </span>
                  </td>

                  {/* Storage Type & M3 */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-indigo-600 block font-mono">
                      {cust.rentedSpaceM3} m³
                    </span>
                    <span className="text-[10.5px] text-slate-500 block">
                      {cust.storageType === "COLD_STORAGE"
                        ? "Cold Storage (-18°C)"
                        : cust.storageType === "STANDARD"
                        ? "Standard Dry"
                        : "Multi-Zone Storage"}
                    </span>
                  </td>

                  {/* Stored Items */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block">
                      {cust.storedItemsCount} Packages
                    </span>
                  </td>

                  {/* Monthly Bill */}
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-900 block">
                      IDR {cust.monthlyBillingRp.toLocaleString("en-US")}
                    </span>
                    <span className="text-[10px] text-slate-400">/ month</span>
                  </td>

                  {/* Payment Status */}
                  <td className="py-3.5 px-3">
                    {cust.paymentStatus === "PAID" ? (
                      <Badge variant="success" className="text-[10.5px]">
                        Paid
                      </Badge>
                    ) : cust.paymentStatus === "OVERDUE" ? (
                      <Badge variant="destructive" className="text-[10.5px]">
                        Overdue (+Late Fee)
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10.5px]">
                        Pending
                      </Badge>
                    )}
                  </td>

                  {/* Contract */}
                  <td className="py-3.5 px-3">
                    <span className="text-slate-700 font-mono text-[11px]">
                      {cust.contractValidUntil}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <Link href="/admin/billing">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                      >
                        Invoices →
                      </Button>
                    </Link>
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
