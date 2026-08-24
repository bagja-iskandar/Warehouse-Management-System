# WMS Nusantara (Warehouse Management System)

Platform tata kelola operasional pergudangan modern dan rantai dingin (*Cold Chain Logistics*) terintegrasi dengan arsitektur **Monorepo** yang memisahkan client frontend dan service backend secara independen.

---

## 🔐 Kredensial Login Akun (Semua Role)

Semua akun default terdaftar pada database PostgreSQL dengan password: **`Password123!`**.

| Role / Peran | Email / Username | Password | Nama Pengguna / Instansi | Redirect Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Warehouse Administrator** | `admin@wms.id` | `Password123!` | Budi Santoso (PT Logistik Prima Nusantara) | `/admin/dashboard` |
| **Corporate Customer (Haidar)** | `haidar@gmail.com` | `Password123!` | Haidar (Tenant Cold Storage) | `/customer/dashboard` |
| **Corporate Customer (Pandu)** | `pandu@gmail.com` | `Password123!` | Pandu (Tenant Standard Dry) | `/customer/dashboard` |
| **Logistics Fleet Driver (Cakung)** | `driver@wms.id` | `Password123!` | Agus Pratama (Armada Reefer Cakung) | `/driver/dashboard` |
| **Logistics Fleet Driver (Bandung)** | `dedi.driver@wms.id` | `Password123!` | Dedi Kurniawan (Armada Bandung) | `/driver/dashboard` |

> [!NOTE]
> Setelah login pada `/login`, sistem secara otomatis mengidentifikasi role dari token JWT dan mengarahkan pengguna ke portal operasional yang sesuai tanpa perlu memilih role secara manual.

---

## 📁 Struktur Monorepo & Dokumentasi

```text
Warehouse/
│
├── backend/                              # NestJS 10.x API Gateway & Service (Port 5000)
│   ├── src/                              # Source code (10 feature modules & common guards)
│   ├── prisma/                           # Schema, migrasi, dan seed database
│   ├── scripts/                          # Script pemeliharaan & diagnostik database
│   └── test/                             # E2E test suites
│
├── frontend/                             # Next.js 15 App Router Web Client (Port 3000)
│   ├── src/                              # 44 rute (Auth, Admin, Customer, Driver)
│   └── public/                           # Static assets
│
├── docs/                                 # PUSAT DOKUMENTASI TEKNIS (Single Source of Truth)
│   ├── architecture/                     # Manual arsitektur (System, Backend, Frontend, Domain, Design)
│   ├── api/                              # Master REST API contract & envelope specifications
│   ├── database/                         # PostgreSQL architecture, indexing, dan migrasi cloud
│   ├── adr/                              # Architecture Decision Records (ADR-001 s.d. ADR-006)
│   ├── operations/                       # Docker Compose, MinIO, dan infrastruktur
│   ├── security/                         # Laporan Security Audit Phase 1
│   └── qa/                               # Pre-QA evaluation, test matrices & stabilization audit
│
├── project-context/                      # CONTEXT RINGKAS UNTUK AI AGENT & DEVELOPER
│   ├── PROJECT.md                        # Master konteks project & business capabilities
│   ├── ROADMAP.md                        # Master riwayat eksekusi Phase 0 s.d. Phase 15
│   └── SKILLS_MAP.md                     # Indeks skill agen dan panduan workflow
│
├── scripts/                              # SCRIPT VERIFIKASI & PENGUJIAN OTOMATIS
│   ├── verification/                     # Script E2E lifecycle & verification testing
│   └── maintenance/                      # Script pemeliharaan & data reconciliation
│
└── skills/                               # Library skills repositori
```

---

## 📚 Indeks Dokumentasi Teknis

| Kategori | Dokumen | Deskripsi |
| :--- | :--- | :--- |
| **Arsitektur Sistem** | [docs/architecture/SYSTEM_OVERVIEW.md](file:///d:/Project/Warehouse/docs/architecture/SYSTEM_OVERVIEW.md) | Topologi Monorepo, alur multi-client, dan workflow data. |
| **Backend Service** | [docs/architecture/BACKEND.md](file:///d:/Project/Warehouse/docs/architecture/BACKEND.md) | Arsitektur NestJS 10, 10 modul, security pipeline, dan business engine. |
| **Frontend Web** | [docs/architecture/FRONTEND.md](file:///d:/Project/Warehouse/docs/architecture/FRONTEND.md) | Next.js 15 App Router, Floating Shell, Zustand, TanStack Query, dan error boundaries. |
| **Domain Models** | [docs/architecture/DOMAIN_MODELS.md](file:///d:/Project/Warehouse/docs/architecture/DOMAIN_MODELS.md) | Entitas domain universal, TypeScript interfaces, dan relasi Prisma. |
| **Design System** | [docs/architecture/DESIGN_SYSTEM.md](file:///d:/Project/Warehouse/docs/architecture/DESIGN_SYSTEM.md) | UI tokens, tema peran (Indigo/Emerald/Amber), dan 7 UX states. |
| **API Contract** | [docs/api/API_CONTRACT.md](file:///d:/Project/Warehouse/docs/api/API_CONTRACT.md) | Spesifikasi lengkap endpoint REST API v1 dan format amplop JSON. |
| **Database** | [docs/database/DATABASE_ARCHITECTURE.md](file:///d:/Project/Warehouse/docs/database/DATABASE_ARCHITECTURE.md) | PostgreSQL 16, indexing, pooling, dan migrasi cloud. |
| **ADRs** | [docs/adr/README.md](file:///d:/Project/Warehouse/docs/adr/README.md) | Architecture Decision Records (ADR-001 s.d. ADR-006). |
| **Infrastruktur** | [docs/operations/INFRASTRUCTURE.md](file:///d:/Project/Warehouse/docs/operations/INFRASTRUCTURE.md) | Docker Compose, PostgreSQL 16 Alpine, dan MinIO S3. |
| **Keamanan** | [docs/security/SECURITY_AUDIT_PHASE_1.md](file:///d:/Project/Warehouse/docs/security/SECURITY_AUDIT_PHASE_1.md) | Laporan audit keamanan tahap 1 (Secret & RBAC exposure). |
| **Kesiapan QA** | [docs/qa/PRE_QA_READINESS.md](file:///d:/Project/Warehouse/docs/qa/PRE_QA_READINESS.md) | Deklarasi kesiapan Pre-QA dan matriks evaluasi 44 rute. |
| **Stabilisasi** | [docs/qa/SYSTEM_STABILIZATION_AUDIT.md](file:///d:/Project/Warehouse/docs/qa/SYSTEM_STABILIZATION_AUDIT.md) | Matriks audit stabilisasi & ketahanan error boundary. |
| **Ketertelusuran SRS** | [docs/qa/SRS_TRACEABILITY.md](file:///d:/Project/Warehouse/docs/qa/SRS_TRACEABILITY.md) | Matriks ketertelusuran 16 SRS Use Cases. |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan Backend (NestJS + PostgreSQL)
```bash
cd backend

# Install dependencies jika belum
npm install

# Setup Prisma & seeder
npx prisma generate
npx prisma db push
npx prisma db seed

# Menjalankan server dev (Port 5000)
npm run start:dev
```
- **API Base URL:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Swagger Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### 2. Menjalankan Frontend (Next.js 15)
```bash
cd frontend

# Install dependencies jika belum
npm install

# Menjalankan Next.js dev server (Port 3000)
npm run dev
```
- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **Login Portal:** [http://localhost:3000/login](http://localhost:3000/login)

---

## 🧪 Pengujian & Verifikasi

### Backend Tests
```bash
cd backend
npx tsc --noEmit    # Validasi TypeScript
npm run test        # Unit testing (Jest)
npm run test:e2e    # E2E testing
```

### Frontend Tests
```bash
cd frontend
npx tsc --noEmit    # Validasi TypeScript
npm run lint        # Linting ESLint
npm run build       # Production bundle build
```

### E2E Lifecycle Verification Scripts
```bash
node scripts/verification/verify_customer_logistics_lifecycle.js
node scripts/verification/verify_customer_track_deliveries.js
node scripts/verification/verify_full_payment_lifecycle.js
```
