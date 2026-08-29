"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  QrCode,
  Snowflake,
  Warehouse,
  Thermometer,
  Calendar,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Eye,
  X,
  Building2,
  Package,
  Layers,
  Scale,
  DollarSign,
  History,
  Printer,
  Loader2,
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
import { useGoods, useUpdateGoodsStatus } from "@/hooks/use-goods";
import { useCustomerActiveWarehouses } from "@/hooks/use-warehouses";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { GoodsItem } from "@/types";
import { GoodsStatusBadge } from "@/components/common/StatusBadge";

export default function CustomerGoodsInventoryPage() {
  const { user } = useAuth();
  const { data: activeWarehouses = [] } = useCustomerActiveWarehouses();

  const [sortOption, setSortOption] = useState<
    "NEWEST" | "OLDEST" | "NAME_ASC" | "SKU_ASC" | "VOLUME_DESC"
  >("NEWEST");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [detailItem, setDetailItem] = useState<GoodsItem | null>(null);
  const [qrItem, setQrItem] = useState<GoodsItem | null>(null);
  const [isConfirmCancel, setIsConfirmCancel] = useState(false);

  const updateGoodsStatusMutation = useUpdateGoodsStatus();

  const { data: liveGoods = [], isLoading } = useGoods({
    customerId: user?.id,
    warehouseId: selectedWarehouseId !== "ALL" ? selectedWarehouseId : undefined,
  });

  // Filter & Sorting Logic
  const filteredGoods = liveGoods
    .filter((item) => {
      const matchStatus =
        selectedStatus === "ALL" ? true : item.status === selectedStatus;
      const matchCategory =
        selectedCategory === "ALL"
          ? true
          : selectedCategory === "COLD"
          ? item.requiresColdStorage
          : !item.requiresColdStorage;
      const matchWarehouse =
        selectedWarehouseId === "ALL"
          ? true
          : item.warehouseId === selectedWarehouseId;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.slotCode && item.slotCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.warehouseName && item.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchCategory && matchWarehouse && matchSearch;
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
      return 0;
    });

  const totalKoli = liveGoods.reduce((acc, g) => acc + g.quantity, 0);
  const totalVolume = Number(
    liveGoods.reduce((acc, g) => acc + (g.dimensions?.volumeM3 || 0), 0).toFixed(2)
  );
  const totalColdCount = liveGoods.filter((g) => g.requiresColdStorage).length;

  const getStatusBadge = (status: string) => <GoodsStatusBadge status={status} />;

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Goods & Inventory"
        title="My Goods & Stored Inventory"
        subtitle="Real-time multi-tenant view of your registered commodities, slot allocations, and cold chain telemetry."
        badgeText={user?.companyName || user?.name || "Customer Account"}
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/customer/goods/input">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                <span>Register New Goods</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Registered SKUs"
          value={`${liveGoods.length} SKUs`}
          icon={Boxes}
          theme="indigo"
          subtext={
            <span className="text-[11px] text-slate-400">
              Isolated to your tenant account
            </span>
          }
        />

        <MetricCard
          label="Total Physical Inventory"
          value={`${totalKoli} Packages`}
          icon={Package}
          theme="emerald"
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              Volume: {totalVolume} m³ Storage Space
            </span>
          }
        />

        <MetricCard
          label="Occupied Space Volume"
          value={`${totalVolume} m³`}
          icon={Warehouse}
          theme="purple"
          subtext={
            <span className="text-[11px] text-slate-400">
              Live warehouse rack utilization
            </span>
          }
        />

        <MetricCard
          label="Cold Chain Commodities"
          value={`${totalColdCount} Items`}
          icon={Snowflake}
          theme="sky"
          badge={
            <Badge variant="success" className="text-[10px]">
              Sub-zero (-18°C)
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              {totalColdCount > 0 ? "Cold chain sensors actively logged" : "No cold chain goods currently stored"}
            </span>
          }
        />
      </div>

      {/* 3. Main Goods Table & Filters */}
      <SectionCard
        title="Stored Inventory & Rack Allocations"
        subtitle="Search your items, inspect barcode labels, or verify rack slot locations"
        icon={Boxes}
      >
        <div className="space-y-4">
        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="STORED">Stored in Rack</option>
              <option value="DRAFT">Registered (Pending Put-Away)</option>
              <option value="INSPECTING">Receiving Dock (Pending Put-Away)</option>
              <option value="PENDING_PICKUP">Pending Pickup</option>
              <option value="IN_TRANSIT_INBOUND">Inbound Transit</option>
              <option value="PENDING_DELIVERY">Ready for Outbound</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Storage Categories</option>
              <option value="COLD">Cold Storage (-18°C)</option>
              <option value="STANDARD">Standard Ambient (24°C)</option>
            </select>

            {/* Warehouse Filter */}
            {activeWarehouses.length > 0 && (
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Rented Facilities</option>
                {activeWarehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            )}
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
                <option value="NAME_ASC">Sort: Product Name (A-Z)</option>
                <option value="SKU_ASC">Sort: Barcode / SKU</option>
                <option value="VOLUME_DESC">Sort: Largest Volume</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, item name, rack slot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
            <p>Loading your stored inventory items...</p>
          </div>
        ) : liveGoods.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <Boxes className="h-12 w-12 text-slate-300 mx-auto stroke-[1.5]" />
            <div>
              <p className="text-sm font-bold text-slate-700">No Stored Inventory</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                You do not have any registered goods in WMS Nusantara warehouse facilities yet.
              </p>
            </div>
            <Link href="/customer/goods/input" className="inline-block pt-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold">
                + Register Goods
              </Button>
            </Link>
          </div>
        ) : filteredGoods.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Boxes className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No items match your filter criteria</p>
            <p className="text-[11px] text-slate-400">Try adjusting your search query or reset filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">SKU & Item Name</th>
                  <th className="py-3 px-3">Storage Status</th>
                  <th className="py-3 px-3">Warehouse & Rack Slot</th>
                  <th className="py-3 px-3">Quantity & Volume</th>
                  <th className="py-3 px-3">Temperature</th>
                  <th className="py-3 px-3">Registration Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
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
                          Inbound Transit with Driver
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQrItem(item)}
                          className="h-8 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          <span className="text-xs">QR</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsConfirmCancel(false);
                            setDetailItem(item);
                          }}
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
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {detailItem.name}
                  </h2>
                  <p className="text-xs font-mono text-emerald-700 font-bold">
                    {detailItem.barcode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailItem(null);
                  setIsConfirmCancel(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Storage Status & Details Card */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block">Storage Status</span>
                  <div className="mt-1">{getStatusBadge(detailItem.status)}</div>
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
                <div>
                  <span className="text-[11px] text-slate-400 block">Temperature Class</span>
                  <span className="text-xs font-mono font-bold text-sky-700 block mt-1">
                    {detailItem.requiresColdStorage ? "Cold Storage (-18°C Sub-zero)" : "Standard Dry (24°C)"}
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
                  <span className="font-semibold text-slate-700 block">Description / Batch Notes:</span>
                  <p className="text-slate-600">{detailItem.description}</p>
                </div>
              )}

              {/* Inline Confirmation Card for Cancellation */}
              {isConfirmCancel && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">
                        Cancel Goods Registration?
                      </h4>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        Are you sure you want to cancel the registration for <strong>{detailItem.name}</strong> ({detailItem.barcode})? This commodity will be marked as cancelled and removed from active storage workflows.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200/60">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsConfirmCancel(false)}
                      disabled={updateGoodsStatusMutation.isPending}
                      className="text-xs h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-rose-100/60 font-medium"
                    >
                      Keep Active
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={updateGoodsStatusMutation.isPending}
                      onClick={async () => {
                        try {
                          await updateGoodsStatusMutation.mutateAsync({
                            id: detailItem.id,
                            status: "CANCELLED",
                            note: "Registration cancelled by customer via portal",
                          });
                          toast.success(`Goods ${detailItem.name} has been successfully cancelled.`);
                          setIsConfirmCancel(false);
                          setDetailItem(null);
                        } catch (err: any) {
                          toast.error(err.message || "Failed to cancel goods registration.");
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-8 px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
                    >
                      {updateGoodsStatusMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                      <span>Yes, Cancel Goods</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailItem(null);
                    setIsConfirmCancel(false);
                  }}
                  className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Close
                </Button>

                {/* Cancel Registration Button for pre-stored items */}
                {["DRAFT", "PENDING_PICKUP", "INSPECTING"].includes(detailItem.status) && !isConfirmCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmCancel(true)}
                    className="text-xs h-9 px-3.5 rounded-lg border-rose-200 bg-rose-50/70 hover:bg-rose-100 hover:border-rose-300 text-rose-700 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Ban className="h-3.5 w-3.5 text-rose-600" />
                    <span>Cancel Registration</span>
                  </Button>
                )}
              </div>

              <Button
                onClick={() => {
                  setQrItem(detailItem);
                  setDetailItem(null);
                  setIsConfirmCancel(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>View QR Label</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">QR Code Master Label</span>
              <button
                onClick={() => setQrItem(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-44 w-44 bg-white border-2 border-slate-900 border-dashed rounded-xl mx-auto flex flex-col items-center justify-center p-3 shadow-sm">
              <QrCode className="h-24 w-24 text-slate-900 stroke-[1.5]" />
              <span className="text-[10px] font-mono font-bold text-slate-900 mt-2">
                {qrItem.barcode}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900">{qrItem.name}</p>
              <p className="text-[11px] text-slate-500">{qrItem.warehouseName}</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setQrItem(null)}
                className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                Close
              </Button>
              <Button
                onClick={() => toast.success(`QR Label ${qrItem.barcode} ready to print.`)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Label</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
