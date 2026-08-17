# BACKEND ARCHITECTURE & MASTER ENGINEERING SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Panduan Komprehensif Arsitektur Backend, Database PostgreSQL, Keamanan, Integrasi Multi-Client, dan Standar Rekayasa*

---

## 1. Backend Objective (Tujuan & Visi Sistem)

Backend **Warehouse Management System (WMS Nusantara)** dirancang sebagai platform layanan inti (*Core Backend Service / Standalone API Gateway*) yang mandiri, berkinerja tinggi, modular, dan **100% Client-Agnostic**. Backend bertindak sebagai *Single Source of Truth* untuk:

1. **Integritas Relasional Pergudangan:** Menjamin konsistensi alokasi ruang simpan fisik ($m^3$) pada multi-gudang (Hub Cakung, Gedebage, dll.) dan visualisasi rak 3D.
2. **Kepatuhan Rantai Dingin (*Cold Chain Compliance*):** Memantau telemetri suhu real-time (ambang batas $-18.0^\circ\text{C}$ s/d $-25.0^\circ\text{C}$) pada ruang Cold Storage dan armada Truk Reefer dengan deteksi anomali otomatis.
3. **Manajemen Logistik & Dispatching:** Mengelola alokasi armada truk (*Reefer & Box*), penugasan driver, pemantauan status rute transit GPS, dan verifikasi serah terima digital (*Digital Proof of Delivery / POD*).
4. **Automated Billing & Penalty Engine:** Menjalankan otomasi penagihan sewa bulanan dan kalkulasi denda keterlambatan pembayaran ($5\%/\text{minggu}$) sesuai spesifikasi SRS UC12.
5. **Platform-Independent API Provider:** Melayani dua klien utama secara setara:
   - **Web Frontend (Next.js 15 App Router)**
   - **Mobile Client (Kotlin Android Native)**

```text
               ┌─────────────────────────────────────────────────────────┐
               │                    WMS BACKEND SYSTEM                   │
               │                   (NestJS / TypeScript)                 │
               └────────────────────────────┬────────────────────────────┘
                                            │
                             RESTful API v1 (JSON / HTTPS)
                             Authorization: Bearer <JWT>
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
         ┌────────────────────────┐                  ┌────────────────────────┐
         │   Next.js Web Client   │                  │  Kotlin Android Client │
         │(Admin, Customer, Driver│                  │ (Driver Field Mobile)  │
         │  [Directory: /frontend]│                  │  [Future Mobile Repo]  │
         └────────────────────────┘                  └────────────────────────┘
```

---

## 2. Technology Stack & Alasan Pemilihannya

| Komponen | Teknologi Terpilih | Justifikasi & Analisis Trade-off |
| :--- | :--- | :--- |
| **Runtime & Language** | **Node.js 20 LTS + TypeScript 5 (Strict Mode)** | Menjamin keamanan tipe data end-to-end (Domain Model parity antara frontend TS dan backend TS). Ekosistem npm yang kaya dan non-blocking I/O yang ideal untuk operasi REST API. |
| **Backend Framework** | **NestJS 10.x** | Mengadopsi arsitektur enterprise berlapis (*Controller $\rightarrow$ Service $\rightarrow$ Repository*) berbasis modul dan *Dependency Injection* (DI). Menyediakan decorators, validation pipes, guards, exception filters, dan auto-generated OpenAPI Swagger secara native ([ADR-001](../ADR/ADR-001-backend-framework.md)). |
| **Database Engine** | **PostgreSQL 16** | Database relasional open-source berstandar enterprise dengan kepatuhan ACID tinggi. Mendukung tipe data `DECIMAL` untuk presisi volume/keuangan, `JSONB` untuk metadata fleksibel, dan indeks temporal untuk data telemetri ([ADR-002](../ADR/ADR-002-database-and-orm.md)). |
| **ORM & Migrations** | **Prisma ORM 5.x** | Schema-first deklaratif (`schema.prisma`), menghasilkan type-safe client otomatis untuk TypeScript, Prisma Migrate untuk versioned database migrations, dan Prisma Studio untuk inspeksi visual ([ADR-002](../ADR/ADR-002-database-and-orm.md)). |
| **API Protocol & Docs** | **RESTful API v1 + OpenAPI / Swagger 3.0** | Universal, stateless, client-agnostic untuk Web Next.js dan Android Kotlin. Swagger di route `/api/docs` menghasilkan file `openapi.json` yang dapat diimpor langsung oleh developer Android ([ADR-003](../ADR/ADR-003-api-architecture-and-contracts.md)). |
| **Data Validation** | **class-validator + class-transformer** | Validasi payload request otomatis pada NestJS `ValidationPipe` (whitelist, non-whitelisted rejection, DTO auto-transform) dengan fallback schema validation via Zod jika diperlukan. |
| **Authentication** | **Dual JWT Strategy (Bearer Token & HTTP-only Cookie)** | Klien Mobile menggunakan `Authorization: Bearer <token>`, klien Web dapat menggunakan Bearer Token atau Secure HTTP-only Cookie. Sandi dienkripsi dengan **Argon2id** (atau bcrypt 12 salt rounds) ([ADR-004](../ADR/ADR-004-authentication-and-authorization.md)). |
| **Object Storage** | **S3-Compatible Storage (MinIO lokal / AWS S3 prod)** | Penyimpanan file binary (foto bukti Digital POD, tanda tangan digital Base64, struk pembayaran VA) di luar database relasional ([ADR-005](../ADR/ADR-005-file-storage-and-digital-pod.md)). |
| **Logging Engine** | **Pino (via `nestjs-pino`)** | High-performance structured JSON logger dengan automatic Request/Correlation ID tracing dan masking data sensitif. |
| **Testing Framework** | **Jest + Supertest + Testcontainers** | Pengujian unit untuk domain calculation rules, integration testing untuk repository, dan end-to-end API testing. |
| **Dev Environment** | **Docker & Docker Compose** | Mengisolasi container PostgreSQL 16 dan MinIO Object Storage untuk lingkungan development lokal yang konsisten dan reproducible. |

---

## 3. Backend Folder Architecture (Clean / Layered Architecture)

Backend mengadopsi prinsip **Clean Layered Architecture (Modular Monolith)** di mana setiap domain memiliki modul terisolasi:

```text
backend/
├── prisma/
│   ├── schema.prisma                 # Master Prisma Schema (11 Entities + Enums)
│   ├── migrations/                   # Migration SQL files (Generated by Prisma)
│   └── seed.ts                       # Deterministic Seed Data (Sync with Frontend)
├── src/
│   ├── common/                       # Shared infrastructure & cross-cutting concerns
│   │   ├── constants/                # Business constants (Rates, Penalty %: 5%)
│   │   ├── decorators/               # Custom decorators (@Roles, @CurrentUser, @Public)
│   │   ├── dto/                      # Global pagination, filter, response DTOs
│   │   ├── filters/                  # GlobalExceptionFilter (Standard Error Envelope)
│   │   ├── guards/                   # JwtAuthGuard, RolesGuard (RBAC)
│   │   ├── interceptors/             # TransformResponseInterceptor, LoggingInterceptor
│   │   ├── pipes/                    # Validation & parsing pipes
│   │   └── utils/                    # Volume calculator, barcode generator, date helpers
│   ├── config/                       # Configuration modules & validation (Joi/Zod)
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── storage.config.ts
│   ├── modules/                      # Domain-Driven Feature Modules
│   │   ├── auth/                     # Authentication & Token Management
│   │   │   ├── dto/                  # LoginDto, RegisterDto, ChangePasswordDto
│   │   │   ├── strategies/           # JwtStrategy, LocalStrategy
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/                    # User Profiles, Driver SIM B2, Company NPWP
│   │   ├── warehouses/               # Facilities, Storage Zones & 3D Slots
│   │   ├── goods/                    # SKU Inventory, Barcodes, Dimension Calculator
│   │   ├── logistics/                # Fleet (Reefer/Box), Delivery Orders, Digital POD
│   │   ├── billing/                  # Invoices, VA Payment, 5% Late Fee Engine
│   │   ├── telemetry/                # IoT Sensor Ingestion, Temperature Anomalies
│   │   ├── notifications/            # In-app notifications & reminder dispatcher
│   │   ├── reports/                  # PDF/XLSX Executive Report Generators
│   │   └── audit/                    # Mutation logs & compliance audit trail
│   ├── database/                     # Database connection lifecycle
│   │   ├── prisma.service.ts         # Prisma client lifecycle management
│   │   └── database.module.ts
│   ├── storage/                      # MinIO / AWS S3 Object Storage Service
│   │   ├── storage.service.ts
│   │   └── storage.module.ts
│   ├── app.module.ts                 # Root Application Module
│   └── main.ts                       # Server Bootstrap & Global Middleware
├── test/                             # E2E & Integration Test Suites
│   ├── auth.e2e-spec.ts
│   ├── goods.e2e-spec.ts
│   ├── logistics.e2e-spec.ts
│   └── test-utils.ts
├── .env.example                      # Template environment variables
├── Dockerfile                        # Multi-stage production build
├── docker-compose.yml                # Local PostgreSQL 16 & MinIO setup
├── package.json                      # Dependencies & npm scripts
├── tsconfig.json                     # Strict TypeScript Compiler Options
└── nest-cli.json                     # Nest CLI Build Configuration
```

---

## 4. Database Architecture (PostgreSQL 16 & Prisma ORM)

### 4.1 Diagram Relasi Antar Entitas (Entity-Relationship Diagram)

```mermaid
erDiagram
    USERS ||--o{ GOODS_ITEMS : "owns (customer)"
    USERS ||--o{ DELIVERY_ORDERS : "requests (customer)"
    USERS ||--o{ DELIVERY_ORDERS : "assigned (driver)"
    USERS ||--o{ INVOICES : "billed to (customer)"
    USERS ||--o{ VEHICLES : "assigned (driver)"
    USERS ||--o{ REFRESH_TOKENS : "maintains"

    WAREHOUSES ||--|{ STORAGE_SLOTS : "contains"
    WAREHOUSES ||--o{ GOODS_ITEMS : "stores"

    STORAGE_SLOTS ||--o{ GOODS_ITEMS : "houses"
    STORAGE_SLOTS ||--o{ TELEMETRY_LOGS : "sensor logs"

    VEHICLES ||--o{ DELIVERY_ORDERS : "carries"
    VEHICLES ||--o{ TELEMETRY_LOGS : "reefer sensor logs"

    DELIVERY_ORDERS ||--|{ ORDER_ITEMS : "manifests"
    GOODS_ITEMS ||--o{ ORDER_ITEMS : "included in"
    GOODS_ITEMS ||--o{ GOODS_MUTATIONS : "tracks"

    INVOICES ||--|{ INVOICE_ITEMS : "details"
```

### 4.2 Pemetaan 11 Tabel Relasional Inti

1. **`users`**: Identitas akun multi-peran (`ADMIN`, `CUSTOMER`, `DRIVER`), kredensial terenkripsi (`password_hash`), legalitas perusahaan (`company_name`, `address`), dan lisensi pengemudi (`driver_license_number`, `driver_license_expiry`).
2. **`refresh_tokens`**: Menyimpan hash refresh token aktif untuk rotasi token aman (*token rotation*) dan pembatalan sesi (*revocation*).
3. **`warehouses`**: Master fasilitas gudang (kode unik e.g. `WH-CKG-01`, nama, kota, kapasitas total $m^3$, manajer PIC, status aktif).
4. **`storage_slots`**: Grid rak 3D per gudang (kode rak unik e.g. `A-01-01`, zona `STANDARD` / `COLD_STORAGE` / `HEAVY_DUTY`, kapasitas $m^3$, volume terpakai $m^3$, status `AVAILABLE` / `OCCUPIED` / `RESERVED` / `MAINTENANCE`, suhu & kelembaban terkini).
5. **`goods_items`**: Master inventaris SKU milik customer (barcode unik e.g. `BRG-2026-X9A2`, dimensi $P \times L \times T$, volume $m^3$, berat $kg$, jumlah koli, flag `requires_cold_storage`, ambang batas suhu, tarif sewa bulanan, status penyimpanan, QR payload string).
6. **`goods_mutations`**: Audit log kronologis pergerakan fisik barang (pendaftaran, alokasi rak, muat armada, serah terima di toko).
7. **`vehicles`**: Master armada logistik (nomor polisi unik e.g. `B 9821 TKN`, tipe `VAN` / `BOX_TRUCK_SMALL` / `REEFER_TRUCK` / `WING_BOX_LARGE`, kapasitas $m^3$ & $kg$, flag pendingin reefer, driver aktif).
8. **`delivery_orders`**: Surat jalan pengiriman/penjemputan (nomor DO unik e.g. `DO-2026-001`, tipe `PICKUP` / `DELIVERY`, alamat asal & tujuan, jadwal, driver & truk yang ditugaskan, status alur kerja, URL foto Digital POD, nama penerima, e-signature, rating driver $1.0 - 5.0$).
9. **`order_items`**: Junction table relasi kargo muatan barang dalam satu DO.
10. **`invoices` & `invoice_items`**: Faktur sewa bulanan tenant (nomor invoice unik e.g. `INV-2026-08-0142`, periode sewa, jatuh tempo, subtotal sewa, denda keterlambatan 5%/minggu, total tagihan, status `UNPAID` / `PAID` / `OVERDUE`, URL bukti pembayaran).
11. **`telemetry_logs` & `audit_logs`**: Log pencatatan berkala sensor suhu IoT gudang/truk dan jejak audit mutasi data sensitif.

---

## 5. Authentication & Authorization (RBAC) Architecture

```text
Incoming Request
       │
       ▼
┌───────────────────────────────┐
│     Helmet & ThrottlerGuard   │  -> Rate Limit: 100 req/min per IP
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│         JwtAuthGuard          │  -> Validasi Bearer Token (Authorization Header)
└──────────────┬────────────────┘     atau Secure HTTP-only Cookie
               │
               ▼
┌───────────────────────────────┐
│          RolesGuard           │  -> Validasi Decorator @Roles('ADMIN', 'CUSTOMER', 'DRIVER')
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│    Tenant Isolation Guard     │  -> Validasi kepemilikan resource (req.user.id == customerId)
└──────────────┬────────────────┘
               │
               ▼
   Target Controller Handler
```

### 5.1 Dual Token Strategy (Stateless JWT + Refresh Token)
- **Access Token:** JWT berumur pendek (15 – 60 menit) berisi payload `{ sub: userId, email: string, role: UserRole }`.
- **Refresh Token:** Token terotentikasi berumur panjang (7 hari) yang di-hash (SHA-256) dan disimpan di tabel `refresh_tokens`. Saat token diperbarui, token lama di-revoke (*Refresh Token Rotation*).
- **Password Security:** Menggunakan algoritma **Argon2id** (atau bcrypt salt rounds 12). Kredensial tidak pernah dikembalikan ke client.

### 5.2 Role-Based Access Control (RBAC) Matrix
- **`ADMIN`:** Akses global ke seluruh gudang, manajemen armada, penetapan slot rak, approval DO, pengawasan faktur, dan ekspor laporan eksekutif.
- **`CUSTOMER`:** Akses terbatas hanya pada data inventaris SKU miliknya, ruang sewa aktif, pembuatan DO Inbound/Outbound miliknya, dan faktur tagihannya sendiri (`customerId = req.user.id`).
- **`DRIVER`:** Akses terbatas hanya pada daftar tugas DO yang dialokasikan kepadanya (`driverId = req.user.id`), checklist muatan, rute GPS, dan upload Digital POD.

---

## 6. REST API Architecture & Standar Komunikasi

### 6.1 Routing & Versioning Prefix
Seluruh endpoint backend menggunakan versioning eksplisit pada URI:
$$\text{Base URL: } \texttt{http(s)://<domain>/api/v1/...}$$

### 6.2 Standard Response Envelope (Konsisten untuk Semua Endpoint)

#### Response Sukses (HTTP 200 / 201):
```json
{
  "success": true,
  "message": "Operasi berhasil dieksekusi",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "timestamp": "2026-08-16T19:30:00.000Z"
  }
}
```

#### Response Error (HTTP 400 / 401 / 403 / 404 / 422 / 500):
```json
{
  "success": false,
  "message": "Validasi input gagal",
  "errors": [
    {
      "field": "dimensions.lengthCm",
      "message": "Panjang barang harus bernilai positif"
    }
  ],
  "statusCode": 422,
  "timestamp": "2026-08-16T19:30:00.000Z",
  "path": "/api/v1/goods"
}
```

---

## 7. Error Handling Strategy

1. **Global Exception Filter (`GlobalExceptionFilter`):** Menangkap seluruh `HttpException` dan unhandled exception, mengonversinya ke format Error Envelope standar.
2. **Keamanan Error di Lingkungan Produksi:** Stack trace dan internal database error messages disembunyikan pada mode `NODE_ENV=production` untuk mencegah kebocoran informasi (*information disclosure*).
3. **HTTP Status Code Semantics:**
   - `200 OK`: Operasi pembacaan/pembaruan sukses.
   - `201 Created`: Pembuatan resource baru berhasil (User, Barang, DO, Invoice).
   - `400 Bad Request`: Format payload JSON tidak sesuai DTO.
   - `401 Unauthorized`: Token JWT tidak valid atau kedaluwarsa.
   - `403 Forbidden`: Pengguna tidak memiliki role/hak akses ke resource tersebut.
   - `404 Not Found`: Resource (Gudang, Barang, DO, Invoice) tidak ditemukan.
   - `409 Conflict`: Terjadi duplikasi data unik (Email, Barcode, No. DO, No. Polisi).
   - `422 Unprocessable Entity`: Validasi aturan bisnis gagal (misal: kapasitas slot penuh).
   - `500 Internal Server Error`: Kesalahan sistem internal tak terduga.

---

## 8. Validation Strategy

1. **NestJS Global `ValidationPipe`:**
   ```typescript
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true,              // Menghapus field liar yang tidak didefinisikan di DTO
       forbidNonWhitelisted: true,  // Melempar error jika ada property ilegal yang dikirim
       transform: true,              // Otomatis mengonversi tipe primitif (string -> number/date)
       transformOptions: { enableImplicitConversion: false },
     })
   );
   ```
2. **DTO Level Annotations:** Menggunakan decorator `class-validator` (`@IsString()`, `@IsNumber()`, `@IsUUID()`, `@Min()`, `@IsEnum()`) untuk seluruh DTO request.
3. **Business Validation Layer:** Validasi logika domain (misal: memverifikasi bahwa truk berpendingin tersedia jika kargo adalah Cold Food) dijalankan pada Service Layer sebelum transaksi database diproses.

---

## 9. Logging Strategy

1. **Structured JSON Logging:** Menggunakan library **Pino** (via `nestjs-pino`) untuk performa tinggi dengan output JSON terstruktur.
2. **Correlation ID & Tracing:** Setiap request HTTP disuntikkan header `X-Correlation-ID` (UUID) yang dicatat pada seluruh log untuk melacak lifecycle sebuah request dari client hingga database.
3. **Log Levels:**
   - `FATAL / ERROR`: Kegagalan transaksi, exception tak tertangani, database disconnection.
   - `WARN`: Deteksi anomali suhu sensor, attempt login gagal, rate limit threshold.
   - `INFO`: Lifecycle bootstrap aplikasi, event audit mutasi data, billing cycle generation.
   - `DEBUG`: Query database dan payload debugging (hanya aktif pada development).
4. **Data Redaction:** Masking otomatis untuk data sensitif (`password`, `token`, `creditCard`, `signatureData`) dari output log.

---

## 10. Environment Configuration

1. **Configuration Engine:** Menggunakan `@nestjs/config` dengan validasi skema berbasis **Joi** atau **Zod** saat bootstrap aplikasi. Jika ada variabel wajib yang hilang, aplikasi akan langsung *fail-fast* saat startup.
2. **Struktur Variabel `.env`:**
   ```env
   # Server Environment
   NODE_ENV=development
   PORT=5000
   API_PREFIX=api/v1
   CORS_ORIGINS=http://localhost:3000

   # Database PostgreSQL
   DATABASE_URL=postgresql://wms_user:wms_secure_pass@localhost:5432/wms_nusantara?schema=public

   # JWT Security
   JWT_ACCESS_SECRET=wms_super_secret_access_key_2026
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_SECRET=wms_super_secret_refresh_key_2026
   JWT_REFRESH_EXPIRATION=7d

   # S3 / MinIO Object Storage
   STORAGE_ENDPOINT=localhost
   STORAGE_PORT=9000
   STORAGE_USE_SSL=false
   STORAGE_ACCESS_KEY=minioadmin
   STORAGE_SECRET_KEY=minioadmin
   STORAGE_BUCKET_NAME=wms-storage
   ```
3. **Secret Isolation:** File `.env` masuk ke `.gitignore`. Repositori hanya menyediakan `.env.example`.

---

## 11. Docker PostgreSQL & Infrastructure Architecture

Untuk lingkungan development lokal, disiapkan file `docker-compose.yml` yang mengorkestrasi seluruh dependency database dan object storage:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: wms_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: wms_user
      POSTGRES_PASSWORD: wms_secure_pass
      POSTGRES_DB: wms_nusantara
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wms_user -d wms_nusantara"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: wms_minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local
```

---

## 12. Migration Strategy (Prisma Migrate)

1. **Development Migration:** Dikelola menggunakan perintah:
   ```bash
   npx prisma migrate dev --name <deskripsi_migrasi>
   ```
   Setiap perubahan menghasilkan file SQL versioned di `prisma/migrations/<timestamp>_<name>/migration.sql`.
2. **Production Deployment Migration:** Dijalankan tanpa interaksi interaktif:
   ```bash
   npx prisma migrate deploy
   ```
3. **Rollback & Safety:** Setiap migrasi diuji pada database staging sebelum diaplikasikan ke production. Migrasi yang bersifat destruktif (drop column/table) diwajibkan melalui fase *expand-and-contract*.

---

## 13. Seed Strategy (Deterministic Data Fixtures)

1. **Sinkronisasi Data dengan Frontend:** Script `prisma/seed.ts` memuat data awal yang **100% identik** dengan dataset mock frontend (`frontend/src/mock/seed/`):
   - 3 Akun Persona (`admin@wms-nusantara.com`, `customer@freshfoods.id`, `driver@wms-nusantara.com`).
   - Master Gudang (Hub Cakung `WH-CKG-01`, Hub Gedebage `WH-GDB-01`).
   - Slot Rak 3D (Zona Standar & Cold Storage Sub-zero).
   - Master Barang (Daging Wagyu A5, Frozen Salmon, Furniture Kayu).
   - Armada Truk (Isuzu Giga Reefer `B 9821 TKN`, Hino Dutro Box).
   - Delivery Order aktif & Invoice penagihan sewa.
2. **Perintah Eksekusi Seed:**
   ```bash
   npx prisma db seed
   ```

---

## 14. API Versioning Strategy

1. **URI Path Versioning:** Seluruh rute diawali dengan `/api/v1/`.
2. **Backward Compatibility:** Perubahan minor yang backward-compatible tetap berada di v1. Jika terdapat breaking changes besar pada kontrak data, rute v2 (`/api/v2/`) akan diperkenalkan secara berdampingan tanpa mematikan v1 seketika.
3. **Deprecation Policy:** Endpoint yang akan dipensiunkan diberi anotasi `@Deprecated()` pada Swagger dan menyertakan header response:
   ```http
   Deprecation: @1735689600
   Sunset: Wed, 01 Jul 2026 00:00:00 GMT
   ```

---

## 15. Security Considerations & Hardening

1. **OWASP Top 10 Mitigation:**
   - **SQL Injection:** Dieliminasi secara struktural melalui parameterized query Prisma ORM.
   - **XSS & Content Sniffing:** Diamankan melalui HTTP Security Headers dari middleware **Helmet**.
   - **CORS Allowlist:** Pembatasan origin hanya untuk domain web client yang terdaftar.
   - **Brute-Force & DoS:** Dilindungi oleh `@nestjs/throttler` (maksimal 100 request/menit per IP).
2. **Password Hashing:** Menggunakan **Argon2id** (atau bcrypt salt rounds 12).
3. **Payload Limits:** Pembatasan ukuran request body maksimal 10MB untuk upload file dan 100KB untuk JSON payloads.

---

## 16. Frontend Integration Strategy (Zero UI Modification)

1. **Substitusi Service Layer Transparan:** Frontend Next.js telah memiliki service abstraction layer di `frontend/src/services/`.
2. **Implementasi `HttpServiceLayer`:**
   ```typescript
   // frontend/src/services/auth.service.ts
   export class HttpAuthService implements IAuthService {
     private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
     // Mengonsumsi endpoint REST backend nyata
   }
   ```
3. **Zero UI Change:** Tidak ada komponen halaman (`src/app/**`) atau komponen antarmuka (`src/components/**`) yang diubah.

---

## 17. Kotlin Android Mobile Integration Strategy

1. **Platform-Independent JSON:** Backend tidak menghasilkan HTML atau struktur React. Seluruh response berupa JSON murni yang dapat diparsing langsung oleh library Android **Retrofit 2** dan **Kotlinx.serialization / Moshi**.
2. **Standard UTC Timestamps:** Format tanggal menggunakan **ISO 8601 UTC** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
3. **Resilient Digital POD:** Endpoint `POST /api/v1/logistics/orders/:id/pod` mendukung upload binary `multipart/form-data` dari kamera Android dan Base64 signature canvas.
4. **Network Fluctuation & Idempotency:** Mendukung header `X-Idempotency-Key` pada operasi kritis (penerbitan DO, pembayaran) untuk mencegah duplikasi order saat sinyal seluler driver terputus di jalan.
5. **OpenAPI SDK Exporter:** File `http://localhost:5000/api/docs-json` menyediakan spesifikasi OpenAPI 3.0 resmi untuk men-generate data class Kotlin secara otomatis.

---

## 18. Development Workflow

```text
1. Start Dev Infrastructure  -->  docker compose up -d (PostgreSQL & MinIO)
2. Database Schema Sync      -->  npx prisma migrate dev
3. Seed Test Data            -->  npx prisma db seed
4. Run Backend Server        -->  npm run start:dev (NestJS Watch Mode)
5. Swagger Testing           -->  Akses http://localhost:5000/api/docs
6. Automated Tests           -->  npm run test (Unit) & npm run test:e2e (E2E)
7. Code Quality Checks       -->  npm run lint & npx tsc --noEmit
```

---

## 19. Production Migration Considerations

1. **Containerization:** Multi-stage `Dockerfile` untuk menghasilkan image Node.js yang ramping dan aman (*distroless / alpine*).
2. **Connection Pooling:** Penggunaan **PgBouncer** atau connection pool sizing Prisma (`connection_limit`) untuk mengoptimalkan konkurensi koneksi PostgreSQL.
3. **Healthcheck Endpoints:**
   - `GET /health/liveness`: Verifikasi apakah service backend hidup.
   - `GET /health/readiness`: Verifikasi kesiapan koneksi PostgreSQL dan MinIO.
4. **Disaster Recovery:** Otomasi daily database snapshot backup via `pg_dump` dan enkripsi cold storage backup.

---

## 20. Conflict Analysis & Decision Notes (SRS vs Frontend vs Backend)

Berikut adalah analisis perbedaan (*discrepancies*) yang teridentifikasi beserta solusi arsitektur yang diadopsi:

1. **Tarif Sewa Gudang (Cold vs Standard Storage):**
   - *SRS:* Menyebutkan sewa bulanan cold storage vs general storage.
   - *Frontend:* Menggunakan simulasi Rp 150.000 / m³ / bulan (Cold) dan Rp 50.000 / m³ / bulan (Standard) pada slider rental, namun mock seed memiliki skala enterprise (Rp 2.500.000 / m³).
   - *Solusi Backend:* Tarif dasar disimpan sebagai konstanta terkonfigurasi di database/config (`STORAGE_RATE_COLD_PER_M3`, `STORAGE_RATE_STANDARD_PER_M3`) agar dinamis dan dapat disesuaikan tanpa *hardcoded code change*.
2. **Mekanisme Otentikasi Web vs Mobile:**
   - *Frontend:* Mengirim `Authorization: Bearer <token>` dan menyimpan di `localStorage`.
   - *Mobile:* Mengirim `Authorization: Bearer <token>`.
   - *Solusi Backend:* Backend mendukung **Dual Authentication Mechanism** (ekstraksi token dari Header Bearer dan fallback dari HTTP-only Cookie), sehingga kompatibel 100% untuk Web maupun Mobile Native.

---

*Dokumen ini menjadi standar arsitektur resmi bagi implementasi Backend WMS Nusantara.*
