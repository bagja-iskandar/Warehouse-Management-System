# Frontend Architecture Specification — Warehouse Management System

## 1. Overview & Architectural Principles

Dokumen ini mendefinisikan arsitektur frontend untuk **Warehouse Management System (WMS)**. Sistem dirancang dengan prinsip **Separation of Concerns**, **Domain-Driven Component Design**, **Frontend-First Service Abstraction**, dan **Strict Type Safety**.

```
+---------------------------------------------------------------+
|                       UI Layer (App Router)                   |
|   (auth)         (admin)          (customer)        (driver)  |
+---------------------------------------------------------------+
                                |
                                ▼
+---------------------------------------------------------------+
|                Components Layer (Atomic Design)               |
|      ui/ (primitives)    modules/ (domain)   common/ (shell)  |
+---------------------------------------------------------------+
                                |
                                ▼
+---------------------------------------------------------------+
|                 Hooks Layer (TanStack Query v5)               |
|   useWarehouse      useGoods      useLogistics     useBilling |
+---------------------------------------------------------------+
                                |
                                ▼
+---------------------------------------------------------------+
|                    Service Abstraction Layer                  |
|    warehouse.service.ts   goods.service.ts   billing.service.ts|
+---------------------------------------------------------------+
                                |
                +---------------+---------------+
                |                               |
                ▼                               ▼
+-------------------------------+ +-------------------------------+
|    Mock Data Engine (Stateful)| |  Real Backend API (Future)    |
|   (In-Memory + LocalStorage)  | |   (PostgreSQL / REST API)     |
+-------------------------------+ +-------------------------------+
```

---

## 2. Directory Structure

```text
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Authentication routes (login, register, forgot-password)
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (admin)/                  # Admin Management Portal
│   │   ├── dashboard/
│   │   ├── warehouse/            # Capacity visualizer & slot allocation
│   │   ├── goods/                # Master inventory & cold storage
│   │   ├── logistics/            # Fleet dispatch & vehicle assigning
│   │   ├── billing/              # Monthly invoices & debt penalty
│   │   ├── reports/              # Analytics, occupancy & revenue reports
│   │   ├── users/                # User & driver account management
│   │   └── layout.tsx
│   ├── (customer)/               # Customer Portal
│   │   ├── dashboard/
│   │   ├── rental/               # Space rental booking (General vs Cold Storage)
│   │   ├── inventory/            # Goods registration (UC2) & item detail
│   │   ├── tracking/             # Logistics status & GPS tracking
│   │   ├── payments/             # Subscription billing & payment proof
│   │   └── layout.tsx
│   ├── (driver)/                 # Driver Portal (Mobile-optimized)
│   │   ├── tasks/                # Active pickup & delivery orders
│   │   ├── vehicles/             # Vehicle selection (UC3)
│   │   ├── route/                # Navigation & transit update
│   │   ├── pod/                  # Digital Proof of Delivery & confirmation
│   │   └── layout.tsx
│   ├── layout.tsx                # Root layout (Fonts, Providers, Toast container)
│   ├── globals.css               # Global Tailwind CSS tokens & themes
│   └── page.tsx                  # Landing / Role redirection page
├── components/
│   ├── ui/                       # shadcn/ui base primitives (Button, Card, Dialog, Table, dll.)
│   ├── common/                   # Shared shell components (Header, Sidebar, UserNav, ThemeToggle)
│   ├── modules/                  # Domain-specific components
│   │   ├── warehouse/            # Grid capacity map, zone indicator, slot badge
│   │   ├── goods/                # GoodsCard, GoodsForm, QrCodeBadge, CategoryBadge
│   │   ├── logistics/            # VehicleCard, DeliveryTimeline, StatusBadge
│   │   └── billing/              # InvoiceSummary, PaymentModal, PenaltyAlert
│   └── feedback/                 # Error Boundary, Skeleton loaders, Empty states
├── hooks/                        # Custom React Query hooks per domain
├── lib/                          # Utility functions (cn, formatters, QR helpers, constants)
├── mock/                         # In-Memory Stateful Mock Engine & Seeds
│   ├── db/                       # In-memory storage with LocalStorage persistence
│   └── seed/                     # Realistic seed data (Gudang, Barang, Armada, Driver, Invoice)
├── services/                     # Service Layer interfaces and implementations
├── store/                        # Lightweight Client State (Zustand: auth simulation, sidebar state)
└── types/                        # Strict TypeScript Domain Interfaces
    ├── auth.types.ts
    ├── warehouse.types.ts
    ├── goods.types.ts
    ├── logistics.types.ts
    ├── billing.types.ts
    └── common.types.ts
```

---

## 3. Technology Stack Specification

| Kategori | Teknologi | Versi Target | Alasan Pemilihan & Keunggulan |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `15.x` | App Router modern, Server Components, Route Handlers, Turbopack, Fast HMR. |
| **UI Library** | React | `19.x` / `18.x` | Standard ekosistem modern React dengan performa rendering optimal. |
| **Type System** | TypeScript | `^5.6.x` | Strict type checking, generic type utilities, zero implicit `any`. |
| **Styling** | Tailwind CSS | `^3.4.x` | Design tokens, arbitrary values, fluid utilities, PostCSS compiler. |
| **Components** | shadcn/ui | Latest | Radix UI accessible primitives, copy-paste ownership, fully customizable. |
| **Icons** | Lucide React | Latest | Konsistensi visual ikon modern untuk enterprise dashboard. |
| **Data Fetching** | TanStack Query | `^5.59.x` | Stale-while-revalidate caching, query key factories, optimistic updates. |
| **Forms & Validation** | React Hook Form + Zod | `^7.x` / `^3.x` | Validasi skema deklaratif, performa form tanpa unnecessary re-renders. |
| **Client UI Store** | Zustand | `^5.0.x` | Store ringan untuk auth state simulation dan UI toggles tanpa boilerplate. |
| **Charts & Visuals** | Recharts | `^2.13.x` | Visualisasi kapasitas gudang, okupansi slot, dan tren pendapatan bulanan. |
| **Feedback / Toast** | Sonner | `^1.7.x` | Toast notifications elegan dengan support promise & multi-action. |

---

## 4. State Management Strategy

### 4.1 Server State (TanStack Query v5)
Seluruh data domain (gudang, barang, armada, tugas pengiriman, tagihan) dikelola melalui custom hooks TanStack Query.
- **Cache Strategy:** Query key factory pattern (`warehouseKeys.all`, `goodsKeys.list(filters)`).
- **Stale Time:** 3 menit secara default; otomatis *invalidated* saat mutasi berhasil.

### 4.2 Client State (Zustand)
Hanya digunakan untuk state lokal murni yang perlu diakses lintas komponen:
- `useAuthStore`: Simulasi user login saat ini (`Admin`, `Customer`, `Driver`), token mock, role switcher untuk keperluan review/demo.
- `useUIStore`: Status sidebar collapsed/expanded, filter drawer active, active modal.

---

## 5. Service Abstraction & Mock Engine Architecture

Untuk memastikan frontend dapat bertransisi ke Backend REST API di masa mendatang tanpa merombak UI:

```typescript
// services/warehouse.service.ts
export interface IWarehouseService {
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouseById(id: string): Promise<WarehouseDetail>;
  updateSlotStatus(slotId: string, status: SlotStatus): Promise<StorageSlot>;
}

// Implementasi Mock (Phase 1 s.d. 7)
export class MockWarehouseService implements IWarehouseService { ... }

// Implementasi Real API (Phase 8+)
export class ApiWarehouseService implements IWarehouseService { ... }

// Service Factory Switch
export const warehouseService: IWarehouseService = 
  process.env.NEXT_PUBLIC_USE_MOCK === 'false' 
    ? new ApiWarehouseService() 
    : new MockWarehouseService();
```

---

## 6. Design System & Theming Tokens

### Color Palette (WMS Enterprise Theme):
- **Primary:** `Indigo / Slate` (`#4F46E5` / `#1E293B`) — Memberikan kesan profesional, kokoh, dan modern.
- **Accent - Cold Storage:** `Cyan / Sky` (`#0284C7`) — Khusus indikator makanan dingin / pendingin.
- **Accent - Furniture / General:** `Amber / Orange` (`#D97706`) — Khusus indikator barang general/furniture.
- **Success / Stored:** `Emerald` (`#059669`) — Barang tersimpan / Pembayaran lunas.
- **Warning / In-Transit:** `Amber` (`#F59E0B`) — Pengiriman berjalan / Tagihan mendekati jatuh tempo.
- **Danger / Overdue:** `Rose / Red` (`#E11D48`) — Denda keterlambatan / Kapasitas penuh.
- **Dark Mode:** Standard Slate-950 background dengan border kontras halus (`slate-800`).
