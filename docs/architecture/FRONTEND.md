# Frontend Architecture Specification
**Warehouse Management System (WMS Nusantara)**
*Next.js 15 App Router Client, Multi-Role Shell Layouts, TanStack Query, and Error Resilience*

---

## 1. Overview & Technology Stack

Frontend WMS Nusantara berlokasi di direktori `/frontend` dan dibangun menggunakan **Next.js 15 App Router**, **React 19**, **TypeScript 5 (Strict Mode)**, **Tailwind CSS**, **Zustand**, dan **TanStack React Query**.

| Komponen | Pilihan Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15.1.7 (App Router)** | Arsitektur rute berbasis direktori `app/` dengan Server & Client Components yang dioptimasi. |
| **UI Library** | **React 19** | Modern React primitives dengan concurrent rendering. |
| **Type Safety** | **TypeScript 5.x Strict** | Type-safe end-to-end tanpa `any`, memvalidasi 44 rute dan DTO models. |
| **Styling** | **Tailwind CSS** | Custom design tokens (`globals.css`), palette peran (Indigo/Emerald/Amber), dan elevated floating shell. |
| **Icons** | **Lucide React** | Modern, lightweight icon library. |
| **State Management** | **Zustand 5.x** | Persistent lightweight client stores (`useAuthStore`, `useWarehouseStore`) dengan hydration guard. |
| **Data Fetching & Cache**| **TanStack React Query 5.x** | Server state caching, background refetching, smart error retry policy, dan zero-retry mutation protection. |
| **Resilient API Client** | **Fetch API Abstraction (`api-client.ts`)** | 15s AbortSignal timeout, dynamic `X-Request-ID` correlation, dan status code normalization. |

---

## 2. Directory Structure (`/frontend/src`)

```text
frontend/src/
├── app/                              # Next.js App Router (44 Routes)
│   ├── (auth)/                       # /login, /register, /forgot-password
│   ├── admin/                        # 11 Admin operational pages
│   │   ├── dashboard/                # Operational KPIs & 3D overview
│   │   ├── warehouse/                # Facility list & /capacity 3D visualizer
│   │   ├── goods/                    # SKU master & storage management
│   │   ├── logistics/                # Dispatch queue & fleet routing
│   │   ├── billing/                  # Invoices & payment verification
│   │   ├── drivers/                  # Driver management & assign
│   │   ├── fleet/                    # Vehicle inventory (Reefer, Box, Van)
│   │   ├── customers/                # Customer directory & tenant usage
│   │   ├── reports/                  # Executive PDF/Excel reports
│   │   ├── monitoring/               # Real-time IoT sensor telemetry
│   │   ├── profile/                  # Admin profile view
│   │   └── error.tsx                 # In-shell Admin error boundary
│   │
│   ├── customer/                     # 10 Customer self-service pages
│   │   ├── dashboard/                # Storage utilization & invoice alerts
│   │   ├── rental/                   # Space booking (Standard vs Cold)
│   │   ├── goods/                    # SKU inventory & /input (dimension calc)
│   │   ├── logistics/                # Delivery requests & tracking
│   │   ├── billing/                  # Invoice payments & proof upload
│   │   ├── receipt/                  # Cargo receipt confirmation
│   │   ├── monitoring/               # Live cold room temperature
│   │   ├── history/                  # Storage mutation logs
│   │   ├── profile/                  # Customer profile settings
│   │   └── error.tsx                 # In-shell Customer error boundary
│   │
│   ├── driver/                       # 8 Driver fleet pages
│   │   ├── dashboard/                # Active task queue & stats
│   │   ├── tasks/                    # Task list & /tasks/[id] checklist
│   │   ├── vehicle/select            # Vehicle selection & dock inspection
│   │   ├── pickup/                   # Inbound pickup execution
│   │   ├── transit/                  # GPS route tracking & status stepper
│   │   ├── pod/                      # Digital POD (E-Signature + Photo)
│   │   ├── history/                  # Completed delivery history
│   │   ├── profile/                  # Driver profile
│   │   └── error.tsx                 # In-shell Driver error boundary
│   │
│   ├── profile/                      # Dynamic multi-role profile (/profile, /change-password)
│   ├── global-error.tsx              # Root fatal error boundary
│   ├── error.tsx                     # Route-level error boundary
│   ├── not-found.tsx                 # Custom 404 page
│   ├── globals.css                   # Tailwind tokens & custom scrollbars
│   ├── layout.tsx                    # Root layout with AppProviders
│   └── page.tsx                      # Root entry & smart role redirection
│
├── components/                       # UI Component Library
│   ├── auth/                         # TermsModal, Auth forms
│   ├── common/                       # ErrorStateCard, ChunkRecoveryHandler, StatusBadge
│   ├── dashboard/                    # DashboardMetricCard, DashboardSectionCard, Skeleton
│   ├── layout/                       # PageContainer, PageHeader, FilterBar
│   ├── logistics/                    # ShipmentStatusStepper, VehicleCard
│   ├── providers/                    # AppProviders (QueryClient, Toaster)
│   └── warehouse/                    # SlotDetailModal, RackGridVisualizer
│
├── hooks/                            # Custom React Hooks
│   ├── use-analytics.ts              # Operational counts & dashboard KPIs
│   ├── use-auth.ts                   # Login, register, logout, role check
│   ├── use-customers.ts              # Customer CRUD & invoice summary
│   ├── use-goods.ts                  # SKU master data & mutation logs
│   ├── use-logistics.ts              # Delivery orders, vehicles, POD
│   ├── use-notifications.ts          # Unread counts & notification drawer
│   └── use-warehouse.ts              # Warehouses, zones, and 3D slots
│
├── lib/                              # Core Utilities
│   ├── api-client.ts                 # Fetch wrapper with timeout, correlation & auth
│   └── utils.ts                      # ClassName merger (clsx + tailwind-merge)
│
├── services/                         # Service Abstraction Layer
│   ├── auth.service.ts
│   ├── analytics.service.ts
│   ├── billing.service.ts
│   ├── goods.service.ts
│   ├── logistics.service.ts
│   ├── notification.service.ts
│   ├── telemetry.service.ts
│   └── warehouse.service.ts
│
├── store/                            # Client State (Zustand)
│   ├── auth.store.ts                 # User profile, tokens, role
│   └── warehouse.store.ts            # Active warehouse & filter selection
│
└── types/                            # Domain TypeScript Interfaces
    ├── analytics.types.ts
    ├── auth.types.ts
    ├── billing.types.ts
    ├── goods.types.ts
    ├── logistics.types.ts
    ├── notification.types.ts
    └── warehouse.types.ts
```

---

## 3. Application Shell & Multi-Role Layouts

Sistem menerapkan arsitektur layout **Floating Shell**:
1. **AdminShell (`/admin/*`)**: Tema Indigo (`#4F46E5`), 11 menu sidebar navigasi, topbar dengan live operational counts badge (logistik, verifikasi pembayaran, notifikasi).
2. **CustomerShell (`/customer/*`)**: Tema Emerald (`#059669`), navigasi sewa ruang, input SKU barang, tracking delivery order, pembayaran faktur, dan konfirmasi penerimaan.
3. **DriverShell (`/driver/*`)**: Tema Amber (`#D97706`), navigasi tugas armada, checklist kendaraan, navigasi GPS transit, dan upload POD digital.
4. **Adaptive ProfileLayout (`/profile/*`)**: Mendeteksi role pengguna aktif (`currentUser.role`) dan secara dinamis membungkus halaman profil ke dalam Shell yang sesuai tanpa merusak navigasi sidebar.

---

## 4. State Management & Hydration Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    ZUSTAND AUTH STORE                        │
│                                                              │
│  State: user, accessToken, refreshToken, isAuthenticated      │
│  Hydration Gate: hasHydrated (boolean)                       │
│  Persistence: localStorage ('wms_access_token')              │
└──────────────────────────────┬───────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            ▼                                     ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│    API CLIENT INJECTION      │ │    TANSTACK QUERY CACHE      │
│                              │ │                              │
│ • Bearer <accessToken>       │ │ • Query Keys: ['goods', ...] │
│ • Auto Token Refresh on 401  │ │ • Stale Time: 30s – 5m       │
│ • X-Request-ID Header Echo   │ │ • Gated Polling when open    │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 5. Data Fetching, Caching & Resilience Policies

1. **Intelligent Query Retry**:
   - `0 retry` pada error 4xx (validasi form, 401 unauthorized, 404 not found).
   - Maksimal `2 retry` hanya pada kegagalan jaringan sementara (502, 503, timeout).
2. **Strict Zero-Retry Mutation Policy**:
   - `mutations.retry = false` pada seluruh mutasi data untuk mencegah duplikasi eksekusi aksi finansial atau pergudangan (*Receiving, Put-Away, Transfer, Payment Submission*).
3. **Stale Chunk Auto-Recovery (`ChunkRecoveryHandler`)**:
   - Menangkap `ChunkLoadError` akibat cache invalidation saat deployment/rebuild dan melakukan reload aman dengan perlindungan guard di `sessionStorage` untuk mencegah reload loop.
4. **15-Second AbortSignal Timeout**:
   - Seluruh request HTTP fetch dibatasi maksimal 15 detik untuk mencegah UI mengalami *infinite loading spinner*.

---

## 6. Development Commands

```bash
# Navigasi ke direktori frontend
cd frontend

# Install dependencies
npm install

# Menjalankan server development (Port 3000)
npm run dev

# Menjalankan type checking
npx tsc --noEmit

# Menjalankan linter
npm run lint

# Build produksi
npm run build
npm run start
```
