"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Calendar,
  Search,
  Filter,
  Download,
  CheckCircle2,
  FileText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MutationLog {
  id: string;
  type: "INBOUND" | "OUTBOUND";
  refDocNumber: string;
  sku: string;
  itemName: string;
  quantityKoli: number;
  volumeM3: number;
  slotCode: string;
  picName: string;
  timestamp: string;
}

const MUTATION_LOGS: MutationLog[] = [
  {
    id: "mut-1",
    type: "OUTBOUND",
    refDocNumber: "DO-2026-001",
    sku: "BAR-FRESH-001",
    itemName: "Import Wagyu Beef Ribeye A5",
    quantityKoli: 50,
    volumeM3: 25,
    slotCode: "A-01-01",
    picName: "Ahmad Subarjo (Driver)",
    timestamp: "Aug 16, 2026, 08:15 WIB",
  },
  {
    id: "mut-2",
    type: "INBOUND",
    refDocNumber: "PO-2026-9912",
    sku: "BAR-FRESH-002",
    itemName: "Premium Norwegian Salmon Fillet",
    quantityKoli: 45,
    volumeM3: 22.5,
    slotCode: "A-01-02",
    picName: "Budianto (Warehouse Admin)",
    timestamp: "Aug 15, 2026, 14:30 WIB",
  },
  {
    id: "mut-3",
    type: "INBOUND",
    refDocNumber: "PO-2026-9801",
    sku: "BAR-FRESH-001",
    itemName: "Import Wagyu Beef Ribeye A5",
    quantityKoli: 100,
    volumeM3: 50,
    slotCode: "A-01-01",
    picName: "Hendra Wijaya (Admin)",
    timestamp: "Aug 10, 2026, 10:00 WIB",
  },
];

export default function CustomerMutationHistoryPage() {
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = MUTATION_LOGS.filter((log) => {
    const matchType = filterType === "ALL" || log.type === filterType;
    const matchSearch =
      log.refDocNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inventory Mutation History & Audit Trail
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px]">
              Audit Log
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Historical log of all inbound stock receipts and outbound dispatches from your warehouse storage space.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Mutation Log</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Mutations
            </button>
            <button
              onClick={() => setFilterType("INBOUND")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "INBOUND"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Inbound Stock
            </button>
            <button
              onClick={() => setFilterType("OUTBOUND")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === "OUTBOUND"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Outbound Stock
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference number, SKU, or goods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3">Mutation Type</th>
                <th className="py-3 px-3">Document / Ref No.</th>
                <th className="py-3 px-3">SKU & Goods Name</th>
                <th className="py-3 px-3">Quantity & Volume</th>
                <th className="py-3 px-3">Rack Slot</th>
                <th className="py-3 px-3">PIC Staff</th>
                <th className="py-3 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3">
                    {log.type === "INBOUND" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                        Inbound (In)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                        Outbound (Out)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-900 block text-xs">
                      {log.refDocNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block">
                      {log.itemName}
                    </span>
                    <span className="font-mono text-[10.5px] text-indigo-600 font-bold">
                      {log.sku}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 block font-mono">
                      {log.quantityKoli} Packages
                    </span>
                    <span className="text-[10.5px] text-slate-400">
                      {log.volumeM3} m³
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.slotCode}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-slate-700 block">{log.picName}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {log.timestamp}
                    </span>
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
