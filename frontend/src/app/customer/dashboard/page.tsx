"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Warehouse,
  Truck,
  Plus,
  ArrowRight,
  Thermometer,
  QrCode,
  CheckCircle2,
  Snowflake,
  CreditCard,
  Building2,
  Clock,
  HelpCircle,
  Receipt,
  FileCheck,
  Package,
  Calendar,
  Compass,
  MapPin,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DashboardContainer,
  DashboardHeader,
  DashboardMetricCard,
  DashboardSectionCard,
  DashboardEmptyState,
  DashboardSkeleton,
  DashboardErrorState,
} from "@/components/dashboard";
import { useCustomerSummary } from "@/hooks/use-analytics";
import { useGoods } from "@/hooks/use-goods";
import { useDeliveryOrders } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { data: summary, isLoading, isError, refetch, isFetching } = useCustomerSummary(user?.id);
  const { data: liveGoods = [] } = useGoods(user?.id);
  const { data: liveOrders = [] } = useDeliveryOrders();

  if (isLoading && !summary) {
    return (
      <DashboardContainer>
        <DashboardSkeleton />
      </DashboardContainer>
    );
  }

  if (isError) {
    return (
      <DashboardContainer>
        <DashboardErrorState
          title="Could Not Load Customer Dashboard"
          message="Failed to load your storage usage and goods telemetry from PostgreSQL."
          onRetry={() => refetch()}
        />
      </DashboardContainer>
    );
  }

  const rentedSpace = summary?.rentedSpaceM3 ?? 0;
  const usedSpace = summary?.usedSpaceM3 ?? 0;
  const utilPct = summary?.utilizationPercent ?? (rentedSpace > 0 ? (usedSpace / rentedSpace) * 100 : 0);
  const remainingSpace = summary?.remainingSpaceM3 ?? Math.max(0, rentedSpace - usedSpace);

  const totalPackages = summary?.totalQuantityPackages ?? liveGoods.reduce((acc, g) => acc + g.quantity, 0);
  const totalSkus = summary?.totalSkus ?? liveGoods.length;

  const currentTemp = summary?.currentTempCelsius;
  const storageLocation = summary?.storageLocationName || (rentedSpace > 0 ? "Gudang Utama Cakung Hub" : null);

  const monthlyBilling = summary?.monthlyBillingRp ?? 0;
  const invoiceStatus = summary?.latestInvoiceStatus;
  const invoiceNumber = summary?.latestInvoiceNumber;

  const activeOrder = liveOrders.find(
    (o) =>
      o.status === "PENDING_ASSIGNMENT" ||
      o.status === "DRIVER_ASSIGNED" ||
      o.status === "EN_ROUTE_PICKUP" ||
      o.status === "PICKED_UP" ||
      o.status === "IN_TRANSIT" ||
      o.status === "ARRIVED_DESTINATION" ||
      o.status === "DELAYED"
  );
  const displayGoods = liveGoods.slice(0, 4);

  const isBrandNewCustomer = rentedSpace === 0 && totalSkus === 0 && !monthlyBilling;

  return (
    <DashboardContainer>
      {/* 1. Standard Header */}
      <DashboardHeader
        title="Warehouse Services & Logistics Portal"
        subtitle="Manage warehouse rental spaces, temperature-controlled inventory goods, and schedule fleet logistics."
        badgeText={user?.companyName || user?.name || "Verified Tenant"}
        badgeColor="bg-emerald-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/customer/rental">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 h-9">
                <Plus className="h-4 w-4" />
                <span>Rent Storage Space</span>
              </Button>
            </Link>

            <Link href="/customer/goods/input">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Register Goods</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Onboarding Guide Tile for Brand New Customer */}
      {isBrandNewCustomer && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in zoom-in-95 duration-150">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-600/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950">
                Welcome to WMS Nusantara! Let&apos;s get your warehouse operations started.
              </h2>
              <p className="text-xs text-emerald-700 mt-0.5">
                Complete these 3 simple steps to reserve your storage space, deposit goods, and arrange logistics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Link
              href="/customer/rental"
              className="p-4 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2.5">
                Rent Storage Space
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Choose between Cold Storage (-18°C) or Standard Dry Storage across our nationwide hubs.
              </p>
            </Link>

            <Link
              href="/customer/goods/input"
              className="p-4 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2.5">
                Register Inventory Goods
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Submit inbound cargo details, dimensions, and auto-generate printable barcode labels.
              </p>
            </Link>

            <Link
              href="/customer/logistics/request"
              className="p-4 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 mt-2.5">
                Schedule Logistics Dispatch
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Dispatch refrigerated reefer or dry fleet trucks for doorstep delivery.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* 3. 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          label="Active Rented Storage"
          value={`${rentedSpace} m³`}
          subvalue="Rented"
          icon={Warehouse}
          theme="emerald"
          progress={{ value: utilPct }}
          badge={
            <span className="font-bold text-emerald-600 font-mono text-xs">
              {utilPct.toFixed(1)}% Used
            </span>
          }
          subtext={
            <span className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{usedSpace} m³ Occupied</span>
              <span className="font-semibold text-emerald-600">Remaining {remainingSpace} m³</span>
            </span>
          }
        />

        <DashboardMetricCard
          label="My Stored Cargo & SKUs"
          value={`${totalSkus} SKUs`}
          subvalue={`(${totalPackages} Packages)`}
          icon={Boxes}
          theme="indigo"
          badge={
            <span className="text-xs text-indigo-800 bg-indigo-100 font-semibold px-2 py-0.5 rounded-md">
              Verified Stored
            </span>
          }
          subtext={
            <span className="text-[11px] text-slate-500">
              Total volume: {usedSpace.toFixed(2)} m³ active in warehouse
            </span>
          }
        />

        <DashboardMetricCard
          label="Cold Storage Telemetry"
          value={
            rentedSpace > 0 && currentTemp != null
              ? `${currentTemp > 0 ? "+" : ""}${currentTemp}°C`
              : "—"
          }
          icon={Thermometer}
          theme="sky"
          badge={
            rentedSpace > 0 && currentTemp != null ? (
              <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 text-[10px] py-0 font-semibold">
                Optimal (-18°C ~ -20°C)
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] py-0 font-semibold">
                No Sensor Feed
              </Badge>
            )
          }
          subtext={
            <span className="text-[11px] text-slate-500 block truncate">
              {storageLocation ? `Location: ${storageLocation}` : "No leased storage zone"}
            </span>
          }
        />

        <DashboardMetricCard
          label="Monthly Rental Billing"
          value={`Rp ${monthlyBilling.toLocaleString("id-ID")}`}
          icon={Receipt}
          theme="amber"
          badge={
            invoiceNumber ? (
              <Badge
                className={`text-[10px] font-semibold ${
                  invoiceStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                    : "bg-amber-100 text-amber-900 hover:bg-amber-100"
                }`}
              >
                {invoiceStatus}
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] py-0 font-semibold">
                No Invoices
              </Badge>
            )
          }
          subtext={
            <span className="text-[11px] text-slate-500 font-mono">
              {invoiceNumber ? `Invoice #${invoiceNumber}` : "Zero active billing balance"}
            </span>
          }
        />
      </div>

      {/* 4. Main Operational Grid: 8 Columns Left / 4 Columns Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): My Stored Goods + Active Delivery Status */}
        <div className="lg:col-span-8 space-y-6">
          {/* My Stored Inventory Goods */}
          <DashboardSectionCard
            title="My Stored Inventory Goods"
            subtitle="Active cargo SKUs deposited in warehouse rack slots"
            icon={Boxes}
            headerAction={
              <Link href="/customer/goods">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  All Goods ({liveGoods.length}) →
                </Button>
              </Link>
            }
          >
            {displayGoods.length === 0 ? (
              <DashboardEmptyState
                icon={Boxes}
                title="No Stored Goods"
                description="You haven't deposited any goods into your rented space yet. Register your inbound inventory to get started."
                action={
                  <Link href="/customer/goods/input">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                      Register Inbound Goods
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">SKU & Item Name</th>
                      <th className="py-2.5 px-3">Quantity & Unit</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Location / Slot</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayGoods.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="font-mono text-[10px] text-indigo-600">{item.barcode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">
                          {item.dimensions?.volumeM3 || 0} m³
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-800 font-medium block">{item.warehouseName || "Cakung Hub"}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.slotCode ? `Slot ${item.slotCode}` : "Staging Bay"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            className={`text-[9.5px] font-medium ${
                              item.status === "STORED"
                                ? "bg-emerald-100 text-emerald-900"
                                : item.status === "PENDING_PICKUP" || item.status === "IN_TRANSIT_INBOUND"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardSectionCard>

          {/* Active Delivery & Tracking Status */}
          <DashboardSectionCard
            title="Active Delivery & Outbound Dispatch Tracker"
            subtitle="Real-time freight status, route milestones, and driver assignment"
            icon={Truck}
            headerAction={
              <Link href="/customer/logistics/track">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-8 px-2 hover:bg-indigo-50">
                  Track Delivery →
                </Button>
              </Link>
            }
          >
            {!activeOrder ? (
              <DashboardEmptyState
                icon={Truck}
                title="No Active Deliveries"
                description="You currently have no outbound delivery runs in transit. Schedule logistics dispatch whenever you need goods transported."
                action={
                  <Link href="/customer/logistics/request">
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                      Request New Delivery
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-600 block">
                      Order #{activeOrder.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Destination: {activeOrder.destinationAddress}
                    </span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px] font-semibold">
                    {activeOrder.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Assigned Fleet</span>
                    <span className="font-bold text-slate-800 font-mono mt-0.5 block">
                      {activeOrder.vehiclePlate || "B 9876 XYZ"}
                    </span>
                    <span className="text-[10px] text-slate-500">{activeOrder.vehicleType?.replace(/_/g, " ") || "Reefer Cold Box"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Driver PIC</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {activeOrder.driverName || "Agus Pratama"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{activeOrder.driverPhone || "0857-1122-3344"}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 block">Dispatch Time</span>
                    <span className="font-bold text-emerald-600 mt-0.5 block font-mono">
                      {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500">Doorstep Delivery</span>
                  </div>
                </div>
              </div>
            )}
          </DashboardSectionCard>
        </div>

        {/* Right Column (4 cols): Leased Space Breakdown + Invoices Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Storage Allocation Summary */}
          <DashboardSectionCard
            title="Leased Warehouse Hub"
            subtitle="Active lease contract & temperature zones"
            icon={Building2}
            headerAction={
              <Link href="/customer/rental">
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600 font-semibold h-7 px-2 hover:bg-emerald-50">
                  {rentedSpace > 0 ? "Manage →" : "Rent Space →"}
                </Button>
              </Link>
            }
          >
            {rentedSpace === 0 || !storageLocation ? (
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Warehouse className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">No Warehouse Space Leased</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    You haven&apos;t leased any storage space yet. Reserve standard dry or sub-zero cold storage capacity to start depositing goods.
                  </p>
                </div>
                <Link href="/customer/rental" className="block pt-1">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                    Browse & Rent Warehouse Space →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950">{storageLocation}</span>
                    <Badge className="bg-emerald-600 text-white text-[9.5px]">Active Lease</Badge>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Kawasan Industri Cakung Blok B-5, Jakarta Timur
                  </p>
                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono border-t border-emerald-200/60 text-emerald-900">
                    <span>Capacity: {rentedSpace} m³</span>
                    <span>Used: {usedSpace} m³</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Zone</span>
                    <span className="font-semibold text-slate-800">❄️ Cold Storage (-18°C)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract Period</span>
                    <span className="font-semibold text-slate-800 font-mono">12 Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate per m³</span>
                    <span className="font-semibold text-slate-800 font-mono">Rp 150.000 / m³ / mo</span>
                  </div>
                </div>
              </div>
            )}
          </DashboardSectionCard>

          {/* Billing & Invoice Summary Card */}
          <DashboardSectionCard
            title="Invoices & Payments"
            subtitle="Monthly lease billing overview"
            icon={Receipt}
            headerAction={
              <Link href="/customer/billing">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-semibold h-7 px-2 hover:bg-indigo-50">
                  Invoices →
                </Button>
              </Link>
            }
          >
            {!invoiceNumber && monthlyBilling === 0 ? (
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-2">
                <Receipt className="h-8 w-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">No Invoices Issued</h4>
                <p className="text-[11px] text-slate-500">
                  You have no active billing statements. Once you rent warehouse space or schedule deliveries, invoices will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 font-mono">
                      #{invoiceNumber}
                    </span>
                    <Badge className={invoiceStatus === "PAID" ? "bg-emerald-600 text-white text-[10px]" : "bg-amber-500 text-slate-950 font-bold text-[10px]"}>
                      {invoiceStatus || "UNPAID"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500">Monthly Subtotal</span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      Rp {monthlyBilling.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <Link href="/customer/billing" className="block">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-9 flex items-center justify-center gap-1.5 shadow-sm">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>View & Pay Invoices</span>
                  </Button>
                </Link>
              </div>
            )}
          </DashboardSectionCard>
        </div>
      </div>

      {/* 5. Secondary Grid: Quick Customer Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <DashboardSectionCard
            title="Customer Service Direct Pathways"
            subtitle="Quick actions for inventory deposit, logistics scheduling, and space management"
            icon={Compass}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/customer/goods/input"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <QrCode className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-emerald-600 transition-colors">
                    Inbound Goods Intake
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Register new cargo and print SKU barcode labels
                  </p>
                </div>
              </Link>

              <Link
                href="/customer/logistics/request"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-indigo-600 transition-colors">
                    Request Dispatch
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Schedule refrigerated fleet delivery to destination
                  </p>
                </div>
              </Link>

              <Link
                href="/customer/rental"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Warehouse className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-emerald-600 transition-colors">
                    Extend Storage Lease
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Reserve additional volumetric space in cold hubs
                  </p>
                </div>
              </Link>

              <Link
                href="/customer/receipt/confirm"
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-500 hover:bg-amber-50/30 transition-all group flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block group-hover:text-amber-600 transition-colors">
                    Confirm Goods Receipt
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Verify delivered shipments and sign electronic POD
                  </p>
                </div>
              </Link>
            </div>
          </DashboardSectionCard>
        </div>
      </div>
    </DashboardContainer>
  );
}
