"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Snowflake,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoodsItem, Warehouse } from "@/types";

export interface LogisticsCargoSelectorProps {
  requestType: "OUTBOUND" | "INBOUND";
  activeWarehouse?: Warehouse;
  candidateGoods: GoodsItem[];
  availableStoredGoods: GoodsItem[];
  isLoadingGoods: boolean;
  selectedQuantities: Record<string, number>;
  onToggleSelectGood: (goodId: string, availableStock: number) => void;
  onQuantityChange: (goodId: string, val: string | number) => void;
  inboundCargoDesc: string;
  setInboundCargoDesc: (desc: string) => void;
  inboundCargoQty: number;
  setInboundCargoQty: (qty: number) => void;
  inboundCargoCold: boolean;
  setInboundCargoCold: (cold: boolean) => void;
}

export function LogisticsCargoSelector({
  requestType,
  activeWarehouse,
  candidateGoods,
  availableStoredGoods,
  isLoadingGoods,
  selectedQuantities,
  onToggleSelectGood,
  onQuantityChange,
  inboundCargoDesc,
  setInboundCargoDesc,
  inboundCargoQty,
  setInboundCargoQty,
  inboundCargoCold,
  setInboundCargoCold,
}: LogisticsCargoSelectorProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            2. Select Cargo & Inventory Items
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {requestType === "OUTBOUND"
              ? `Select stored items in ${activeWarehouse?.name || "facility"} to dispatch.`
              : `Select registered goods for pickup into ${activeWarehouse?.name || "facility"}.`}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          {candidateGoods.length} Item(s) Available
        </Badge>
      </div>

      {isLoadingGoods ? (
        <div className="p-6 text-center text-xs text-slate-500 space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600 mx-auto" />
          <p>Fetching goods from PostgreSQL...</p>
        </div>
      ) : requestType === "OUTBOUND" && availableStoredGoods.length === 0 ? (
        <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
          <Boxes className="h-7 w-7 text-amber-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              No Inventory Available for Outbound
            </p>
            <p className="text-[11px] text-slate-600 max-w-md mx-auto">
              No inventory is currently available for outbound. Inventory must be
              received and stored in a warehouse first.
            </p>
          </div>
          <Link href="/customer/goods/input">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Register New Goods / Inbound</span>
            </Button>
          </Link>
        </div>
      ) : candidateGoods.length > 0 ? (
        <div className="space-y-3">
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {candidateGoods.map((good) => {
              const isSelected = selectedQuantities[good.id] !== undefined;
              const requestedQty = selectedQuantities[good.id] || 1;
              const isOverStock = requestedQty > good.quantity;
              const isCold =
                good.requiresColdStorage || good.category === "COLD_FOOD";

              return (
                <div
                  key={good.id}
                  className={`p-3.5 transition-colors ${
                    isSelected
                      ? isOverStock
                        ? "bg-rose-50/50"
                        : "bg-emerald-50/30"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Checkbox & Item Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        id={`good-${good.id}`}
                        checked={isSelected}
                        onChange={() =>
                          onToggleSelectGood(good.id, good.quantity)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                      />
                      <label
                        htmlFor={`good-${good.id}`}
                        className="cursor-pointer flex-1 min-w-0"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {good.name}
                          </span>
                          {isCold ? (
                            <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[9.5px] gap-1 py-0">
                              <Snowflake className="h-2.5 w-2.5" />
                              Cold Storage (-18°C)
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9.5px] py-0">
                              Standard Dry
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            SKU: {good.barcode || good.id.substring(0, 8)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1 font-mono">
                          <span>
                            Available Stock:{" "}
                            <strong className="text-slate-800 font-sans">
                              {good.quantity} {good.unit || "Packages"}
                            </strong>
                          </span>
                          <span>
                            Slot:{" "}
                            <strong className="text-slate-700">
                              {good.slotCode || "A-01"}
                            </strong>
                          </span>
                          <span>
                            Vol:{" "}
                            <strong className="text-slate-700">
                              {good.dimensions?.volumeM3 || 0.05} m³
                            </strong>
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Quantity Input when selected */}
                    {isSelected && (
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <span className="text-[11px] font-semibold text-slate-600 mr-1">
                          Dispatch Qty:
                        </span>
                        <div
                          className={`flex items-center rounded-lg bg-white overflow-hidden shadow-2xs border transition-colors ${
                            isOverStock
                              ? "border-rose-400 ring-1 ring-rose-300"
                              : "border-emerald-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const curr = selectedQuantities[good.id] || 1;
                              if (curr > 1) {
                                onQuantityChange(good.id, curr - 1);
                              }
                            }}
                            className="h-8 w-7 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border-r border-slate-200 transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={
                              selectedQuantities[good.id] === 0
                                ? ""
                                : selectedQuantities[good.id] ?? 1
                            }
                            onChange={(e) =>
                              onQuantityChange(good.id, e.target.value)
                            }
                            onBlur={() => {
                              if (
                                !selectedQuantities[good.id] ||
                                selectedQuantities[good.id] < 1
                              ) {
                                onQuantityChange(good.id, 1);
                              }
                            }}
                            className={`w-16 h-8 text-center text-xs font-bold focus:outline-none ${
                              isOverStock
                                ? "bg-rose-50 text-rose-700"
                                : "bg-white text-slate-900"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = selectedQuantities[good.id] || 1;
                              onQuantityChange(good.id, curr + 1);
                            }}
                            className="h-8 w-7 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border-l border-slate-200 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                          {good.unit || "pkgs"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Overstock Warning */}
                  {isSelected && isOverStock && (
                    <p className="text-[10px] font-semibold text-rose-600 mt-1.5 pl-7 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Insufficient inventory. Available: {good.quantity}{" "}
                      {good.unit || "units"}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Fallback for inbound custom cargo description if no draft items */
        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Info className="h-4 w-4 text-indigo-600" />
            <span>Inbound Pickup Cargo Information</span>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Cargo Description & Commodity *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 50 Cartons Frozen Seafood Import"
              value={inboundCargoDesc}
              onChange={(e) => setInboundCargoDesc(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Total Quantity (Packages)
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const curr = Number(inboundCargoQty) || 1;
                    if (curr > 1) setInboundCargoQty(curr - 1);
                  }}
                  className="h-9 w-8 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border-r border-slate-200 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={inboundCargoQty === 0 ? "" : inboundCargoQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setInboundCargoQty(0);
                    } else {
                      const parsed = parseInt(val, 10);
                      setInboundCargoQty(
                        isNaN(parsed) ? 0 : Math.max(0, parsed)
                      );
                    }
                  }}
                  onBlur={() => {
                    if (!inboundCargoQty || Number(inboundCargoQty) < 1) {
                      setInboundCargoQty(1);
                    }
                  }}
                  className="w-full h-9 text-center text-xs font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const curr = Number(inboundCargoQty) || 1;
                    setInboundCargoQty(curr + 1);
                  }}
                  className="h-9 w-8 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border-l border-slate-200 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="inboundCold"
                checked={inboundCargoCold}
                onChange={(e) => setInboundCargoCold(e.target.checked)}
                className="h-4 w-4 text-sky-600 rounded border-slate-300"
              />
              <label
                htmlFor="inboundCold"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Requires Cold Storage (-18°C)
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
