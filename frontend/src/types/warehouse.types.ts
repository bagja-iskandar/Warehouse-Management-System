export type StorageZoneType = "STANDARD" | "COLD_STORAGE" | "HEAVY_DUTY";

export type SlotStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface StorageSlot {
  id: string;
  warehouseId: string;
  code: string; // e.g. "RAK-A01", "COLD-01"
  zone: StorageZoneType;
  capacityM3: number;
  usedM3: number;
  temperatureCelsius?: number; // For cold storage monitoring
  humidityPercent?: number;
  status: SlotStatus;
  currentGoodsIds: string[];
  storedGoods?: Array<{
    id: string;
    barcode: string;
    name: string;
    quantity: number;
    unit: string;
    volumeM3: number;
    weightKg: number;
    category: string;
    customerName: string;
    customerCompany?: string | null;
    storageStartDate?: string | null;
  }>;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string; // e.g. "WH-JKT-01"
  address: string;
  city: string;
  totalCapacityM3: number;
  usedCapacityM3: number;
  slotsCount: number;
  occupiedSlotsCount: number;
  zones: {
    standardCapacityM3: number;
    coldStorageCapacityM3: number;
  };
  isActive: boolean;
  managerName: string;
  contactPhone: string;
}

export interface WarehouseDetail extends Warehouse {
  slots: StorageSlot[];
}
