# Security Audit Phase 1 — Secret, Credential & Sensitive Data Exposure

## Executive Summary

Audit keamanan tahap pertama (Phase 1) pada sistem **WMS Nusantara** telah dilaksanakan dengan cakupan menyeluruh terhadap repositori (Backend NestJS, Frontend Next.js 15, PostgreSQL/Prisma, Konfigurasi Docker, Git History, Endpoint Autentikasi/Otorisasi, File Storage Abstraction, dan Logging).

Tujuan audit ini adalah mengidentifikasi seluruh celah paparan credential, secret hardcoded, riwayat Git, kelemahan autentikasi & RBAC, isolasi multi-tenant, dan risiko kebocoran data sensitif sebelum dilakukan perbaikan.

> [!IMPORTANT]
> Seluruh temuan dalam dokumen ini berstatus **AUDIT ONLY (Read-Only)**. Tidak ada modifikasi kode, penghapusan git commit, atau rotasi credential yang dilakukan sebelum persetujuan resmi.

---

## Scope

1. **Backend Subsystem (`backend/src/**`, `backend/prisma/**`, `backend/test/**`, `backend/config/**`)**
2. **Frontend Subsystem (`frontend/src/**`, `frontend/.env*`, `frontend/.gitignore`)**
3. **Konfigurasi Lingkungan (`.env*`, `.gitignore`, `docker-compose.yml`, `Dockerfile`)**
4. **Git Repository History (All branches: `master`, `backend-development`, `frontend-development`, tags, and historic commits)**
5. **Autentikasi & Manajemen Sesi (JWT Access/Refresh, Fallback Secrets, Password Hashing, Direct Password Reset)**
6. **Otorisasi & Multi-Tenant Isolation (RBAC Role matrix, IDOR/BOLA pada 10 Controller)**
7. **Storage & File Upload Security (MIME validation, Public bucket policies, Path handling)**
8. **Logging & Error Leakage (Pino HTTP redaction, Exception Filters, Access Logs)**

---

## Findings Summary Matrix

| Severity | Count | Primary Impact Areas |
| :--- | :---: | :--- |
| **CRITICAL** | **0** | Tidak ditemukan live cloud production secret (AWS/Stripe/SendGrid) yang aktif di source code. |
| **HIGH** | **5** | Hardcoded fallback JWT secrets, Git history database credential, Broken Access Control (Driver access to Invoices & Goods), Unrestricted IoT Telemetry Ingest. |
| **MEDIUM** | **5** | Static default seed passwords, Anonymous download MinIO bucket policy, Client-side MIME check only, Direct password reset endpoint without verification token, LocalStorage token storage. |
| **LOW** | **2** | Incomplete `.gitignore` pattern in frontend subfolder, Sample database connection strings in documentation markdown. |
| **SAFE / VERIFIED** | **4** | Zero backend secrets in frontend bundle, Pino logger credential redaction, Sanitized 500 error envelopes in production, Parameterized SQL queries via Prisma ORM. |

---

## Critical Findings

*Tidak ditemukan credential live production cloud aktif (CRITICAL: 0).*

---

## High Findings

### Finding ID: SEC-01
**Severity:** HIGH  
**Location:** Backend JWT Configuration & Strategies  
**File:** [`backend/src/config/jwt.config.ts`](file:///d:/Project/Warehouse/backend/src/config/jwt.config.ts), [`backend/src/config/env.validation.ts`](file:///d:/Project/Warehouse/backend/src/config/env.validation.ts), [`backend/src/modules/auth/auth.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/auth/auth.service.ts), [`backend/src/modules/auth/strategies/jwt.strategy.ts`](file:///d:/Project/Warehouse/backend/src/modules/auth/strategies/jwt.strategy.ts)  
**Lines:** `jwt.config.ts:L4,L7`, `env.validation.ts:L15,L19`, `auth.service.ts:L368,L373`, `jwt.strategy.ts:L20`  
**Issue:** Hardcoded Fallback JWT Secrets pada Source Code dan Joi Validation Schema  
**Why it matters:** Jika environment variable `JWT_ACCESS_SECRET` atau `JWT_REFRESH_SECRET` tidak disetel di server production, aplikasi secara diam-diam akan menggunakan fallback hardcoded string yang diketahui publik untuk menandatangani dan memverifikasi token JWT.  
**Evidence:**
```ts
// jwt.config.ts
accessSecret: process.env.JWT_ACCESS_SECRET || 'wms_default_access_secret_for_dev_mode_only_2026',
refreshSecret: process.env.JWT_REFRESH_SECRET || 'wms_default_refresh_secret_for_dev_mode_only_2026',

// jwt.strategy.ts
secretOrKey: configService.get<string>('jwt.accessSecret') || 'wms_development_super_secret_access_jwt_key_2026',
```
**Recommended Fix:**
1. Hapus seluruh fallback default string literal dari `jwt.config.ts`, `jwt.strategy.ts`, `auth.service.ts`, dan `env.validation.ts`.
2. Jadikan `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` sebagai **wajib** (`Joi.string().required().min(32)`) sehingga aplikasi gagal boot (*fail-fast*) jika secret belum dikonfigurasi.
**Risk if ignored:** Penyerang dapat memalsukan (*forge*) JWT token dengan role `ADMIN` dan mengambil alih seluruh sistem WMS.

---

### Finding ID: SEC-02
**Severity:** HIGH  
**Location:** Git Commit History & Infrastructure Specification  
**File:** `backend/src/config/database.config.ts` (Commit `69e819a435f82518f7db7a0d5a3248e00f08826a`), [`backend/docker-compose.yml`](file:///d:/Project/Warehouse/backend/docker-compose.yml), `docs/operations/INFRASTRUCTURE.md`  
**Lines:** `69e819a:database.config.ts:L6`, `docker-compose.yml:L10`, `INFRASTRUCTURE.md:L42`  
**Issue:** Plaintext Database & Storage Credentials Pernah Di-commit ke Git History  
**Why it matters:** Meskipun pada working tree saat ini `database.config.ts` telah diubah, Git history menyimpan commit `69e819a` secara permanen. Siapa pun yang memiliki akses ke repositori git dapat mengekstrak riwayat connection string tersebut.  
**Evidence:**
```diff
commit 69e819a435f82518f7db7a0d5a3248e00f08826a
+ export const databaseConfig = registerAs('database', () => ({
+   url: process.env.DATABASE_URL || 'postgresql://wms_user:********@localhost:5432/wms_nusantara?schema=public',
+ }));
```
**Recommended Fix:**
1. Anggap credential `wms_user:********` telah terkompromi (*compromised*).
2. Terapkan prosedur **Rotate & Replace**: Ubah password PostgreSQL lokal dan staging ke password baru yang acak dan kuat melalui `.env`.
3. Bersihkan default fallback password pada `docker-compose.yml` (`${POSTGRES_PASSWORD:?DATABASE PASSWORD REQUIRED}`).
4. Jika repositori akan dipublikasikan ke public remote, lakukan git history cleanup terencana menggunakan `git-filter-repo` setelah persetujuan.
**Risk if ignored:** Kredensial database dapat dieksploitasi jika repositori diakses oleh pihak yang tidak berwenang.

---

### Finding ID: SEC-03
**Severity:** HIGH  
**Location:** Billing & Invoices Module Access Control  
**File:** [`backend/src/modules/billing/billing.controller.ts`](file:///d:/Project/Warehouse/backend/src/modules/billing/billing.controller.ts), [`backend/src/modules/billing/billing.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/billing/billing.service.ts)  
**Lines:** `billing.controller.ts:L37,L89`, `billing.service.ts:L155-L165,L281-L285`  
**Issue:** Broken Access Control / BOLA: Akun Driver Dapat Mengakses Faktur Tagihan Pelanggan  
**Why it matters:** Route `@Get('billing/invoices')` dan `@Get('billing/invoices/:id')` tidak dibatasi dengan guard peran `@Roles(UserRole.ADMIN, UserRole.CUSTOMER)`. Di dalam service, filter isolasi tenant hanya diterapkan untuk `CUSTOMER` (`if (currentUser.role === UserRole.CUSTOMER) where.customerId = currentUser.id`). Akun dengan role `DRIVER` yang memanggil endpoint ini akan mem-bypass filter dan mendapatkan seluruh daftar faktur tagihan dan nilai nominal finansial seluruh pelanggan.  
**Evidence:**
```ts
// billing.service.ts - findAllInvoices
if (currentUser.role === UserRole.CUSTOMER) {
  where.customerId = currentUser.id;
}
// Tidak ada pengecekan untuk DRIVER -> DRIVER melihat SELURUH invoice!
```
**Recommended Fix:**
Tambahkan `@Roles(UserRole.ADMIN, UserRole.CUSTOMER)` pada seluruh endpoint penagihan di `billing.controller.ts` dan tolak akses untuk role `DRIVER` secara eksplisit (`ForbiddenException`).  
**Risk if ignored:** Kebocoran data finansial, volume sewa, dan profil pelanggan ke pengemudi logistik.

---

### Finding ID: SEC-04
**Severity:** HIGH  
**Location:** Master Goods Module Access Control  
**File:** [`backend/src/modules/goods/goods.controller.ts`](file:///d:/Project/Warehouse/backend/src/modules/goods/goods.controller.ts), [`backend/src/modules/goods/goods.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/goods/goods.service.ts)  
**Lines:** `goods.controller.ts:L155,L207`, `goods.service.ts:L800-L806,L946-L950`  
**Issue:** Broken Access Control / BOLA: Akun Driver Dapat Melihat Seluruh Master SKU Inventaris  
**Why it matters:** Serupa dengan modul billing, `goodsService.findAll` dan `goodsService.findById` hanya membatasi `where.customerId` untuk role `CUSTOMER`. Role `DRIVER` dapat melihat seluruh master SKU inventaris barang milik semua tenant di semua gudang.  
**Evidence:**
```ts
// goods.service.ts - findAll
if (currentUser.role === UserRole.CUSTOMER) {
  where.customerId = currentUser.id;
} else if (currentUser.role === UserRole.ADMIN) {
  if (query.customerId) where.customerId = query.customerId;
}
// DRIVER tidak difilter -> Mengambil seluruh data barang tenant lain
```
**Recommended Fix:**
Tambahkan pembatasan peran yang jelas: `@Roles(UserRole.ADMIN, UserRole.CUSTOMER)` atau untuk Driver hanya izinkan barang yang terkait dengan Surat Jalan (`DeliveryOrder`) aktif miliknya.  
**Risk if ignored:** Driver dapat memetakan seluruh inventaris komoditas dan kuantitas barang bernilai tinggi di seluruh gudang.

---

### Finding ID: SEC-05
**Severity:** HIGH  
**Location:** IoT Telemetry Module Ingestion  
**File:** [`backend/src/modules/telemetry/telemetry.controller.ts`](file:///d:/Project/Warehouse/backend/src/modules/telemetry/telemetry.controller.ts)  
**Lines:** `telemetry.controller.ts:L26-L50`  
**Issue:** Unrestricted Telemetry Ingest Endpoint (Missing Role / API Key Guard)  
**Why it matters:** Endpoint `@Post('telemetry/ingest')` hanya dilindungi oleh `@UseGuards(JwtAuthGuard, RolesGuard)` tanpa batasan peran `@Roles(...)`. Setiap user yang terautentikasi (termasuk Customer) dapat mengirimkan payload telemetry palsu untuk mengubah data suhu sensor Cold Storage atau Armada Reefer.  
**Evidence:**
```ts
@Post('ingest')
@HttpCode(HttpStatus.CREATED)
async ingest(@Body() dto: IngestTelemetryDto) { ... }
```
**Recommended Fix:**
Batasi endpoint ingest telemetry hanya untuk role `ADMIN` atau terapkan API Key autentikasi khusus IoT hardware sensor (`X-IoT-API-Key`).  
**Risk if ignored:** Manipulasi data suhu cold chain yang dapat memicu alarm anomali palsu atau menyembunyikan kerusakan unit pendingin.

---

## Medium Findings

### Finding ID: SEC-06
**Severity:** MEDIUM  
**Location:** Database Seeder Default Passwords  
**File:** [`backend/prisma/seed.ts`](file:///d:/Project/Warehouse/backend/prisma/seed.ts)  
**Lines:** `seed.ts:L30`  
**Issue:** Hardcoded Static Password Hash untuk Semua Akun Seed  
**Why it matters:** Seluruh akun default (`admin@wms.id`, `customer@freshfoods.id`, `driver@wms.id`, dsb.) menggunakan password statis yang sama (`Password123!`). Jika perintah `prisma db seed` dijalankan di lingkungan deployment publik atau staging tanpa rotasi manual, akun-akun tersebut langsung dapat diakses siapa pun.  
**Recommended Fix:**
Buat mekanisme seed dinamis yang membaca password dari environment variable `SEED_ADMIN_PASSWORD` atau melakukan generate random password saat seeding.  
**Risk if ignored:** Akses tidak sah ke akun administratif default.

---

### Finding ID: SEC-07
**Severity:** MEDIUM  
**Location:** Object Storage Configuration (MinIO S3 Abstraction)  
**File:** [`backend/docker-compose.yml`](file:///d:/Project/Warehouse/backend/docker-compose.yml), [`backend/src/modules/billing/services/storage.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/billing/services/storage.service.ts)  
**Lines:** `docker-compose.yml:L55`, `storage.service.ts:L73`  
**Issue:** Kebijakan Akses Bucket Anonim Terbuka Publik (`download` policy)  
**Why it matters:** Helper script MinIO mengeset `/usr/bin/mc anonymous set download localminio/wms-storage;`. Hal ini menyebabkan semua file bukti transfer pembayaran (`proofs/*`) dan foto POD dapat diunduh langsung oleh siapa pun melalui HTTP tanpa autentikasi jika mengetahui atau menebak URL file.  
**Recommended Fix:**
Ubah bucket MinIO menjadi *private* dan gunakan **Presigned URLs** (dengan masa berlaku 15–60 menit) atau stream file melalui controller terproteksi `@UseGuards(JwtAuthGuard)`.  
**Risk if ignored:** Paparan data privasi bukti transaksi perbankan dan tanda tangan digital ke publik.

---

### Finding ID: SEC-08
**Severity:** MEDIUM  
**Location:** File Upload Validation in Storage Service  
**File:** [`backend/src/modules/billing/services/storage.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/billing/services/storage.service.ts)  
**Lines:** `storage.service.ts:L49-L53,L69`  
**Issue:** Validasi Tipe File Hanya Berdasarkan Header Client (`mimeType`) Tanpa Magic Byte Header Inspection  
**Why it matters:** Validasi file bukti transfer saat ini hanya memeriksa string `file.mimeType` yang dikirimkan oleh browser/client (`['image/jpeg', 'image/png', 'image/webp', 'application/pdf']`). Penyerang dapat memalsukan Content-Type header untuk mengunggah file berbahaya (misal script/executable).  
**Recommended Fix:**
Tambahkan validasi buffer signature (*magic numbers*) menggunakan library seperti `file-type` pada backend untuk memastikan konten riil file sesuai dengan ekstensinya.  
**Risk if ignored:** Risiko upload file berbahaya / payload injection ke object storage.

---

### Finding ID: SEC-09
**Severity:** MEDIUM  
**Location:** Frontend Token Storage  
**File:** [`frontend/src/lib/api-client.ts`](file:///d:/Project/Warehouse/frontend/src/lib/api-client.ts)  
**Lines:** `api-client.ts:L195,L282`  
**Issue:** Penyimpanan Refresh Token di Browser `localStorage`  
**Why it matters:** Menyimpan JWT `access_token` dan terutama `refresh_token` di `localStorage` rentan terhadap pencurian token melalui serangan Cross-Site Scripting (XSS).  
**Recommended Fix:**
Migrasikan penyimpanan `refresh_token` ke dalam `HttpOnly, Secure, SameSite=Strict` Cookies di backend.  
**Risk if ignored:** Jika terjadi celah XSS pada frontend di masa depan, token sesi user dapat diekstrak oleh script penyerang.

---

### Finding ID: SEC-10
**Severity:** MEDIUM  
**Location:** Authentication Password Reset Flow  
**File:** [`backend/src/modules/auth/auth.service.ts`](file:///d:/Project/Warehouse/backend/src/modules/auth/auth.service.ts), [`backend/src/modules/auth/auth.controller.ts`](file:///d:/Project/Warehouse/backend/src/modules/auth/auth.controller.ts)  
**Lines:** `auth.service.ts:L327-L360`, `auth.controller.ts:L115`  
**Issue:** Direct Password Reset Tanpa Verifikasi Token / OTP Email  
**Why it matters:** Endpoint `POST /auth/reset-password` menerima `{ email, newPassword }` dan langsung mengubah password pengguna di database tanpa memverifikasi kepemilikan email melalui link reset/OTP berbatas waktu.  
**Recommended Fix:**
Ubah flow menjadi 2-langkah:
1. `POST /auth/forgot-password` $\rightarrow$ Menerbitkan time-limited signed reset token via email.
2. `POST /auth/reset-password` $\rightarrow$ Menerima `{ token, newPassword }` dan memverifikasi token sebelum update password.  
**Risk if ignored:** Siapa pun yang mengetahui alamat email pengguna dapat mereset password akun tersebut tanpa izin.

---

## Low Findings

### Finding ID: SEC-11
**Severity:** LOW  
**Location:** Frontend Git Ignore Specification  
**File:** [`frontend/.gitignore`](file:///d:/Project/Warehouse/frontend/.gitignore)  
**Lines:** `frontend/.gitignore:L26`  
**Issue:** Pattern `.env` pada subfolder frontend hanya mencakup `.env*.local`  
**Why it matters:** Meskipun root `.gitignore` sudah mencakup `.env` dan `.env.*`, file `.gitignore` di subfolder `frontend/` sebaiknya menyertakan rule eksplisit `.env`, `.env.development`, `.env.production` untuk konsistensi proteksi multi-tier.  
**Recommended Fix:**
Tambahkan `.env`, `.env.development`, `.env.production` ke dalam `frontend/.gitignore`.

---

### Finding ID: SEC-12
**Severity:** LOW  
**Location:** Architecture Documentation Files  
**File:** [`docs/architecture/BACKEND.md`](file:///d:/Project/Warehouse/docs/architecture/BACKEND.md), [`docs/database/DATABASE_ARCHITECTURE.md`](file:///d:/Project/Warehouse/docs/database/DATABASE_ARCHITECTURE.md)  
**Issue:** Terdapat Contoh String Koneksi Database Literal pada File Dokumentasi Markdown  
**Why it matters:** File dokumentasi mencantumkan contoh connection string dengan username dan password dummy. Praktik terbaik adalah menggunakan placeholder murni (misal: `postgresql://<DB_USER>:<DB_PASSWORD>@...`).  
**Recommended Fix:**
Ganti string contoh di seluruh file markdown menjadi format placeholder `<USERNAME>:<PASSWORD>`.

---

## Informational & Verified Safe Controls

1. **Frontend Secret Leakage (SAFE)**:
   - Tidak ditemukan API key privat, JWT secret, atau database connection string yang bocor ke browser bundle frontend.
   - Variabel yang terekspos hanya `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_USE_MOCK`.
2. **Pino Logger Redaction (SAFE)**:
   - `app.module.ts` telah mengonfigurasi redaksi otomatis untuk `req.headers.authorization`, `req.headers.cookie`, `body.password`, `body.newPassword`, `body.token`, `body.refreshToken`, dsb.
   - `LoggingInterceptor` tidak mencatat body request atau authorization header ke console.
3. **Production Error Response Sanitization (SAFE)**:
   - `GlobalExceptionFilter` memastikan bahwa pada environment production (`NODE_ENV === 'production'`), client hanya menerima pesan error yang telah dinormalisasi tanpa kebocoran internal schema Prisma, query SQL, atau stack trace.
4. **SQL Injection Protection (SAFE)**:
   - Seluruh interaksi database menggunakan Prisma ORM dengan parameterized queries yang aman dari SQL Injection.

---

## Hardcoded Secrets Summary Table

| Komponen / File | Parameter | Status Nilai | Klasifikasi | Tindakan |
| :--- | :--- | :--- | :---: | :--- |
| `backend/src/config/jwt.config.ts` | `accessSecret`, `refreshSecret` | Fallback String Literal | **HIGH** | Hapus fallback; wajibkan dari env |
| `backend/src/config/env.validation.ts` | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Default Joi String | **HIGH** | Ubah `.default(...)` $\rightarrow$ `.required()` |
| `backend/src/modules/auth/auth.service.ts` | `accessSecret`, `refreshSecret` | Fallback String Literal | **HIGH** | Hapus fallback; ambil strictly dari config |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | `secretOrKey` | Fallback String Literal | **HIGH** | Hapus fallback string |
| `backend/docker-compose.yml` | `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD` | Default Environment Fallback | **HIGH** | Hapus default literal |
| `backend/prisma/seed.ts` | Seed Password Hash | Statis `"Password123!"` | **MEDIUM** | Gunakan env parameter dinamis |

---

## Git History Exposure

1. **Commit `69e819a435f82518f7db7a0d5a3248e00f08826a` (Branch `master`, `backend-development`)**:
   - File `backend/src/config/database.config.ts` ditambahkan dengan string koneksi `postgresql://wms_user:********@localhost:5432/wms_nusantara?schema=public`.
   - **Tindakan yang direkomendasikan**: Anggap credential lokal ini telah exposed. Lakukan rotasi password pada database server dan perbarui `.env` lokal.

---

## Environment Configuration

1. **Backend `.env.example`**:
   - Berisi template konfigurasi dengan placeholder standar (`USERNAME:PASSWORD`, `your_jwt_access_secret_...`).
   - File `.env` lokal **tidak di-track** oleh git (terdaftar di `.gitignore`).
2. **Frontend `.env.example`**:
   - Bersih dari secret, hanya mencantumkan `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_USE_MOCK`.

---

## Recommended Remediation

### Tahap 1: Secret Hardening & Fallback Elimination (Prioritas Utama)
1. Hapus seluruh fallback secret JWT dari `jwt.config.ts`, `jwt.strategy.ts`, `auth.service.ts`, dan `env.validation.ts`.
2. Validasi ketat bahwa `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` wajib memiliki panjang minimal 32 karakter.
3. Rotasi password PostgreSQL lokal dan MinIO.

### Tahap 2: Broken Access Control & Multi-Tenant Hardening
1. Tambahkan `@Roles(UserRole.ADMIN, UserRole.CUSTOMER)` pada `BillingController` (`/billing/invoices`, `/billing/invoices/:id`).
2. Perketat filter pada `GoodsController` agar role `DRIVER` tidak dapat melihat seluruh katalog barang milik tenant lain.
3. Batasi endpoint `@Post('telemetry/ingest')` untuk role `ADMIN` atau hardware IoT key.

### Tahap 3: Storage & Upload Hardening
1. Hapus anonymous download policy pada MinIO bucket.
2. Terapkan presigned URL untuk file bukti pembayaran dan dokumen POD.
3. Tambahkan validasi buffer signature (*magic numbers*) pada upload file.

### Tahap 4: Authentication & Password Reset Flow Hardening
1. Implementasikan token-based verification flow pada proses forgot/reset password.
2. Pertimbangkan migrasi refresh token ke secure HttpOnly cookies.

---

## Priority Remediation Order

```
[P1] SEC-01: Hapus Fallback JWT Secrets & Wajibkan Joi .required()
  │
  ▼
[P2] SEC-03 & SEC-04: Perbaiki Broken Access Control (RBAC Driver pada Invoices & Goods)
  │
  ▼
[P3] SEC-05: Proteksi Endpoint Ingest Telemetry Sensor
  │
  ▼
[P4] SEC-02 & SEC-06: Rotasi Credential Database & Konfigurasi Dynamic Seed
  │
  ▼
[P5] SEC-07 & SEC-08: Hardening MinIO Object Storage (Private Bucket & Presigned URLs)
  │
  ▼
[P6] SEC-10: Token-based Forgot Password Flow
```
