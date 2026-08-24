"use client";

import React, { useState } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  X,
  Loader2,
  ShieldAlert,
  Clock,
  MapPin,
  RefreshCw,
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
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { CustomerItem } from "@/services/customer.service";
import { toast } from "sonner";

export default function CustomerManagementPage() {
  const { data: customers = [], isLoading, refetch, isFetching } = useCustomers();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<CustomerItem | null>(null);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<CustomerItem | null>(null);
  const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<CustomerItem | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION">("ACTIVE");

  const openEditModal = (cust: CustomerItem) => {
    setSelectedCustomerForEdit(cust);
    setEditName(cust.name || "");
    setEditCompanyName(cust.companyName || "");
    setEditEmail(cust.email || "");
    setEditPhone(cust.phone || "");
    setEditAddress(cust.address || "");
    setEditStatus(cust.status || "ACTIVE");
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForEdit) return;

    try {
      await updateCustomerMutation.mutateAsync({
        id: selectedCustomerForEdit.id,
        input: {
          name: editName.trim(),
          companyName: editCompanyName.trim() || undefined,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim() || undefined,
          status: editStatus,
        },
      });

      toast.success("Customer Profile Updated", {
        description: `Customer "${editName}" information has been updated successfully in PostgreSQL.`,
      });
      setSelectedCustomerForEdit(null);
    } catch (err: any) {
      toast.error("Update Failed", {
        description: err?.message || "Failed to update customer details.",
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerForDelete) return;

    try {
      await deleteCustomerMutation.mutateAsync(selectedCustomerForDelete.id);
      toast.success("Customer Deleted Successfully", {
        description: `Account "${selectedCustomerForDelete.name}" and associated records removed from PostgreSQL.`,
      });
      setSelectedCustomerForDelete(null);
      if (selectedCustomerForDetail?.id === selectedCustomerForDelete.id) {
        setSelectedCustomerForDetail(null);
      }
    } catch (err: any) {
      toast.error("Delete Failed", {
        description: err?.message || "Could not delete customer account.",
      });
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && cust.status === "ACTIVE") ||
      (statusFilter === "SUSPENDED" && cust.status === "SUSPENDED") ||
      (statusFilter === "PENDING" && cust.status === "PENDING_VERIFICATION") ||
      (statusFilter === "WITH_GOODS" && cust.totalGoodsCount > 0);

    const matchSearch =
      (cust.companyName && cust.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust.phone && cust.phone.includes(searchQuery));

    return matchStatus && matchSearch;
  });

  // KPI Calculations
  const totalCustomersCount = customers.length;
  const totalVolumeStoredM3 = customers.reduce((acc, c) => acc + c.totalVolumeM3, 0);
  const totalBilledRevenue = customers.reduce((acc, c) => acc + c.totalBilledAmount, 0);
  const totalUnpaidInvoices = customers.reduce((acc, c) => acc + c.unpaidInvoicesCount, 0);
  const activeCustomersCount = customers.filter((c) => c.status === "ACTIVE").length;

  const getStatusBadge = (status: CustomerItem["status"]) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-600 text-white text-[10px]">Active Tenant</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-rose-600 text-white text-[10px]">Suspended</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge className="bg-amber-500 text-slate-950 text-[10px]">Pending Verification</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="WMS Admin > Customers & Tenants"
        title="Customer & Warehouse Tenant Directory"
        subtitle="Manage tenant accounts, edit profiles, monitor storage volume utilization, and oversee billing status."
        badgeText="PostgreSQL Live"
        badgeColor="bg-indigo-600 text-white"
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* 2. 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Registered Tenants"
          value={`${totalCustomersCount} Accounts`}
          icon={Users}
          theme="indigo"
          badge={
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Active
            </Badge>
          }
          subtext={
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{activeCustomersCount} Active Accounts</span>
            </span>
          }
        />

        <MetricCard
          label="Occupied Cargo Volume"
          value={`${totalVolumeStoredM3.toFixed(2)} m³`}
          icon={Boxes}
          theme="emerald"
          subtext={
            <span className="text-[11px] text-slate-400 font-mono">
              Live PostgreSQL Cargo Sum
            </span>
          }
        />

        <MetricCard
          label="Cumulative Billed Revenue"
          value={`Rp ${(totalBilledRevenue / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`}
          icon={Receipt}
          theme="purple"
          subtext={
            <span className="text-[11px] text-slate-400">
              Total issued invoices
            </span>
          }
        />

        <MetricCard
          label="Outstanding Invoices"
          value={`${totalUnpaidInvoices} Unpaid`}
          icon={AlertTriangle}
          theme={totalUnpaidInvoices > 0 ? "amber" : "emerald"}
          badge={
            totalUnpaidInvoices > 0 ? (
              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                Pending
              </span>
            ) : undefined
          }
          subtext={
            <span className="text-[11px] text-slate-400">
              {totalUnpaidInvoices > 0 ? "Requires payment follow-up" : "All tenant accounts settled"}
            </span>
          }
        />
      </div>

      {/* 3. Main Customer Directory Table & Filters */}
      <SectionCard
        title="Tenant Directory & Storage Accounts"
        subtitle="Search customer details, edit profile, or inspect active goods inventory"
        icon={Users}
      >
        <div className="space-y-4">
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
              All Customers ({customers.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "ACTIVE"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Active ({customers.filter((c) => c.status === "ACTIVE").length})
            </button>
            <button
              onClick={() => setStatusFilter("WITH_GOODS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "WITH_GOODS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              With Stored Goods ({customers.filter((c) => c.totalGoodsCount > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === "SUSPENDED"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Suspended ({customers.filter((c) => c.status === "SUSPENDED").length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
            <p>Loading customer records from PostgreSQL...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Users className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No customer records found</p>
            <p className="text-[11px] text-slate-400">Try changing your search query or filter selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-3">Company & Tenant PIC</th>
                  <th className="py-3 px-3">Contact Details</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-3">Stored Inventory</th>
                  <th className="py-3 px-3">Billing & Invoices</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block text-xs">
                          {cust.companyName || "Individual Account"}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Building2 className="h-3 w-3 text-indigo-500 shrink-0" />
                          <span>{cust.name}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{cust.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{cust.phone || "No phone registered"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(cust.status)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="font-bold text-slate-900 font-mono">
                          {cust.totalGoodsCount} Registered SKUs
                        </span>
                        <span className="text-slate-500 block font-mono">
                          {cust.totalVolumeM3.toFixed(2)} m³ total volume
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="font-bold text-slate-900 font-mono">
                          Rp {cust.totalBilledAmount.toLocaleString("id-ID")}
                        </span>
                        <span className={`block font-semibold ${cust.unpaidInvoicesCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {cust.totalInvoicesCount} Invoices ({cust.unpaidInvoicesCount} Unpaid)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCustomerForDetail(cust)}
                          className="h-8 px-2.5 text-xs border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>Detail</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(cust)}
                          className="h-8 px-2.5 text-xs border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCustomerForDelete(cust)}
                          className="h-8 px-2.5 text-xs border-rose-200 hover:bg-rose-50 text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span>Delete</span>
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

      {/* Customer Detail Modal */}
      {selectedCustomerForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedCustomerForDetail.companyName || selectedCustomerForDetail.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {selectedCustomerForDetail.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Contact PIC Name</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{selectedCustomerForDetail.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Account Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedCustomerForDetail.status)}</div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Email Address</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{selectedCustomerForDetail.email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Phone / WhatsApp</span>
                  <span className="font-mono font-semibold text-slate-800 block mt-0.5">{selectedCustomerForDetail.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Registered Address</span>
                  <span className="text-slate-700 block mt-0.5">{selectedCustomerForDetail.address || "No address provided"}</span>
                </div>
              </div>

              {/* Stored Cargo Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Registered Inventory Items ({selectedCustomerForDetail.recentGoods.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    Total: {selectedCustomerForDetail.totalVolumeM3.toFixed(2)} m³
                  </span>
                </div>

                {selectedCustomerForDetail.recentGoods.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No active goods items registered by this tenant.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">SKU / Item Name</th>
                          <th className="py-2 px-3">Quantity & Unit</th>
                          <th className="py-2 px-3">Volume</th>
                          <th className="py-2 px-3">Storage Location</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomerForDetail.recentGoods.map((g) => (
                          <tr key={g.id}>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {g.name}
                              <span className="block text-[10px] font-mono text-indigo-600">{g.barcode}</span>
                            </td>
                            <td className="py-2 px-3 font-mono">{g.quantity} {g.unit}</td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-600">{g.volumeM3} m³</td>
                            <td className="py-2 px-3 text-[11px] text-slate-600">
                              {g.warehouseName} {g.slotCode ? `(Slot ${g.slotCode})` : ""}
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="text-[9.5px] font-mono">{g.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Invoices */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Invoices & Billing History ({selectedCustomerForDetail.recentInvoices.length})</span>
                  </h3>
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    Billed: Rp {selectedCustomerForDetail.totalBilledAmount.toLocaleString("id-ID")}
                  </span>
                </div>

                {selectedCustomerForDetail.recentInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No billing invoices issued for this customer.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">Invoice Number</th>
                          <th className="py-2 px-3">Billing Period</th>
                          <th className="py-2 px-3">Total Amount</th>
                          <th className="py-2 px-3">Due Date</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomerForDetail.recentInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-slate-700">{inv.billingMonth}</td>
                            <td className="py-2 px-3 font-mono font-bold">Rp {inv.totalAmount.toLocaleString("id-ID")}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              {new Date(inv.dueDate).toLocaleDateString("id-ID")}
                            </td>
                            <td className="py-2 px-3">
                              <Badge className={`text-[9.5px] ${inv.status === "PAID" ? "bg-emerald-600 text-white" : "bg-amber-500 text-slate-950"}`}>
                                {inv.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomerForDetail(null)}
                className="text-xs h-9 px-4 rounded-lg"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  openEditModal(selectedCustomerForDetail);
                  setSelectedCustomerForDetail(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {selectedCustomerForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Edit Customer Profile
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedCustomerForEdit.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerForEdit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name / Contact PIC *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Company / Corporate Entity Name
                </label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Operational Account Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Full access & active contracts)</option>
                  <option value="SUSPENDED">SUSPENDED (Restricted access)</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION (Awaiting review)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Physical Registered Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCustomerForEdit(null)}
                  className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateCustomerMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  {updateCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedCustomerForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Delete Customer Account?
                </h2>
                <p className="text-xs text-rose-600 font-semibold">
                  Destructive Action Warning
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-900 space-y-1.5 leading-relaxed">
              <p>
                Are you sure you want to delete customer <strong>{selectedCustomerForDelete.name}</strong> ({selectedCustomerForDelete.email})?
              </p>
              <p className="text-[11px] text-rose-700">
                All associated inventory items ({selectedCustomerForDelete.totalGoodsCount}), invoices ({selectedCustomerForDelete.totalInvoicesCount}), and mutations will be removed transactionally from PostgreSQL.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedCustomerForDelete(null)}
                className="text-xs h-9 px-4 rounded-lg border-slate-300 hover:bg-slate-100 text-slate-700 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCustomer}
                disabled={deleteCustomerMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                {deleteCustomerMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
