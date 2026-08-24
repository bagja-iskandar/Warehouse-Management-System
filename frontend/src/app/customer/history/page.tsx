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
  Plus,
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
import { useGoodsMutations } from "@/hooks/use-goods";
import { useAuth } from "@/hooks/use-auth";

export default function CustomerMutationHistoryPage() {
  const { user } = useAuth();
  const { data: liveMutations = [], isLoading, refetch, isFetching } = useGoodsMutations(user?.id);
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = liveMutations.filter((log) => {
    const matchType = filterType === "ALL" || log.type === filterType;
    const matchSearch =
      (log.sku && log.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.itemName && log.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.title && log.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.slotCode && log.slotCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const inboundCount = liveMutations.filter((m) => m.type === "INBOUND").length;
  const outboundCount = liveMutations.filter((m) => m.type === "OUTBOUND").length;
  const totalPackagesMoved = liveMutations.reduce((acc, m) => acc + (m.quantityKoli || 0), 0);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > History & Audit"
        title="Inventory Mutation History & Audit Trail"
        subtitle="Historical log of all inbound stock receipts and outbound dispatches from your warehouse storage space."
        badgeText="Live Audit Log"
        badgeColor="bg-emerald-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Mutation Log</span>
            </Button>
          </div>
        }
      />

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Mutation Events"
          value={`${liveMutations.length} Events`}
          icon={History}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              Immutable ledger trail
            </span>
          }
        />

        <MetricCard
          label="Inbound Intake Records"
          value={`${inboundCount} Inbound`}
          icon={ArrowDownLeft}
          theme="emerald"
          subtext={
            <span className="text-[11px] text-slate-400">
              Goods receipts & dock put-away
            </span>
          }
        />

        <MetricCard
          label="Outbound Dispatches"
          value={`${outboundCount} Dispatched`}
          icon={ArrowUpRight}
          theme="amber"
          subtext={
            <span className="text-[11px] text-slate-400">
              Customer outbound fulfillment
            </span>
          }
        />

        <MetricCard
          label="Total Packages Moved"
          value={`${totalPackagesMoved} Pkgs`}
          icon={Boxes}
          theme="purple"
          subtext={
            <span className="text-[11px] text-slate-400">
              Cumulative physical cargo volume
            </span>
          }
        />
      </div>

      {/* 3. Main Table Card & Filters */}
      <SectionCard
        title="Physical Inventory Movement & Mutation Log"
        subtitle="Real-time audit records of all stock movements, rack slot assignments, and fulfillment dispatches"
        icon={History}
      >
        <div className="space-y-4">
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
                All Mutations ({liveMutations.length})
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
                Outbound Shipments
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, name, slot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No Movement Logs Recorded"
              description="No inventory mutations match your selected filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">SKU & Item Name</th>
                    <th className="py-3 px-3">Transaction Description</th>
                    <th className="py-3 px-3">Quantity & Volume</th>
                    <th className="py-3 px-3">Slot Location</th>
                    <th className="py-3 px-3">PIC / Staff</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {log.type === "INBOUND" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] flex items-center gap-1 w-fit">
                            <ArrowDownLeft className="h-3 w-3" />
                            <span>INBOUND</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10.5px] flex items-center gap-1 w-fit">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>OUTBOUND</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{log.itemName}</span>
                        <span className="text-[10.5px] font-mono text-indigo-600 block mt-0.5">
                          {log.sku}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {log.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                          {log.description}
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
                          {log.slotCode || "Floor"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-slate-700 block font-medium">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
