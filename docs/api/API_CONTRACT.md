# REST API Specification & Master Contract
**Warehouse Management System (WMS Nusantara)**
*Version 1.0.0 — Authoritative Client-Agnostic REST API for Web & Mobile Clients*

---

## 1. Overview & General Conventions

- **Base URL:** `http://localhost:5000/api/v1`
- **Interactive OpenAPI / Swagger UI:** `http://localhost:5000/api/docs`
- **Swagger JSON Specification:** `http://localhost:5000/api/docs-json`
- **Authentication Scheme:** HTTP Bearer Token (`Authorization: Bearer <JWT>`)
- **Correlation Header:** `X-Request-ID` (Client generated / Server echoed)
- **Response Format:** Pure JSON enveloped with standard metadata (`success`, `message`, `data`, `meta`)

---

## 2. Standard Envelope Specifications

### 2.1 Standard Single Item Success Envelope (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {},
  "meta": {
    "timestamp": "2026-08-24T18:00:00.000Z",
    "path": "/api/v1/goods/brg-001",
    "version": "1.0.0"
  }
}
```

### 2.2 Standard Paginated List Envelope (HTTP 200)
```json
{
  "success": true,
  "message": "Daftar data berhasil diambil",
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2026-08-24T18:00:00.000Z",
    "path": "/api/v1/goods?page=1&limit=10",
    "version": "1.0.0"
  }
}
```

### 2.3 Standard Error Response Envelope (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "message": "Validasi input gagal",
  "data": null,
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "errors": [
    {
      "field": "quantity",
      "message": "Kuantitas minimal adalah 1"
    }
  ],
  "meta": {
    "timestamp": "2026-08-24T18:00:00.000Z",
    "path": "/api/v1/goods"
  }
}
```

---

## 3. Module Endpoint Matrix (10 Core Modules)

### 3.1 Health & Monitoring (No `/api/v1` Prefix)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/health/liveness` | Public | Liveness probe container k8s/docker. |
| `GET` | `/health/readiness` | Public | Readiness probe memverifikasi koneksi PostgreSQL aktif. |

### 3.2 Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | Public | Autentikasi email & password, menghasilkan Access & Refresh Token. |
| `POST` | `/auth/register` | Public | Registrasi akun customer mandiri. |
| `POST` | `/auth/refresh-token` | Public | Rotasi access token menggunakan refresh token. |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token aktif pengguna dari database. |
| `POST` | `/auth/reset-password` | Public | Mengatur ulang password akun pengguna. |
| `PATCH`| `/auth/change-password`| Authenticated | Mengubah password akun login dengan validasi password lama. |

### 3.3 Users & Profiles (`/api/v1/users`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/users/customers` | Admin | Direktori seluruh customer & ringkasan utilisasi sewa gudang. |
| `GET` | `/users` | Admin | Daftar seluruh pengguna sistem. |
| `GET` | `/users/:id` | Admin / Self | Detail profil pengguna. |
| `PATCH`| `/users/:id/profile` | Admin / Self | Memperbarui informasi profil (nama, telepon, alamat, avatar). |
| `PATCH`| `/users/:id` | Admin / Self | Memperbarui data pengguna secara komprehensif. |
| `DELETE`| `/users/:id` | Admin | Menghapus akun pengguna secara permanen. |

### 3.4 Warehouses & 3D Slots (`/api/v1/warehouses`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/warehouses` | Authenticated | Daftar seluruh fasilitas gudang dan utilisasi kapasitas $m^3$. |
| `GET` | `/warehouses/customer/active` | Customer / Admin | Fasilitas gudang aktif tempat barang customer disimpan. |
| `POST`| `/warehouses/rent` | Customer / Admin | Pemesanan sewa ruang gudang & penerbitan faktur tagihan otomatis. |
| `GET` | `/warehouses/:id` | Authenticated | Detail fasilitas gudang, denah zona, dan daftar slot rak 3D. |

### 3.5 Goods & Inventory (`/api/v1/goods`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/goods` | Customer / Admin | Registrasi master SKU barang baru dengan kalkulasi volume $m^3$. |
| `GET` | `/goods` | Customer / Admin | Daftar inventaris barang dengan isolasi tenant per customer. |
| `GET` | `/goods/mutations` | Customer / Admin | Jejak audit histori mutasi penyimpanan barang. |
| `GET` | `/goods/:id` | Customer / Admin | Detail barang, spesifikasi dimensi, slot rak, dan jejak mutasi. |
| `PATCH`| `/goods/:id/status` | Authenticated | Transisi status barang (Put-Away, Inbound, Outbound). |
| `POST`| `/goods/:id/transfer-slot` | Admin | Pemindahan barang antar-slot rak (Rack Transfer). |

### 3.6 Logistics & Fleet (`/api/v1/logistics`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/logistics/vehicles` | Authenticated | Direktori armada kendaraan (Reefer, Box, Van). |
| `POST`| `/logistics/vehicles/assign` | Admin | Menugaskan driver resmi ke armada kendaraan tertentu. |
| `GET` | `/logistics/orders` | Authenticated | Daftar Delivery Order terisolasi (Admin, Customer, Driver). |
| `POST`| `/logistics/orders` | Customer / Admin | Membuat Delivery Order / Surat Jalan baru. |
| `GET` | `/logistics/orders/:id` | Authenticated | Detail lengkap surat jalan, muatan SKU, dan rute pengiriman. |
| `PATCH`| `/logistics/orders/:id/status` | Authenticated | Transisi status pengiriman (EN_ROUTE, PICKED_UP, IN_TRANSIT). |
| `POST`| `/logistics/orders/:id/pod` | Authenticated | Mengunggah Digital POD (Foto kargo + E-Signature penerima). |
| `POST`| `/logistics/orders/:id/receive`| Customer / Admin | Konfirmasi serah terima kargo di dermaga bongkar muat. |

### 3.7 Billing & Invoices (`/api/v1/billing`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/billing/invoices` | Customer / Admin | Daftar faktur tagihan sewa bulanan & denda keterlambatan 5%/minggu. |
| `GET` | `/billing/invoices/:id` | Customer / Admin | Detail faktur tagihan, rincian biaya per m3, dan transaksi. |
| `POST`| `/billing/invoices/:id/pay` | Customer / Admin | Pembayaran tagihan (Virtual Account / Upload Bukti Transfer). |
| `GET` | `/billing/payments/pending` | Admin | Antrean verifikasi pembayaran berstatus UNDER_REVIEW. |
| `PATCH`| `/billing/payments/:id/verify`| Admin | Verifikasi atau tolak pembayaran customer (PAID / REJECTED). |

### 3.8 IoT Telemetry & Monitoring (`/api/v1/telemetry`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/telemetry/ingest` | Admin / Hardware | Ingestion data suhu sensor IoT slot dingin atau truk reefer. |
| `GET` | `/telemetry/monitoring` | Authenticated | Live snapshot status suhu seluruh slot cold storage & anomali. |
| `GET` | `/telemetry/logs` | Authenticated | Riwayat log telemetri suhu & kelembaban dengan filter tanggal. |

### 3.9 Analytics & KPIs (`/api/v1/analytics`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/analytics/operational-counts` | Authenticated | Badge counter realtime (antrean logistik, tagihan, unread notif). |
| `GET` | `/analytics/admin-overview` | Admin | Agregasi KPI operasional, utilisasi gudang, pendapatan sewa. |
| `GET` | `/analytics/customer-summary` | Customer / Admin | Ringkasan tenant pelanggan (sisa kapasitas, tagihan, barang). |
| `GET` | `/analytics/driver-summary` | Driver / Admin | Ringkasan tugas armada driver, performa, dan rute aktif. |

### 3.10 System Notifications (`/api/v1/notifications`)
| Method | Endpoint | Access | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/notifications` | Authenticated | Daftar notifikasi pengguna terautentikasi dengan paginasi. |
| `GET` | `/notifications/unread-count` | Authenticated | Jumlah notifikasi belum dibaca untuk lonceng topbar. |
| `PATCH`| `/notifications/read-all` | Authenticated | Menandai seluruh notifikasi user sebagai telah dibaca. |
| `PATCH`| `/notifications/:id/read` | Authenticated | Menandai satu notifikasi tertentu sebagai telah dibaca. |
