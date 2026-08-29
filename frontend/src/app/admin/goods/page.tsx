"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  ArrowRightLeft,
  Snowflake,
  Warehouse,
  Thermometer,
  Calendar,
  AlertTriangle,
  Building2,
  Download,
  CheckCircle2,
  Eye,
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  X,
  Package,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  MetricCard,
  SectionCard,
  FilterBar,
  EmptyState,
} from "@/components/dashboard";
import { useGoods } from "@/hooks/use-goods";

import { useWarehouses } from "@/hooks/use-warehouses";
import { GoodsItem } from "@/types";
import { GoodsStatusBadge } from "@/components/common/StatusBadge";


import { GoodsDetailModal } from "@/components/goods/GoodsDetailModal";
import { GoodsQrModal } from "@/components/goods/GoodsQrModal";
import { PutAwayModal } from "@/components/goods/PutAwayModal";
import { AdminRackTransferModal } from "@/components/goods/AdminRackTransferModal";
import { toast } from "sonner";


export default function GoodsManagementPage() {
  const { data: warehouses = [] } = useWarehouses();
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<
    "NEWEST" | "OLDEST" | "NAME_ASC" | "SKU_ASC" | "VOLUME_DESC" | "QTY_DESC"
  >("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: liveGoods = [], isLoading } = useGoods({
    warehouseId: selectedWarehouseFilter === "ALL" ? undefined : selectedWarehouseFilter,
  });

  const [selectedQrItem, setSelectedQrItem] = useState<GoodsItem | null>(null);
  const [detailItem, setDetailItem] = useState<GoodsItem | null>(null);
  const [putAwayItem, setPutAwayItem] = useState<GoodsItem | null>(null);
  const [transferItem, setTransferItem] = useState<GoodsItem | null>(null);

  // Multi-dimensional filtering and sorting
  const filteredGoods = liveGoods
    .filter((item) => {
      const matchWh =
        selectedWarehouseFilter === "ALL"
          ? true
          : item.warehouseId === selectedWarehouseFilter;
      const matchStatus =
        selectedStatusFilter === "ALL"
          ? true
          : item.status === selectedStatusFilter;
      const matchCat =
        selectedCategoryFilter === "ALL"
          ? true
          : selectedCategoryFilter === "COLD"
          ? item.requiresColdStorage
          : !item.requiresColdStorage;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.slotCode && item.slotCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.warehouseName && item.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchWh && matchStatus && matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === "OLDEST") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === "NAME_ASC") {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === "SKU_ASC") {
        return a.barcode.localeCompare(b.barcode);
      }
      if (sortOption === "VOLUME_DESC") {
        return (b.dimensions?.volumeM3 || 0) - (a.dimensions?.volumeM3 || 0);
      }
      if (sortOption === "QTY_DESC") {
        return b.quantity - a.quantity;
      }
      return 0;
    });

  // Real Metric Calculations from PostgreSQL
  const totalGoodsCount = liveGoods.length;
  const totalStoredCount = liveGoods.filter((g) => g.status === "STORED").length;
  const pendingPutawayCount = liveGoods.filter((g) => g.status === "INSPECTING").length;
  const pendingInboundCount = liveGoods.filter(
    (g) => g.status === "DRAFT" || g.status === "PENDING_PICKUP" || g.status === "IN_TRANSIT_INBOUND"
  ).length;
  const totalKoli = liveGoods.reduce((acc, g) => acc + g.quantity, 0);
  const totalVolumeM3 = Number(
    liveGoods.reduce((acc, g) => acc + (g.dimensions?.volumeM3 || 0), 0).toFixed(2)
  );
  const totalColdCount = liveGoods.filter((g) => g.requiresColdStorage).length;

  const getStatusBadge = (status: string) => <GoodsStatusBadge status={status} />;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Goods Management"
        title="Master Inventory & Warehouse Storage Management"
        subtitle="Real-time physical stock registry, Put-Away slot allocation, QR validation, and intra-warehouse rack transfers."
        badgeText="Master SKU"
        badgeColor="bg-indigo-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/warehouse/capacity">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
              >
                <Warehouse className="h-3.5 w-3.5 text-indigo-600" />
                <span>Rack Grid View</span>
              </Button>
            </Link>
            <Link href="/customer/goods/input">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                <span>Register Goods</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active SKUs"
          value={`${totalGoodsCount} SKUs`}
          icon={Boxes}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Total Physical: {totalKoli} Packages
            </span>
          }
        />

        <MetricCard
          label="Stored in Racks"
          value={`${totalStoredCount} SKUs`}
          icon={Warehouse}
          theme="emerald"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] py-0 font-semibold">
              Allocated
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              Occupied Volume: {totalVolumeM3} m³
            </span>
          }
        />

        <MetricCard
          label="Pending Put-Away (Dock)"
          value={`${pendingPutawayCount} SKUs`}
          icon={AlertTriangle}
          theme="amber"
          badge={
            pendingPutawayCount > 0 ? (
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                Action Needed
              </Badge>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Ready to allocate to rack slots
            </span>
          }
        />

        <MetricCard
          label="Cold Chain Commodities"
          value={`${totalColdCount} SKUs`}
          icon={Snowflake}
          theme="sky"
          badge={
            <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
              Sub-zero (-18°C)
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Meat, Seafood & Frozen Dairy
            </span>
          }
        />
      </div>

      {/* 3. Main Master SKU Table & Filters */}
      <SectionCard
        title="Master SKU & Inventory Directory"
        subtitle="Filter by facility, storage temperature zone, or lifecycle status"
        icon={Boxes}
      >
        <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Warehouse Filter */}
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Warehouse Facilities</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="STORED">Stored in Rack</option>
              <option value="INSPECTING">Receiving Dock (Pending Put-Away)</option>
              <option value="PENDING_PICKUP">Pending Pickup</option>
              <option value="IN_TRANSIT_INBOUND">Inbound Transit</option>
              <option value="PENDING_DELIVERY">Ready for Outbound</option>
              <option value="DELIVERED">Delivered</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Storage Categories</option>
              <option value="COLD">Cold Storage (-18°C)</option>
              <option value="STANDARD">Standard Dry Storage (24°C)</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-9 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="NEWEST">Sort: Newest First</option>
                <option value="OLDEST">Sort: Oldest First</option>
                <option value="NAME_ASC">Sort: Item Name (A-Z)</option>
                <option value="SKU_ASC">Sort: Barcode / SKU</option>
                <option value="VOLUME_DESC">Sort: Largest Volume</option>
                <option value="QTY_DESC">Sort: Largest Quantity</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, product, tenant, slot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
            <p>Loading master inventory database...</p>
          </div>
        ) : filteredGoods.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Boxes className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No goods match your filter criteria</p>
            <p className="text-[11px] text-slate-400">Try changing your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">SKU & Item Name</th>
                  <th className="py-3 px-3">Tenant / Customer</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Warehouse & Rack Slot</th>
                  <th className="py-3 px-3">Quantity & Volume</th>
                  <th className="py-3 px-3">Operating Temp</th>
                  <th className="py-3 px-3">Registration Date</th>
                  <th className="py-3 px-3 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGoods.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                            item.requiresColdStorage
                              ? "bg-sky-50 text-sky-600"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {item.requiresColdStorage ? (
                            <Snowflake className="h-4 w-4" />
                          ) : (
                            <Boxes className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-mono text-indigo-600 font-bold">
                            {item.barcode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {item.customerName}
                      </span>
                      <span className="text-[10.5px] text-slate-400 block">
                        Registered Tenant
                      </span>
                    </td>

                    <td className="py-3.5 px-3">{getStatusBadge(item.status)}</td>

                    <td className="py-3.5 px-3">
                      {item.status === "INSPECTING" ? (
                        <Badge variant="warning" className="text-[10px] bg-amber-500 text-slate-950 font-bold animate-pulse">
                          Receiving Dock (Pending Put-Away)
                        </Badge>
                      ) : item.status === "STORED" && item.slotCode ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Slot {item.slotCode}
                        </span>
                      ) : item.status === "IN_TRANSIT_INBOUND" ? (
                        <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          In Transit with Driver
                        </span>
                      ) : item.status === "PENDING_PICKUP" ? (
                        <span className="text-[11px] text-sky-700 font-medium bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                          Origin (Pickup Scheduled)
                        </span>
                      ) : item.status === "DRAFT" ? (
                        <span className="text-[11px] text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded">
                          Origin (Not yet received)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Unallocated</span>
                      )}
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">
                        {item.warehouseName}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block font-mono">
                        {item.quantity} {item.unit || "Packages"}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-mono">
                        {item.dimensions?.volumeM3 || 0} m³ • {item.dimensions?.weightKg || 0} kg
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.requiresColdStorage ? (
                        <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                          {item.currentTemperature != null ? `${item.currentTemperature}°C` : "-18.4°C"}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          24.0°C (Ambient)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status === "INSPECTING" && (
                          <Button
                            size="sm"
                            onClick={() => setPutAwayItem(item)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] h-8 px-2.5 flex items-center gap-1 shadow-sm"
                            title="Allocate received goods to warehouse rack slot"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            <span>Put-Away</span>
                          </Button>
                        )}

                        {item.status === "DRAFT" && (
                          <span
                            className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 whitespace-nowrap"
                            title="Put-Away unavailable. Goods must be received at warehouse dock first."
                          >
                            Awaiting Inbound
                          </span>
                        )}

                        {item.status === "PENDING_PICKUP" && (
                          <span
                            className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-200 whitespace-nowrap"
                            title="Put-Away unavailable. Pickup by driver scheduled."
                          >
                            Pickup Scheduled
                          </span>
                        )}

                        {item.status === "IN_TRANSIT_INBOUND" && (
                          <span
                            className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200 whitespace-nowrap"
                            title="Put-Away unavailable. Cargo currently in transit with driver."
                          >
                            In Transit
                          </span>
                        )}

                        {item.status === "STORED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTransferItem(item)}
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-[11px] h-8 px-2 flex items-center gap-1"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            <span>Transfer</span>
                          </Button>
                        )}

                        {item.status === "CANCELLED" && (
                          <span
                            className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200 whitespace-nowrap"
                            title="Item has been cancelled and terminated from operations."
                          >
                            Cancelled
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedQrItem(item)}
                          className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailItem(item)}
                          className="h-8 px-2.5 text-xs font-semibold border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>Detail</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </SectionCard>

      {/* Goods Detail Modal */}
      <GoodsDetailModal
        detailItem={detailItem}
        onClose={() => setDetailItem(null)}
        onPutAway={(item) => {
          setPutAwayItem(item);
          setDetailItem(null);
        }}
        onTransfer={(item) => {
          setTransferItem(item);
          setDetailItem(null);
        }}
        onViewQr={(item) => {
          setSelectedQrItem(item);
          setDetailItem(null);
        }}
      />

      {/* QR Code Modal */}
      <GoodsQrModal
        selectedQrItem={selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
      />

      {/* Put-Away Storage Slot Allocation Modal */}
      {putAwayItem && (
        <PutAwayModal
          item={putAwayItem}
          onClose={() => setPutAwayItem(null)}
        />
      )}

      {/* Intra-Warehouse Rack Transfer Modal */}
      {transferItem && (
        <AdminRackTransferModal
          item={transferItem}
          onClose={() => setTransferItem(null)}
        />
      )}
    </PageContainer>
  );
}

