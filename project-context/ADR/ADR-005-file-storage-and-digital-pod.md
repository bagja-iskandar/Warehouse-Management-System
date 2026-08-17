# ADR-005: File Storage & Digital POD Strategy

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
Operasional WMS Nusantara mewajibkan pencatatan bukti fisik digital:
1. **Digital Proof of Delivery (POD):** Foto kargo saat tiba di lokasi dan tanda tangan digital (*E-Signature*) penerima.
2. **Bukti Pembayaran:** Gambar kuitansi / struk transfer bank dari Customer.
3. **Master Barang:** Foto produk barang yang disimpan di gudang.

File binary (gambar/PDF) tidak boleh disimpan langsung sebagai BLOB di database PostgreSQL karena akan memperbesar ukuran database secara drastis, memperlambat proses backup, dan menurunkan performa query.

## Decision Drivers
1. **Pemisahan Binary Storage dari Relational DB:** Database hanya menyimpan metadata dan URL string.
2. **S3-Compatible Protocol:** Dukungan universal pada cloud (AWS S3, Google Cloud Storage, Cloudflare R2) dan local development (MinIO).
3. **Dukungan Pengunggahan dari Mobile & Web:** Memfasilitasi upload kamera dari aplikasi Android Kotlin dan canvas signature dari Next.js Web.

## Considered Options

### Option 1: S3-Compatible Object Storage (MinIO / Cloudflare R2 / AWS S3)
- **Kelebihan:**
  - Standar industri terbukti untuk penyimpanan objek tidak terstruktur.
  - MinIO dapat dijalankan dengan mudah via Docker Compose untuk development lokal.
  - Mendukung *Presigned Upload URLs* atau *Direct Multipart Upload* via backend proxy.
  - Performa read statis sangat cepat melalui CDN.
- **Kekurangan:**
  - Memerlukan konfigurasi service penyimpanan terpisah.

### Option 2: Local Disk Storage pada Server Backend (`/uploads`)
- **Kelebihan:**
  - Sangat mudah diimplementasikan pada tahap awal.
- **Kekurangan:**
  - Tidak stateless; backend tidak dapat di-scale secara horizontal (*multi-replica container*) tanpa shared volume (NFS).

### Option 3: Database BLOB Storage (PostgreSQL `bytea`)
- **Kelebihan:**
  - Seluruh data berada dalam satu tempat.
- **Kekurangan:**
  - Anti-pattern untuk file media, menghabiskan I/O database dan RAM cache buffer.

## Decision
Kami memutuskan untuk menggunakan **S3-Compatible Object Storage Abstraction** (menggunakan **MinIO** untuk environment Local Development / Docker, dan **AWS S3 / Cloudflare R2** untuk Staging & Production).

## Workflow Upload Digital POD

```text
Driver Mobile / Web Klien
         │
         │ 1. POST /api/v1/logistics/orders/:id/pod
         │    (Multipart: Foto Kamera + Signature Base64)
         ▼
WMS Backend (NestJS)
         │
         │ 2. Validasi MIME Type & Ukuran File (Maks 5MB)
         │ 3. Simpan file ke Object Storage (MinIO / S3) -> path: /pod/{year}/{month}/{orderId}.jpg
         │ 4. Dapatkan Public / Signed CDN URL
         │ 5. Simpan URL & data tanda tangan ke tabel `delivery_orders`
         ▼
PostgreSQL Database
```

## Consequences

### Positive
- Database PostgreSQL tetap ramping dan teroptimasi untuk query transaksional cepat.
- Backend tetap sepenuhnya *stateless*.
- Driver mobile dapat mengunggah foto beresolusi tinggi dengan kompresi client-side sebelum dikirim ke backend.
