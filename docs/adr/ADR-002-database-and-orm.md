# ADR-002: Database Engine & ORM Selection

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
WMS Nusantara mengelola data relasional pergudangan dengan dependensi ketat antar entitas: Gudang, Slot Rak, SKU Barang, Armada Truk, Delivery Order, Faktur, dan Telemetri Suhu. Diperlukan database engine yang menjamin integritas referensial (ACID transactions), mendukung query relasi kompleks, serta ORM type-safe yang mempermudah migrasi skema dan interaksi data pada backend TypeScript.

## Decision Drivers
1. **ACID Compliance & Integritas Referensial:** Menjamin konsistensi alokasi kapasitas ($m^3$) dan status finansial tagihan.
2. **Dukungan Tipe Data Kompleks:** Butuh DECIMAL presisi tinggi untuk kalkulasi volume/uang, JSONB untuk fleksibilitas metadata atribut barang/log, dan time-series capabilities untuk telemetri sensor.
3. **Type-Safe ORM & DX:** ORM yang menghasilkan TypeScript types secara otomatis dari schema definition, meminimalkan runtime mismatch.
4. **Migration Tooling:** Pengelolaan migrasi skema database yang deklaratif, repeatable, dan dapat diaudit.

## Considered Options

### Option 1: PostgreSQL 16 + Prisma ORM
- **Kelebihan:**
  - PostgreSQL adalah database relasional open-source paling stabil, kaya fitur (JSONB, spatial extensions, check constraints, ACID komprehensif).
  - Prisma menyediakan schema modeling deklaratif (`schema.prisma`), type-safe client otomatis, Prisma Studio untuk inspeksi data, dan migration tool yang andal (`prisma migrate`).
  - Integrasi mulus dengan NestJS via PrismaService.
- **Kekurangan:**
  - Prisma Client memiliki overhead query generator untuk query agregasi super kompleks (dapat dimitigasi dengan `$queryRaw` jika diperlukan).

### Option 2: PostgreSQL 16 + TypeORM
- **Kelebihan:**
  - Pola Active Record / Data Mapper berbasis class decorator.
  - Sangat populer di ekosistem NestJS masa lalu.
- **Kekurangan:**
  - Type safety tidak seketat Prisma.
  - Masalah stabilitas migrasi dan maintenance lambat pada versi terbaru.

### Option 3: MongoDB (NoSQL)
- **Kelebihan:**
  - Fleksibilitas skema dokumen.
- **Kekurangan:**
  - Tidak cocok untuk domain WMS yang kaya relasi relasional kuat (Warehouse $\rightarrow$ Slot $\rightarrow$ Goods $\rightarrow$ DO $\rightarrow$ Invoice).
  - Kurangnya penegakan integritas referensial foreign key otomatis.

## Decision
Kami memutuskan untuk menggunakan **PostgreSQL 16** sebagai Primary Relational Database dan **Prisma ORM** sebagai Data Access Layer.

## Rationale
Kombinasi PostgreSQL dan Prisma memberikan fondasi data yang sangat kokoh. Model domain WMS didominasi oleh relasi 1:N dan N:M yang memerlukan integritas foreign key dan transaksi atomik (misalnya saat alokasi slot rak bersamaan dengan pembaruan status barang). Prisma Client menjamin 100% type-safety di level compile time TypeScript.

## Consequences

### Positive
- Seluruh entity dan DTO backend dapat disinkronkan secara presisi dengan schema database.
- Migrasi database terdokumentasi rapi di folder `prisma/migrations/`.
- Integritas data terjamin di level database via foreign key constraints, cascade rules, dan check constraints.

### Negative
- Prisma requires schema generation step (`npx prisma generate`) setelah setiap perubahan schema.
- Perlu optimasi indexing eksplisit pada kolom pencarian (`barcode`, `order_number`, `invoice_number`, `customer_id`, `driver_id`).

### Implementation Notes
- Seluruh primary key menggunakan format `UUIDv4` untuk mencegah enumeration attack dan mempermudah sinkronisasi multi-klien.
- Field finansial dan dimensi menggunakan tipe `DECIMAL` (bukan float) untuk menghindari floating-point rounding errors.
