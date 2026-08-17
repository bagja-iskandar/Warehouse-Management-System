# DATABASE ARCHITECTURE & STRATEGY SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Spesifikasi Komprehensif Arsitektur Database, Strategi Local Development (pgAdmin), dan Cloud-Ready Migration Path*

---

## 1. Prinsip & Visi Arsitektur Database

Arsitektur database WMS Nusantara mengadopsi prinsip **Pemisahan Tegas antara Database Environment dan Database Architecture**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION & DOMAIN LAYER                          │
│        (NestJS Controllers, Services, Repositories, Domain DTOs)        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                        PRISMA ORM 6.x (Type-Safe API)
                                     │
                                DATABASE_URL
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│   CURRENT: LOCAL ENVIRONMENT    │             │    FUTURE: CLOUD PRODUCTION     │
│   • PostgreSQL 17 on Windows    │             │   • Managed PostgreSQL          │
│   • Host: localhost:5432        │             │     (AWS RDS / Supabase / Neon) │
│   • Database: wms_db            │             │   • High Availability & Backup  │
│   • Tool: pgAdmin 4 for Inspect │             │   • SSL Mode Required           │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

Perpindahan dari **Local PostgreSQL (pgAdmin)** ke **Cloud PostgreSQL** dapat dilakukan **100% melalui perubahan konfigurasi `DATABASE_URL` pada `.env`** tanpa mengubah satu baris pun kode pada domain model, controller, service, repository, maupun antarmuka frontend.

---

## 2. Database Architecture (15 Core Relational Models)

Seluruh struktur tabel dikelola secara deklaratif melalui `backend/prisma/schema.prisma` yang memenuhi standar normalisasi Third Normal Form (3NF):

### 2.1 Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "1:N (active JWT sessions)"
    users ||--o{ goods_items : "1:N (owns - customer)"
    users ||--o{ delivery_orders : "1:N (requests - customer)"
    users ||--o{ delivery_orders : "1:N (assigned - driver)"
    users ||--o{ vehicles : "1:N (operates - driver)"
    users ||--o{ invoices : "1:N (billed to - customer)"
    users ||--o{ invoices : "1:N (verified by - admin)"
    users ||--o{ system_notifications : "1:N (receives)"
    users ||--o{ audit_logs : "1:N (triggers)"

    warehouses ||--|{ storage_zones : "1:N (divided into)"
    warehouses ||--|{ storage_slots : "1:N (contains)"
    warehouses ||--o{ goods_items : "1:N (stores)"

    storage_zones ||--o{ storage_slots : "1:N (classifies)"

    storage_slots ||--o{ goods_items : "1:N (houses)"
    storage_slots ||--o{ telemetry_logs : "1:N (records temp)"

    vehicles ||--o{ delivery_orders : "1:N (transports)"
    vehicles ||--o{ telemetry_logs : "1:N (records reefer temp)"

    delivery_orders ||--|{ order_items : "1:N (manifests)"
    goods_items ||--o{ order_items : "1:N (included in)"

    goods_items ||--o{ goods_mutations : "1:N (tracks audit lifecycle)"
    goods_items ||--o{ invoice_items : "1:N (billed as)"

    invoices ||--|{ invoice_items : "1:N (itemizes)"
```

### 2.2 Pemetaan Tabel & Kepatuhan Tipe Data
1. **`users`:** Akun multi-peran (`ADMIN`, `CUSTOMER`, `DRIVER`), identitas perusahaan, lisensi SIM B2 driver, password hash Argon2id/Bcrypt.
2. **`refresh_tokens`:** Sesi refresh token aktif dengan status revocation.
3. **`warehouses`:** Master fasilitas fisik gudang (Hub Cakung, Gedebage, dll.) beserta total kapasitas ($m^3$).
4. **`storage_zones`:** Segmentasi zona (`STANDARD`, `COLD_STORAGE`, `HEAVY_DUTY`) dengan ambang batas temperatur.
5. **`storage_slots`:** Grid rak 3D (`COLD-A01`, `RAK-F01`) dengan kapasitas $m^3$, status utilisasi, dan telemetri suhu terkini.
6. **`goods_items`:** Master SKU barang customer, dimensi ($P \times L \times T$), volume kubikasi presisi `DECIMAL(10, 4)` ($m^3$), barcode QR, dan tarif sewa bulanan.
7. **`goods_mutations`:** Audit log mutasi barang (Pendaftaran $\rightarrow$ Inbound Pickup $\rightarrow$ Inspeksi Gudang $\rightarrow$ Penyimpanan Slot $\rightarrow$ Outbound Delivery).
8. **`vehicles`:** Master armada truk (`VAN`, `BOX_TRUCK_SMALL`, `REEFER_TRUCK`, `WING_BOX_LARGE`) dengan flag pendingin reefer sub-zero.
9. **`delivery_orders`:** Surat jalan order logistik dengan rute GPS, status dispatch, dan Digital POD (Proof of Delivery).
10. **`order_items`:** Junction table Many-to-Many antara Delivery Order dan SKU barang (3NF compliance).
11. **`invoices` & `invoice_items`:** Faktur sewa bulanan, kalkulasi denda keterlambatan 5%/minggu, dan bukti pembayaran VA.
12. **`telemetry_logs`:** Time-series ingestion sensor suhu IoT Cold Storage dan truk Reefer dengan deteksi anomali otomatis.
13. **`system_notifications`:** Notifikasi in-app terpadu untuk 3 peran pengguna.
14. **`audit_logs`:** Jejak audit keamanan sistem untuk mutasi data sensitif.

---

## 3. Current Setup: Local Development (PostgreSQL on Windows)

### 3.1 Konfigurasi Lokal
- **Database Engine:** PostgreSQL Server lokal pada Windows.
- **Host / Port:** `localhost:5432`
- **Database Name:** `wms_db`
- **Management Tool:** **pgAdmin 4** (atau DBeaver / psql).

### 3.2 Peran pgAdmin dalam Siklus Pengembangan
> [!IMPORTANT]
> **Aturan Penggunaan pgAdmin:**
> 1. **pgAdmin digunakan HANYA untuk:**
>    - Menginspeksi tabel, relasi, dan constraint.
>    - Menjalankan query SELECT untuk debugging data development.
>    - Memantau performa dan volume storage secara visual.
> 2. **DILARANG membuat, mengubah, atau menghapus tabel/kolom/FK secara manual melalui pgAdmin.** Seluruh perubahan skema basis data **WAJIB** berasal dari Prisma Migration (`prisma/schema.prisma`).

---

## 4. Future Setup: Cloud Production Migration

### 4.1 Target Cloud Environment
Pada fase deployment produksi, backend akan terhubung ke penyedia layanan Cloud PostgreSQL terkelola (*Managed Database*):
- **Opsi Cloud:** AWS RDS PostgreSQL / Supabase / Neon Serverless / Google Cloud SQL.
- **Fitur Enterprise:** Automated daily snapshot backups, multi-AZ replication, connection pooling (PgBouncer), dan enkripsi at-rest & in-transit (`sslmode=require`).

### 4.2 Prosedur Migrasi Local ke Cloud (Seamless Transition)
1. Buat instance database kosong di Cloud Provider.
2. Set variabel `DATABASE_URL` pada environment production:
   ```env
   DATABASE_URL="postgresql://cloud_user:secure_pass@cloud-db-host.com:5432/wms_production?sslmode=require"
   ```
3. Eksekusi deployment migration tanpa interaksi:
   ```bash
   npx prisma migrate deploy
   ```
4. *(Opsional)* Jalankan production seeder data awal:
   ```bash
   npx prisma db seed
   ```
5. **Zero Code Changes:** Controller, service, repository, dan API contract berjalan langsung tanpa modifikasi kode.

---

## 5. Environment Variables & Security Rules

| Environment Variable | Local Development (pgAdmin) | Future Cloud Production |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://USERNAME:PASSWORD@localhost:5432/wms_db?schema=public` | `postgresql://USER:PASS@HOST:5432/wms_db?sslmode=require` |
| `NODE_ENV` | `development` | `production` |
| `LOG_LEVEL` | `debug` | `warn` / `info` |

> [!CAUTION]
> **Security Governance Rules:**
> 1. File `.env` **TIDAK BOLEH** di-commit ke Git repository (masuk dalam `.gitignore`).
> 2. File `.env.example` hanya berisi template dan placeholder aman tanpa kredensial nyata.
> 3. Jangan melakukan hardcode username, password, host, atau database name di dalam kode sumber TypeScript.

---

## 6. Migration & Seeding Strategy

### 6.1 Migration Workflow (Prisma Migrate)
- **Membuat & Menerapkan Migrasi Development Baru:**
  ```bash
  npx prisma migrate dev --name <nama_migrasi>
  ```
- **Menerapkan Migrasi pada CI/CD / Production:**
  ```bash
  npx prisma migrate deploy
  ```

### 6.2 Seeding Workflow (`prisma/seed.ts`)
- Script seeder `backend/prisma/seed.ts` memuat dataset awal yang **100% konsisten** dengan mock frontend:
  - 1 Admin (`admin@wms.id`), 2 Customers (`customer@freshfoods.id`, dll.), 2 Drivers (`driver@wms.id`, dll.).
  - 2 Master Gudang (Hub Cakung `WH-CKG-01`, Gedebage `WH-BDG-01`).
  - Grid Slot Rak 3D (Zona Standar & Cold Storage Sub-zero).
  - 4 Master Barang SKU (Salmon, Wagyu Beef, Kursi Kantor, Meja Jati).
  - 4 Master Armada Truk (Reefer, Box, Van, Wing Box).
  - Delivery Orders aktif & Invoices penagihan sewa dengan denda keterlambatan 5%.
- **Menjalankan Seeder:**
  ```bash
  npx prisma db seed
  ```

---

## 7. Hal-Hal yang DILARANG (Anti-Patterns)

1. ❌ **Dilarang mengubah struktur tabel secara manual di pgAdmin** tanpa melalui Prisma migration file.
2. ❌ **Dilarang menggunakan `prisma db push` pada alur formal migration** karena dapat merusak histori migrasi.
3. ❌ **Dilarang memasukkan kredensial database lokal/cloud ke dalam file Git.**
4. ❌ **Dilarang mengubah komponen atau UI pada direktori `/frontend`** (Frontend tetap frozen).
5. ❌ **Dilarang melakukan hardcode query SQL raw** yang rentan terhadap SQL Injection; selalu gunakan type-safe Prisma Client methods.
