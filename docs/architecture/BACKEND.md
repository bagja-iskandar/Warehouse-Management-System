# Backend Architecture Specification
**Warehouse Management System (WMS Nusantara)**
*Enterprise NestJS 10.x Service, 10 Core Modules, Security Pipeline & PostgreSQL Data Layer*

---

## 1. Executive Overview & System Role

Backend WMS Nusantara adalah layanan mandiri (*standalone API service*) berbasis **NestJS 10.x** dan **TypeScript Strict** yang berfungsi sebagai *Single Source of Truth* untuk seluruh aturan bisnis, kalkulasi pergudangan, otomasi dispatch logistik, dan persistensi data.

### Peran Utama Backend:
1. **API Gateway & Provider**: Menyediakan endpoint RESTful JSON terstandarisasi bagi Web Client (Next.js 15) dan Mobile Client (Kotlin Android).
2. **Database Gateway**: Menjadi satu-satunya komponen yang memiliki koneksi langsung (*direct connection pool*) ke PostgreSQL melalui Prisma ORM.
3. **Authentication & RBAC Authority**: Menerbitkan JWT token pair, memvalidasi sesi, me-revoke refresh token, dan menegakkan otorisasi peran (`ADMIN`, `CUSTOMER`, `DRIVER`).
4. **Business Calculation Engine**: Menjalankan kalkulasi kubikasi ($m^3$), occupancy slot rak, kapasitas gudang, tarif sewa Cold vs Standard, serta formula denda keterlambatan pembayaran ($5\%/\text{minggu}$).
5. **IoT Telemetry Ingestion Engine**: Menerima dan memvalidasi log pembacaan sensor suhu & kelembaban dari slot Cold Storage dan armada Truk Reefer.

---

## 2. Technology Stack & Design Principles

| Komponen | Pilihan Teknologi | Deskripsi & Rationale |
| :--- | :--- | :--- |
| **Framework** | **NestJS 10.x** | Mengadopsi arsitektur modular enterprise berlapis (*Controller $\rightarrow$ Service $\rightarrow$ Prisma/Repository*), Dependency Injection kelas satu, dan decorator standard. |
| **Runtime & Bahasa** | **Node.js 20+ LTS / TypeScript 5.x** | Type-safe end-to-end, compiler strict mode tanpa `any`. |
| **Database Engine** | **PostgreSQL 16** | Database relasional open-source ACID-compliant dengan dukungan indexing performa tinggi. |
| **ORM & Migrasi** | **Prisma ORM 6.x** | Schema-first deklaratif (`prisma/schema.prisma`), menghasilkan type-safe PrismaClient dengan migrasi otomatis. |
| **Keamanan & Header** | **Helmet & CORS** | Proteksi header HTTP modern dan pembatasan origin domain. |
| **Logging & Tracing** | **Pino (`nestjs-pino`)** | High-performance JSON structured logging dengan injeksi `x-request-id` correlation header dan redaksi data sensitif. |
| **Validasi Request** | **`class-validator` + `class-transformer`** | Global validation pipe dengan `whitelist: true`, `forbidNonWhitelisted: true`, dan DTO strictly typed. |
| **API Documentation** | **OpenAPI 3.0 / Swagger** | Dokumentasi interaktif otomatis pada `/api/docs` dan JSON schema pada `/api/docs-json`. |

---

## 3. Directory Structure (`/backend`)

```text
backend/
├── src/
│   ├── app.module.ts                 # Root Application Module & Global Configuration
│   ├── main.ts                       # Entrypoint (Pipes, Interceptors, Filters, Swagger)
│   │
│   ├── common/                       # Shared Cross-Cutting Concerns
│   │   ├── constants/                # App constants (AppConstants)
│   │   ├── decorators/               # @CurrentUser, @Public, @Roles
│   │   ├── dto/                      # Standard ApiResponseDto, PaginationQueryDto
│   │   ├── filters/                  # GlobalExceptionFilter (Prisma & HTTP error handler)
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard
│   │   └── interceptors/             # LoggingInterceptor, TransformResponseInterceptor
│   │
│   ├── config/                       # Configuration Modules & Joi Schema Validation
│   │   ├── app.config.ts             # Port, NodeEnv, API prefix, CORS
│   │   ├── database.config.ts        # DATABASE_URL connection string
│   │   ├── env.validation.ts         # Joi schema validation for environment variables
│   │   ├── jwt.config.ts             # Access/Refresh secret & expiration duration
│   │   └── storage.config.ts         # MinIO endpoint, port, SSL, and credentials
│   │
│   ├── database/                     # Core Database Module
│   │   ├── database.module.ts
│   │   └── prisma.service.ts         # Lifecycle connection & disconnect handler
│   │
│   └── modules/                      # 10 Domain Business Modules
│       ├── analytics/                # Operational KPIs, Admin overview, Customer/Driver summaries
│       ├── auth/                     # Login, register, refresh-token, logout, reset-password
│       ├── billing/                  # Invoices, late penalties, payment verification, MinIO storage
│       ├── goods/                    # SKU master, volume m3 calculator, rack transfer, mutations
│       ├── health/                   # Liveness & readiness probes
│       ├── logistics/                # Delivery orders, fleet dispatch, driver tasks, Digital POD
│       ├── notifications/            # System notifications, unread counts, mark-as-read
│       ├── telemetry/                # IoT sensor ingestion, live cold chain snapshot, anomaly logs
│       ├── users/                    # Profiles, customer directory, user CRUD, admin overrides
│       └── warehouse/                # Facilities, storage zones, 3D rack slots, rental bookings
│
├── prisma/
│   ├── migrations/                   # Sequential SQL migration history
│   ├── schema.prisma                 # Master relational data model (15 models, 14 enums)
│   └── seed.ts                       # Deterministic development seeder
│
├── scripts/                          # Diagnostic & data reconciliation tools
└── test/                             # E2E test suites (auth, goods, billing, logistics, telemetry)
```

---

## 4. Module Architecture (10 Core Modules)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           10 NESTJS CORE MODULES                            │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│ 1. AuthModule     │ 2. UsersModule    │ 3. WarehouseModule│ 4. GoodsModule  │
│ • Login / Register│ • Profile update  │ • Warehouse hubs  │ • SKU Master    │
│ • Token refresh   │ • Customer list   │ • Storage zones   │ • Volume calc   │
│ • Password reset  │ • Role management │ • 3D Rack slots   │ • Rack transfer │
├───────────────────┼───────────────────┼───────────────────┼─────────────────┤
│ 5. LogisticsModule│ 6. BillingModule  │ 7. TelemetryModule│ 8. Analytics    │
│ • Delivery Orders │ • Monthly invoice │ • Sensor ingest   │ • Metric cards  │
│ • Fleet dispatch  │ • 5%/week penalty │ • Temp monitoring │ • Operational   │
│ • Digital POD     │ • Payment verify  │ • Cold chain alert│   badge counts  │
├───────────────────┼───────────────────┴───────────────────┴─────────────────┤
│ 9. Notifications  │ 10. HealthModule                                        │
│ • System alerts   │ • Liveness probe: /health/liveness                      │
│ • Unread counts   │ • Readiness probe: /health/readiness (DB health check)  │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 5. Security, Authentication & Authorization Pipeline

### 5.1 Authentication Pipeline (Dual-Token Strategy)
```text
Client Request
      │
      ▼
JwtAuthGuard ──(Public Route?)──► YES ──► Route Handler
      │
      NO
      ▼
Extract Bearer Token ──► Verify Access Secret & Expiration
      │
      ▼
Load User from DB ──► Check Active Status (Reject SUSPENDED / PENDING_VERIFICATION)
      │
      ▼
Inject AuthenticatedUser into request.user (@CurrentUser())
      │
      ▼
RolesGuard ──(@Roles specified?)──► Check if user.role in allowed roles
      │
      ▼
Route Execution
```

### 5.2 Token Specifications:
- **Access Token**: Masa berlaku 15 menit (`JWT_ACCESS_EXPIRATION=15m`), berisi payload `{ sub, email, role }`.
- **Refresh Token**: Masa berlaku 7 hari (`JWT_REFRESH_EXPIRATION=7d`), disimpan dengan hash **SHA-256** di tabel `refresh_tokens` pada database untuk memastikan sesi dapat di-revoke secara instan saat logout atau ganti password.
- **Password Hashing**: Menggunakan algoritma **Bcrypt** dengan salt round 10.

---

## 6. Business Calculation Engines

### 6.1 Volume Kubikasi Barang ($m^3$)
Dihitung secara server-side pada `GoodsService` saat pembuatan atau pengeditan master barang:
$$\text{Volume per Unit } (m^3) = \frac{\text{Panjang (cm)} \times \text{Lebar (cm)} \times \text{Tinggi (cm)}}{1.000.000}$$
$$\text{Total Volume } (m^3) = \text{Volume per Unit } (m^3) \times \text{Kuantitas (Pcs)}$$

### 6.2 Denda Keterlambatan Pembayaran Sewa ($5\%/\text{minggu}$)
Dihitung secara deterministik pada `BillingService`:
- Jika $\text{Tanggal Sekarang} \le \text{Due Date} \rightarrow \text{Denda} = 0$.
- Jika $\text{Tanggal Sekarang} > \text{Due Date} \rightarrow \text{Denda}$ dihitung berdasarkan jumlah minggu keterlambatan:
$$\text{Hari Terlambat} = \lceil (\text{Now} - \text{DueDate}) / 86400000 \rceil$$
$$\text{Minggu Terlambat} = \max(1, \lceil \text{Hari Terlambat} / 7 \rceil)$$
$$\text{Biaya Denda (IDR)} = \text{Subtotal} \times (0.05 \times \text{Minggu Terlambat})$$
$$\text{Total Tagihan} = \text{Subtotal} + \text{Biaya Denda}$$

---

## 7. Error Handling, Resilience & Logging

1. **Prisma Exception Translation (`GlobalExceptionFilter`)**:
   - `P2002` (Unique constraint) $\rightarrow$ **HTTP 409 Conflict** (`DUPLICATE_RESOURCE_CONFLICT`).
   - `P2025` (Record not found) $\rightarrow$ **HTTP 404 Not Found** (`RESOURCE_NOT_FOUND`).
   - `P2003` / `P2014` (Foreign key violation) $\rightarrow$ **HTTP 400 Bad Request**.
2. **Correlation ID Tracing (`LoggingInterceptor`)**:
   - Mengekstrak `x-request-id` dari frontend atau men-generate ID baru.
   - Mencatat log: `[x-request-id] METHOD URL STATUS - DURATIONms`.
   - Mengembalikan header `X-Request-ID` pada response client.
3. **Production Sanitization**:
   - Pada `NODE_ENV=production`, seluruh stack trace internal dan detail query database tidak pernah diekspos ke antarmuka client.

---

## 8. Development & Operational Commands

```bash
# Navigasi ke direktori backend
cd backend

# Install dependencies
npm install

# Setup Prisma ORM
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Menjalankan server development (Port 5000)
npm run start:dev

# Menjalankan type checking
npx tsc --noEmit

# Menjalankan unit & E2E tests
npm run test
npm run test:e2e

# Build produksi
npm run build
npm run start:prod
```
