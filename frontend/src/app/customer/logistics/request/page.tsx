"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Boxes,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Phone,
  Loader2,
  Warehouse,
  Plus,
  Snowflake,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
  LoadingSkeleton,
} from "@/components/dashboard";
import { useCreateDeliveryOrder } from "@/hooks/use-logistics";
import { useGoods } from "@/hooks/use-goods";
import { useCustomerActiveWarehouses } from "@/hooks/use-warehouses";
import { useAuth } from "@/hooks/use-auth";
import { isEligibleForInbound, isEligibleForOutbound } from "@/lib/inventory-lifecycle";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { LogisticsCargoSelector } from "@/components/logistics/LogisticsCargoSelector";
import { LogisticsRecipientForm } from "@/components/logistics/LogisticsRecipientForm";
import { toast } from "sonner";


export default function LogisticsRequestPage() {
  const { user } = useAuth();
  const { data: activeWarehouses = [], isLoading: isLoadingWarehouses } =
    useCustomerActiveWarehouses();
  const createOrderMutation = useCreateDeliveryOrder();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [requestType, setRequestType] = useState<"OUTBOUND" | "INBOUND">("OUTBOUND");

  // Form State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientCity, setRecipientCity] = useState("Jakarta");
  const [vehicleType, setVehicleType] = useState<"REEFER" | "BOX">("REEFER");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Goods State: Map of goodsId -> requested quantity
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  // Inbound custom cargo state
  const [inboundCargoDesc, setInboundCargoDesc] = useState("");
  const [inboundCargoQty, setInboundCargoQty] = useState<number>(10);
  const [inboundCargoCold, setInboundCargoCold] = useState<boolean>(false);

  // Set default active warehouse once loaded
  useEffect(() => {
    if (activeWarehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(activeWarehouses[0].id || activeWarehouses[0].code);
    }
  }, [activeWarehouses, selectedWarehouseId]);

  const activeWarehouse = useMemo(() => {
    return activeWarehouses.find(
      (w) => w.id === selectedWarehouseId || w.code === selectedWarehouseId
    );
  }, [activeWarehouses, selectedWarehouseId]);

  // Fetch real customer goods from database filtered by active warehouse
  const { data: allCustomerGoods = [], isLoading: isLoadingGoods } = useGoods(
    user?.id
      ? {
          customerId: user.id,
          warehouseId: selectedWarehouseId || undefined,
        }
      : null
  );

  // Filter goods for active warehouse
  const availableStoredGoods = useMemo(() => {
    return allCustomerGoods.filter((g) => {
      const matchWh =
        !selectedWarehouseId || g.warehouseId === selectedWarehouseId;
      return matchWh && isEligibleForOutbound(g);
    });
  }, [allCustomerGoods, selectedWarehouseId]);

  // Inbound draft/pending goods (Cancelled strictly excluded)
  const inboundPendingGoods = useMemo(() => {
    return allCustomerGoods.filter((g) => {
      const matchWh =
        !selectedWarehouseId || g.warehouseId === selectedWarehouseId;
      return matchWh && isEligibleForInbound(g.status);
    });
  }, [allCustomerGoods, selectedWarehouseId]);

  // Active candidate goods depending on movement type
  const candidateGoods = requestType === "OUTBOUND" ? availableStoredGoods : inboundPendingGoods;

  // Selected goods list
  const selectedGoodsList = useMemo(() => {
    return candidateGoods.filter((g) => selectedQuantities[g.id] !== undefined);
  }, [candidateGoods, selectedQuantities]);

  // Calculations for total volume, weight, and cold storage requirement
  const cargoTotals = useMemo(() => {
    if (requestType === "INBOUND" && selectedGoodsList.length === 0 && inboundCargoDesc.trim()) {
      return {
        itemCount: inboundCargoQty,
        volumeM3: Number((0.05 * inboundCargoQty).toFixed(3)),
        weightKg: Number((15 * inboundCargoQty).toFixed(1)),
        requiresReefer: inboundCargoCold,
      };
    }

    return selectedGoodsList.reduce(
      (acc, g) => {
        const qty = selectedQuantities[g.id] || 0;
        const unitVol =
          g.quantity > 0
            ? (g.dimensions?.volumeM3 || 0) / g.quantity
            : g.dimensions?.volumeM3 || 0.05;
        const unitWeight =
          g.quantity > 0
            ? (g.dimensions?.weightKg || 0) / g.quantity
            : g.dimensions?.weightKg || 10;

        acc.itemCount += qty;
        acc.volumeM3 += unitVol * qty;
        acc.weightKg += unitWeight * qty;
        if (
          g.requiresColdStorage ||
          g.category === "COLD_FOOD"
        ) {
          acc.requiresReefer = true;
        }
        return acc;
      },
      { itemCount: 0, volumeM3: 0, weightKg: 0, requiresReefer: false }
    );
  }, [
    requestType,
    selectedGoodsList,
    selectedQuantities,
    inboundCargoDesc,
    inboundCargoQty,
    inboundCargoCold,
  ]);

  // Automatically enforce Reefer truck if Cold Storage goods are selected
  useEffect(() => {
    if (cargoTotals.requiresReefer) {
      setVehicleType("REEFER");
    }
  }, [cargoTotals.requiresReefer]);

  // Toggle selection of a goods item
  const toggleSelectGood = (goodId: string, availableStock: number) => {
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      if (next[goodId] !== undefined) {
        delete next[goodId];
      } else {
        next[goodId] = Math.min(1, availableStock);
      }
      return next;
    });
  };

  // Update requested quantity
  const handleQuantityChange = (goodId: string, val: string | number) => {
    if (val === "" || val === 0) {
      setSelectedQuantities((prev) => ({
        ...prev,
        [goodId]: 0,
      }));
      return;
    }
    const parsed = typeof val === "number" ? val : parseInt(val, 10);
    setSelectedQuantities((prev) => ({
      ...prev,
      [goodId]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  // Check if any requested quantity exceeds available stock
  const hasInsufficientStock = useMemo(() => {
    if (requestType === "OUTBOUND") {
      return selectedGoodsList.some((g) => (selectedQuantities[g.id] || 0) > g.quantity);
    }
    return false;
  }, [requestType, selectedGoodsList, selectedQuantities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("You must be logged in to create a logistics request.");
      return;
    }

    if (!activeWarehouse) {
      setErrorMessage("You must select an active rented warehouse facility.");
      return;
    }

    if (requestType === "OUTBOUND" && selectedGoodsList.length === 0) {
      setErrorMessage("Please select at least 1 stored inventory item to dispatch.");
      return;
    }

    if (hasInsufficientStock) {
      setErrorMessage("One or more selected items exceed available storage inventory.");
      return;
    }

    try {
      const itemsPayload = selectedGoodsList.map((g) => ({
        goodsId: g.id,
        quantity: selectedQuantities[g.id] || 1,
      }));

      const goodsItemIds = selectedGoodsList.map((g) => g.id);

      const goodsSummary =
        selectedGoodsList.length > 0
          ? selectedGoodsList
              .map((g) => `${selectedQuantities[g.id] || 1}x ${g.name}`)
              .join(", ")
          : inboundCargoDesc || "General Inbound Cargo";

      const originAddress =
        requestType === "OUTBOUND"
          ? activeWarehouse.address || `${activeWarehouse.name}, ${activeWarehouse.city}`
          : recipientAddress;

      const originCity =
        requestType === "OUTBOUND"
          ? activeWarehouse.city || "Jakarta"
          : recipientCity || "Customer City";

      const destinationAddress =
        requestType === "OUTBOUND"
          ? recipientAddress
          : activeWarehouse.address || `${activeWarehouse.name}, ${activeWarehouse.city}`;

      const destinationCity =
        requestType === "OUTBOUND"
          ? recipientCity || "Destination City"
          : activeWarehouse.city || "Jakarta";

      const created = await createOrderMutation.mutateAsync({
        type: requestType === "OUTBOUND" ? "DELIVERY" : "PICKUP",
        customerId: user.id,
        customerName: user.name || user.companyName || "Customer",
        customerPhone: recipientPhone || user.phone || "-",
        warehouseId: activeWarehouse.id,
        goodsItemIds: goodsItemIds.length > 0 ? goodsItemIds : undefined,
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
        goodsSummary,
        originAddress,
        originCity,
        destinationAddress,
        destinationCity,
        scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
        scheduledTimeSlot: `${scheduledTime} WIB`,
        requiresReefer: vehicleType === "REEFER" || cargoTotals.requiresReefer,
      });

      const orderNo = created?.orderNumber || `DO-${Date.now().toString().slice(-6)}`;
      setCreatedOrderNumber(orderNo);
      setIsSubmitted(true);
      toast.success("Logistics Delivery Order Created Successfully", {
        description: `Order #${orderNo} has been queued in PostgreSQL for fleet dispatch.`,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to submit logistics delivery request. Please review your inputs."
      );
    }
  };

  // 1. Loading State
  if (isLoadingWarehouses) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          Loading customer warehouse facilities & inventory context...
        </p>
      </div>
    );
  }

  // 2. Empty State: No Active Rented Warehouses
  if (activeWarehouses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Schedule Logistics Request & Fleet Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Request warehouse outbound shipment or inbound goods pickup.
          </p>
        </div>

        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center max-w-2xl mx-auto shadow-sm space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <Warehouse className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">
              No Active Warehouse Rental Found
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              You must have an active warehouse storage contract before you can schedule outbound deliveries or inbound pickups. Rent temperature-controlled storage space to get started.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/customer/rental">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-5 gap-2 rounded-xl shadow-md shadow-emerald-600/20">
                <Warehouse className="h-4 w-4" />
                <span>Rent Warehouse Space</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/customer/dashboard">
              <Button variant="outline" className="text-xs h-9 px-4 rounded-xl">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Logistics Dispatch"
        title="Schedule Logistics Request & Fleet Dispatch"
        subtitle="Dispatch stored goods from your warehouse or schedule an inbound pickup using Reefer / Box trucks."
        badgeText="PostgreSQL Live"
        badgeColor="bg-emerald-600 text-white"
        actions={
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Warehouse className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600">Active Warehouse:</span>
            {activeWarehouses.length === 1 ? (
              <span className="text-xs font-bold text-slate-900 font-mono">
                {activeWarehouses[0].name} ({activeWarehouses[0].code})
              </span>
            ) : (
              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setSelectedQuantities({});
                }}
                className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5 focus:outline-none"
              >
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {isSubmitted ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Logistics Delivery Order Created Successfully!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Shipment order <span className="font-mono font-bold text-emerald-700">{createdOrderNumber}</span> has been stored in PostgreSQL and queued for driver assignment. A <span className="font-semibold">{vehicleType === "REEFER" ? "Refrigerated Reefer Truck (-18°C)" : "Standard Box Truck"}</span> will be dispatched.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono space-y-1 text-left">
            <p className="font-sans font-bold text-slate-900 border-b border-slate-200 pb-1">
              Dispatch Summary
            </p>
            <p>Warehouse: {activeWarehouse?.name} ({activeWarehouse?.code})</p>
            <p>Recipient: {recipientName || "Registered Destination"} ({recipientPhone})</p>
            <p>Address: {recipientAddress}, {recipientCity}</p>
            <p>Schedule: {scheduledDate || "Today"} at {scheduledTime} WIB</p>
            <p>Cargo: {cargoTotals.itemCount} Units • {cargoTotals.volumeM3.toFixed(3)} m³ • {cargoTotals.weightKg.toFixed(1)} kg</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/customer/logistics/tracking">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 rounded-xl shadow-sm">
                Track Fleet Delivery →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                setRecipientName("");
                setRecipientAddress("");
                setSelectedQuantities({});
              }}
              className="text-xs h-9 px-4 rounded-xl"
            >
              New Delivery Request
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Form (8 Columns) */}
          <div className="lg:col-span-8 space-y-6">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Submission Error</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* 1. Request Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>1. Select Logistics Movement Type</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setRequestType("OUTBOUND");
                    setSelectedQuantities({});
                  }}
                  className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
                    requestType === "OUTBOUND"
                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Outbound Delivery (From Warehouse)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Dispatch inventory currently stored at <span className="font-semibold text-slate-700">{activeWarehouse?.name}</span> to your clients.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestType("INBOUND");
                    setSelectedQuantities({});
                  }}
                  className={`p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${
                    requestType === "INBOUND"
                      ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Boxes className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Inbound Pickup (To Warehouse)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Pick up shipments from supplier/port to deposit into <span className="font-semibold text-slate-700">{activeWarehouse?.name}</span>.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Real Goods Inventory Selector */}
            <LogisticsCargoSelector
              requestType={requestType}
              activeWarehouse={activeWarehouse}
              candidateGoods={candidateGoods}
              availableStoredGoods={availableStoredGoods}
              isLoadingGoods={isLoadingGoods}
              selectedQuantities={selectedQuantities}
              onToggleSelectGood={toggleSelectGood}
              onQuantityChange={handleQuantityChange}
              inboundCargoDesc={inboundCargoDesc}
              setInboundCargoDesc={setInboundCargoDesc}
              inboundCargoQty={inboundCargoQty}
              setInboundCargoQty={setInboundCargoQty}
              inboundCargoCold={inboundCargoCold}
              setInboundCargoCold={setInboundCargoCold}
            />

            {/* 3 & 4. Recipient, Destination, Fleet & Schedule Form */}
            <LogisticsRecipientForm
              requestType={requestType}
              recipientName={recipientName}
              setRecipientName={setRecipientName}
              recipientPhone={recipientPhone}
              setRecipientPhone={setRecipientPhone}
              recipientAddress={recipientAddress}
              setRecipientAddress={setRecipientAddress}
              recipientCity={recipientCity}
              setRecipientCity={setRecipientCity}
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              requiresReefer={cargoTotals.requiresReefer}
            />

          </div>

          {/* Right: Summary Card (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Dispatch Summary</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                  {requestType === "OUTBOUND" ? "Outbound" : "Inbound"}
                </Badge>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Facility Hub</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {activeWarehouse?.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {activeWarehouse?.code} • {activeWarehouse?.city}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] text-slate-400 block">Fleet Type</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    {vehicleType === "REEFER" ? (
                      <>
                        <Snowflake className="h-3.5 w-3.5 text-sky-600" />
                        <span>Reefer Truck (-18°C Sub-zero)</span>
                      </>
                    ) : (
                      <>
                        <Truck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Standard Box Truck</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] text-slate-400 block">Cargo Metrics</span>
                  <div className="grid grid-cols-3 gap-2 mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
                    <div>
                      <p className="text-[9.5px] text-slate-400">ITEMS</p>
                      <p className="font-bold text-slate-900 text-xs">{cargoTotals.itemCount}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-slate-400">VOL</p>
                      <p className="font-bold text-slate-900 text-xs">{cargoTotals.volumeM3.toFixed(2)} m³</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] text-slate-400">WEIGHT</p>
                      <p className="font-bold text-slate-900 text-xs">{cargoTotals.weightKg.toFixed(0)} kg</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5">
                  <span className="text-[11px] text-slate-400 block">Destination / Schedule</span>
                  <span className="font-bold text-slate-900 block truncate mt-0.5">
                    {recipientName || "Pending Destination"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {scheduledDate || "Today"} ({scheduledTime} WIB)
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  createOrderMutation.isPending ||
                  !recipientName ||
                  !recipientAddress ||
                  hasInsufficientStock ||
                  (requestType === "OUTBOUND" && selectedGoodsList.length === 0)
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Logistics Order...</span>
                  </>
                ) : (
                  <span>Submit Logistics Order</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </PageContainer>
  );
}
