export interface TelemetryMonitoringSummary {
  totalMonitoredSensors: number;
  activeAnomaliesCount: number;
  coldStorageSafeCount: number;
  coldStorageWarningCount: number;
  coldStorageCriticalCount: number;
  averageColdTempCelsius: number;
}

export interface ColdStorageSlotMonitoring {
  slotId: string;
  slotCode: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  currentTempCelsius: number;
  humidityPercent?: number | null;
  status: string;
  condition: "SAFE" | "WARNING" | "CRITICAL";
  goodsCount: number;
  storedGoodsNames: string[];
}

export interface ReeferVehicleMonitoring {
  vehicleId: string;
  plateNumber: string;
  name: string;
  currentDriverName?: string | null;
  currentTempCelsius: number;
  minTempCelsius?: number | null;
  condition: "SAFE" | "WARNING" | "CRITICAL";
  status: string;
}

export interface TelemetryMonitoringData {
  summary: TelemetryMonitoringSummary;
  slots: ColdStorageSlotMonitoring[];
  vehicles: ReeferVehicleMonitoring[];
}

export interface TelemetryLog {
  id: string;
  slotId?: string | null;
  slotCode?: string | null;
  warehouseName?: string | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  temperatureCelsius: number;
  humidityPercent?: number | null;
  isAnomaly: boolean;
  recordedAt: string;
}
