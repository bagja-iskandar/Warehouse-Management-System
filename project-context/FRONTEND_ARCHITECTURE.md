# FRONTEND ARCHITECTURE SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Spesifikasi Arsitektur Web Client Next.js 15*

---

## 1. Overview & Arsitektur Monorepo

Frontend WMS Nusantara berlokasi di direktori `/frontend` dan dibangun menggunakan **Next.js 15 App Router**, **React 19**, **TypeScript 5 (Strict Mode)**, dan **Tailwind CSS**.

```text
┌──────────────────────────────────────────────────────────────┐
│                    UI Layer (App Router)                     │
│    /app/login     /app/admin/*     /app/customer/*   /app/driver/*│
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  Components & Modals Layer                   │
│   ui/ (primitives)    common/ (shell & state)   modules/ (domain) │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Custom Hooks & State Layer                 │
│      useAuth           useWarehouse          useLogistics    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   Service Abstraction Layer                  │
│       authService     warehouseService     logisticsService   │
└──────────────────────────────┬───────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│   Mock Service (Current)     │ │   Real REST API (Backend)    │
│ (In-memory + LocalStorage)   │ │  (PostgreSQL Gateway - P8)   │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Struktur Direktori Frontend (`/frontend`)

```text
frontend/
├── src/
│   ├── app/                          # Next.js App Router Pages
│   │   ├── (auth)/                   # /login, /register, /forgot-password
│   │   ├── admin/                    # 11 Rute Operasional Admin
│   │   ├── customer/                 # 10 Rute Layanan Mandiri Customer
│   │   ├── driver/                   # 8 Rute Eksekusi Armada Driver
│   │   ├── profile/                  # Profil Akun & Ganti Password
│   │   ├── globals.css               # Design Tokens & Tailwind Base
│   │   └── layout.tsx                # Root Provider & Shell Wrapper
│   ├── components/
│   │   ├── common/                   # Header, Floating Navigation, EmptyState, Skeleton
│   │   ├── ui/                       # Button, Badge, Dialog, Table, Input, dll.
│   │   └── warehouse/                # SlotDetailModal, GridVisualizer
│   ├── hooks/                        # useAuth, useLocalStorage, dsb.
│   ├── lib/                          # Utils, volume calculators, formatters
│   ├── mock/                         # In-memory database & mock seeders
│   ├── services/                     # Service interfaces & implementations
│   └── types/                        # Strict Domain TypeScript interfaces
├── components.json                   # UI configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Frontend dependencies
├── tailwind.config.ts                # Design tokens & color system
└── tsconfig.json                     # Path alias: @/* -> ./src/*
```

---

## 3. Komponen Utama & Service Layer

1. **Clean Service Abstraction:** Setiap interaksi data melewati TypeScript interface (misal: `IAuthService`, `IGoodsService`, `ILogisticsService`, `IBillingService`).
2. **Pluggable Architecture:** Penggantian ke backend API hanya dilakukan dengan mengimplementasikan class `HttpServiceLayer` yang mengarah ke endpoint REST API tanpa menyentuh UI components.
3. **Stateless UI:** Komponen UI tidak mengikat logic koneksi database, sehingga sepenuhnya aman dan modular.
