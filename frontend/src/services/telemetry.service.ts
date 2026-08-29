import { apiClient } from "@/lib/api-client";
import { TelemetryLog, TelemetryMonitoringData } from "@/types";

export interface ITelemetryService {
  getMonitoringSnapshot(warehouseId?: string): Promise<TelemetryMonitoringData>;
  getTelemetryLogs(params?: {
    warehouseId?: string;
    vehicleId?: string;
    isAnomaly?: boolean;
  }): Promise<TelemetryLog[]>;
  ingestTelemetry(data: {
    warehouseId?: string;
    slotId?: string;
    vehicleId?: string;
    temperatureCelsius: number;
    humidityPercent?: number;
  }): Promise<TelemetryLog>;
}

/**
 * Backend REST API Implementation (Live NestJS + PostgreSQL)
 */
export class HttpTelemetryService implements ITelemetryService {
  async getMonitoringSnapshot(warehouseId?: string): Promise<TelemetryMonitoringData> {
    const url = warehouseId
      ? `/telemetry/monitoring?warehouseId=${encodeURIComponent(warehouseId)}`
      : "/telemetry/monitoring";
    const res = await apiClient<TelemetryMonitoringData>(url);
    return res;
  }

  async getTelemetryLogs(params?: {
    warehouseId?: string;
    vehicleId?: string;
    isAnomaly?: boolean;
  }): Promise<TelemetryLog[]> {
    const res = await apiClient<{ items: TelemetryLog[]; totalItems: number }>(
      "/telemetry/logs",
      { params: params as any }
    );
    return res?.items || (Array.isArray(res) ? res : []);
  }

  async ingestTelemetry(data: {
    slotId?: string;
    vehicleId?: string;
    temperatureCelsius: number;
    humidityPercent?: number;
  }): Promise<TelemetryLog> {
    const payload: Record<string, any> = {
      temperatureCelsius: Number(data.temperatureCelsius),
    };
    if (data.slotId) payload.slotId = data.slotId;
    if (data.vehicleId) payload.vehicleId = data.vehicleId;
    if (data.humidityPercent != null)
      payload.humidityPercent = Number(data.humidityPercent);

    const res = await apiClient<TelemetryLog>("/telemetry/ingest", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  }
}

export const telemetryService: ITelemetryService = new HttpTelemetryService();
