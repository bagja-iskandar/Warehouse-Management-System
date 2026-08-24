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

/**
 * In-Memory Mock Implementation (Local Development & Offline Testing)
 */
export class MockTelemetryService implements ITelemetryService {
  async getMonitoringSnapshot(): Promise<TelemetryMonitoringData> {
    return {
      summary: {
        totalMonitoredSensors: 4,
        activeAnomaliesCount: 0,
        coldStorageSafeCount: 3,
        coldStorageWarningCount: 1,
        coldStorageCriticalCount: 0,
        averageColdTempCelsius: -19.4,
      },
      slots: [
        {
          slotId: "slot-c01",
          slotCode: "COLD-A01",
          warehouseId: "wh-jkt-central",
          warehouseName: "Cakung Logistics Central Hub",
          warehouseCode: "WH-CKG-01",
          currentTempCelsius: -18.5,
          humidityPercent: 85,
          status: "OCCUPIED",
          condition: "SAFE",
          goodsCount: 1,
          storedGoodsNames: ["Norwegian Salmon Fillet Grade A"],
        },
        {
          slotId: "slot-c02",
          slotCode: "COLD-A02",
          warehouseId: "wh-jkt-central",
          warehouseName: "Cakung Logistics Central Hub",
          warehouseCode: "WH-CKG-01",
          currentTempCelsius: -20.0,
          humidityPercent: 82,
          status: "OCCUPIED",
          condition: "SAFE",
          goodsCount: 1,
          storedGoodsNames: ["Australian Premium Wagyu Beef Ribeye"],
        },
      ],
      vehicles: [
        {
          vehicleId: "veh-01",
          plateNumber: "B 9821 WMS",
          name: "Isuzu Giga Reefer Cold Truck 5T",
          currentDriverName: "Agus Pratama (Driver)",
          currentTempCelsius: -19.2,
          minTempCelsius: -25.0,
          condition: "SAFE",
          status: "AVAILABLE",
        },
      ],
    };
  }

  async getTelemetryLogs(): Promise<TelemetryLog[]> {
    return [
      {
        id: "1",
        slotId: "slot-c01",
        slotCode: "COLD-A01",
        warehouseName: "Cakung Logistics Central Hub",
        temperatureCelsius: -18.5,
        humidityPercent: 85,
        isAnomaly: false,
        recordedAt: new Date().toISOString(),
      },
    ];
  }

  async ingestTelemetry(data: {
    warehouseId?: string;
    slotId?: string;
    vehicleId?: string;
    temperatureCelsius: number;
    humidityPercent?: number;
  }): Promise<TelemetryLog> {
    return {
      id: `tel-${Date.now()}`,
      ...data,
      isAnomaly: data.temperatureCelsius > -18.0,
      recordedAt: new Date().toISOString(),
    };
  }
}

// Service Factory / Dependency Injection Selection
const isMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
export const telemetryService: ITelemetryService = isMock
  ? new MockTelemetryService()
  : new HttpTelemetryService();
