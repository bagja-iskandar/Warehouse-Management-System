# Domain Models & Relational Entity Specification
**Warehouse Management System (WMS Nusantara)**
*Universal Domain Models, TypeScript Entity Interfaces, and PostgreSQL / Prisma Schema Mapping*

---

## 1. Domain Entity Relationship Diagram (ERD)

```text
┌──────────────┐       1:N       ┌──────────────────┐       1:N       ┌──────────────┐
│  Warehouse   │─────────────────│   StorageSlot    │─────────────────│  GoodsItem   │
└──────────────┘                 └──────────────────┘                 └──────┬───────┘
                                                                             │
┌──────────────┐       1:N       ┌──────────────────┐                        │
│     User     │─────────────────│     Invoice      │                        │ N:M (Items)
│ (Admin/Cust/ │                 └──────────────────┘                        │
│   Driver)    │                          │ 1:N                              │
└──────┬───────┘                          ▼                                  │
       │                         ┌──────────────────┐                        │
       │ 1:N                     │   InvoiceItem    │                        │
       ▼                         └──────────────────┘                        ▼
┌──────────────┐       1:N       ┌──────────────────┐                 ┌──────────────┐
│   Vehicle    │─────────────────│  DeliveryOrder   │◀────────────────│  OrderItem   │
└──────────────┘                 └──────────────────┘                 └──────────────┘
```

---

## 2. Core Domain Entities & TypeScript Contracts

### 2.1 User & Identity Domain
```typescript
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface UserProfile {
  id: string;                    // UUID Primary Key
  name: string;
  email: string;                 // Unique, lowercase
  role: UserRole;
  phone: string;
  avatarUrl?: string | null;
  companyName?: string | null;   // Khusus Customer
  address?: string | null;
  status: UserStatus;
  createdAt: string;             // ISO 8601
}
```

### 2.2 Warehouse & Capacity Domain
```typescript
export type StorageZoneType = 'STANDARD' | 'COLD_STORAGE' | 'HEAVY_DUTY';
export type SlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface Warehouse {
  id: string;                    // UUID Primary Key
  code: string;                  // e.g. "WH-JKT-01"
  name: string;
  city: string;
  address: string;
  totalCapacityM3: number;
  usedCapacityM3: number;
  availableCapacityM3: number;
  utilizationRatePercent: number;
  isActive: boolean;
}

export interface StorageSlot {
  id: string;                    // UUID Primary Key
  warehouseId: string;           // Foreign Key -> Warehouse
  code: string;                  // e.g. "A-01-01", "COLD-01"
  zone: StorageZoneType;
  capacityM3: number;            // Volume maksimal slot (m³)
  usedM3: number;                // Volume terisi (m³)
  status: SlotStatus;
  temperatureCelsius?: number;   // Real-time IoT sensor (-18.4°C)
}
```

### 2.3 Goods & Inventory Domain
```typescript
export type GoodsCategory = 'FOOD_FROZEN' | 'FURNITURE' | 'ELECTRONICS' | 'PHARMACEUTICAL' | 'GENERAL';
export type GoodsStorageStatus = 
  | 'DRAFT'
  | 'PENDING_PICKUP'
  | 'IN_TRANSIT_INBOUND'
  | 'INSPECTION'
  | 'STORED'
  | 'PENDING_DELIVERY'
  | 'IN_TRANSIT_OUTBOUND'
  | 'DELIVERED'
  | 'CANCELLED';

export interface GoodsItem {
  id: string;                    // UUID Primary Key
  customerId: string;            // Foreign Key -> User (Customer)
  warehouseId: string;           // Foreign Key -> Warehouse
  slotId?: string | null;        // Foreign Key -> StorageSlot (saat STORED)
  barcode: string;               // Unique e.g. "BRG-2026-001"
  name: string;
  category: GoodsCategory;
  quantity: number;
  unit: string;                  // e.g. "Box", "Pcs", "Pallet"
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeM3: number;              // Server-calculated: (P x L x T / 10^6) * Qty
  weightKg: number;
  requiresColdStorage: boolean;
  minTempCelsius?: number;
  maxTempCelsius?: number;
  status: GoodsStorageStatus;
  monthlyRentalPrice: number;    // IDR
  inboundDate?: string;
}
```

### 2.4 Logistics & Fleet Domain
```typescript
export type VehicleType = 'REEFER_TRUCK' | 'BOX_TRUCK' | 'VAN' | 'CONTAINER';
export type VehicleStatus = 'AVAILABLE' | 'IN_SERVICE' | 'MAINTENANCE';

export type OrderType = 'INBOUND_PICKUP' | 'OUTBOUND_DELIVERY';
export type OrderStatus =
  | 'PENDING'
  | 'DRIVER_ASSIGNED'
  | 'EN_ROUTE'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Vehicle {
  id: string;
  plateNumber: string;           // Unique e.g. "B 9876 WMS"
  type: VehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  status: VehicleStatus;
  currentDriverId?: string | null;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;           // Unique e.g. "ORD-2026-092"
  type: OrderType;
  customerId: string;
  driverId?: string | null;
  vehicleId?: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledTime: string;
  status: OrderStatus;
  totalVolumeM3: number;
  totalWeightKg: number;
  podPhotoUrl?: string | null;
  podSignatureUrl?: string | null;
  podReceivedByName?: string | null;
}
```

### 2.5 Billing & Financial Domain
```typescript
export type InvoiceStatus = 'UNPAID' | 'PENDING_PAYMENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'VIRTUAL_ACCOUNT' | 'BANK_TRANSFER' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface Invoice {
  id: string;
  invoiceNumber: string;         // Unique e.g. "INV-2026-08-001"
  customerId: string;
  billingMonth: string;          // e.g. "2026-08"
  subtotal: number;
  penaltyFee: number;            // 5% per minggu keterlambatan
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string | null;
}
```

### 2.6 IoT Telemetry Domain
```typescript
export type TelemetryCondition = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface TelemetryLog {
  id: string;
  slotId?: string | null;
  vehicleId?: string | null;
  temperatureCelsius: number;
  humidityPercent: number;
  isAnomaly: boolean;
  recordedAt: string;
}
```

---

## 3. PostgreSQL / Prisma Relational Schema Mapping

| Relational Model | Primary Key | Foreign Keys | Unique Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `User` | `id` (UUID) | None | `email` (Unique), `role`, `status` |
| `RefreshToken` | `id` (UUID) | `userId` $\rightarrow$ `User.id` | `tokenHash` (Unique), `userId` (Index) |
| `Warehouse` | `id` (UUID) | None | `code` (Unique), `city` (Index) |
| `StorageZone` | `id` (UUID) | `warehouseId` $\rightarrow$ `Warehouse.id` | `(warehouseId, type)` (Unique) |
| `StorageSlot` | `id` (UUID) | `warehouseId`, `zoneId` | `(warehouseId, code)` (Unique) |
| `GoodsItem` | `id` (UUID) | `customerId`, `warehouseId`, `slotId` | `barcode` (Unique), `(customerId, status)` |
| `GoodsMutation` | `id` (UUID) | `goodsId` $\rightarrow$ `GoodsItem.id` | `goodsId`, `timestamp` (Index) |
| `Vehicle` | `id` (UUID) | `currentDriverId` $\rightarrow$ `User.id` | `plateNumber` (Unique), `type`, `status` |
| `DeliveryOrder` | `id` (UUID) | `customerId`, `driverId`, `vehicleId` | `orderNumber` (Unique), `status` (Index) |
| `OrderItem` | `id` (UUID) | `orderId`, `goodsId` | `(orderId, goodsId)` (Unique) |
| `Invoice` | `id` (UUID) | `customerId`, `verifiedByAdminId` | `invoiceNumber` (Unique), `(customerId, status)` |
| `InvoiceItem` | `id` (UUID) | `invoiceId`, `goodsId` | `invoiceId` (Index) |
| `Payment` | `id` (UUID) | `invoiceId`, `customerId`, `verifiedByAdminId` | `invoiceId` (Index), `status` |
| `TelemetryLog` | `id` (UUID) | `slotId`, `vehicleId` | `slotId`, `vehicleId`, `recordedAt` (Index) |
| `SystemNotification`| `id` (UUID) | `recipientUserId` $\rightarrow$ `User.id` | `recipientUserId`, `isRead`, `createdAt` |
