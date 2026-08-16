export type GoodsCategory = "FURNITURE" | "COLD_FOOD" | "GENERAL_ELECTRONICS" | "TEXTILE";

export type GoodsStorageStatus =
  | "DRAFT"
  | "PENDING_PICKUP"
  | "IN_TRANSIT_INBOUND"
  | "INSPECTING"
  | "STORED"
  | "PENDING_DELIVERY"
  | "IN_TRANSIT_OUTBOUND"
  | "DELIVERED"
  | "CANCELLED";

export interface GoodsDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number;
  weightKg: number;
}

export interface GoodsHistoryEvent {
  id: string;
  goodsId: string;
  status: GoodsStorageStatus;
  title: string;
  description: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  location?: string;
}

export interface GoodsItem {
  id: string;
  barcode: string; // e.g. "BRG-2026-X9A2"
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  slotId?: string;
  slotCode?: string;
  name: string;
  category: GoodsCategory;
  description: string;
  dimensions: GoodsDimensions;
  quantity: number;
  unit: string; // e.g. "Box", "Pallet", "Pcs"
  requiresColdStorage: boolean;
  targetTemperatureMin?: number;
  targetTemperatureMax?: number;
  currentTemperature?: number;
  storageStartDate: string;
  storageEndDate?: string;
  monthlyRentalFee: number;
  status: GoodsStorageStatus;
  imageUrl?: string;
  history: GoodsHistoryEvent[];
  qrCodeData: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoodsInput {
  name: string;
  category: GoodsCategory;
  description: string;
  dimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
  };
  quantity: number;
  unit: string;
  requiresColdStorage: boolean;
  warehouseId: string;
  pickupRequired: boolean;
  pickupAddress?: string;
  pickupDate?: string;
}
