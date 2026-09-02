# Cloud Production Deployment Guide
**Warehouse Management System (WMS Nusantara)**
*Evolusi dari SRS Perkuliahan Menjadi Platform Cloud Enterprise: Next.js 15 Frontend on Vercel Edge, NestJS 10 Serverless Backend, and Supabase PostgreSQL on AWS Sydney*

---

> **Catatan Konteks & Asal-Usul Proyek**:
> Platform ini berakar dari dokumen akademis spesifikasi kebutuhan sistem (*Software Requirements Specification* - SRS) pergudangan masa kuliah yang mendefinisikan 16 Use Cases fungsional. Melalui fase *Enterprise Rework*, seluruh kebutuhan tersebut direkayasa ulang secara penuh menjadi arsitektur cloud-native modern berstandar industri dengan bantuan Google DeepMind Antigravity AI, Google Stitch, Supabase, dan Vercel.

---

## 1. Arsitektur Produksi Cloud (Production Topology)

Sistem WMS Nusantara mengadopsi arsitektur terdistribusi cloud modern dengan pemisahan client dan API gateway yang ter-kolokasi secara optimal:

```text
[ Reviewer / User Browser ]
           │
           ▼ HTTPS (Anycast Edge CDN)
┌─────────────────────────────────────────────────────────┐
│              FRONTEND: Vercel Edge Network              │
│                Domain: wms-porto.vercel.app             │
│            Next.js 15.1.12 App Router (React 19)        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼ HTTPS REST API (JSON Envelope)
┌─────────────────────────────────────────────────────────┐
│             BACKEND: Vercel Serverless Function         │
│          Domain: warehouse-management-system-olive      │
│                     Region: syd1 (Sydney)               │
│                NestJS 10.4 + ExpressAdapter             │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼ TCP (Port 6543 - PgBouncer Transaction Pooler)
┌─────────────────────────────────────────────────────────┐
│            DATABASE: Supabase Managed Postgres          │
│                Region: ap-southeast-2 (Sydney)          │
│               PostgreSQL 16 Engine + Prisma ORM         │
└─────────────────────────────────────────────────────────┘
```

> **Keunggulan Kolokasi Region (`syd1` $\leftrightarrow$ `ap-southeast-2`)**:
> Backend Serverless Vercel dan Cluster Database Supabase ditempatkan pada region geografis yang sama (Sydney, Australia). Hal ini memangkas roundtrip latency antar-query dari ~800ms menjadi **di bawah 5 milidetik (<5ms)**, sehingga agregasi data multi-tabel pada Dashboard Admin berjalan instan.

---

## 2. Live Production Endpoints

| Layanan | Domain / URL | Keterangan |
| :--- | :--- | :--- |
| **Web Portal Client** | [https://wms-porto.vercel.app](https://wms-porto.vercel.app) | Frontend Next.js 15 produksi untuk Admin, Driver, dan Customer |
| **REST API Gateway** | [https://warehouse-management-system-olive.vercel.app/api/v1](https://warehouse-management-system-olive.vercel.app/api/v1) | Endpoint terpusat seluruh business logic WMS Nusantara |
| **Interactive Docs** | [https://warehouse-management-system-olive.vercel.app/api/docs](https://warehouse-management-system-olive.vercel.app/api/docs) | Dokumentasi Swagger OpenAPI interaktif dengan otentikasi JWT |
| **Readiness Probe** | [https://warehouse-management-system-olive.vercel.app/health/readiness](https://warehouse-management-system-olive.vercel.app/health/readiness) | Pengecekan status koneksi live PostgreSQL Supabase |
| **Liveness Probe** | [https://warehouse-management-system-olive.vercel.app/health/liveness](https://warehouse-management-system-olive.vercel.app/health/liveness) | Pengecekan uptime dan memory heap runtime Node.js |

---

## 3. Teknologi & Alat Pengembangan (Engineering Tooling)

Sistem ini dirancang dan dibangun dengan mengintegrasikan serangkaian teknologi generasi mutakhir:

### A. Artificial Intelligence & Architecting
- **Google DeepMind Antigravity AI**: Bertindak sebagai AI Pair Programmer & System Architect otonom untuk merancang modul, membersihkan dependensi real-time (SSE decoupling), mengaudit kompatibilitas serverless, dan mengotomatiskan pengujian E2E.
- **Google Stitch**: Digunakan dalam fase *visual discovery* dan *design token generation* untuk menghasilkan tampilan dashboard enterprise yang modern, harmonis, dan intuitif.

### B. Frontend Framework & Client Layer
- **Next.js 15.1.12 (App Router)**: Server-Side Rendering (SSR) & Static Site Generation (SSG) dengan kompilasi 45 rute teroptimasi.
- **React 19**: Primitif UI reaktif terkini dengan optimasi rendering.
- **TailwindCSS & Radix UI**: Sistem desain visual konsisten dengan token palet warna fungsional (*Indigo/Emerald/Amber*).
- **TanStack React Query v5**: Sinkronisasi state asinkronus dengan cache invalidation otomatis.
- **Zustand**: Manajemen state global sesi otentikasi dan token rotasi.

### C. Backend & API Service Layer
- **NestJS 10.4**: Framework enterprise TypeScript modular dengan Dependency Injection bersih.
- **Pino Structured Logger**: Logging JSON terstruktur dengan redaksi otomatis data sensitif (header Authorization & Cookie).
- **Helmet & Compression**: Proteksi header HTTP standar OWASP dan kompresi payload Gzip/Brotli.
- **Class-Validator & Class-Transformer**: Validasi data input ketat (*strict whitelist pipe*).

### D. Database & Infrastructure Layer
- **Supabase (PostgreSQL 16)**: Database relasional terkelola dengan performa tinggi.
- **Transaction Mode Pooler (Port 6543)**: Menggunakan PgBouncer Supabase untuk multiplexing ribuan query serverless tanpa *connection exhaustion* (`EMAXCONNSESSION`).
- **Prisma ORM (v6.19.3)**: Engine query bertipe kuat dengan adaptasi connection pool dinamis (`connection_limit=5`, `pool_timeout=20s`).
- **Vercel Cloud Platform**: Hosting otomatis dengan zero-config CI/CD dari repository GitHub `master`.

---

## 4. Konfigurasi Environment Variables Produksi

### Backend Vercel Project (`warehouse-management-system`)
```ini
NODE_ENV=production
API_PREFIX=api/v1
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=20"
JWT_ACCESS_SECRET="[RANDOM_SECURE_32_CHAR_STRING]"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="[RANDOM_SECURE_32_CHAR_STRING]"
JWT_REFRESH_EXPIRATION="7d"
LOG_LEVEL="info"
CORS_ORIGIN="https://wms-porto.vercel.app"
```

### Frontend Vercel Project (`warehouse-management-system-frontend`)
```ini
NEXT_PUBLIC_API_URL="https://warehouse-management-system-olive.vercel.app/api/v1"
```

---

## 5. Prosedur Pemeliharaan & Verifikasi Produksi

Untuk memastikan kesehatan sistem secara berkala pasca-deployment:

```bash
# 1. Pengecekan Liveness & Readiness Serverless
curl -s https://warehouse-management-system-olive.vercel.app/health/liveness
curl -s https://warehouse-management-system-olive.vercel.app/health/readiness

# 2. Simulasi Login Autentikasi Demo
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@wms.id","password":"123456"}' \
  https://warehouse-management-system-olive.vercel.app/api/v1/auth/login

# 3. Pengecekan Query Gudang Terkolokasi (<100ms)
curl -s -H "Authorization: Bearer <TOKEN>" \
  https://warehouse-management-system-olive.vercel.app/api/v1/warehouses
```
