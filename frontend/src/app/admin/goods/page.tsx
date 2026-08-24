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
import { useGoods, useUpdateGoodsStatus, useTransferGoodsSlot } from "@/hooks/use-goods";
import { useWarehouses, useWarehouse } from "@/hooks/use-warehouses";
import { toast } from "sonner";
import { GoodsItem } from "@/types";

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
  const pendingPutawayCount = liveGoods.filter(
    (g) => g.status === "INSPECTING" || g.status === "DRAFT"
  ).length;
  const pendingInboundCount = liveGoods.filter(
    (g) => g.status === "PENDING_PICKUP" || g.status === "IN_TRANSIT_INBOUND"
  ).length;
  const totalKoli = liveGoods.reduce((acc, g) => acc + g.quantity, 0);
  const totalVolumeM3 = Number(
    liveGoods.reduce((acc, g) => acc + (g.dimensions?.volumeM3 || 0), 0).toFixed(2)
  );
  const totalColdCount = liveGoods.filter((g) => g.requiresColdStorage).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "STORED":
        return <Badge className="bg-emerald-600 text-white text-[10px]">Stored in Rack</Badge>;
      case "DRAFT":
        return (
          <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
            Pending Put-Away (Registered)
          </Badge>
        );
      case "INSPECTING":
        return (
          <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold animate-pulse">
            Receiving Dock (Put-Away)
          </Badge>
        );
      case "PENDING_PICKUP":
        return <Badge className="bg-sky-600 text-white text-[10px]">Pending Pickup</Badge>;
      case "IN_TRANSIT_INBOUND":
        return <Badge className="bg-indigo-600 text-white text-[10px]">Inbound Transit</Badge>;
      case "PENDING_DELIVERY":
        return <Badge className="bg-purple-600 text-white text-[10px]">Ready for Outbound</Badge>;
      case "DELIVERED":
        return <Badge className="bg-slate-700 text-white text-[10px]">Delivered</Badge>;
      default:
        return <Badge className="bg-slate-200 text-slate-700 text-[10px]">{status}</Badge>;
    }
  };

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
                        <Badge variant="warning" className="text-[10px] bg-amber-500 text-slate-950 font-bold">
                          Receiving Dock (Pending Put-Away)
                        </Badge>
                      ) : item.slotCode ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          Slot {item.slotCode}
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
                        {(item.status === "INSPECTING" || item.status === "DRAFT") && (
                          <Button
                            size="sm"
                            onClick={() => setPutAwayItem(item)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] h-8 px-2.5 flex items-center gap-1 shadow-sm"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            <span>Put-Away</span>
                          </Button>
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
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {detailItem.name}
                  </h2>
                  <p className="text-xs font-mono text-indigo-600 font-bold">
                    {detailItem.barcode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Storage Status</span>
                  <div className="mt-1">{getStatusBadge(detailItem.status)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Item Owner (Tenant)</span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {detailItem.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Warehouse Facility</span>
                  <span className="text-xs font-bold text-slate-800 block mt-1">
                    {detailItem.warehouseName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Rack Slot Allocation</span>
                  <span className="text-xs font-mono font-bold text-slate-800 block mt-1">
                    {detailItem.slotCode ? `Slot ${detailItem.slotCode}` : "Receiving Dock (Pending Put-Away)"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-xl p-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                  PHYSICAL SPECIFICATIONS & CUBIC VOLUME
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-[10.5px] text-slate-400 block">Quantity</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {detailItem.quantity} {detailItem.unit || "Packages"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-[10.5px] text-slate-400 block">Total Volume</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {detailItem.dimensions?.volumeM3 || 0} m³
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">
                    <span className="text-[10.5px] text-slate-400 block">Total Weight</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {detailItem.dimensions?.weightKg || 0} kg
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Unit dimensions: {detailItem.dimensions?.lengthCm || 0} x {detailItem.dimensions?.widthCm || 0} x {detailItem.dimensions?.heightCm || 0} cm
                </p>
              </div>

              {detailItem.description && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-slate-700 block">Description / Notes:</span>
                  <p className="text-slate-600">{detailItem.description}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailItem(null)}
                className="text-xs h-9"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                {(detailItem.status === "INSPECTING" || detailItem.status === "DRAFT") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPutAwayItem(detailItem);
                      setDetailItem(null);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 flex items-center gap-1.5 shadow-sm"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    <span>Allocate to Rack (Put-Away)</span>
                  </Button>
                )}

                {detailItem.status === "STORED" && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setTransferItem(detailItem);
                      setDetailItem(null);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 flex items-center gap-1.5 shadow-sm"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    <span>Transfer Rack</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedQrItem(detailItem);
                    setDetailItem(null);
                  }}
                  className="text-xs h-9 flex items-center gap-1.5"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>View QR</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">QR Code Master Box</span>
              <button
                onClick={() => setSelectedQrItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-44 w-44 bg-white border-2 border-slate-900 border-dashed rounded-xl mx-auto flex flex-col items-center justify-center p-3 shadow-sm">
              <QrCode className="h-24 w-24 text-slate-900 stroke-[1.5]" />
              <span className="text-[10px] font-mono font-bold text-slate-900 mt-2">
                {selectedQrItem.barcode}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">{selectedQrItem.name}</p>
              <p className="text-[11px] text-slate-500">{selectedQrItem.warehouseName}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedQrItem(null)}
                className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                Close
              </Button>
              <Button
                onClick={() => toast.success(`QR Label ${selectedQrItem.barcode} ready to print.`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Label</span>
              </Button>
            </div>
          </div>
        </div>
      )}

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

function PutAwayModal({
  item,
  onClose,
}: {
  item: GoodsItem;
  onClose: () => void;
}) {
  const { data: warehouseDetail, isLoading } = useWarehouse(item.warehouseId);
  const updateStatusMutation = useUpdateGoodsStatus();
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [putAwayNote, setPutAwayNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = warehouseDetail?.slots || [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) {
      toast.error("Please select a destination rack slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: item.id,
        status: "STORED",
        slotId: selectedSlotId,
        note: putAwayNote || `Put-Away allocated to rack slot ${selectedSlot?.code || ""}`,
      });

      toast.success("Put-Away Successful", {
        description: `Item "${item.name}" allocated to slot ${selectedSlot?.code} (${warehouseDetail?.name || item.warehouseName}).`,
      });
      onClose();
    } catch (err: any) {
      toast.error("Put-Away Failed", {
        description: err?.message || "Failed to allocate rack slot.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Put-Away to Warehouse Storage Slot
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {item.barcode} • {item.name}
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white text-[10px]">
            Rack Allocation
          </Badge>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          {/* Goods & Requirements summary */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Facility:</span>
              <span className="font-bold text-slate-800">{warehouseDetail?.name || item.warehouseName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Required Storage:</span>
              <span className="font-bold text-slate-800">
                {item.requiresColdStorage ? "Cold Storage (-18°C Sub-zero)" : "Standard Rack (Ambient)"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Item Volume:</span>
              <span className="font-bold text-indigo-600 font-mono">{item.dimensions?.volumeM3 || 0} m³</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Quantity:</span>
              <span className="font-bold text-slate-800">{item.quantity} Packages</span>
            </div>
          </div>

          {/* Slot Selection from PostgreSQL */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Select Candidate Storage Slot (Real PostgreSQL Slots)
            </label>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading available rack slots...</div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No storage slots registered in this warehouse facility.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {slots.map((slot) => {
                  const isColdRequired = item.requiresColdStorage;
                  const isZoneMatch = isColdRequired
                    ? slot.zone === "COLD_STORAGE"
                    : true;
                  const availableM3 = Math.max(0, Number((Number(slot.capacityM3) - Number(slot.usedM3)).toFixed(2)));
                  const hasCapacity = availableM3 >= (item.dimensions?.volumeM3 || 0);
                  const isCompatible = isZoneMatch && hasCapacity && slot.status !== "MAINTENANCE";
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isCompatible) setSelectedSlotId(slot.id);
                      }}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        !isCompatible
                          ? "opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-50 border-indigo-500 shadow-sm cursor-pointer"
                          : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="targetSlot"
                            checked={isSelected}
                            disabled={!isCompatible}
                            onChange={() => setSelectedSlotId(slot.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-bold text-slate-900">
                            Slot {slot.code}
                          </span>
                          <Badge
                            variant={slot.zone === "COLD_STORAGE" ? "default" : "outline"}
                            className={`text-[9.5px] ${
                              slot.zone === "COLD_STORAGE" ? "bg-sky-600 text-white" : "text-slate-600"
                            }`}
                          >
                            {slot.zone?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 text-[11px] block">
                            Avail: {availableM3} / {slot.capacityM3} m³
                          </span>
                          {!isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Incompatible Zone (Requires Cold)
                            </span>
                          )}
                          {!hasCapacity && isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Insufficient Capacity
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Put-Away Note */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Put-Away Operational Note
            </label>
            <input
              type="text"
              placeholder="e.g. Placed in Level 2 west lane, ambient temperature."
              value={putAwayNote}
              onChange={(e) => setPutAwayNote(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedSlotId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Boxes className="h-3.5 w-3.5" />}
              <span>Confirm Put-Away</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminRackTransferModal({
  item,
  onClose,
}: {
  item: GoodsItem;
  onClose: () => void;
}) {
  const { data: warehouseDetail, isLoading } = useWarehouse(item.warehouseId);
  const transferMutation = useTransferGoodsSlot();
  const [targetSlotId, setTargetSlotId] = useState<string>("");
  const [reason, setReason] = useState<string>("Warehouse cargo rack space optimization");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slots = (warehouseDetail?.slots || []).filter(
    (s) => s.id !== item.slotId && s.status !== "MAINTENANCE"
  );
  const selectedSlot = slots.find((s) => s.id === targetSlotId);

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlotId) {
      toast.error("Please select a target rack slot.");
      return;
    }
    if (!reason || reason.trim().length < 3) {
      toast.error("Transfer reason must be at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await transferMutation.mutateAsync({
        id: item.id,
        targetSlotId,
        reason: reason.trim(),
        note: note.trim() || undefined,
      });

      toast.success("Rack Transfer Successful", {
        description: `Item "${item.name}" transferred to slot ${selectedSlot?.code}.`,
      });
      onClose();
    } catch (err: any) {
      toast.error("Transfer Failed", {
        description: err?.message || "Failed to transfer rack slot.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Intra-Warehouse Rack Transfer (Stock Movement)
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SKU: {item.barcode} • {item.name}
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-600 text-white text-[10px]">
            Slot {item.slotCode || "Current"}
          </Badge>
        </div>

        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Source Slot:</span>
              <span className="font-bold text-slate-800">Slot {item.slotCode || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Item Volume:</span>
              <span className="font-bold text-indigo-600 font-mono">{item.dimensions?.volumeM3 || 0} m³</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Select New Target Rack Slot *
            </label>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading candidate slots...</div>
            ) : slots.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                No alternative rack slots available in this facility.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {slots.map((slot) => {
                  const isColdRequired = item.requiresColdStorage;
                  const isZoneMatch = isColdRequired
                    ? slot.zone === "COLD_STORAGE"
                    : true;
                  const availableM3 = Math.max(0, Number((Number(slot.capacityM3) - Number(slot.usedM3)).toFixed(2)));
                  const hasCapacity = availableM3 >= (item.dimensions?.volumeM3 || 0);
                  const isCompatible = isZoneMatch && hasCapacity;
                  const isSelected = targetSlotId === slot.id;

                  return (
                    <div
                      key={slot.id}
                      onClick={() => {
                        if (isCompatible) setTargetSlotId(slot.id);
                      }}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        !isCompatible
                          ? "opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : isSelected
                          ? "bg-indigo-50 border-indigo-500 shadow-sm cursor-pointer"
                          : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="targetTransferSlot"
                            checked={isSelected}
                            disabled={!isCompatible}
                            onChange={() => setTargetSlotId(slot.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-bold text-slate-900">
                            Slot {slot.code}
                          </span>
                          <Badge
                            variant={slot.zone === "COLD_STORAGE" ? "default" : "outline"}
                            className={`text-[9.5px] ${
                              slot.zone === "COLD_STORAGE" ? "bg-sky-600 text-white" : "text-slate-600"
                            }`}
                          >
                            {slot.zone?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 text-[11px] block">
                            Avail: {availableM3} / {slot.capacityM3} m³
                          </span>
                          {!isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Incompatible Zone (Requires Cold)
                            </span>
                          )}
                          {!hasCapacity && isZoneMatch && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              Insufficient Capacity
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Transfer Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reorganizing cold corridor racks for forklift efficiency"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Executed via reefer forklift unit 02"
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !targetSlotId}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
              <span>Confirm Rack Transfer</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
