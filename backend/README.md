# WMS Nusantara — Backend Service & API Layer

> **STATUS: PLACEHOLDER ONLY / IMPLEMENTATION NOT STARTED**
> Direktori ini disiapkan untuk service/API backend independen yang akan melayani Web Client (Next.js) dan Mobile Client (Kotlin Android).

---

## 1. Peran & Tanggung Jawab Backend
1. **API Provider:** Menyediakan RESTful API endpoints untuk seluruh modul Admin, Customer, dan Driver.
2. **Database Gateway:** Menjadi satu-satunya gerbang komunikasi langsung ke database **PostgreSQL**. Frontend dan Mobile Client tidak memiliki direct database access.
3. **Authentication & RBAC:** Mengelola otentikasi JWT Bearer token dan Role-Based Access Control (Admin, Customer, Driver).
4. **IoT Sensor Ingestion:** Mengolah telemetri suhu & kelembaban dari Cold Storage dan Armada Truk Reefer.
5. **Business Automation:** Menjalankan kalkulasi tarif volume sewa ($m^3$) dan penalti denda keterlambatan pembayaran ($5\%/\text{minggu}$).

---

## 2. Rekomendasi Struktur Direktori Backend (Clean / Layered Architecture)
```text
backend/
├── src/
│   ├── config/             # Database (PostgreSQL pool), JWT, environment configs
│   ├── controllers/        # HTTP Request handlers & routing mapping
│   ├── services/           # Core business logic & calculation rules
│   ├── repositories/       # Database queries & PostgreSQL ORM/driver access
│   ├── models/             # Entity models & relational schemas
│   ├── middlewares/        # Auth JWT verification, RBAC guard, error handler
│   ├── validators/         # Request body validation (Zod / Joi / Class-validator)
│   ├── utils/              # Calculation helpers (volume, late fee) & logger
│   └── app.ts / main.go    # Application entry point
├── tests/                  # Unit & integration tests
├── .env.example            # Template environment variables
├── package.json / go.mod   # Backend dependencies & scripts
└── README.md
```

---

## 3. Catatan Penting
- **Jangan Mengubah Frontend:** Frontend telah selesai 100% dan terisolasi pada folder `frontend/`.
- **API Contract:** Silakan merujuk pada dokumen `Project-Context/BACKEND_HANDOFF.md` dan `Project-Context/BACKEND_CONTEXT.md` untuk spesifikasi data dan rute yang dibutuhkan.
