# BACKEND HANDOFF & API CONTRACT SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Dokumentasi Resmi Serah Terima Frontend ke Backend Engineering*

---

## 1. Project Overview

### 1.1 Identitas & Tujuan Sistem
- **Nama Sistem:** Warehouse Management System (WMS Nusantara)
- **Tujuan Utama:** Platform tata kelola operasional pergudangan modern terintegrasi yang mencakup penyewaan ruang gudang mandiri ($m^3$), pelacakan barang dan rantai dingin (*Cold Storage sub-zero telemetry*), manajemen armada logistik (*Reefer & Box Truck*), dispatching delivery order otomatis, dan penagihan sewa bulanan dengan kalkulasi denda keterlambatan otomatis.

### 1.2 Multi-Role Persona
Sistem melayani 3 aktor utama dengan hak akses dan fokus operasional yang berbeda:
1. **ADMIN (Pusat Operasional Gudang & Dispatch):** Bertanggung jawab atas alokasi slot rak ($m^3$), approval DO, penugasan driver & armada truk, monitoring IoT sensor suhu gudang, manajemen faktur & denda, dan ekspor laporan eksekutif.
2. **CUSTOMER (Penyewa Ruang Gudang Mandiri):** Pelaku usaha yang menyewa kapasitas gudang ($m^3$), mendaftarkan barang (kalkulator dimensi $P \times L \times T$), memantau inventaris & suhu Cold Storage secara live, memesan penjemputan/pengantaran armada, membayar invoice, dan memvalidasi serah terima barang.
3. **DRIVER (Pengemudi Armada Logistik):** Pengemudi lapangan yang menerima task DO, memilih armada kendaraan (*Reefer / Box*), inspeksi loading dock, menjalankan rute navigasi GPS, dan mengunggah bukti serah terima digital (*Digital POD: Foto & E-Signature*).

### 1.3 Arsitektur Sistem Terencana
```text
┌───────────────────────────┐      ┌───────────────────────────┐
│   NEXT.JS 15 WEB APP      │      │   KOTLIN MOBILE CLIENT    │
│ (Admin, Customer, Driver) │      │     (Driver Mobile)       │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              │         REST API / JSON          │
              └─────────────────┬────────────────┘
                                │
                                ▼
              ┌──────────────────────────────────┐
              │     BACKEND API SERVICE LAYER    │
              │  (Node.js / Express / Go / Java) │
              │   • JWT Auth & RBAC Middleware   │
              │   • Business Logic & Validators  │
              │   • Audit Logging & IoT Ingestion│
              └─────────────────┬────────────────┘
                                │
                                ▼
              ┌──────────────────────────────────┐
              │      POSTGRESQL DATABASE         │
              │  (Relational Database + Tables)  │
              └──────────────────────────────────┘
```

---

## 2. Frontend Completion Status

Frontend telah selesai **100% sampai tahap arsitektur UI/UX dan Mock Service Layer**. Seluruh halaman telah diaudit, divalidasi, dan siap dihubungkan (*plug-and-play*) ke backend API.

> [!IMPORTANT]
> **Catatan Status Backend:**
> Seluruh fitur backend saat ini **BELUM TERSEDIA**. Frontend saat ini beroperasi menggunakan simulasi `MockServiceLayer` berbasis in-memory/localStorage dengan artificial delay untuk mensimulasikan latency jaringan riil.

### 2.1 Spesifikasi Teknologi Frontend
- **Framework:** Next.js 15 (App Router Architecture)
- **Runtime & Library:** React 19, TypeScript 5 (Strict Mode, 0 compile errors)
- **Styling:** Tailwind CSS (Custom Color Tokens, Elevated Panels, Rounded Floating Design System)
- **Icons & Visuals:** Lucide React
- **Client State:** React Context & Custom Hooks (`useAuth`, `useLocalStorage`)
- **Validation:** Zod Schema Validation & Client-side Error Feedback

### 2.2 Arsitektur Application Shell
- **Floating Sidebar:** Panel navigasi putih melayang (`w-64`, `rounded-2xl`, `bg-white`, `border-slate-200`, `shadow-xl`) dengan aksen peran spesifik (Indigo untuk Admin, Emerald untuk Customer, Amber untuk Driver).
- **Floating Topbar:** Topbar melayang terpisah (`h-16`, `rounded-2xl`, `bg-white`, `border-slate-200`) dengan fitur interaktif:
  - Global Search Modal (`⌘ K` / `Ctrl + K`)
  - Live IoT Telemetry Badge
  - Slide-over Notification Center Drawer
  - Quick Profile / Logout Dropdown Menu
- **Responsive Canvas:** `#F8FAFC` canvas dengan grid seragam `lg:pl-72 flex flex-col p-4 space-y-4` yang mendukung mobile (375px), tablet (768px), dan desktop (1280px+).

### 2.3 Standarisasi 7 UX State (Phase 6)
Frontend telah memiliki komponen siap pakai untuk 7 status interaksi:
1. **Loading State:** Skeleton loader (`MetricCardSkeleton`, `TableSkeleton` di `src/components/common/LoadingSkeleton.tsx`).
2. **Empty State:** Ilustrasi grafis dan tombol call-to-action (`src/components/common/EmptyState.tsx`).
3. **Success State:** Badge konfirmasi dan modal sukses.
4. **Error State:** Banner notifikasi kesalahan dan input error inline.
5. **Validation State:** Pesan validasi Zod interaktif.
6. **Disabled State:** Tombol & kontrol non-aktif dengan kontras yang jelas.
7. **Confirmation State:** Dialog modal konfirmasi destruktif (`src/components/common/ConfirmationModal.tsx`).

---

## 3. Frontend Routes Specification (Rute Terdaftar)

Berikut adalah daftar seluruh 30 rute frontend yang **benar-benar ada** di repositori beserta kebutuhan data dan aksinya:

### 3.1 Autentikasi & Akun Umum
| Route | Role | Tujuan Halaman | Data Ditampilkan | Aksi User |
| :--- | :--- | :--- | :--- | :--- |
| **`/`** | Public | Entry Point | Redirector | Auto-redirect ke `/login` (jika guest) atau dashboard role |
| **`/login`** | Public | Login Multi-Peran | Form login, role badge preview | Submit email & password, switch tab demo, navigasi registrasi |
| **`/register`** | Public | Registrasi Customer | Form legalitas perusahaan, NPWP | Input nama PT, email, telepon, submit pendaftaran |
| **`/forgot-password`** | Public | Lupa Kata Sandi | Form recovery email | Submit request link reset password |
| **`/profile`** | All | Profil Akun Terpadu | Data akun, avatar, session | Update informasi pribadi, upload avatar |
| **`/profile/change-password`** | All | Ganti Kata Sandi | Form password saat ini & baru | Submit ganti password |

### 3.2 Admin Portal Modules
| Route | Role | Tujuan Halaman | Data Ditampilkan | Aksi User |
| :--- | :--- | :--- | :--- | :--- |
| **`/admin/dashboard`** | Admin | Operational Center | 4 KPI cards, occupancy zone, dock gates, live queue | Filter timeline, quick link ke kapasitas & dispatch |
| **`/admin/warehouse/capacity`** | Admin | 3D Rack Visualizer | Grid slot 3D Zona A/B/C, detail tenant, suhu slot | Klik slot rak untuk membuka `SlotDetailModal`, mutasi barang |
| **`/admin/warehouse`** | Admin | Multi-Hub Overview | Fasilitas Cakung & Gedebage, kapasitas m³, sensor health | Buka detail hub, filter status aktif/maintenance |
| **`/admin/goods`** | Admin | Master SKU Management | Tabel SKU, batch, expired date, barcode data | Search/filter barang, buka modal dialog cetak label QR |
| **`/admin/customers`** | Admin | Tenant Management | Profil customer, m³ sewa, tagihan overdue | Filter status pembayaran, verifikasi legalitas tenant |
| **`/admin/drivers`** | Admin | Driver Fleet Directory | Personel driver, status SIM B2, performa rating | Alokasi penugasan driver, evaluasi performa |
| **`/admin/fleet`** | Admin | Vehicle Management | Truk Reefer, Box Truck, suhu pendingin, KIR expiry | Validasi kelayakan armada, assign driver ke truk |
| **`/admin/logistics`** | Admin | Dispatch Queue | Antrean Delivery Order (DO), loading dock allocation | Setujui dispatch, alokasi armada & driver, monitor status transit |
| **`/admin/monitoring`** | Admin | IoT Telemetry Center | Stream real-time node sensor suhu Cold Storage & truk | Filter anomali suhu, pantau status kompresor |
| **`/admin/billing`** | Admin | Billing & Penalty | Tagihan bulanan, kalkulator otomatis denda 5%/minggu | Verifikasi bukti bayar VA, kirim reminder denda |
| **`/admin/reports`** | Admin | Executive Reports | Tab laporan kapasitas, mutasi, logistik, keuangan | Unduh laporan berformat PDF, XLSX, CSV |

### 3.3 Customer Portal Modules
| Route | Role | Tujuan Halaman | Data Ditampilkan | Aksi User |
| :--- | :--- | :--- | :--- | :--- |
| **`/customer/dashboard`** | Customer | Customer Dashboard | Kapasitas m³ sewa aktif, suhu cold room, ringkasan SKU | Quick booking ruang sewa, daftarkan barang baru |
| **`/customer/rental`** | Customer | Storage Booking | Kalkulator tarif m³ (Cold Rp 150rb vs Std Rp 50rb), durasi | Slider volume m³, pilih hub, checkout invoice sewa |
| **`/customer/goods/input`** | Customer | Goods Registration | Kalkulator dimensi fisik $P \times L \times T \rightarrow m^3$, preview QR | Input batch, kategori barang, generate label QR |
| **`/customer/goods`** | Customer | My Inventory List | Tabel inventaris SKU milik customer, slot rak, suhu | Filter status barang, inspeksi QR code |
| **`/customer/monitoring`** | Customer | Cold Storage Telemetry | Suhu real-time node sewa, grafik kestabilan 24 jam | Pantau fluktuasi suhu, unduh sertifikat suhu resmi |
| **`/customer/logistics/request`**| Customer | Dispatch Request | Form permohonan armada Outbound/Inbound, reefer/box | Tentukan tujuan, jadwal pick-up/drop-off, submit request |
| **`/customer/history`** | Customer | Mutation History | Audit log pergerakan stok barang masuk & keluar | Search nomor PO/DO, filter tipe mutasi |
| **`/customer/billing`** | Customer | Invoices & Payment | Faktur sewa bulanan, instruksi Virtual Account (VA) | Dialog pelunasan tagihan, unduh bukti kuitansi |
| **`/customer/receipt/confirm`** | Customer | Delivery Confirmation | Data muatan yang tiba di toko, form rating driver | Verifikasi kondisi segel fisik, beri rating bintang driver |
| **`/customer/profile`** | Customer | Company Profile | Profil badan usaha, nomor NPWP pajak, kontak PIC | Update data legalitas perusahaan & kontak operasional |

### 3.4 Driver Fleet Modules
| Route | Role | Tujuan Halaman | Data Ditampilkan | Aksi User |
| :--- | :--- | :--- | :--- | :--- |
| **`/driver/dashboard`** | Driver | Task Queue Dashboard | Armada terpasang (Truk Reefer B 9821 TKN), suhu box, DO aktif | Buka navigasi GPS rute, tombol upload POD |
| **`/driver/tasks/[id]`** | Driver | Task Instructions | Manifest muatan dingin, alamat drop-off, kontak PIC | Telepon PIC penerima, pelajari instruksi penanganan |
| **`/driver/vehicle/select`** | Driver | Vehicle Selection | Daftar armada pool (Reefer, Box, Van), kapasitas m³ | Pilih dan konfirmasi armada yang digunakan bertugas |
| **`/driver/pickup`** | Driver | Dock Pickup Checklist | Checklist koli muatan, verifikasi suhu box & segel | Konfirmasi keberangkatan dari loading dock gudang |
| **`/driver/transit`** | Driver | GPS Navigation & Telemetry | Live map visualizer, ETA waktu tempuh, pantauan suhu jalan | Navigasi arah rute, lapor kendala/emergency |
| **`/driver/pod`** | Driver | Digital POD Upload | Form upload foto muatan, canvas tanda tangan digital | Ambil foto bukti, minta E-Signature penerima, submit DO selesai |
| **`/driver/history`** | Driver | Trip History | Daftar pengiriman selesai, rating kepuasan customer | Cari riwayat DO lampau |
| **`/driver/profile`** | Driver | Driver License Profile | Golongan SIM B2 Umum, masa berlaku, sertifikasi kargo | Update masa berlaku lisensi SIM & kontak darurat |

---

## 4. Domain & Business Entities Specification

Berdasarkan implementasi TypeScript di `src/types/`, berikut adalah spesifikasi entitas data yang dibutuhkan frontend beserta catatan keputusan backend:

### 4.1 Entity: User (`UserProfile`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | Unique Identifier | Primary Key |
| `name` | string | Nama lengkap pengguna | Required |
| `email` | string | Email login unik | Unique Index |
| `role` | enum | `"ADMIN" \| "CUSTOMER" \| "DRIVER"` | RBAC Role |
| `phone` | string | Nomor telepon / WA | Required |
| `avatarUrl` | string? | URL foto profil | Optional |
| `companyName` | string? | Nama PT (khusus Customer) | Optional / Nullable |
| `address` | string? | Alamat domisili/kantor | Optional / Nullable |
| `status` | enum | `"ACTIVE" \| "SUSPENDED" \| "PENDING_VERIFICATION"` | Default: `"ACTIVE"` |
| `createdAt` | string (ISO) | Tanggal registrasi akun | Auto-generated timestamp |
| `passwordHash` | string | *Backend Only* | `[BACKEND DECISION REQUIRED: Gunakan bcrypt / argon2]` |

### 4.2 Entity: Warehouse & Storage Slot (`Warehouse`, `StorageSlot`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ID Fasilitas Gudang | Primary Key |
| `code` | string | Kode Hub (e.g. `"WH-JKT-01"`) | Unique |
| `name` | string | Nama fasilitas gudang | e.g. `"Gudang Utama Cakung"` |
| `city` | string | Kota operasional | e.g. `"Jakarta Timur"` |
| `totalCapacityM3` | number | Kapasitas total kubikasi | Required |
| `usedCapacityM3` | number | Kubikasi terpakai saat ini | Calculated / Aggregated |
| `slots` | Array<StorageSlot> | Relasi slot rak di dalam gudang | One-to-Many |
| *Slot Fields:* | | | |
| `slot.id` | string (UUID) | ID Slot Rak | Primary Key |
| `slot.code` | string | Kode Rak (e.g. `"RAK-A-01-01"`) | Unique per Warehouse |
| `slot.zone` | enum | `"STANDARD" \| "COLD_STORAGE" \| "HEAVY_DUTY"` | Klasifikasi Zona |
| `slot.capacityM3` | number | Kapasitas maksimal slot ($m^3$) | Biasanya $1.0\text{ s/d }5.0\text{ m}^3$ |
| `slot.usedM3` | number | Kapasitas terisi ($m^3$) | Dynamic calculation |
| `slot.temperature` | number? | Suhu sensor aktif ($^\circ\text{C}$) | Real-time IoT Ingestion |
| `slot.status` | enum | `"AVAILABLE" \| "OCCUPIED" \| "RESERVED" \| "MAINTENANCE"` | Status Slot |

### 4.3 Entity: Goods / Master SKU (`GoodsItem`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ID Barang | Primary Key |
| `barcode` | string | Barcode unik (e.g. `"BRG-2026-X9A2"`) | Unique Index |
| `customerId` | string (UUID) | Pemilik barang (Customer ID) | Foreign Key $\rightarrow$ Users |
| `warehouseId` | string (UUID) | Gudang penyimpanan | Foreign Key $\rightarrow$ Warehouses |
| `slotId` | string? (UUID) | Slot rak penyimpanan aktif | Foreign Key $\rightarrow$ StorageSlots |
| `name` | string | Nama produk | Required |
| `category` | enum | `"FURNITURE" \| "COLD_FOOD" \| "GENERAL_ELECTRONICS" \| "TEXTILE"` | Kategori Barang |
| `dimensions` | Object | `{ lengthCm, widthCm, heightCm, volumeM3, weightKg }` | Auto Volume: $(P \times L \times T) / 10^6$ |
| `quantity` | number | Jumlah koli | Required |
| `unit` | string | Satuan (e.g. `"Koli"`, `"Box"`, `"Pallet"`) | Required |
| `requiresColdStorage`| boolean | Penanganan khusus rantai dingin | Boolean Flag |
| `targetTempMin` | number? | Ambang batas suhu minimal ($-25^\circ\text{C}$) | Optional |
| `targetTempMax` | number? | Ambang batas suhu maksimal ($-18^\circ\text{C}$) | Optional |
| `monthlyRentalFee` | number | Estimasi tarif sewa per bulan | Calculated berdasarkan $m^3$ |
| `status` | enum | `"DRAFT" \| "PENDING_PICKUP" \| "STORED" \| "IN_TRANSIT" \| "DELIVERED"` | State Machine |
| `qrCodeData` | string | Payload string untuk scanner QR | Format: `"WMS://ITEM/{barcode}"` |

### 4.4 Entity: Vehicle Fleet (`Vehicle`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ID Armada | Primary Key |
| `plateNumber` | string | Nomor Polisi (e.g. `"B 9821 TKN"`) | Unique Index |
| `name` | string | Model Truk (e.g. `"Isuzu Giga FVR"`) | Required |
| `type` | enum | `"VAN" \| "BOX_TRUCK_SMALL" \| "REEFER_TRUCK" \| "WING_BOX_LARGE"` | Tipe Kendaraan |
| `maxVolumeM3` | number | Kapasitas box ($m^3$) | Required |
| `maxWeightKg` | number | Daya angkut tonase ($kg$) | Required |
| `hasRefrigeration` | boolean | Dilengkapi mesin pendingin reefer | Boolean Flag |
| `minTempCelsius` | number? | Kemampuan suhu terendah ($-20^\circ\text{C}$) | Untuk Reefer Truck |
| `status` | enum | `"AVAILABLE" \| "IN_SERVICE" \| "MAINTENANCE"` | Status Operasional |
| `currentDriverId` | string? (UUID) | Pengemudi yang sedang ditugaskan | Foreign Key $\rightarrow$ Users |

### 4.5 Entity: Delivery Order (`DeliveryOrder`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ID Delivery Order | Primary Key |
| `orderNumber` | string | Nomor DO (e.g. `"DO-2026-001"`) | Unique Index |
| `type` | enum | `"PICKUP" \| "DELIVERY"` | Inbound / Outbound |
| `customerId` | string (UUID) | Pemilik DO | Foreign Key $\rightarrow$ Users |
| `goodsItemIds` | Array<string> | Daftar ID barang yang dimuat | Many-to-Many |
| `originAddress` | string | Alamat muat / pickup | Required |
| `destinationAddress`| string | Alamat bongkar / drop-off | Required |
| `scheduledDate` | string | Tanggal pengiriman | Format: `YYYY-MM-DD` |
| `driverId` | string? (UUID) | Driver yang ditugaskan | Foreign Key $\rightarrow$ Users |
| `vehicleId` | string? (UUID) | Truk yang dialokasikan | Foreign Key $\rightarrow$ Vehicles |
| `status` | enum | `"PENDING_ASSIGNMENT" \| "DRIVER_ASSIGNED" \| "IN_TRANSIT" \| "ARRIVED" \| "DELIVERED" \| "CONFIRMED"` | Workflow State |
| `proofOfDeliveryUrl`| string? | URL foto bukti serah terima | Stored in S3 / MinIO |
| `recipientName` | string? | Nama penerima yang menandatangani | Digital POD data |
| `recipientSignature`| string? | Data base64 / vector tanda tangan | Digital POD data |
| `customerRating` | number? | Rating bintang dari customer ($1.0 - 5.0$) | Evaluasi Driver |

### 4.6 Entity: Invoice & Billing (`Invoice`)
| Field | Tipe Data | Kebutuhan Frontend | Catatan Backend |
| :--- | :--- | :--- | :--- |
| `id` | string (UUID) | ID Faktur | Primary Key |
| `invoiceNumber` | string | No. Faktur (e.g. `"INV-2026-08-0142"`) | Unique Index |
| `customerId` | string (UUID) | Tenant penanggung biaya | Foreign Key $\rightarrow$ Users |
| `billingMonth` | string | Periode sewa (e.g. `"Agustus 2026"`) | Required |
| `dueDate` | string | Tanggal jatuh tempo | Format: `YYYY-MM-DD` |
| `subtotal` | number | Nilai tagihan sewa pokok ($Rp$) | Tarif $m^3 \times \text{Volume}$ |
| `penaltyFee` | number | Denda keterlambatan ($Rp$) | Rule: $5\%$ per minggu terlambat |
| `totalAmount` | number | Total tagihan $(Subtotal + Penalty)$ | Calculated |
| `status` | enum | `"UNPAID" \| "PENDING_VERIFICATION" \| "PAID" \| "OVERDUE" \| "CANCELLED"` | Status Faktur |
| `paymentMethod` | enum? | `"BANK_TRANSFER" \| "QRIS" \| "VIRTUAL_ACCOUNT"` | Metode Pembayaran |
| `paymentProofUrl` | string? | Bukti transfer / callback VA | Stored in Object Storage |

---

## 5. Frontend Service Layer & Anticipated REST API Endpoints

Seluruh integrasi data frontend telah diisolasi secara terpusat pada file-file service di folder `src/services/`. Backend developer hanya perlu mengimplementasikan endpoint REST API berikut untuk menggantikan `MockServiceLayer`:

### 5.1 Auth Service (`src/services/auth.service.ts`)
| Method Frontend | Input | Output | Target REST Endpoint |
| :--- | :--- | :--- | :--- |
| `login(credentials)` | `{ email, password, role? }` | `Promise<UserProfile>` | `POST /api/v1/auth/login` |
| `registerCustomer(input)` | `{ name, email, phone, companyName, address, password }` | `Promise<UserProfile>` | `POST /api/v1/auth/register` |
| `getCurrentUser(id)` | `id: string` | `Promise<UserProfile \| null>` | `GET /api/v1/auth/me` |
| `changePassword(id, current, new)` | `id, currentPass, newPass` | `Promise<boolean>` | `POST /api/v1/auth/change-password` |
| `updateProfile(id, updates)` | `id, updates: Partial<UserProfile>` | `Promise<UserProfile>` | `PATCH /api/v1/users/profile` |

### 5.2 Warehouse Service (`src/services/warehouse.service.ts`)
| Method Frontend | Input | Output | Target REST Endpoint |
| :--- | :--- | :--- | :--- |
| `getWarehouses()` | None | `Promise<WarehouseDetail[]>` | `GET /api/v1/warehouses` |
| `getWarehouseById(id)` | `id: string` | `Promise<WarehouseDetail \| null>` | `GET /api/v1/warehouses/:id` |
| `getSlotDetails(slotId)` | `slotId: string` | `Promise<StorageSlot>` | `GET /api/v1/warehouses/slots/:id` |

### 5.3 Goods Service (`src/services/goods.service.ts`)
| Method Frontend | Input | Output | Target REST Endpoint |
| :--- | :--- | :--- | :--- |
| `getGoods(customerId?)` | `customerId?: string` | `Promise<GoodsItem[]>` | `GET /api/v1/goods?customerId=...` |
| `getGoodsById(id)` | `id: string` | `Promise<GoodsItem \| null>` | `GET /api/v1/goods/:id` |
| `createGoods(input, custId, custName)`| `CreateGoodsInput, customerId, customerName` | `Promise<GoodsItem>` | `POST /api/v1/goods` |
| `updateStatus(id, status, note?)` | `id, status, note?` | `Promise<GoodsItem>` | `PATCH /api/v1/goods/:id/status` |

### 5.4 Logistics Service (`src/services/logistics.service.ts`)
| Method Frontend | Input | Output | Target REST Endpoint |
| :--- | :--- | :--- | :--- |
| `getOrders(driverId?, customerId?)` | `driverId?, customerId?` | `Promise<DeliveryOrder[]>` | `GET /api/v1/logistics/orders` |
| `getVehicles()` | None | `Promise<Vehicle[]>` | `GET /api/v1/logistics/vehicles` |
| `assignVehicle(vehId, drvId, drvName)` | `vehicleId, driverId, driverName` | `Promise<Vehicle>` | `POST /api/v1/logistics/vehicles/assign` |
| `updateOrderStatus(orderId, status)` | `orderId, status` | `Promise<DeliveryOrder>` | `PATCH /api/v1/logistics/orders/:id/status` |
| `submitDigitalPod(orderId, podData)` | `orderId, photoUrl, signature, recipient` | `Promise<DeliveryOrder>` | `POST /api/v1/logistics/orders/:id/pod` |

### 5.5 Billing Service (`src/services/billing.service.ts`)
| Method Frontend | Input | Output | Target REST Endpoint |
| :--- | :--- | :--- | :--- |
| `getInvoices(customerId?)` | `customerId?: string` | `Promise<Invoice[]>` | `GET /api/v1/billing/invoices` |
| `payInvoice(invoiceId, method, proof)` | `invoiceId, method, proofUrl` | `Promise<Invoice>` | `POST /api/v1/billing/invoices/:id/pay` |

---

## 6. Ringkasan & Petunjuk Transisi bagi Backend Developer

1. **Struktur Kode Bersih:** Seluruh pemanggilan API dari komponen React dilakukan via interface service di folder `src/services/`. Backend developer dapat membuat `HttpServiceLayer` baru yang mengimplementasikan interface `IAuthService`, `IGoodsService`, `ILogisticsService`, dsb. tanpa perlu mengubah satu baris pun kode pada komponen UI (`src/app/**`).
2. **Format Response Standar:** Disarankan backend menggunakan format wrapper JSON seragam:
   ```json
   {
     "success": true,
     "message": "Operasi berhasil",
     "data": { ... },
     "meta": { "timestamp": "2026-08-16T18:30:00Z" }
   }
   ```
3. **Autentikasi Header:** Frontend siap mengirimkan token JWT pada HTTP Header:
   ```http
   Authorization: Bearer <JWT_ACCESS_TOKEN>
   ```

*Dokumen ini menjadi acuan mutlak bagi implementasi Database PostgreSQL dan Backend REST API Service.*
