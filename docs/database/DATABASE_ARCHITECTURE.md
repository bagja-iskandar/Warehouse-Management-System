# Database Architecture & Cloud Migration Strategy
**Warehouse Management System (WMS Nusantara)**
*PostgreSQL 16 Engine, Prisma ORM 6.x, Schema Design, Performance Indexing, and Cloud Readiness*

---

## 1. Executive Summary & Design Principles

Database WMS Nusantara menggunakan **PostgreSQL 16** dengan **Prisma ORM 6.x** sebagai lapisan data access object.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION ACCESS LAYER                           │
│                                                                             │
│      WMS Backend NestJS API (Port 5000) ──► PrismaService (Client Pool)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                        DATABASE_URL Environment String
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL 16 RELATIONAL ENGINE                         │
│                                                                             │
│   • 15 Relational Models & 14 Enums                                         │
│   • ACID Compliance: Serialized Transactions ($transaction)                 │
│   • Performance Indexing (B-Tree on Foreign Keys & Status Filters)          │
│   • Decimal Precision: Capacity m3 (8,2), Currency IDR (12,2)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Relational Schema & Table Definitions (15 Models)

1. **`User`**: Pengguna sistem (Admin, Customer, Driver) dengan hash password Bcrypt.
2. **`RefreshToken`**: Sesi login JWT dengan tokenHash SHA-256 dan flag `isRevoked`.
3. **`Warehouse`**: Master fasilitas gudang (kapasitas total $m^3$, kapasitas terpakai, kota).
4. **`StorageZone`**: Zona suhu & fungsi (`STANDARD`, `COLD_STORAGE`, `HEAVY_DUTY`).
5. **`StorageSlot`**: Unit rak 3D penyimpanan kargo dengan tracking kapasitas $m^3$ terpakai.
6. **`GoodsItem`**: Master SKU barang inventaris dengan dimensi, kubikasi $m^3$, dan barcode unik.
7. **`GoodsMutation`**: Jejak audit mutasi status dan pemindahan slot rak (*Rack Transfer*).
8. **`Vehicle`**: Armada truk logistik (*Reefer Truck, Box Truck, Van*) dan penugasan driver.
9. **`DeliveryOrder`**: Surat jalan pengiriman logistik (*Inbound Pickup / Outbound Delivery*).
10. **`OrderItem`**: Relasi manifest muatan SKU kargo pada setiap surat jalan.
11. **`Invoice`**: Faktur tagihan sewa bulanan dengan kalkulasi denda keterlambatan $5\%/\text{minggu}$.
12. **`InvoiceItem`**: Rincian tagihan per komoditas barang atau biaya sewa ruang gudang.
13. **`Payment`**: Riwayat transaksi pembayaran customer dan verifikasi administratif.
14. **`TelemetryLog`**: Log pembacaan sensor IoT telemetri suhu & kelembaban.
15. **`SystemNotification`**: Notifikasi sistem dalam aplikasi untuk lonceng navbar.

---

## 3. Performance & Indexing Strategy

1. **Composite Unique Indexes**:
   - `StorageZone`: `@@unique([warehouseId, type])`
   - `StorageSlot`: `@@unique([warehouseId, code])`
   - `OrderItem`: `@@unique([orderId, goodsId])`
2. **Lookup & Filter Indexes**:
   - `User`: `@@index([role, status])`
   - `GoodsItem`: `@@index([customerId, status])`, `@@index([warehouseId])`, `@@index([slotId])`
   - `DeliveryOrder`: `@@index([customerId, status])`, `@@index([driverId])`
   - `Invoice`: `@@index([customerId, status])`
   - `TelemetryLog`: `@@index([slotId, recordedAt])`, `@@index([vehicleId, recordedAt])`
   - `SystemNotification`: `@@index([recipientUserId, isRead, createdAt])`

---

## 4. Cloud PostgreSQL Migration Strategy

Perpindahan dari **Local PostgreSQL** ke **Cloud Managed Database** (AWS RDS PostgreSQL, Supabase, Neon, atau Google Cloud SQL) bersifat **100% Zero-Code-Change**:

1. Siapkan instance cloud PostgreSQL 15/16.
2. Perbarui variabel `DATABASE_URL` pada `.env.production`:
   ```bash
   DATABASE_URL="postgresql://<CLOUD_USER>:<CLOUD_PASS>@<CLOUD_HOST>:5432/<CLOUD_DB>?sslmode=require"
   ```
3. Jalankan migrasi Prisma untuk membangun skema relasional:
   ```bash
   npx prisma migrate deploy
   ```
4. Jalankan seeder initial data jika diperlukan:
   ```bash
   npx prisma db seed
   ```
