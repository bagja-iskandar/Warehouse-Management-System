# ROADMAP — Warehouse Management System (WMS Nusantara)

## Status Keseluruhan Project

| Phase | Modul & Cakupan | Status |
| :--- | :--- | :---: |
| **Phase 0** | **Baseline & Requirements Analysis** (SRS, Use Cases, Architecture Baseline) | 🔒 **COMPLETED & FROZEN** |
| **Phase 1** | **Frontend Foundation & Authentication** (Login, Register, Forgot Password, Profile) | 🔒 **COMPLETED & FROZEN** |
| **Phase 2** | **Application Shell & Navigation** (Floating Sidebar, Topbar, Search Modal ⌘K) | 🔒 **COMPLETED & FROZEN** |
| **Phase 3** | **Admin Operations & Fleet Center** (11 Sub-modul Operasional Gudang & Dispatch) | 🔒 **COMPLETED & FROZEN** |
| **Phase 4** | **Customer Self-Service Module** (10 Sub-modul Sewa, SKU, Suhu & Invoice) | 🔒 **COMPLETED & FROZEN** |
| **Phase 5** | **Driver Fleet Module** (8 Sub-modul Tugas, GPS Transit & Digital POD) | 🔒 **COMPLETED & FROZEN** |
| **Phase 6** | **Billing, Notification & 7 UX States** (Skeleton, Empty, Modal, Toast, VA) | 🔒 **COMPLETED & FROZEN** |
| **Phase 7** | **Frontend QA, Accessibility & Multi-Audit** (16/16 SRS Use Cases Passed) | 🔒 **COMPLETED & FROZEN** |
| **Phase 8** | **Backend Foundation & Infrastructure** (NestJS, TypeScript, Config, Docker PostgreSQL) | 🔒 **COMPLETED & VERIFIED** |
| **Phase 9** | **Database Schema & Migration** (Prisma ORM, 15 Relational Entities, Seed Data) | 🔒 **COMPLETED & VERIFIED** |
| **Phase 10** | **Authentication & RBAC** (JWT Dual Strategy, Bcrypt, Role Guards, Refresh Token) | 🔒 **COMPLETED & VERIFIED** |
| **Phase 11** | **Core REST API** (Warehouses, 3D Slots, Master SKU, Logistics DO, Billing & Telemetry) | 🔒 **COMPLETED & VERIFIED** |
| **Phase 12** | **Frontend API Integration** (HttpServiceLayer, 12.1 & 12.2 Done, Zero UI Rewrite) | ⏳ **IN PROGRESS** |
| **Phase 13** | **Mobile API Readiness** (Kotlin Android Spec, OpenAPI 3.0 SDK, Idempotency Support) | 📋 **PLANNED** |
| **Phase 14** | **Testing & Security Hardening** (Jest, Supertest, OWASP Top 10, Rate Limiting) | 📋 **PLANNED** |
| **Phase 15** | **Deployment & Production Infrastructure** (Docker Compose, CI/CD, Disaster Recovery) | 📋 **PLANNED** |

---

## BAGIAN I — FRONTEND EXECUTION HISTORY (PHASE 0 – PHASE 7)

### PHASE 0 — BASELINE & REQUIREMENTS
- Analisis SRS Sistem Penyimpanan Gudang (16 Use Cases, ERD, Class Diagram, Sequence Diagram).
- Pemetaan 3 Multi-Role Personas (Admin, Customer, Driver).
- Pembentukan Design System Baseline (Rounded Floating Shell, Indigo/Emerald/Amber Accents).

### PHASE 1 — AUTHENTICATION & PROFILE
1. **Multi-Role Login** (`/login`) — **FROZEN & VERIFIED**
2. **Customer Registration** (`/register`) — **FROZEN & VERIFIED**
3. **Password Recovery** (`/forgot-password`) — **FROZEN & VERIFIED**
4. **User Profile & Settings** (`/profile`, `/profile/change-password`) — **FROZEN & VERIFIED**

### PHASE 2 — MASTER APPLICATION SHELL
1. **White Floating Sidebar & Topbar** (`rounded-2xl`, `shadow-xl`, `w-64`) — **FROZEN & VERIFIED**
2. **Unified Spacing Grid** (`lg:pl-72 flex flex-col p-4 space-y-4` on `#F8FAFC`) — **FROZEN & VERIFIED**
3. **Interactive Search Dialog (⌘ K)** & **Notification Drawer** — **FROZEN & VERIFIED**

### PHASE 3 — ADMIN OPERATIONAL & FLEET CENTER
1. **Operational Dashboard** (`/admin/dashboard`) — **FROZEN & VERIFIED**
2. **Warehouse Capacity 3D Rack Visualizer** (`/admin/warehouse/capacity`) — **FROZEN & VERIFIED**
3. **Multi-Hub Facility Overview** (`/admin/warehouse`) — **FROZEN & VERIFIED**
4. **Master SKU & Inventory Management** (`/admin/goods`) — **FROZEN & VERIFIED**
5. **Customer & Tenant Management** (`/admin/customers`) — **FROZEN & VERIFIED**
6. **Driver Fleet Management** (`/admin/drivers`) — **FROZEN & VERIFIED**
7. **Vehicle Management & Reefer Fleet** (`/admin/fleet`) — **FROZEN & VERIFIED**
8. **Logistics & Dispatch Queue** (`/admin/logistics`) — **FROZEN & VERIFIED**
9. **Real-time IoT Sensor Monitoring** (`/admin/monitoring`) — **FROZEN & VERIFIED**
10. **Monthly Billing & Late Penalty Management** (`/admin/billing`) — **FROZEN & VERIFIED**
11. **Executive Operational Reports** (`/admin/reports`) — **FROZEN & VERIFIED**

### PHASE 4 — CUSTOMER SELF-SERVICE MODULE
1. **Customer Dashboard** (`/customer/dashboard`) — **FROZEN & VERIFIED**
2. **Storage Space Booking (Cold vs Standard)** (`/customer/rental`) — **FROZEN & VERIFIED**
3. **Goods Registration Form (Dimension Calculator & QR Code)** (`/customer/goods/input`) — **FROZEN & VERIFIED**
4. **Customer Inventory List & QR Inspection** (`/customer/goods`) — **FROZEN & VERIFIED**
5. **Cold Storage Temperature Monitor** (`/customer/monitoring`) — **FROZEN & VERIFIED**
6. **Pickup & Delivery Request Scheduler** (`/customer/logistics/request`) — **FROZEN & VERIFIED**
7. **Storage Mutation History & Audit Log** (`/customer/history`) — **FROZEN & VERIFIED**
8. **Customer Invoices & Payment VA** (`/customer/billing`) — **FROZEN & VERIFIED**
9. **Delivery Receipt Confirmation (POD Validation)** (`/customer/receipt/confirm`) — **FROZEN & VERIFIED**
10. **Customer Company Profile & NPWP** (`/customer/profile`) — **FROZEN & VERIFIED**

### PHASE 5 — DRIVER FLEET MODULE
1. **Driver Task Queue & Dashboard** (`/driver/dashboard`) — **FROZEN & VERIFIED**
2. **Task Detail & Delivery Instructions** (`/driver/tasks/[id]`) — **FROZEN & VERIFIED**
3. **Vehicle Selection (Reefer vs Box Truck)** (`/driver/vehicle/select`) — **FROZEN & VERIFIED**
4. **Pickup Confirmation & Dock Checklist** (`/driver/pickup`) — **FROZEN & VERIFIED**
5. **Live Route & GPS Transit Status** (`/driver/transit`) — **FROZEN & VERIFIED**
6. **Digital Proof of Delivery (Photo & E-Signature)** (`/driver/pod`) — **FROZEN & VERIFIED**
7. **Driver Delivery History** (`/driver/history`) — **FROZEN & VERIFIED**
8. **Driver Profile & SIM B2 License** (`/driver/profile`) — **FROZEN & VERIFIED**

### PHASE 6 — BILLING, NOTIFICATION & 7 UX STATES
- `Loading State`: Skeleton loader & animated spinners (`LoadingSkeleton.tsx`) — **FROZEN & VERIFIED**
- `Empty State`: Ilustrasi grafis profesional & petunjuk aksi (`EmptyState.tsx`) — **FROZEN & VERIFIED**
- `Success State`: Toast feedback & visual confirmation badges — **FROZEN & VERIFIED**
- `Error State`: Alert banner & input error feedback — **FROZEN & VERIFIED**
- `Validation State`: Zod schema validation messages — **FROZEN & VERIFIED**
- `Disabled State`: Kontrol non-aktif dengan kontras yang jelas — **FROZEN & VERIFIED**
- `Confirmation State`: Dialog konfirmasi destruktif (`ConfirmationModal.tsx`) — **FROZEN & VERIFIED**

### PHASE 7 — FRONTEND QA, ACCESSIBILITY & MULTI-AUDIT
1. **SRS Traceability Audit:** 16 / 16 Use Cases Terpetakan 100% (UC1 - UC16) — **PASSED**
2. **Design System Consistency Audit:** 100% konsistensi token & rounded floating shell — **PASSED**
3. **Responsive Audit:** Lolos breakpoint Mobile (375px), Tablet (768px), Desktop (1280px+) — **PASSED**
4. **Accessibility Audit:** Kepatuhan WCAG AA pada seluruh peran — **PASSED**
5. **TypeScript & Build Audit:** Zero compiler error (`tsc --noEmit` & `npm run lint`) — **PASSED**
6. **E2E Test Cycle:** Siklus alur sewa $\rightarrow$ inventaris $\rightarrow$ logistik $\rightarrow$ POD $\rightarrow$ billing teruji — **PASSED**

---

## BAGIAN II — BACKEND MASTER ROADMAP (PHASE 8 – PHASE 11)

### PHASE 8 — BACKEND FOUNDATION & INFRASTRUCTURE (COMPLETED & VERIFIED)
- [x] Scaffolding arsitektur NestJS di direktori `/backend` dengan TypeScript Strict mode (`tsconfig.json`).
- [x] Konfigurasi arsitektur berlapis (*Controllers, Services, Repositories, DTOs, Modules*).
- [x] Konfigurasi environment variables & schema validation (`@nestjs/config` + Joi).
- [x] Implementasi Global `ValidationPipe` (`class-validator` & `class-transformer` dengan whitelist & forbidNonWhitelisted).
- [x] Implementasi `TransformResponseInterceptor` (Standard Envelope Response: `success, message, data, meta`).
- [x] Implementasi `GlobalExceptionFilter` (Standard Error Envelope, no stack trace in production).
- [x] Konfigurasi Structured Logging dengan Pino (`nestjs-pino`) & correlation ID tracking.
- [x] Konfigurasi OpenAPI / Swagger documentation di endpoint `/api/docs` dan `/api/docs-json`.
- [x] Implementasi Health Check endpoints (`/health/liveness` & `/health/readiness`).
- [x] Audit zero modification terhadap frontend frozen (`/frontend`).

### PHASE 9 — DATABASE DOMAIN MODEL, LOCAL POSTGRESQL & MIGRATION (COMPLETED & VERIFIED)
- [x] Analisis Domain Model & Penyusunan Spesifikasi Database (`DATABASE_DOMAIN_MODEL.md` & `DATABASE_DECISIONS.md`).
- [x] Strategi Local Development First (PostgreSQL Server lokal Windows, `localhost:5433`, database `wms_db`, dikelola via pgAdmin 4).
- [x] Pemisahan tegas Database Environment (Local Development) dan Database Architecture (Cloud-Ready via `DATABASE_URL`).
- [x] Implementasi Master Prisma Schema (`backend/prisma/schema.prisma`) dengan 15 Entitas Relasional & 14 Enums.
- [x] Pembuatan Seeder Database Deterministik (`backend/prisma/seed.ts`) yang tersinkronisasi 100% dengan mock dataset frontend.
- [x] Eksekusi PostgreSQL Migration (`npx prisma migrate dev --name init_wms_db`) pada PostgreSQL lokal `wms_db`.
- [x] Eksekusi Database Seeder (`npx prisma db seed`).
- [x] Verifikasi integritas relasional, constraint, dan query via pgAdmin/backend.
- [x] Dokumentasi Master Arsitektur Database (`docs/DATABASE_ARCHITECTURE.md`).

### PHASE 10 — AUTHENTICATION & RBAC (COMPLETED & VERIFIED)
- [x] Implementasi `AuthModule` (`AuthController`, `AuthService`, `JwtStrategy`).
- [x] Implementasi Login multi-peran Admin, Customer, Driver (`POST /api/v1/auth/login`).
- [x] Implementasi Refresh token rotation & DB revocation (`POST /api/v1/auth/refresh`).
- [x] Implementasi Logout & session invalidation (`POST /api/v1/auth/logout`).
- [x] Implementasi Session check profile (`GET /api/v1/auth/me`).
- [x] Implementasi `JwtAuthGuard`, `RolesGuard`, dan `@Roles()` / `@CurrentUser()` / `@Public()` decorators.
- [x] Hashing password aman menggunakan Bcrypt 10 salt rounds.
- [x] Standard Response Envelope & Error Envelope tanpa kebocoran `passwordHash`.
- [x] Unit Test Suite (27 tests) & E2E Test Suite (18 tests) Passed 100%.
- [x] Dokumentasi REST API Contract (`docs/API.md`) & Arsitektur Autentikasi (`AUTHENTICATION.md`).

### PHASE 11 — CORE BUSINESS REST API (COMPLETED & VERIFIED)

#### Phase 11.1 — Warehouse Module (COMPLETED & VERIFIED)
- [x] Implementasi `WarehouseModule`, `WarehouseService`, `WarehouseController`.
- [x] Endpoint `GET /api/v1/warehouses`: List fasilitas gudang dengan utilisasi kapasitas $m^3$, persentase okupansi, dan ringkasan zona.
- [x] Filter & Search pada list gudang (`?search=`, `?city=`, `?isActive=`).
- [x] Endpoint `GET /api/v1/warehouses/:id`: Detail gudang beserta visualisasi grid slot rak 3D, zona sub-zero / standar, dan data suhu.

#### Phase 11.2 — Goods & Inventory Domain (`GoodsModule`) (COMPLETED & VERIFIED)
- [x] Endpoint `GET /api/v1/goods`: List master SKU dengan paginasi, pencarian nama/barcode, filtering kategori/status, dan isolasi tenant.
- [x] Endpoint `GET /api/v1/goods/:id`: Detail barang beserta dimensi $P \times L \times T$, kubikasi $m^3$, relasi gudang, slot rak, dan jejak audit mutasi.
- [x] Endpoint `POST /api/v1/goods`: Registrasi barang baru dengan kalkulasi volume server-side ($P \times L \times T / 10^6 \times Qty$).
- [x] Endpoint `PATCH /api/v1/goods/:id/status`: Alur transisi status terkontrol (`DRAFT` $\to$ `STORED` $\to$ `DELIVERED`).

#### Phase 11.3 — Logistics & Fleet Domain (`LogisticsModule`) (COMPLETED & VERIFIED)
- [x] Endpoint `GET /api/v1/logistics/vehicles` & `POST /api/v1/logistics/vehicles/assign`.
- [x] Endpoint `GET /api/v1/logistics/orders` & `POST /api/v1/logistics/orders`.
- [x] Endpoint `PATCH /api/v1/logistics/orders/:id/status` & `POST /api/v1/logistics/orders/:id/pod`.

#### Phase 11.4 — Billing & Penalty Domain (`BillingModule`) (COMPLETED & VERIFIED)
- [x] Endpoint `GET /api/v1/billing/invoices` & `GET /api/v1/billing/invoices/:id`.
- [x] Mesin Kalkulasi Denda Deterministik 5% per minggu keterlambatan.
- [x] Endpoint `POST /api/v1/billing/invoices/:id/pay` & `PATCH /api/v1/billing/invoices/:id/verify`.

#### Phase 11.5 — IoT Telemetry & Monitoring Domain (`TelemetryModule`) (COMPLETED & VERIFIED)
- [x] Endpoint `POST /api/v1/telemetry/ingest`: Perekaman data sensor suhu & kelembaban IoT.
- [x] Deteksi Anomali Rantai Pendingin (Threshold $\le -18.0^\circ\text{C}$).
- [x] Endpoint `GET /api/v1/telemetry/monitoring` & `GET /api/v1/telemetry/logs`.

---

## BAGIAN III — FRONTEND API INTEGRATION (PHASE 12 — ACTIVE)

### PHASE 12.1 — AUTH API INTEGRATION (COMPLETED & APPROVED)
- [x] Implementasi HTTP Client terpusat (`frontend/src/lib/api-client.ts`) dengan Bearer token injection dan auto 401 token refresh rotation.
- [x] Implementasi `HttpAuthService` (`frontend/src/services/auth.service.ts`) terhubung ke `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- [x] Integrasi Zustand `useAuthStore` dan React Query `useAuth` hook.
- [x] Konfigurasi environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_MOCK=false`).
- [x] Pengujian login multi-role (Admin, Customer, Driver) terhadap backend NestJS + PostgreSQL lokal.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.2 — WAREHOUSE API INTEGRATION (COMPLETED & APPROVED)
- [x] Implementasi `HttpWarehouseService` (`frontend/src/services/warehouse.service.ts`) terhubung ke `GET /api/v1/warehouses` dan `GET /api/v1/warehouses/:id`.
- [x] Integrasi React Query `useWarehouses()` hook ke overview fasilitas gudang (`/admin/warehouse`).
- [x] Integrasi React Query `useWarehouse(id)` hook ke visualisasi kapasitas slot rak 3D (`/admin/warehouse/capacity`).
- [x] Zero UI modification — Desain layout, floating cards, dan warna tetap 100% frozen.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.3 — GOODS & INVENTORY API INTEGRATION (COMPLETED & VERIFIED)
- [x] Implementasi `HttpGoodsService` (`frontend/src/services/goods.service.ts`) terhubung ke:
  - `GET /api/v1/goods` (Master SKU list, tenant filtering, status & category filters).
  - `GET /api/v1/goods/:id` (Item detail, dimensi $m^3$, slot rak, mutation log).
  - `POST /api/v1/goods` (Registrasi barang baru dari customer).
  - `PATCH /api/v1/goods/:id/status` (Update status & alokasi slot dari admin).
- [x] Integrasi ke Admin Goods Management (`/admin/goods`).
- [x] Integrasi ke Customer Goods Registration (`/customer/goods/input`) & Inventory List (`/customer/goods`).
- [x] Verifikasi konsistensi formula volume fisik dan barcode QR code.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.4 — LOGISTICS & FLEET API INTEGRATION (COMPLETED & VERIFIED)
- [x] Implementasi `HttpLogisticsService` (`frontend/src/services/logistics.service.ts`) terhubung ke armada truk, assignment driver, DO dispatch queue, dan upload Digital POD.
- [x] Integrasi ke `/admin/fleet`, `/admin/logistics`, `/customer/logistics/request`, `/driver/vehicle/select`, `/driver/pod`.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.5 — BILLING & INVOICING API INTEGRATION (COMPLETED & VERIFIED)
- [x] Implementasi `HttpBillingService` (`frontend/src/services/billing.service.ts`) terhubung ke faktur sewa, pembayaran VA/transfer, denda 5%/minggu, dan approval admin.
- [x] Integrasi ke `/admin/billing` dan `/customer/billing`.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.6 — TELEMETRY & IOT SENSOR INTEGRATION (COMPLETED & VERIFIED)
- [x] Implementasi `HttpTelemetryService` (`frontend/src/services/telemetry.service.ts`) terhubung ke live snapshot monitoring (`GET /api/v1/telemetry/monitoring`) dan telemetry logs (`GET /api/v1/telemetry/logs`).
- [x] Integrasi feed monitoring suhu sub-zero real-time dan deteksi anomali ke `/admin/monitoring` dan `/customer/monitoring`.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

### PHASE 12.7 — FULL E2E FRONTEND ↔ BACKEND INTEGRATION & VERIFICATION (COMPLETED & VERIFIED)
- [x] Audit menyeluruh seluruh siklus end-to-end (Auth Multi-Role $\to$ Gudang Hub $\to$ Input SKU Barang $\to$ DO Booking & Dispatch $\to$ Driver Assignment $\to$ Digital POD E-Signature $\to$ Faktur & Denda 5%/minggu $\to$ Verifikasi Admin $\to$ IoT Telemetri Suhu Sub-zero).
- [x] Verifikasi 100% rute frontend Next.js (41 routes) lulus pengujian HTTP 200 OK.
- [x] Verifikasi 0 error pada `type-check`, `lint`, dan `build`.

---

## BAGIAN ? — FUTURE PHASES (PHASE 13 – PHASE 15)

### PHASE 13 — MOBILE API READINESS (NEXT / READY TO START)
- [ ] Verifikasi kepatuhan *Client-Agnostic Response* (100% JSON murni).
- [ ] Ekspor OpenAPI 3.0 spec (`/api/docs-json`) untuk Retrofit Kotlin Android client.
- [ ] Dukungan header `X-Idempotency-Key` untuk koneksi jaringan seluler tidak stabil.

### PHASE 14 — TESTING & SECURITY HARDENING
- [ ] Security Audit (OWASP Top 10, Helmet, CORS, Throttler rate limiting).
- [ ] Database query indexing tuning & connection pool optimization.

### PHASE 15 — DEPLOYMENT & PRODUCTION INFRASTRUCTURE
- [ ] Multi-stage production `Dockerfile` dan `docker-compose.yml`.
- [ ] CI/CD pipeline automation & automated backup runbook.
