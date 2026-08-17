# DATABASE ARCHITECTURAL DECISIONS & CONFLICT RESOLUTION
**Warehouse Management System (WMS Nusantara)**
*Dokumentasi Keputusan Arsitektur Basis Data, Analisis Konflik (SRS vs Frontend vs Relational DB), dan Rekomendasi untuk Project Manager*

---

## 1. Latar Belakang & Tujuan Dokumen

Dalam merancang skema basis data relasional PostgreSQL 16 untuk WMS Nusantara, dilakukan cross-reference mendalam terhadap tiga sumber acuan:
1. **Software Requirements Specification (SRS):** Dokumen analisis sistem (`docs/SRS/SRS_Sistem Penyimpanan Gudang.docx` / UC1–UC16).
2. **Frontend Frozen Baseline (`frontend/src/types/` & `frontend/src/mock/seed/`):** Kontrak data antarmuka yang telah stabil dan tidak boleh diubah.
3. **Standar Relasional 3NF & Arsitektur Enterprise Backend:** Best practice desain database untuk performa, integritas data, dan skalabilitas multi-client.

Dokumen ini mencatat keputusan arsitektural (*Architectural Decisions*), rekonsiliasi perbedaan, dan rekomendasi teknis yang diajukan kepada Project Manager sebelum eksekusi migrasi.

---

## 2. Analisis Keputusan & Rekonsiliasi Konflik

### Keputusan 1: Struktur Entitas Pengguna (`users`) vs Tabel Terpisah per Peran
- **Latar Belakang SRS:** SRS menyebutkan 3 aktor utama: Admin Gudang, Customer (Perusahaan Penyewa), dan Driver (Kurir Pengantar).
- **Opsi yang Dipertimbangkan:**
  - *Opsi A:* Membuat 3 tabel terpisah: `admins`, `customers`, `drivers`.
  - *Opsi B (Rekomendasi):* Membuat 1 tabel terpadu `users` dengan kolom diskriminator `role` (`ENUM('ADMIN', 'CUSTOMER', 'DRIVER')`) dan atribut spesifik peran yang bersifat *nullable* (`company_name` untuk Customer, `driver_license_number` untuk Driver).
- **Justifikasi & Analisis Trade-off:**
  - Memudahkan proses otentikasi JWT terpadu (`AuthModule`) tanpa perlu query ke 3 tabel berbeda.
  - Sesuai 100% dengan `UserProfile` pada `frontend/src/types/auth.types.ts`.
  - Mengurangi beban *join* relasional pada entitas transaksi yang mereferensikan pengguna.
- **Status:** **DIREKOMENDASIKAN (Opsi B)**.

---

### Keputusan 2: Mekanisme Penyewaan Ruang (*Rental Contract* vs *Goods-Centric Storage*)
- **Latar Belakang SRS (UC2 & UC12):** SRS mendefinisikan skenario penyewaan gudang bulanan (*subscription-based*) untuk kategori makanan dingin (*Cold Storage*) dan perabotan (*Furniture*), dengan penagihan berkala dan denda keterlambatan 5%/minggu.
- **Frontend Baseline:** Frontend mengikat atribut sewa langsung ke entitas `GoodsItem` (`storageStartDate`, `storageEndDate`, `monthlyRentalFee`, `slotId`) dan menghasilkan faktur bulanan di `Invoice` + `InvoiceItem`.
- **Analisis Trade-off:**
  - Jika membuat tabel `rentals` terpisah di luar `goods_items`, akan terjadi duplikasi state dan redundansi antara status sewa dan status penyimpanan barang fisik.
  - Mempertahankan atribut sewa pada `goods_items` (yang terasosiasi ke `storage_slots` dan `users`) secara otomatis mencerminkan siklus sewa aktual per SKU barang, sekaligus 100% kompatibel dengan frontend tanpa perlu *data transformation mapping* yang kompleks.
- **Status:** **DIREKOMENDASIKAN (Goods-Centric Storage & Direct Invoicing)**.

---

### Keputusan 3: Relasi Kargo Order Pengiriman (*DeliveryOrder* ke *GoodsItem*)
- **Latar Belakang Frontend:** Frontend merepresentasikan muatan order melalui array of string ID: `goodsItemIds: string[]` dan ringkasan teks `goodsSummary: string`.
- **Analisis Relasional Database:** Menyimpan array ID mentah dalam string atau JSON di database relasional melanggar First Normal Form (1NF) dan menyulitkan validasi integritas referensial (Foreign Key) jika ada barang yang dihapus/dimutasi.
- **Solusi Arsitektur:**
  - Di database relasional, dibuat tabel junction **`order_items`** (`order_id`, `goods_id`, `quantity`) dengan *Foreign Key* dan *Unique Constraint* `UNIQUE(order_id, goods_id)`.
  - Pada API Response Interceptor / Service Layer, backend akan otomatis mengagregasi relasi `order_items` menjadi properti `goodsItemIds: string[]` dan `goodsSummary` agar kontrak antarmuka frontend tetap terpenuhi secara sempurna.
- **Status:** **DIREKOMENDASIKAN (3NF Relational Junction Table `order_items`)**.

---

### Keputusan 4: Tipe Data Presisi Moneter & Volume Kubikasi
- **Latar Belakang Bisnis:**
  - Rumus volume SRS: $P \times L \times T / 10^6 \times \text{Qty}$ menghasilkan nilai desimal (misal: $0.9600\,m^3$).
  - Perhitungan denda keterlambatan 5% per minggu ($0.05 \times \text{subtotal} \times \text{minggu}$) menghasilkan nilai rupiah yang harus presisi.
- **Keputusan:**
  - Volume barang: Menggunakan `DECIMAL(10, 4)` pada PostgreSQL.
  - Dimensi & Berat: Menggunakan `DECIMAL(10, 2)` ($cm$ dan $kg$).
  - Nilai Uang (Tarif, Denda, Total Tagihan): Menggunakan `DECIMAL(14, 2)` (menampung hingga Rp 999 Miliar dengan 2 digit presisi sen).
- **Status:** **DIREKOMENDASIKAN (Strict Decimal Precision)**.

---

### Keputusan 5: Strategi Primary Key (UUID vs Auto-Increment Integer)
- **Latar Belakang:** Frontend telah menginisialisasi seed mock dengan format string deskriptif (`usr-admin-1`, `wh-jkt-central`, `brg-001`, `ord-001`, `inv-001`).
- **Keputusan:**
  - Menggunakan tipe data `String` / `UUID` (CUID/UUID v4) untuk seluruh entitas domain utama.
  - Untuk lingkungan development seed, sistem mendukung seed ID yang identik dengan mock frontend agar transisi API di Phase 11 berlangsung tanpa *drift*.
- **Status:** **DIREKOMENDASIKAN (String UUID/CUID Strategy)**.

---

### Keputusan 6: Entitas Pelengkap untuk Telemetri IoT & Keamanan Enterprise
- **Tambahan Entitas:**
  1. **`telemetry_logs`:** Khusus menangani time-series pencatatan sensor suhu Cold Storage (ambang batas $-18.0^\circ\text{C}$ s/d $-25.0^\circ\text{C}$) dan truk pendingin Reefer, dengan flag `is_anomaly`.
  2. **`audit_logs`:** Menyimpan jejak audit sistem untuk kepatuhan non-fungsional keamanan (SRS III.2.1).
  3. **`refresh_tokens`:** Menyimpan hash token untuk keamanan rotasi token JWT sesi login.
- **Status:** **DIREKOMENDASIKAN (Ditambahkan ke Skema Relasional Phase 9)**.

---

## 3. Matriks Rekomendasi untuk Persetujuan Project Manager

| No | Topik Keputusan | Pilihan yang Diajukan | Dampak ke Frontend | Risiko |
| :-: | :--- | :--- | :---: | :--- |
| 1 | Model Pengguna | Single Table `users` + Role Enum | Nol (Zero Change) | Rendah |
| 2 | Model Penyewaan | Goods-Centric Storage + `invoices` | Nol (Zero Change) | Rendah |
| 3 | Order Manifest | Junction Table `order_items` | Nol (Mapped by API) | Sangat Rendah |
| 4 | Presisi Angka | `DECIMAL(14,2)` & `DECIMAL(10,4)` | Nol (JSON Number) | Nol |
| 5 | Primary Key | String UUID / CUID | Nol (Identik dengan Mock) | Nol |
| 6 | Telemetri & Audit | Tabel `telemetry_logs` & `audit_logs`| Nol (Fitur Tambahan) | Nol |

---

*Dokumen ini diajukan untuk mendapatkan persetujuan tertulis dari Project Manager sebelum eksekusi pembuatan `prisma/schema.prisma` dan migrasi database.*
