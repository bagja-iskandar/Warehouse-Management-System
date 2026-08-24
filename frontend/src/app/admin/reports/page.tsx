"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Warehouse,
  Boxes,
  Truck,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Filter,
  BarChart3,
  PieChart,
  Search,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  User,
  History,
  ShieldCheck,
  Loader2,
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

interface ReportTemplate {
  id: string;
  title: string;
  category: "CAPACITY" | "INVENTORY" | "LOGISTICS" | "FINANCE";
  description: string;
  period: string;
  format: string;
  lastGenerated: string;
  fileSize: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "rep-1",
    title: "Warehouse Capacity & Rack Slot Utilization Report",
    category: "CAPACITY",
    description: "Physical volume m³ occupancy analysis per zone for Cold Storage vs Standard across all hubs.",
    period: "Monthly (August 2026)",
    format: "PDF & XLSX",
    lastGenerated: "Aug 22, 2026, 07:00 WIB",
    fileSize: "1.8 MB",
  },
  {
    id: "rep-2",
    title: "Inventory Movement & Inbound/Outbound Flow Report",
    category: "INVENTORY",
    description: "Registered SKU summary, stock turnover velocity, batch expiration tracking, and QR code verifications.",
    period: "Weekly (Aug 15 - 22, 2026)",
    format: "XLSX & CSV",
    lastGenerated: "Aug 22, 2026, 06:30 WIB",
    fileSize: "2.4 MB",
  },
  {
    id: "rep-3",
    title: "Logistics Fleet On-Time Delivery & Performance Report",
    category: "LOGISTICS",
    description: "Driver transit routing accuracy evaluations, reefer temperature telemetry logs, and Digital POD completion.",
    period: "Monthly (August 2026)",
    format: "PDF & CSV",
    lastGenerated: "Aug 21, 2026, 23:59 WIB",
    fileSize: "1.2 MB",
  },
  {
    id: "rep-4",
    title: "Warehouse Space Rental, Invoices & Late Fee Penalty Report",
    category: "FINANCE",
    description: "Rental turnover revenue breakdown per m³, automated 5%/week overdue fees, and aging receivables.",
    period: "Monthly (August 2026)",
    format: "PDF & XLSX",
    lastGenerated: "Aug 22, 2026, 08:00 WIB",
    fileSize: "3.1 MB",
  },
];

export default function OperationalReportsPage() {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"MUTATIONS" | "TEMPLATES">("MUTATIONS");
  const [mutationFilter, setMutationFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: liveMutations = [], isLoading: isLoadingMutations, refetch, isFetching } = useGoodsMutations();

  const handleExport = (title: string) => {
    setDownloadSuccess(`Downloading file: ${title}...`);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3000);
  };

  const filteredMutations = liveMutations.filter((m) => {
    const matchType = mutationFilter === "ALL" || m.type === mutationFilter;
    const matchSearch =
      (m.itemName && m.itemName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.sku && m.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.actorName && m.actorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  const inboundCount = liveMutations.filter((m) => m.type === "INBOUND").length;
  const transferCount = liveMutations.filter((m) => m.type === "TRANSFER").length;
  const outboundCount = liveMutations.filter((m) => m.type === "OUTBOUND").length;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Reports & Analytics"
        title="Audit Logs, Analytics & Operational Reports"
        subtitle="Live PostgreSQL immutable stock mutations, ledger traceability, warehouse space lease analytics, and exportable reports."
        badgeText="Immutable Ledger"
        badgeColor="bg-indigo-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "MUTATIONS" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("MUTATIONS")}
              className={`text-xs h-9 ${
                activeTab === "MUTATIONS"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              <span>Live Mutation Logs ({liveMutations.length})</span>
            </Button>

            <Button
              variant={activeTab === "TEMPLATES" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("TEMPLATES")}
              className={`text-xs h-9 ${
                activeTab === "TEMPLATES"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              <span>Executive Reports ({REPORT_TEMPLATES.length})</span>
            </Button>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Mutation Events"
          value={`${liveMutations.length} Events`}
          icon={History}
          theme="indigo"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Live DB
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              Immutable PostgreSQL Audit Trail
            </span>
          }
        />

        <MetricCard
          label="Inbound Intake & Put-Away"
          value={`${inboundCount} Transactions`}
          icon={ArrowDownLeft}
          theme="emerald"
          subtext={
            <span className="text-[11px] text-slate-400">
              Goods receipts & dock put-away
            </span>
          }
        />

        <MetricCard
          label="Intra-Rack Transfers"
          value={`${transferCount} Relocations`}
          icon={ArrowRightLeft}
          theme="sky"
          subtext={
            <span className="text-[11px] text-slate-400">
              Internal slot reallocations
            </span>
          }
        />

        <MetricCard
          label="Outbound Dispatches"
          value={`${outboundCount} Shipments`}
          icon={ArrowUpRight}
          theme="amber"
          subtext={
            <span className="text-[11px] text-slate-400">
              Customer outbound fulfillment
            </span>
          }
        />
      </div>

      {/* Notification toast if exporting */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{downloadSuccess} Successfully exported!</span>
        </div>
      )}

      {activeTab === "MUTATIONS" ? (
        /* Tab 1: Live PostgreSQL Inventory Mutations & Movement Log */
        <SectionCard
          title="Physical Inventory Movement & Mutation Log"
          subtitle="Real-time audit records of all inbound intakes, put-aways, rack transfers, and outbound dispatches"
          icon={History}
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                {["ALL", "INBOUND", "TRANSFER", "OUTBOUND"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMutationFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      mutationFilter === type
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {type === "ALL"
                      ? `All Movement Logs (${liveMutations.length})`
                      : type === "INBOUND"
                      ? "Inbound & Put-Away"
                      : type === "TRANSFER"
                      ? "Rack Transfers"
                      : "Outbound Dispatch"}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SKU, commodity, actor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {isLoadingMutations ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                <p>Loading PostgreSQL inventory mutation logs...</p>
              </div>
            ) : filteredMutations.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="No Mutation Logs Recorded"
                description="All physical stock movements are automatically recorded into goods_mutations."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3 px-3">Date & Timestamp</th>
                      <th className="py-3 px-3">Event Type</th>
                      <th className="py-3 px-3">Cargo Commodity & SKU</th>
                      <th className="py-3 px-3">Quantity & Volume</th>
                      <th className="py-3 px-3">Location Shift</th>
                      <th className="py-3 px-3">Actor PIC</th>
                      <th className="py-3 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMutations.map((m) => {
                      const eventDate = new Date(m.timestamp).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      });
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {eventDate}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {m.type === "INBOUND" && (
                              <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1 w-fit">
                                <ArrowDownLeft className="h-3 w-3" />
                                <span>INBOUND</span>
                              </Badge>
                            )}
                            {m.type === "TRANSFER" && (
                              <Badge className="bg-sky-600 text-white text-[10px] flex items-center gap-1 w-fit">
                                <ArrowRightLeft className="h-3 w-3" />
                                <span>TRANSFER</span>
                              </Badge>
                            )}
                            {m.type === "OUTBOUND" && (
                              <Badge className="bg-amber-600 text-white text-[10px] flex items-center gap-1 w-fit">
                                <ArrowUpRight className="h-3 w-3" />
                                <span>OUTBOUND</span>
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-900 block leading-tight">
                              {m.itemName || "Cargo Item"}
                            </span>
                            <span className="text-[10.5px] font-mono text-indigo-600 font-bold block mt-0.5">
                              {m.sku}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800 font-mono block">
                              {m.quantityKoli} Packages
                            </span>
                            <span className="text-[10.5px] text-slate-400 font-mono block">
                              {m.volumeM3} m³
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            {m.slotCode ? (
                              <span className="font-mono text-indigo-600 font-bold text-[11px]">
                                Slot {m.slotCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">{m.location || "Warehouse Floor"}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <User className="h-3.5 w-3.5 text-slate-400" />
                              <span>{m.actorName || "Warehouse Staff"}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 max-w-[220px]">
                            <p className="text-[11px] text-slate-500 truncate" title={m.description || ""}>
                              {m.description || "-"}
                            </p>
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
      ) : (
        /* Tab 2: Standard Executive Exportable Reports Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REPORT_TEMPLATES.map((report) => (
            <SectionCard
              key={report.id}
              title={report.title}
              subtitle={report.description}
              icon={FileText}
              badge={
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    report.category === "CAPACITY"
                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                      : report.category === "INVENTORY"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : report.category === "LOGISTICS"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {report.category}
                </span>
              }
              headerAction={
                <span className="text-[11px] text-slate-400 font-mono">
                  {report.fileSize}
                </span>
              }
            >
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{report.period}</span>
                  </div>
                  <span className="font-mono">{report.format}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Generated: {report.lastGenerated}
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handleExport(report.title)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
