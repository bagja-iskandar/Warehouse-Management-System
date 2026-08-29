# SRS Traceability & Requirements Verification Matrix
**Warehouse Management System (WMS Nusantara)**
*16 Use Cases Traceability, Functional Scope, and Final Verification Status*

---

## 1. Traceability Overview

Dokumen ini memetakan 16 Use Cases fungsional dari spesifikasi kebutuhan sistem (*Software Requirements Specification* - SRS) pergudangan terhadap modul implementasi frontend, endpoint backend, dan status verifikasi akhir.

---

## 2. SRS 16 Use Cases Traceability Matrix

| ID | Use Case SRS | Aktor | Modul & Cakupan Fungsional | Rute Frontend & Endpoint Backend | Status Akhir |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UC16** | **Login** | Admin, Customer, Driver | Autentikasi multi-role, validasi kredensial, token pair JWT, proteksi sesi. | `/login`<br>`POST /api/v1/auth/login` | 🔒 **VERIFIED** |
| **UC15** | **Create Akun** | Admin, Customer | Pendaftaran akun baru customer & pembuatan akun driver/staff oleh admin. | `/register`<br>`POST /api/v1/auth/register` | 🔒 **VERIFIED** |
| **UC14** | **Hapus Akun** | Admin | Penonaktifan dan penghapusan akun pengguna bermasalah / non-aktif. | `/admin/customers`<br>`DELETE /api/v1/users/:id` | 🔒 **VERIFIED** |
| **UC7** | **Edit Profile** | Admin, Customer, Driver | Pembaruan profil pengguna, kontak telepon, alamat, dan ubah password. | `/profile`, `/profile/change-password`<br>`PATCH /api/v1/users/:id/profile` | 🔒 **VERIFIED** |
| **UC5** | **Fitur Aplikasi** | All Roles | Navigasi menu utama berbasis floating shell dan hak akses peran. | `/admin/*`, `/customer/*`, `/driver/*` | 🔒 **VERIFIED** |
| **UC2** | **Input Barang** | Customer | Pendaftaran barang sewa: Furniture vs Cold Food, kalkulator dimensi $P \times L \times T$. | `/customer/goods/input`<br>`POST /api/v1/goods` | 🔒 **VERIFIED** |
| **UC10** | **Info Data Barang** | Customer, Admin | Detail data spesifikasi teknis barang, barcode QR, dan alokasi slot rak. | `/customer/goods`, `/admin/goods`<br>`GET /api/v1/goods/:id` | 🔒 **VERIFIED** |
| **UC1** | **Melihat Riwayat** | Customer, Admin | Riwayat barang disimpan, diambil, dan jejak mutasi slot (*Rack Transfer*). | `/customer/goods`, `/admin/reports`, `/admin/goods`<br>`GET /api/v1/goods/mutations` | 🔒 **VERIFIED** |
| **UC9** | **Monitoring** | Admin, Customer | Pemantauan live status suhu sensor cold storage sub-zero dan anomali. | `/admin/monitoring`, `/customer/monitoring`<br>`GET /api/v1/telemetry/monitoring` | 🔒 **VERIFIED** |
| **UC3** | **Pemilihan Kendaraan** | Driver | Driver memilih armada kendaraan (Van, Truk Box, Reefer) dan inspeksi dock. | `/driver/vehicle/select`<br>`GET /api/v1/logistics/vehicles` | 🔒 **VERIFIED** |
| **UC8** | **Pengiriman** | Driver, Customer | Eksekusi tugas pickup & delivery, tracking rute/maps GPS, update status transit. | `/driver/transit`, `/customer/logistics/track`<br>`PATCH /api/v1/logistics/orders/:id/status` | 🔒 **VERIFIED** |
| **UC6** | **Penjadwalan (Jadwal)** | Admin, Driver, Customer | Penjadwalan penjemputan/pengantaran armada kargo ke fasilitas gudang. | `/admin/logistics`, `/customer/logistics/request`<br>`POST /api/v1/logistics/orders` | 🔒 **VERIFIED** |
| **UC4** | **Konfirmasi Barang** | Admin, Driver, Customer | Serah terima digital: Digital POD (Foto kargo + E-Signature) dan receipt dock. | `/driver/pod`, `/customer/receipt/confirm`<br>`POST /api/v1/logistics/orders/:id/pod` | 🔒 **VERIFIED** |
| **UC12** | **Pembayaran** | Customer, Admin | Tagihan sewa bulanan, denda $5\%/\text{minggu}$, upload bukti transfer, verifikasi lunas. | `/customer/billing`, `/admin/billing`<br>`POST /api/v1/billing/invoices/:id/pay` | 🔒 **VERIFIED** |
| **UC11** | **Notifikasi** | All Roles | Notifikasi otomatis (tagihan tempo, status pengiriman, alokasi barang, anomali). | Notification Drawer Navbar<br>`GET /api/v1/notifications` | 🔒 **VERIFIED** |
| **UC13** | **Membuat Laporan** | Admin | Laporan utilisasi kapasitas gudang $m^3$, pendapatan sewa, performa armada. | `/admin/reports`, `/admin/dashboard`<br>`GET /api/v1/analytics/admin-overview` | 🔒 **VERIFIED** |

---

## 3. SRS Compliance Evaluation
- **Total Use Cases Defined:** 16
- **Total Use Cases Implemented:** 16 (100%)
- **Total Use Cases Verified E2E:** 16 (100%)
- **SRS Functional Compliance Rate:** **100%**
