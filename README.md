# WMS Nusantara (Enterprise Warehouse & Cold Chain Logistics Platform)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel)](https://wms-porto.vercel.app)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.12-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.4-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![Supabase Postgres](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM%20v6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Built with Antigravity](https://img.shields.io/badge/Built%20With-Google%20DeepMind%20Antigravity-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

Platform Enterprise tata kelola pergudangan terpadu (*Warehouse Management System*) dan logistik rantai dingin (*Cold Chain Logistics*) di Indonesia. Sistem ini mengintegrasikan pemantauan suhu IoT real-time, manajemen kapasitas m³ bertingkat (*multi-tier rack allocation*), dispatch armada truk pendingin (*reefer fleet*), serta sistem penagihan kontrak sewa otomatis.

---

## 🎓 Asal-Usul Proyek: Dari SRS Kuliah Menuju Enterprise Rework

Proyek ini bermula dari dokumen akademis **Software Requirements Specification (SRS) Sistem Penyimpanan Gudang** yang disusun saat masa perkuliahan (terdokumentasi di [docs/SRS/](file:///d:/Project/Warehouse/docs/SRS)). Dokumen awal tersebut memuat rancangan 16 Use Cases fungsional inti untuk operasional pergudangan dan logistik.

Pada fase saat ini, proyek telah menjalani **Tahap Rework & Rekayasa Ulang Menyeluruh (Enterprise Rework)**:
1. **Transformasi Arsitektur**: Mengubah cetak biru akademis menjadi platform cloud-native terdistribusi berskala *production-ready*.
2. **Implementasi Full-Stack Modern**: Menggantikan pendekatan monolitik konvensional dengan pemisahan **Next.js 15 App Router** di sisi frontend dan **NestJS 10 Modular Clean Architecture** di sisi backend.
3. **Penyelarasan 16 Use Cases (100% Verified)**: Seluruh 16 Use Cases dari dokumen SRS perkuliahan (mulai dari *Input Barang*, *Pemilihan Kendaraan*, *Penjadwalan*, *Monitoring Suhu IoT*, *Konfirmasi POD*, hingga *Penagihan & Denda Keterlambatan*) telah diimplementasikan penuh dan lolos uji end-to-end (lihat matriks di [docs/qa/SRS_TRACEABILITY.md](file:///d:/Project/Warehouse/docs/qa/SRS_TRACEABILITY.md)).
4. **Didukung Next-Gen AI**: Proses rekayasa ulang, refactoring arsitektur, dan optimasi performa serverless dikolaborasikan bersama **Google DeepMind Antigravity AI** dan perancangan visual antarmuka dengan **Google Stitch**.

---

## 🌐 Live Production Deployment

Aplikasi telah berhasil dideploy penuh secara serverless ke cloud production:

| Komponen | Lingkungan | Tautan Akses / URL |
| :--- | :--- | :--- |
| **Frontend Web App (Client)** | Vercel Edge Network | [**https://wms-porto.vercel.app**](https://wms-porto.vercel.app) |
| **Backend REST API** | Vercel Serverless Function (`syd1`) | [**https://warehouse-management-system-olive.vercel.app/api/v1**](https://warehouse-management-system-olive.vercel.app/api/v1) |
| **Interactive API Documentation** | Swagger OpenAPI UI | [**https://warehouse-management-system-olive.vercel.app/api/docs**](https://warehouse-management-system-olive.vercel.app/api/docs) |
| **System Readiness Probe** | Live Database Healthcheck | [**https://warehouse-management-system-olive.vercel.app/health/readiness**](https://warehouse-management-system-olive.vercel.app/health/readiness) |

---

## 🔐 Kredensial Uji Coba Demo (Instant Persona Login)

Pada halaman login ([wms-porto.vercel.app/login](https://wms-porto.vercel.app/login)), Anda dapat mengklik tombol **Instant Review Persona** di bawah form login tanpa perlu mengetik manual:

| Persona | Tombol Cepat UI | Akun Email | Password | Hak Akses & Kemampuan |
| :--- | :--- | :--- | :--- | :--- |
| **Warehouse Administrator** | `[ Login as Admin ]` | `admin@wms.id` | `123456` | Overview kapasitas 3 gudang, monitoring suhu telemetri, penugasan armada (*dispatch*), approval delivery, dan verifikasi invoice. |
| **Logistics Fleet Driver** | `[ Login as Driver ]` | `driver@wms.id` | `123456` | Penerimaan tugas delivery, seleksi kendaraan reefer, update status perjalanan real-time (*In-Transit* s/d *Arrived*), dan upload Digital POD. |
| **Corporate Tenant / Customer**| `[ Login as Customer ]` | `customer@wms.id` | `123456` | Registrasi inventaris barang (*inbound*), sewa kapasitas gudang cold/dry, permohonan logistik, dan pelunasan faktur sewa. |

---

## 🤖 Built With Next-Gen AI & Modern Engineering Tools

Aplikasi ini dirancang, diarsitekkan, dan dikembangkan secara end-to-end menggunakan ekosistem engineering modern:

* **Google DeepMind Antigravity AI**: Bertindak sebagai *Agentic AI Pair Programmer & Lead System Architect* untuk perancangan arsitektur enterprise, implementasi business logic 10 modul NestJS, optimasi query Prisma, decoupling event real-time, hingga adaptasi serverless Vercel.
* **Google Stitch**: Digunakan untuk *Generative UI/UX Prototyping*, eksplorasi tata letak visual dashboard responsif, pemilihan palet warna logistik harmonis, dan standardisasi komponen antarmuka modern.
* **Supabase (PostgreSQL 16)**: Penyedia database PostgreSQL enterprise yang dikonfigurasi dengan *Transaction Pooler PgBouncer (Port 6543)* berlatensi rendah untuk menangani ribuan transaksi serverless tanpa *connection exhaustion*.
* **Vercel Cloud Platform**: Infrastruktur *Edge CDN* untuk pengiriman aset Next.js 15 berkecepatan tinggi di seluruh dunia, dipadukan dengan *Vercel Serverless Functions* ber-region Sydney (`syd1`) yang ter-kolokasi langsung dengan cluster database Supabase untuk latensi sub-detik.
* **Prisma ORM (v6)**: Abstraksi data relasional bertipe kuat (*type-safe*), pemodelan skema deklaratif, generator client otomatis, dan migrasi zero-downtime.
* **Docker & Docker Compose**: Lingkungan kontainerisasi lokal untuk pengujian standalone mandiri dengan PostgreSQL 16 Alpine dan MinIO S3 Object Storage.

---

## 🛠️ Tech Stack & Architecture Overview

### 1. Frontend Web Client
* **Framework:** [Next.js 15.1.12](https://nextjs.org/) (App Router, React 19)
* **Styling & Design System:** TailwindCSS, Tailwind Animate, Radix UI Primitives
* **Data Fetching & Cache:** [TanStack React Query v5](https://tanstack.com/query/latest) (dengan automatic query invalidation & prefetching)
* **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (Auth session & persistent tokens)
* **Data Visualization:** [Recharts](https://recharts.org/) (Kapasitas zona gudang, okupansi, tren suhu reefer)
* **Icons & Feedback:** Lucide React, Sonner Toast Notifications

### 2. Backend API Service
* **Framework:** [NestJS 10.4](https://nestjs.com/) (Node.js TypeScript, ExpressAdapter)
* **Architecture:** Modular Clean Architecture (Auth, Users, Warehouse, Goods, Logistics, Billing, Notifications, Analytics, Telemetry, Health)
* **Data Validation:** Class-Validator & Class-Transformer (Strict Whitelist Validation Pipe)
* **Logging & Telemetry:** Pino Structured Logger (`nestjs-pino`) dengan redacted sensitive headers
* **Security & Hardening:** Helmet (CSP, HSTS), Compression (Gzip/Brotli), Strict CORS whitelist
* **API Documentation:** Swagger OpenAPI v3 (`/api/docs`)

### 3. Database & Storage Layer
* **Database Engine:** PostgreSQL 16 (Hosted on Supabase AWS Sydney `ap-southeast-2`)
* **Connection Pooling:** Supabase Transaction Pooler via PgBouncer (Port 6543, `connection_limit=5`, `pool_timeout=20s`)
* **ORM:** Prisma Client v6.19.3
* **Object Storage Support:** MinIO S3 Compatible Object Storage

---

## 📁 Struktur Monorepo

```text
Warehouse/
│
├── backend/                              # NestJS 10 Serverless & Standalone Service
│   ├── api/index.ts                      # Vercel Serverless Function Entrypoint
│   ├── vercel.json                       # Konfigurasi routing rewrite & region Sydney (syd1)
│   ├── src/                              # Source code (10 feature modules & common guards)
│   ├── prisma/schema.prisma              # Master relational database schema
│   └── test/                             # Unit testing suites (Jest)
│
├── frontend/                             # Next.js 15 App Router Web Client
│   ├── src/app/                          # 45 rute (Auth, Admin, Customer, Driver, Favicon)
│   ├── src/components/                   # UI components, layout shell, and design tokens
│   ├── src/lib/api-client.ts             # Centralized resilient HTTP client
│   └── public/                           # Static assets, SVG branded favicon
│
├── docs/                                 # PUSAT DOKUMENTASI TEKNIS LENGKAP
│   ├── architecture/                     # System, Backend, Frontend, Domain, Design System
│   ├── api/                              # Master REST API contract & envelope specifications
│   ├── database/                         # Database schema, indexing, dan cloud pooling
│   ├── operations/                       # Panduan Deployment Cloud & Docker Infrastructure
│   └── qa/                               # Matriks pengujian & QA verification
│
└── project-context/                      # Context ringkas project & roadmap
```

---

## 🚀 Panduan Menjalankan Secara Lokal (Local Development)

Jika ingin menjalankan aplikasi pada mesin lokal pengembang:

### 1. Backend Service (Port 5000)
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```
- Endpoint API Lokal: `http://localhost:5000/api/v1`
- Swagger UI Lokal: `http://localhost:5000/api/docs`
- Healthcheck: `http://localhost:5000/health/readiness`

### 2. Frontend Client (Port 3000)
```bash
cd frontend
npm install
npm run dev
```
- Buka browser: `http://localhost:3000`

---

## 🧪 Verifikasi & Pengujian Kode

```bash
# Validasi TypeCheck Backend & Frontend
cd backend && npm run typecheck
cd ../frontend && npm run type-check

# Menjalankan Unit Tests (Jest)
cd backend && npm test

# Kompilasi Production Bundle
cd backend && npm run build
cd ../frontend && npm run build
```

---

## 📄 Lisensi
Hak Cipta © 2026 PT WMS Nusantara Logistik. Seluruh hak cipta dilindungi undang-undang.
Dikembangkan sebagai sistem portofolio enterprise berstandar industri.
