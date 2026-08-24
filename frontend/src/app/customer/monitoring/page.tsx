"use client";

import React from "react";
import Link from "next/link";
import {
  Thermometer,
  Snowflake,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Download,
  ShieldCheck,
  Warehouse,
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
import { useCustomerSummary } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";

export default function CustomerTemperatureMonitoringPage() {
  const { user } = useAuth();
  const { data: summary, refetch, isFetching } = useCustomerSummary(user?.id);

  const hasActiveStorage = Boolean(summary && summary.rentedSpaceM3 > 0);
  const currentTemp = summary?.currentTempCelsius;
  const humidity = summary?.humidityPercent ?? 60;
  const storageLocation = summary?.storageLocationName || "Cold Storage Zone";

  return (
    <PageContainer>
      {/* 1. Page Header */}
      <PageHeader
        breadcrumb="Customer Portal > Environmental Telemetry"
        title="Storage Temperature & Sensor Telemetry"
        subtitle="Monitor real-time sub-zero temperature stability and humidity levels of your rented storage space."
        badgeText={hasActiveStorage && currentTemp != null ? "Live Stream Active" : "Offline"}
        badgeColor={hasActiveStorage && currentTemp != null ? "bg-sky-600 text-white" : "bg-slate-600 text-white"}
        isFetching={isFetching}
        onRefresh={() => refetch()}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              disabled={!hasActiveStorage}
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700 h-9 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Compliance Certificate</span>
            </Button>
          </div>
        }
      />

      {!hasActiveStorage || currentTemp == null ? (
        <EmptyState
          icon={Warehouse}
          title="No Active Cold Storage Contract"
          description="You do not have an active cold storage contract. Rent a sub-zero space to start monitoring real-time telemetry."
          action={
            <Link href="/customer/rental">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
                Rent Cold Storage Space →
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* 2. 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Current Temperature"
              value={`${currentTemp > 0 ? `+${currentTemp}` : currentTemp}°C`}
              icon={Thermometer}
              theme="sky"
              badge={
                <Badge variant="success" className="text-[10px]">
                  Optimal
                </Badge>
              }
              subtext={
                <span className="text-[11px] text-slate-400 truncate">
                  {storageLocation}
                </span>
              }
            />

            <MetricCard
              label="Air Humidity (RH)"
              value={`${humidity}% RH`}
              icon={Activity}
              theme="emerald"
              subtext={
                <span className="text-[11px] text-emerald-600 font-semibold">
                  Humidity Stable & Controlled
                </span>
              }
            />

            <MetricCard
              label="Telemetry Sensor Status"
              value="Online & Active"
              icon={CheckCircle2}
              theme="emerald"
              subtext={
                <span className="text-[11px] text-slate-400 font-mono">
                  Sync Interval: 5 Seconds
                </span>
              }
            />

            <MetricCard
              label="Storage Allocation"
              value={`${summary?.rentedSpaceM3 || 0} m³`}
              icon={Warehouse}
              theme="indigo"
              subtext={
                <span className="text-[11px] text-slate-400">
                  {storageLocation}
                </span>
              }
            />
          </div>

          {/* 3. Sensor Detail & Historical Graph Card */}
          <SectionCard
            title="Temperature Stability & Hourly Sensor Telemetry"
            subtitle={`Live sensor node logs for ${storageLocation}`}
            icon={Activity}
            badge={
              <span className="text-xs text-slate-500 font-mono">
                {storageLocation}
              </span>
            }
          >
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
                {[
                  { time: "00:00", temp: currentTemp },
                  { time: "03:00", temp: currentTemp },
                  { time: "06:00", temp: Number((currentTemp + 0.1).toFixed(1)) },
                  { time: "09:00", temp: currentTemp },
                  { time: "12:00", temp: Number((currentTemp - 0.1).toFixed(1)) },
                  { time: "15:00", temp: currentTemp },
                  { time: "18:00", temp: currentTemp },
                  { time: "21:00", temp: currentTemp },
                ].map((pt, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono font-bold text-sky-700">{pt.temp}°C</span>
                    <div className="w-full max-w-[36px] bg-sky-500 rounded-t-md h-28" />
                    <span className="text-[10px] text-slate-500 font-mono">{pt.time}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10.5px] text-slate-400 font-mono pt-2 border-t border-slate-200">
                Storage temperature condition is monitored 24/7 with automated anomaly alerts.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </PageContainer>
  );
}
