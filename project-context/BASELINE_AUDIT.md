# Baseline Audit & SRS Traceability Report

**Project:** Warehouse Management System (WMS)  
**Status:** Approved (Phase 0 Baseline)  
**Audit Date:** 2026-08-16  

---

## 1. Kondisi Fisik Repository Saat Inisiasi

- **Status Workspace:** Greenfield Rework Directory (`d:\Project\REWORK\Warehouse`)
- **Node.js:** v22.18.0 (LTS Active)
- **npm:** 10.9.3
- **OS:** Windows 10/11 x64
- **Existing Code:** Bersih tanpa legacy codebase spaghetti yang bercampur di direktori kerja.
- **Dokumen Referensi:** `Document/SRS_Sistem Penyimpanan Gudang.docx` (796 paragraf, 16 use cases, ERD, Sequence, UI Wireframes)

---

## 2. SRS Traceability Matrix (Use Case 1 s.d. 16)

| ID | Use Case SRS | Aktor | Deskripsi & Cakupan Fungsional | Status Awal (Phase 0) | Target Milestone |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **UC16** | **Login** | Admin, Customer, Driver | Autentikasi multi-role, validasi kredensial, proteksi sesi, redirect dashboard sesuai role | `Missing` | Phase 2 (Sprint 2) |
| **UC15** | **Create Akun** | Admin, Customer | Pendaftaran akun baru customer & pembuatan akun oleh admin untuk staff/driver | `Missing` | Phase 2 (Sprint 2) |
| **UC14** | **Hapus Akun** | Admin | Penghapusan akun pengguna non-aktif / bermasalah | `Missing` | Phase 2 (Sprint 2) |
| **UC7** | **Edit Profile** | Admin, Customer, Driver | Pembaruan profil pengguna, kontak telepon, alamat, password | `Missing` | Phase 2 (Sprint 2) |
| **UC5** | **Fitur Aplikasi** | All Roles | Navigasi menu utama sistem berbasis hak akses peran | `Missing` | Phase 2 (Sprint 2) |
| **UC2** | **Input Barang** | Customer | Input data sewa gudang: Furniture vs Makanan Dingin (Cold Storage), dimensi, qty, deskripsi | `Missing` | Phase 3 (Sprint 3) |
| **UC10** | **Info Data Barang** | Customer, Admin | Detail data spesifikasi teknis barang dan histori inspeksi | `Missing` | Phase 3 (Sprint 3) |
| **UC1** | **Melihat Riwayat** | Customer, Admin | Riwayat barang yang disimpan, diambil, dan mutasi di gudang | `Missing` | Phase 3 (Sprint 3) |
| **UC9** | **Monitoring** | Admin, Customer | Pemantauan daring status barang, kondisi suhu rak pendingin, dan lokasi slot | `Missing` | Phase 3 & 5 |
| **UC3** | **Pemilihan Kendaraan** | Driver | Driver memilih kendaraan (Van, Truk Box, Reefer) sesuai kapasitas barang | `Missing` | Phase 4 (Sprint 4) |
| **UC8** | **Pengiriman** | Driver, Customer | Eksekusi tugas pickup & delivery, tracking rute/maps, update status logistik | `Missing` | Phase 4 (Sprint 4) |
| **UC6** | **Penjadwalan (Jadwal)** | Admin, Driver, Customer | Penjadwalan dinamis pickup/delivery dan manajemen penundaan (delay) | `Missing` | Phase 4 (Sprint 4) |
| **UC4** | **Konfirmasi Barang** | Admin, Driver, Customer | Serah terima digital (Proof of Delivery / POD) barang di gudang / customer | `Missing` | Phase 4 (Sprint 4) |
| **UC12** | **Pembayaran** | Customer, Admin | Tagihan sewa bulanan (subscription), denda keterlambatan, bukti transfer, konfirmasi lunas | `Missing` | Phase 6 (Sprint 6) |
| **UC11** | **Notifikasi** | All Roles | Notifikasi otomatis (tagihan jatuh tempo, status pengiriman, approval barang, penundaan) | `Missing` | Phase 6 (Sprint 6) |
| **UC13** | **Membuat Laporan** | Admin | Laporan aktivitas gudang, utilisasi kapasitas, pendapatan sewa, performa logistik | `Missing` | Phase 6 (Sprint 6) |

---

## 3. Hasil Evaluasi & Baseline Health Score

```text
Architecture Baseline:
- Zero technical debt legacy.
- Clean slate untuk menerapkan Next.js App Router + TanStack Query + Service Abstraction Layer.

Design System Baseline:
- Standardisasi token (Colors, Spacing, Typography, Dark/Light Mode) diselaraskan dengan kebutuhan WMS modern.
- Komponen atomic berbasis Radix UI + Tailwind CSS.

Type Safety Baseline:
- 100% strict TypeScript types untuk seluruh entitas domain (Warehouse, Slot, GoodsItem, Order, Vehicle, Invoice).
```
