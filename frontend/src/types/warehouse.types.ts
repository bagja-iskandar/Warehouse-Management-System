export type StorageZoneType = "STANDARD" | "COLD_STORAGE" | "HEAVY_DUTY";

export type SlotStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface StoredGoodDetail {
  id: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  dimensions?: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  unitVolumeM3?: number;
  volumeM3: number;
  unitWeightKg?: number;
  weightKg: number;
  status: string;
  currentTemp?: number | null;
  customerId: string;
  customerName: string;
  customerCompany?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  storageStartDate?: string | null;
  storageEndDate?: string | null;
}

export interface StorageSlot {
  id: string;
  warehouseId: string;
  zoneId?: string | null;
  code: string; // e.g. "RAK-A01", "COLD-B01"
  zone: StorageZoneType;
  capacityM3: number;
  usedM3: number;
  availableM3?: number;
  volumeUtilizationPercent?: number;
  maxWeightKg?: number;
  usedWeightKg?: number;
  availableWeightKg?: number;
  weightUtilizationPercent?: number;
  temperatureCelsius?: number | null;
  humidityPercent?: number | null;
  status: SlotStatus | string;
  capacityStatus?: string;
  customerCount?: number;
  totalPackagesCount?: number;
  currentGoodsCount?: number;
  currentGoodsIds: string[];
  storedGoods?: StoredGoodDetail[];
}

export interface CustomerRentalSummary {
  rentedVolumeM3: number;
  rentedWeightKg: number;
  startDate: string;
  endDate: string;
  durationMonths: number;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "PENDING_PAYMENT";
  isExpired: boolean;
  storageType: StorageZoneType;
  monthlyFee?: number;
  invoiceNumber?: string;
}

export interface CustomerUtilization {
  storedVolumeM3: number;
  storedWeightKg: number;
  storedCount: number;
  receivingVolumeM3: number;
  receivingWeightKg: number;
  receivingCount: number;
  waitingInboundVolumeM3: number;
  waitingInboundWeightKg: number;
  waitingInboundCount: number;
  usedVolumeM3: number;
  usedWeightKg: number;
  availableVolumeM3: number;
  availableWeightKg: number;
  volumeUtilizationPercent: number;
  weightUtilizationPercent: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string; // e.g. "WH-JKT-01"
  address: string;
  city: string;
  totalCapacityM3: number;
  usedCapacityM3: number;
  occupancyPercent?: number;
  slotsCount: number;
  occupiedSlotsCount: number;
  zones: {
    standardCapacityM3: number;
    coldStorageCapacityM3: number;
    heavyDutyCapacityM3?: number;
  };
  isActive: boolean;
  managerName: string;
  contactPhone: string;
  customerRental?: CustomerRentalSummary;
  customerUtilization?: CustomerUtilization;
}

export interface WarehouseDetail extends Warehouse {
  slots: StorageSlot[];
}
