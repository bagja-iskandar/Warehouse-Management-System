"use client";

import React from "react";
import {
  UserCheck,
  Snowflake,
  Package,
  Weight,
  Boxes,
  Truck,
  User,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryOrder, Vehicle, User as UserType } from "@/types";
import {
  CompatibilityResult,
  DriverEligibilityResult,
  formatVehicleTypeName,
} from "@/lib/fleet-compatibility";

export interface LogisticsAssignModalProps {
  assigningOrder: DeliveryOrder | null;
  vehicleOptions: { vehicle: Vehicle; eval: CompatibilityResult }[];
  driverOptions: { driver: UserType; eval: DriverEligibilityResult }[];
  selectableVehicles: { vehicle: Vehicle; eval: CompatibilityResult }[];
  selectableDrivers: { driver: UserType; eval: DriverEligibilityResult }[];
  liveVehicles: Vehicle[];
  liveDrivers: UserType[];
  assignDriverId: string;
  setAssignDriverId: (id: string) => void;
  assignVehicleId: string;
  setAssignVehicleId: (id: string) => void;
  isAssigning: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LogisticsAssignModal({
  assigningOrder,
  vehicleOptions,
  driverOptions,
  selectableVehicles,
  selectableDrivers,
  liveVehicles,
  liveDrivers,
  assignDriverId,
  setAssignDriverId,
  assignVehicleId,
  setAssignVehicleId,
  isAssigning,
  onClose,
  onSubmit,
}: LogisticsAssignModalProps) {
  if (!assigningOrder) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAssigning) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Assign Driver & Fleet Dispatch
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10.5px] font-mono border-slate-200 text-slate-700 bg-slate-50 font-semibold"
                >
                  {assigningOrder.orderNumber}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Customer:{" "}
                <span className="font-semibold text-slate-700">
                  {assigningOrder.customerName || "Tenant"}
                </span>{" "}
                • Route:{" "}
                <span className="font-semibold text-slate-700">
                  {assigningOrder.originCity} → {assigningOrder.destinationCity}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Prominent Cargo Requirements Banner */}
        <div
          className={`p-4 rounded-xl border text-xs space-y-3 ${
            assigningOrder.requiresReefer
              ? "bg-gradient-to-br from-sky-50 via-blue-50/40 to-indigo-50/30 border-sky-200/90 shadow-sm"
              : "bg-slate-50 border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              {assigningOrder.requiresReefer ? (
                <div className="h-7 w-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Snowflake className="h-4 w-4" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Cargo Requirements
                  </span>
                  {assigningOrder.requiresReefer ? (
                    <Badge className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                      ❄️ -18°C Reefer Required
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-300 text-slate-700 bg-white font-semibold"
                    >
                      📦 Standard Dry / Ambient Fleet
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {assigningOrder.requiresReefer
                    ? "Fleet must have operational sub-zero refrigeration (-18°C capability)"
                    : "Dry goods — standard cargo van or box truck suitable"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10.5px] font-semibold text-slate-400 block uppercase tracking-wider">
                Cargo Commodity
              </span>
              <span className="font-bold text-slate-800 text-xs block mt-0.5 truncate">
                {assigningOrder.goodsSummary || "Standard Merchandise"}
              </span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                Total: {assigningOrder.totalPackages || 1} Packages
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
              <span className="text-[10.5px] font-semibold text-slate-400 block uppercase tracking-wider">
                Payload & Volume
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                  <Weight className="h-3 w-3 text-slate-500" />
                  {assigningOrder.totalWeightKg
                    ? Number(assigningOrder.totalWeightKg).toFixed(0)
                    : "0"}{" "}
                  kg
                </span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                  <Boxes className="h-3 w-3 text-slate-500" />
                  {assigningOrder.totalVolumeM3
                    ? Number(assigningOrder.totalVolumeM3).toFixed(2)
                    : "0.00"}{" "}
                  m³
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* 1. Select Dedicated Fleet Vehicle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Select Compatible Delivery Vehicle</span>
              </label>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {selectableVehicles.length} eligible / {liveVehicles.length} vehicles
              </span>
            </div>

            {/* Vehicle Selection Cards List */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {vehicleOptions.map(({ vehicle: veh, eval: vEval }, index) => {
                const isSelected = assignVehicleId === veh.id;
                const isSelectable = vEval.isSelectable;
                const isRecommended = isSelectable && index === 0;
                const isFirstNonSelectable =
                  !isSelectable &&
                  (index === 0 || vehicleOptions[index - 1].eval.isSelectable);

                return (
                  <React.Fragment key={veh.id}>
                    {isFirstNonSelectable && (
                      <div className="pt-2 pb-1 flex items-center gap-2">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Unavailable / Incompatible (
                          {vehicleOptions.length - selectableVehicles.length})
                        </span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>
                    )}

                    <div
                      onClick={() => {
                        if (isSelectable) setAssignVehicleId(veh.id);
                      }}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        isSelectable
                          ? isSelected
                            ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/30 cursor-pointer shadow-sm"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer bg-white"
                          : "border-slate-200/80 bg-slate-50/60 opacity-60 cursor-not-allowed border-dashed"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Radio / Selection Indicator */}
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : isSelectable
                                ? "border-slate-300 bg-white"
                                : "border-slate-200 bg-slate-100"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-1.5 w-1.5 bg-white rounded-full" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {veh.plateNumber}
                              </span>
                              {isRecommended && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  ⭐ Recommended
                                </span>
                              )}
                              <span className="text-slate-400">•</span>
                              <span className="font-semibold text-slate-800 text-xs">
                                {veh.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                              <span className="text-slate-600 font-medium">
                                {formatVehicleTypeName(veh.type)}
                              </span>
                              <span>•</span>
                              <span>
                                Max: {veh.maxWeightKg} kg / {veh.maxVolumeM3} m³
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Cooling & Status Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {veh.hasRefrigeration ||
                          veh.type === "REEFER_TRUCK" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                              <Snowflake className="h-3 w-3" />
                              {veh.minTempCelsius
                                ? `${veh.minTempCelsius}°C REEFER`
                                : "-18°C REEFER"}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              📦 No Cooling
                            </span>
                          )}

                          {isSelectable ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ● AVAILABLE
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              {vEval.reason
                                ? vEval.reason.split("—")[1]?.trim() ||
                                  vEval.badgeLabel
                                : vEval.badgeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 2. Select Certified Driver PIC */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-indigo-600" />
                <span>Select Certified Driver PIC</span>
              </label>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {selectableDrivers.length} ready / {liveDrivers.length} drivers
              </span>
            </div>

            {/* Driver Selection Cards List */}
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {driverOptions.map(({ driver: drv, eval: dEval }, index) => {
                const isSelected = assignDriverId === drv.id;
                const isSelectable = dEval.isSelectable;
                const isRecommended = isSelectable && index === 0;
                const isFirstNonSelectable =
                  !isSelectable &&
                  (index === 0 || driverOptions[index - 1].eval.isSelectable);

                return (
                  <React.Fragment key={drv.id}>
                    {isFirstNonSelectable && (
                      <div className="pt-2 pb-1 flex items-center gap-2">
                        <div className="h-px bg-slate-200 flex-1" />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Unavailable Drivers (
                          {driverOptions.length - selectableDrivers.length})
                        </span>
                        <div className="h-px bg-slate-200 flex-1" />
                      </div>
                    )}

                    <div
                      onClick={() => {
                        if (isSelectable) setAssignDriverId(drv.id);
                      }}
                      className={`p-2.5 rounded-xl border transition-all text-xs ${
                        isSelectable
                          ? isSelected
                            ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500/30 cursor-pointer shadow-sm"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer bg-white"
                          : "border-slate-200/80 bg-slate-50/60 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {/* Radio / Selection Indicator */}
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : isSelectable
                                ? "border-slate-300 bg-white"
                                : "border-slate-200 bg-slate-100"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-1.5 w-1.5 bg-white rounded-full" />
                            )}
                          </div>

                          <div className="h-7 w-7 rounded-lg bg-indigo-100/70 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {drv.name.charAt(0)}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs block leading-tight">
                                {drv.name}
                              </span>
                              {isRecommended && (
                                <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  ⭐ Recommended
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              {drv.phone || "No Phone"} •{" "}
                              {drv.driverLicenseNumber || "SIM B2 Umum"}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isSelectable ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Ready & Available
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {dEval.reason
                                ? dEval.reason.split("—")[1]?.trim() ||
                                  dEval.badgeLabel
                                : dEval.badgeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isAssigning}
              onClick={onClose}
              className="text-xs border-slate-300 text-slate-700 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isAssigning ||
                !assignDriverId ||
                !assignVehicleId ||
                selectableVehicles.length === 0 ||
                selectableDrivers.length === 0
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Dispatch...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Confirm Assignment & Queue</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
