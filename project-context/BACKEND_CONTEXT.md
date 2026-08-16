# BACKEND CONTEXT & ARCHITECTURAL GUIDELINES
**Warehouse Management System (WMS Nusantara)**
*Panduan Arsitektur Backend, Database PostgreSQL, dan Integrasi Multi-Client*

---

## 1. Tujuan Backend Service

Backend WMS Nusantara dirancang sebagai **layanan pusat independen (*standalone API service*)** yang bertindak sebagai *Single Source of Truth* untuk seluruh aturan bisnis, kalkulasi pergudangan, otomasi dispatch logistik, dan manajemen data persistensi.

### Peran Utama Backend:
1. **API Provider:** Menyediakan endpoint RESTful JSON bagi Web Client (Next.js) dan Mobile Client (Kotlin Android).
2. **Database Gateway:** Menjadi satu-satunya komponen yang memiliki koneksi langsung (*direct access*) ke database PostgreSQL.
3. **Authentication & Security:** Mengelola otentikasi akun, penerbitan JWT Bearer token, refresh token, dan otorisasi peran (Admin, Customer, Driver).
4. **Business Calculation Engine:** Menjalankan kalkulasi kubikasi ($m^3$), tarif sewa Cold vs Standard Storage, serta formula denda keterlambatan pembayaran ($5\%/\text{minggu}$).
5. **IoT Telemetry Ingestion:** Menerima dan memproses data sensor suhu & kelembaban dari gudang Cold Storage dan armada Truk Reefer.

---

## 2. Diagram Arsitektur & Hubungan Multi-Client

```text
┌────────────────────────────────┐         ┌────────────────────────────────┐
│      NEXT.JS WEB CLIENT        │         │      KOTLIN ANDROID CLIENT     │
│   (Admin, Customer, Driver)    │         │      (Driver Field Mobile)     │
│       [Folder: /frontend]      │         │       [Future Repository]      │
└───────────────┬────────────────┘         └────────────────┬───────────────┘
                │                                           │
                │         HTTPS / JSON REST API             │
                │         Authorization: Bearer <JWT>       │
                └─────────────────────┬─────────────────────┘
                                      │
                                      ▼
                ┌───────────────────────────────────────────┐
                │          WMS BACKEND API SERVICE          │
                │             [Folder: /backend]            │
                │                                           │
                │  • Routing & Controllers Layer            │
                │  • Authentication & RBAC Middleware       │
                │  • Business Service & Validation Layer    │
                │  • IoT Telemetry Ingestion Engine         │
                │  • Repository / Database Access Layer     │
                └─────────────────────┬─────────────────────┘
                                      │
                                      │ PostgreSQL Connection Pool
                                      │ (TCP / SSL Connection)
                                      ▼
                ┌───────────────────────────────────────────┐
                │           POSTGRESQL DATABASE             │
                │          (Relational DB Engine)           │
                │                                           │
                │  • Users & Profiles                       │
                │  • Warehouses, Zones & Storage Slots      │
                │  • Goods Items & QR Barcodes              │
                │  • Vehicles & Reefer Fleet                │
                │  • Delivery Orders & Digital PODs         │
                │  • Invoices, VA & Late Penalties          │
                │  • Mutation Logs & Telemetry History      │
                └───────────────────────────────────────────┘
```

---

## 3. Prinsip Arsitektur Utama

### 3.1 Prinsip API-First
- Seluruh fitur dan mutasi data harus diekspos melalui REST API dengan kontrak request/response JSON yang konsisten.
- Web Frontend dan Kotlin Android adalah *consumers* setara yang mengonsumsi endpoint yang sama.

### 3.2 Isolasi Database (Zero Direct Database Access)
- **Frontend TIDAK BOLEH mengakses PostgreSQL secara langsung** (tidak ada direct SQL queries, ORM client, ataupun connection string di sisi frontend).
- **Kotlin Mobile TIDAK BOLEH mengakses PostgreSQL secara langsung**.
- Seluruh operasi Create, Read, Update, Delete (CRUD) dilakukan melalui HTTP Request terotentikasi ke Backend.

### 3.3 Autentikasi & Autorisasi (JWT + RBAC)
- Autentikasi berbasis **JSON Web Token (JWT)**.
- Setiap request yang membutuhkan hak akses wajib menyertakan HTTP Header:
  ```http
  Authorization: Bearer <ACCESS_TOKEN>
  ```
- Backend menerapkan **Role-Based Access Control (RBAC)** untuk 3 peran:
  - `ADMIN`: Akses penuh operasional, kapasitas slot, dispatch, dan billing.
  - `CUSTOMER`: Akses terbatas pada ruang sewa, inventaris SKU, request logistik, dan faktur milik customer terkait.
  - `DRIVER`: Akses terbatas pada tugas DO yang ditugaskan, navigasi rute, dan upload Digital POD.

---

## 4. Rekomendasi Struktur Direktori Backend

Backend disarankan mengadopsi arsitektur berlapis (*Layered / Clean Architecture*) agar modular dan mudah diuji:

```text
backend/
├── src/
│   ├── config/             # Konfigurasi DB (PostgreSQL pool), JWT secret, env variables
│   ├── controllers/        # HTTP Request & Response handlers
│   │   ├── auth.controller.ts
│   │   ├── warehouse.controller.ts
│   │   ├── goods.controller.ts
│   │   ├── logistics.controller.ts
│   │   └── billing.controller.ts
│   ├── services/           # Business logic & core domain calculations
│   │   ├── auth.service.ts
│   │   ├── storage-calculator.service.ts
│   │   ├── logistics-dispatch.service.ts
│   │   └── penalty-calculator.service.ts
│   ├── repositories/       # Database queries & PostgreSQL interaction
│   ├── models/             # Entity models & relational definitions
│   ├── middlewares/        # JWT auth guard, RBAC validator, error handling
│   ├── validators/         # Input request validation schemas
│   ├── utils/              # Helper functions & structured logging
│   └── index.ts / app.ts   # Entry point server
├── tests/                  # Unit tests & API integration tests
├── .env.example            # Template environment variables
├── package.json / go.mod   # Dependencies
└── README.md
```

---

## 5. Hal-hal yang Sengaja BELUM Diimplementasikan (Status Saat Ini)

Untuk menjaga kejelasan batasan kerja (*scope boundary*), hal-hal berikut **secara sengaja belum diimplementasikan** pada tahap ini:

| Komponen | Status Saat Ini | Rencana Implementasi |
| :--- | :---: | :--- |
| **Backend Codebase** | ❌ `NOT STARTED` | Akan dikembangkan pada Phase 8 di folder `/backend` |
| **PostgreSQL Schema** | ❌ `NOT IMPLEMENTED` | Migration scripts / schema DDL akan dibuat pada Phase 8 |
| **Live REST Endpoints** | ❌ `NOT IMPLEMENTED` | Endpoint `/api/v1/...` belum aktif (Frontend masih mock) |
| **JWT Server Auth** | ❌ `NOT IMPLEMENTED` | Verifikasi token server-side belum aktif |
| **Real Database Connection**| ❌ `NOT IMPLEMENTED` | Tidak ada koneksi DB aktif |

---

## 6. Dependency & Alur Transisi Frontend $\rightarrow$ Backend

1. **Frontend Tetap Stabil:** Seluruh kode frontend di folder `/frontend` telah stabil (*frozen*) dan beroperasi normal dengan mock layer.
2. **Penggantian Transparan (*Zero UI Change*):** Ketika backend API telah siap, frontend hanya perlu mengubah implementasi service di `frontend/src/services/` dari `MockService` menjadi `HttpService` yang melakukan `fetch()` ke URL Backend API. Tidak ada komponen UI/UX yang perlu diubah.
3. **Dokumentasi Kontrak:** Rujukan detail seluruh field, tipe data, dan rute terdapat pada file:
   - [Project-Context/BACKEND_HANDOFF.md](file:///d:/Project/REWORK/Warehouse/Project-Context/BACKEND_HANDOFF.md)
   - [Project-Context/ROADMAP.md](file:///d:/Project/REWORK/Warehouse/Project-Context/ROADMAP.md)
