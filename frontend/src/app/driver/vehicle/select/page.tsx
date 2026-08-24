"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Car,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Gauge,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  EmptyState,
} from "@/components/dashboard";
import { useVehicles, useAssignVehicle } from "@/hooks/use-logistics";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface SelectableVehicle {
  id: string;
  name: string;
  plateNumber: string;
  type: "REEFER" | "BOX" | "VAN";
  capacityM3: number;
  hasReefer: boolean;
  temp: string;
  status: "AVAILABLE" | "IN_USE";
  hubLocation: string;
}

const VEHICLES_LIST: SelectableVehicle[] = [
  {
    id: "veh-01",
    name: "Isuzu Giga FVR Reefer Truck",
    plateNumber: "B 9821 TKN",
    type: "REEFER",
    capacityM3: 12,
    hasReefer: true,
    temp: "-18.2°C",
    status: "AVAILABLE",
    hubLocation: "Cakung Logistics Central Hub (JKT-01)",
  },
  {
    id: "veh-02",
    name: "Hino Dutro 130 HD Box Truck",
    plateNumber: "B 1234 XYZ",
    type: "BOX",
    capacityM3: 16,
    hasReefer: false,
    temp: "Standard Dry",
    status: "AVAILABLE",
    hubLocation: "Cakung Logistics Central Hub (JKT-01)",
  },
  {
    id: "veh-03",
    name: "Daihatsu GranMax Blind Van",
    plateNumber: "B 5678 KLM",
    type: "VAN",
    capacityM3: 4,
    hasReefer: false,
    temp: "Standard Dry",
    status: "AVAILABLE",
    hubLocation: "Cakung Logistics Central Hub (JKT-01)",
  },
];

export default function VehicleSelectionPage() {
  const { user } = useAuth();
  const { data: liveVehicles } = useVehicles();
  const assignVehicleMutation = useAssignVehicle();
  const [selectedVehicleId, setSelectedVehicleId] = useState("veh-01");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const activeVehicles: SelectableVehicle[] =
    liveVehicles && liveVehicles.length > 0
      ? liveVehicles.map((v) => ({
          id: v.id,
          name: v.name,
          plateNumber: v.plateNumber,
          type:
            v.type === "REEFER_TRUCK"
              ? "REEFER"
              : v.type === "VAN"
              ? "VAN"
              : "BOX",
          capacityM3: v.maxVolumeM3 || 10,
          hasReefer: Boolean(v.hasRefrigeration),
          temp: v.hasRefrigeration ? "-18.2°C" : "Standard Dry",
          status: v.status === "AVAILABLE" ? "AVAILABLE" : "IN_USE",
          hubLocation: v.locationCity || "Cakung Logistics Central Hub (JKT-01)",
        }))
      : VEHICLES_LIST;

  const handleSelect = async () => {
    try {
      if (user?.id) {
        await assignVehicleMutation.mutateAsync({
          driverId: user.id,
          vehicleId: selectedVehicleId,
        });
      }
      setIsConfirmed(true);
      toast.success("Fleet Vehicle Assigned Successfully", {
        description: `Vehicle is now active for your delivery shift.`,
      });
    } catch (err: any) {
      toast.error("Failed to assign vehicle", {
        description: err?.message || "An unexpected error occurred.",
      });
    }
  };

  const selectedVehicle = activeVehicles.find((v) => v.id === selectedVehicleId);

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Driver Workstation > Vehicle Assignment"
        title="Fleet Vehicle Selection & Shift Assignment"
        subtitle="Select the active truck or van you will be driving for your operational delivery shift."
        badgeText="Shift Assignment"
        badgeColor="bg-amber-500 text-slate-950"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/driver/dashboard">
              <Button
                variant="outline"
                className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9"
              >
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        }
      />

      {isConfirmed ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Vehicle Assigned to Your Profile!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            You are now assigned to <strong className="text-slate-800">{selectedVehicle?.name}</strong> (<strong className="font-mono text-indigo-600">{selectedVehicle?.plateNumber}</strong>). All telemetry data and delivery work orders are bound to this unit.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/driver/tasks">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-9 px-5 shadow-sm">
                View Assigned Tasks →
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setIsConfirmed(false)}
              className="text-xs h-9"
            >
              Change Vehicle
            </Button>
          </div>
        </div>
      ) : (
        <SectionCard
          title="Available Logistics Fleet Registry"
          subtitle="Choose the operational vehicle matching your payload temperature and capacity requirements"
          icon={Truck}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
            {activeVehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id;
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`bg-white border-2 rounded-2xl p-6 shadow-sm cursor-pointer transition-all space-y-4 ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                        vehicle.hasReefer
                          ? "bg-sky-50 text-sky-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {vehicle.hasReefer ? (
                        <Thermometer className="h-5 w-5" />
                      ) : (
                        <Truck className="h-5 w-5" />
                      )}
                    </div>

                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {vehicle.plateNumber}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{vehicle.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{vehicle.hubLocation}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">Capacity:</span>
                      <span className="font-bold text-slate-800 font-mono">{vehicle.capacityM3} m³</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-400 block">Unit Temp:</span>
                      <span className="font-bold text-sky-700 font-mono">{vehicle.temp}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSelect}
                    className={`w-full text-xs font-bold h-9 rounded-xl ${
                      isSelected
                        ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isSelected ? "Use This Vehicle" : "Select Vehicle"}
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
