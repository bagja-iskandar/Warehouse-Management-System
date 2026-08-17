# FRONTEND DOMAIN MODELS & ENTITY SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Spesifikasi Entitas Domain, Tipe Data TypeScript & Panduan Relasi PostgreSQL*

---

## 1. Domain Entities Overview

```text
┌──────────────┐       1:N       ┌──────────────────┐       1:N       ┌──────────────┐
│  Warehouse   │─────────────────│   StorageSlot    │─────────────────│  GoodsItem   │
└──────────────┘                 └──────────────────┘                 └──────┬───────┘
                                                                             │
┌──────────────┐       1:N       ┌──────────────────┐                        │
│     User     │─────────────────│     Invoice      │                        │ N:M (Items)
│ (Cust/Driver)│                 └──────────────────┘                        │
└──────┬───────┘                                                             │
       │ 1:N                                                                 │
       ▼                                                                     ▼
┌──────────────┐       1:N       ┌──────────────────┐                 ┌──────────────┐
│   Vehicle    │─────────────────│  DeliveryOrder   │◀────────────────│ OrderManifest│
└──────────────┘                 └──────────────────┘                 └──────────────┘
```

---

## 2. Definisi Entitas & TypeScript Interfaces

### 2.1 User & Identity Domain
```typescript
export type UserRole = "ADMIN" | "CUSTOMER" | "DRIVER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface UserProfile {
  id: string; // UUID Primary Key
  name: string;
  email: string; // Unique, lowercase
  role: UserRole;
  phone: string;
  avatarUrl?: string;
  companyName?: string; // Khusus Customer
  address?: string;
  status: UserStatus;
  createdAt: string; // ISO 8601
}
```

### 2.2 Warehouse & Capacity Domain
```typescript
export type StorageZoneType = "STANDARD" | "COLD_STORAGE" | "HEAVY_DUTY";
export type SlotStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export interface StorageSlot {
  id: string; // UUID Primary Key
  warehouseId: string; // Foreign Key -> Warehouse
  code: string; // e.g. "A-01-01", "COLD-01"
  zone: StorageZoneType;
  capacityM3: number; // Volume maksimal (m³)
  usedM3: number; // Volume terisi (m³)
  temperatureCelsius?: number; // Real-time IoT sensor (-18.4°C)
  humidityPercent?: number; // Kelembaban RH (65%)
  status: SlotStatus;
  currentGoodsIds: string[];
}

export interface Warehouse {
  id: string; // UUID Primary Key
  code: string; // e.g. "WH-CKG-01"
  name: string;
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
```

### 2.3 Goods & Inventory Domain
```typescript
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
  volumeM3: number; // Formula: (lengthCm * widthCm * heightCm) / 1,000,000
  weightKg: number;
}

export interface GoodsItem {
  id: string; // UUID Primary Key
  barcode: string; // Unique identifier, e.g. "BRG-2026-X9A2"
  customerId: string; // Foreign Key -> Users (Customer)
  customerName: string;
  warehouseId: string; // Foreign Key -> Warehouse
  warehouseName: string;
  slotId?: string; // Foreign Key -> StorageSlot
  slotCode?: string; // e.g. "A-01-01"
  name: string;
  category: GoodsCategory;
  description: string;
  dimensions: GoodsDimensions;
  quantity: number;
  unit: string; // "Koli", "Box", "Pallet", "Pcs"
  requiresColdStorage: boolean;
  targetTemperatureMin?: number; // e.g. -25°C
  targetTemperatureMax?: number; // e.g. -18°C
  currentTemperature?: number;
  storageStartDate: string;
  storageEndDate?: string;
  monthlyRentalFee: number; // Biaya sewa bulanan
  status: GoodsStorageStatus;
  imageUrl?: string;
  qrCodeData: string; // Format: "WMS://ITEM/{barcode}"
  createdAt: string;
  updatedAt: string;
}
```

### 2.4 Fleet, Vehicles & Logistics Domain
```typescript
export type VehicleType = "VAN" | "BOX_TRUCK_SMALL" | "REEFER_TRUCK" | "WING_BOX_LARGE";
export type OrderType = "PICKUP" | "DELIVERY";
export type OrderStatus =
  | "PENDING_ASSIGNMENT"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_DESTINATION"
  | "DELIVERED"
  | "CONFIRMED"
  | "DELAYED"
  | "CANCELLED";

export interface Vehicle {
  id: string; // UUID Primary Key
  plateNumber: string; // Unique, e.g. "B 9821 TKN"
  name: string;
  type: VehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  hasRefrigeration: boolean; // True jika truk reefer
  minTempCelsius?: number; // e.g. -20°C
  status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE";
  currentDriverId?: string;
  currentDriverName?: string;
  locationCity: string;
}

export interface DeliveryOrder {
  id: string; // UUID Primary Key
  orderNumber: string; // Unique, e.g. "DO-2026-001"
  type: OrderType;
  customerId: string; // Foreign Key -> Users (Customer)
  customerName: string;
  customerPhone: string;
  goodsItemIds: string[]; // Relasi items yang dimuat
  goodsSummary: string;
  totalVolumeM3: number;
  totalWeightKg: number;
  requiresReefer: boolean;
  originAddress: string;
  destinationAddress: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  driverId?: string; // Foreign Key -> Users (Driver)
  driverName?: string;
  vehicleId?: string; // Foreign Key -> Vehicle
  vehiclePlate?: string;
  status: OrderStatus;
  proofOfDeliveryUrl?: string;
  recipientName?: string;
  recipientRole?: string;
  customerRating?: number; // 1.0 - 5.0 Bintang
  createdAt: string;
  updatedAt: string;
}
```

### 2.5 Billing & Invoices Domain
```typescript
export type InvoiceStatus = "UNPAID" | "PENDING_VERIFICATION" | "PAID" | "OVERDUE" | "CANCELLED";

export interface InvoiceItem {
  id: string;
  description: string;
  goodsName?: string;
  volumeM3: number;
  ratePerM3: number;
  subtotal: number;
}

export interface Invoice {
  id: string; // UUID Primary Key
  invoiceNumber: string; // Unique, e.g. "INV-2026-08-0142"
  customerId: string; // Foreign Key -> Users (Customer)
  customerName: string;
  customerEmail: string;
  billingMonth: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  penaltyFee: number; // Denda 5% per minggu terlambat
  totalAmount: number; // subtotal + penaltyFee
  status: InvoiceStatus;
  paymentMethod?: "BANK_TRANSFER" | "QRIS" | "VIRTUAL_ACCOUNT";
  paymentProofUrl?: string;
  createdAt: string;
}
```
