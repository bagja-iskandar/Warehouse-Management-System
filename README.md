# WMS Nusantara (Warehouse Management System)

Platform tata kelola operasional pergudangan modern terintegrasi dengan arsitektur **Monorepo** yang memisahkan client frontend dan service backend secara independen.

---

## 🔐 Kredensial Login Akun (Semua Role)

Semua akun terdaftar di database PostgreSQL `wms_db` menggunakan password default: **`Password123!`**.

| Role / Peran | Email / Username | Password | Nama Pengguna / Instansi | Redirect Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Warehouse Administrator** | `admin@wms.id` | `Password123!` | Budi Santoso (PT Logistik Prima Nusantara) | `/admin/dashboard` |
| **Corporate Customer (Cold Storage)** | `customer@freshfoods.id` | `Password123!` | Siti Rahma (CV Fresh Frozen Nusantara) | `/customer/dashboard` |
| **Corporate Customer (Standard Dry)** | `michael@megafurniture.co.id` | `Password123!` | Michael Tan (PT Mega Furniture Indo) | `/customer/dashboard` |
| **Logistics Fleet Driver (Cakung)** | `driver@wms.id` | `Password123!` | Agus Pratama (Armada Reefer Cakung) | `/driver/dashboard` |
| **Logistics Fleet Driver (Bandung)** | `dedi.driver@wms.id` | `Password123!` | Dedi Kurniawan (Armada Bandung) | `/driver/dashboard` |

> [!NOTE]
> Setelah login pada `/login`, sistem secara otomatis mengidentifikasi role dari token JWT dan mengarahkan pengguna ke dashboard operasional yang sesuai tanpa perlu memilih role manual.

---

## 📁 Struktur Monorepo

```text
Warehouse/
├── frontend/             # Next.js 15 Web Application (Admin, Customer, Driver)
├── backend/              # NestJS + Prisma ORM + PostgreSQL Service & REST API
├── docs/                 # Dokumentasi Sistem (SRS, API Contract, Architecture)
├── Project-Context/      # Panduan Konteks, Roadmap, dan Handoff Specification
└── Skills/               # Developer Skill References
```

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan Backend (NestJS + PostgreSQL)
```bash
cd backend

# Install dependencies jika belum
npm install

# Menjalankan database migration & seeder (jika diperlukan)
npx prisma db push
npx prisma db seed

# Menjalankan NestJS dev server (Port 5000)
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
- **Web Application URL:** [http://localhost:3000](http://localhost:3000)
- **Login Portal:** [http://localhost:3000/login](http://localhost:3000/login)
- **Customer Registration:** [http://localhost:3000/register](http://localhost:3000/register)
- **Password Recovery:** [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password)

---

## 🧪 Perintah Pengujian

### Backend
```bash
cd backend
npm run test        # Unit testing (Jest)
npm run test:e2e    # E2E testing
```

### Frontend
```bash
cd frontend
npm run type-check  # Validasi TypeScript
npm run lint        # Linting ESLint
npm run build       # Production bundle build
```

---

## 🏗️ Status Arsitektur Sistem
- **Frontend (Next.js 15):** `STABLE / READY` (Enterprise UI, Zustand, TanStack Query)
- **Backend (NestJS):** `STABLE / READY` (JWT Auth, Role Guards, Module Services)
- **Database (PostgreSQL & Prisma):** `STABLE / CONNECTED` (Port 5433 / `wms_db`)
- **REST API Endpoints:** `STABLE / ACTIVE` (Prefix `/api/v1`)
