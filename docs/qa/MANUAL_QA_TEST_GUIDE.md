# 📋 MANUAL QA & USER ACCEPTANCE TESTING (UAT) PLAYBOOK
**WMS Nusantara — Enterprise Warehouse & Cold Chain Logistics Management System**  
**Document Code:** `QA-UAT-MANUAL-001` | **Version:** `1.0.0` | **Target Audience:** Project Manager, Product Owner, QA Manual Tester

---

## 1. TUJUAN DOKUMENTASI

Dokumen ini disusun sebagai **Panduan Pengujian Manual (Manual QA & UAT Guide)** yang **HARUS dijalankan sendiri oleh manusia (Project Manager / QA Tester)** secara langsung melalui antarmuka web (*browser*).

Dokumen ini **BUKAN** daftar automated unit/e2e tests, melainkan panduan terstruktur langkah-demi-langkah untuk memverifikasi:
1. **Business Logic & Workflow Feasibility:** Apakah alur operasional pergudangan, logistik rantai dingin (*cold chain*), penempatan rak, dan penagihan tagihan berjalan logis sesuai aturan industri.
2. **User Experience (UX) & Ergonomics:** Apakah interaksi, visual feedback, navigasi, dan handling status terasa natural bagi pengguna nyata (Admin Gudang, Tenant Customer, dan Driver Armada).
3. **Data Integrity & Multi-Tenant Isolation:** Memastikan tidak ada kebocoran data (*data leakage*) antar-pelanggan dan setiap mutasi fisik barang tercatat akurat di database PostgreSQL.

---

## 2. PEMBAGIAN QA: AI/AUTOMATED VS HUMAN MANUAL TESTING

Untuk efisiensi dan ketepatan pengujian, berikut pembagian tanggung jawab antara pengujian otomatis oleh mesin/AI dan pengujian manual oleh Project Manager:

| Aspek Pengujian | Diuji oleh Mesin / AI / Automated | Wajib Diuji oleh Human Tester (PM) | Alasan Membutuhkan Validasi Manusia |
| :--- | :---: | :---: | :--- |
| **Type Safety & Syntax** | ✅ (*tsc --noEmit*) | ❌ | Compiler menjamin integritas tipe TypeScript. |
| **REST API Contracts** | ✅ (*Supertest / Jest*) | ❌ | Status code HTTP dan struktur JSON envelope sudah teruji. |
| **Database Constraints** | ✅ (*Prisma Migrations*) | ❌ | Foreign key, unique indexes, dan schema enforce divalidasi DB. |
| **Alur Transisi Bisnis Riil** | ⚠️ (*Scripted Flow*) | ✅ **WAJIB** | Menilai apakah urutan aksi (misal: *Inbound $\rightarrow$ Receiving $\rightarrow$ Put-Away*) logis secara operasional. |
| **Kesesuaian Desain & Estetika** | ❌ | ✅ **WAJIB** | Menilai visual hierarchy, alignment, kontras warna status, dan konsistensi layout. |
| **Perasaan Interaksi (Feel & Polish)** | ❌ | ✅ **WAJIB** | Menilai kejelasan feedback (toast, modal confirmation, loading skeleton, badge). |
| **Isolasi Multi-Tenant Visual** | ⚠️ (*Data Query Check*) | ✅ **WAJIB** | Memastikan Customer A benar-benar tidak melihat visual data milik Customer B di layar. |
| **Exploratory & Edge Cases** | ❌ | ✅ **WAJIB** | Double click button, interupsi jaringan, refresh tab saat mutasi data, multi-tabing. |

---

## 3. TESTING ENVIRONMENT

### 3.1 Prasyarat Menjalankan Aplikasi

Pastikan service backend dan frontend aktif di terminal lokal Anda:

1. **Backend Service (NestJS 10.x):**
   - URL: `http://localhost:5000`
   - API Base: `http://localhost:5000/api/v1`
   - Swagger Docs: `http://localhost:5000/api/docs`
   - Database: PostgreSQL 16 (Local / Docker)
2. **Frontend Client (Next.js 15):**
   - URL: `http://localhost:3000`
3. **Browser yang Disarankan:**
   - Google Chrome / Microsoft Edge versi terbaru (resolusi desktop $1366 \times 768$ hingga $1920 \times 1080$, serta mode mobile responsive $375 \times 667$ untuk Driver).
4. **Tools Pendukung Tester:**
   - Browser Developer Tools (`F12` $\rightarrow$ Console & Network Tab).
   - Mode *Incognito / Private Window* (untuk menguji multi-role secara bersamaan tanpa bentrok session).

### 3.2 Kredensial Akun Pengujian Resmi

Seluruh akun default terdaftar pada database PostgreSQL dengan password seragam: **`Password123!`**.

| Role / Peran | Email Akun | Password | Deskripsi / Karakteristik Akun | Target Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Warehouse Admin** | `admin@wms.id` | `Password123!` | Administrator Utama Gudang (PT Logistik Prima Nusantara) | `/admin/dashboard` |
| **Customer A** | `haidar@gmail.com` | `Password123!` | Tenant Aktif — Kategori Cold Storage (Frozen Food) | `/customer/dashboard` |
| **Customer B** | `pandu@gmail.com` | `Password123!` | Tenant Aktif — Kategori Standard Dry (Furniture / General) | `/customer/dashboard` |
| **Driver 1** | `driver@wms.id` | `Password123!` | Pengemudi Armada Reefer Truck (Hub Cakung Jakarta) | `/driver/dashboard` |
| **Driver 2** | `dedi.driver@wms.id` | `Password123!` | Pengemudi Armada Box Truck (Hub Bandung) | `/driver/dashboard` |

---

## 4. TEST DATA PREPARATION

Sebelum memulai skenario pengujian, pastikan Anda menyiapkan entitas data pengujian mandiri berikut ini (atau menggunakan data seed yang sudah ada):

1. **Akun Pengguna Baru (Untuk Uji Registrasi):**
   - Email Uji: `tester.new@company.id`
   - Nama: `Bambang QA Tester`
   - Perusahaan: `PT Segar Abadi Logistik`
2. **Data Barang Uji Inbound (Customer A - Cold Storage):**
   - Nama Barang: `Salmon Sashimi Grade A`
   - Dimensi: $50 \text{ cm} \times 40 \text{ cm} \times 30 \text{ cm}$ (Volume: $0.06 \text{ m}^3$)
   - Jumlah: $50 \text{ Box}$ (Total Volume: $3.00 \text{ m}^3$, Berat: $500 \text{ kg}$)
   - Suhu Wajib: $-20^\circ\text{C}$ s.d. $-18^\circ\text{C}$ (Requires Cold Storage = `TRUE`)
3. **Data Barang Uji Inbound (Customer B - Standard Dry):**
   - Nama Barang: `Office Ergonomic Chair`
   - Dimensi: $80 \text{ cm} \times 60 \text{ cm} \times 50 \text{ cm}$ (Volume: $0.24 \text{ m}^3$)
   - Jumlah: $10 \text{ Box}$ (Total Volume: $2.40 \text{ m}^3$, Berat: $180 \text{ kg}$)
   - Suhu Wajib: Standard Ambient (Requires Cold Storage = `FALSE`)
4. **Data Gudang & Rak Uji:**
   - Gudang: `Cakung Logistics Central Hub (WH-CKG-01)`
   - Slot Cold Storage: `COLD-A01` s.d. `COLD-A05`
   - Slot Standard Dry: `DRY-B01` s.d. `DRY-B05`

---

## 5. MANUAL QA TEST MATRIX

---

### TC-001
**Module:** Authentication & Access Control  
**Role:** Unauthenticated Guest / All Roles  
**Scenario:** Registrasi Akun Customer Baru & Validasi Otomatis  
**Priority:** Critical  

**Precondition:**
- Browser membuka halaman [http://localhost:3000/register](http://localhost:3000/register).
- Belum ada sesi login aktif di browser.

**Steps:**
1. Klik tautan **"Register as Customer"** pada halaman login.
2. Isi formulir pendaftaran:
   - Full Name: `Bambang QA Tester`
   - Corporate Email: `bambang.qa@freshmart.id`
   - Company Name: `PT Freshmart Sejahtera`
   - Phone Number: `081298765432`
   - Password: `Password123!`
   - Confirm Password: `Password123!`
   - Warehouse Service: Pilih *Cold Chain Storage*.
3. Klik tombol **"Create Enterprise Account"**.

**Expected Result:**
- Sistem memvalidasi formulir dan mengirim request `POST /api/v1/auth/register-customer`.
- Muncul toast notifikasi hijau: *"Registrasi Berhasil"*.
- Token JWT diterbitkan dan pengguna langsung dialihkan ke `/customer/dashboard`.
- Nama *Bambang QA Tester* dan *PT Freshmart Sejahtera* tampil di pojok kanan atas navbar / profile.

**What I should observe manually:**
- Tombol submit menampilkan animasi loading *spinner* dan disable selama request berlangsung.
- Tidak ada kedipan (*flicker*) atau halaman kosong saat redirect ke dashboard.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  
*(Catat error jika ada)*

---

### TC-002
**Module:** Authentication & Access Control  
**Role:** All Roles (Admin, Customer, Driver)  
**Scenario:** Login dengan Kredensial Valid & Validasi Automatic Role-Based Routing  
**Priority:** Critical  

**Precondition:**
- Halaman login terbuka di [http://localhost:3000/login](http://localhost:3000/login).

**Steps:**
1. Masukkan email: `admin@wms.id` dan password: `Password123!`. Klik **"Sign In"**. Periksa halaman redirect.
2. Logout dari sistem, lalu masukkan email: `haidar@gmail.com` dan password: `Password123!`. Klik **"Sign In"**. Periksa halaman redirect.
3. Logout dari sistem, lalu masukkan email: `driver@wms.id` dan password: `Password123!`. Klik **"Sign In"**. Periksa halaman redirect.

**Expected Result:**
- `admin@wms.id` secara instan dialihkan ke `/admin/dashboard`.
- `haidar@gmail.com` secara instan dialihkan ke `/customer/dashboard`.
- `driver@wms.id` secara instan dialihkan ke `/driver/dashboard`.
- Token JWT tersimpan aman di `localStorage` (`wms_access_token` & `wms_refresh_token`).

**What I should observe manually:**
- Indikator password toggle (ikon mata 👁️) berfungsi menyembunyikan/menampilkan teks password.
- Checkbox *"Remember session on this device"* dapat dicentang tanpa visual glitch.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-003
**Module:** Authentication & Access Control  
**Role:** Unauthenticated / Wrong Credentials  
**Scenario:** Uji Validasi Error Login & Feedback Bahasa Inggris  
**Priority:** High  

**Precondition:**
- Halaman login terbuka.

**Steps:**
1. Masukkan email salah: `unknown@wms.id` dan password: `WrongPassword999!`.
2. Klik tombol **"Sign In"**.

**Expected Result:**
- Request `POST /api/v1/auth/login` menghasilkan response HTTP 401 Unauthorized.
- Di bawah form login muncul alert banner warna merah dengan teks Bahasa Inggris:
  `"Invalid email or password"`
- Form tidak melakukan redirect dan password input tetap dalam kontrol pengguna.

**What I should observe manually:**
- Banner error muncul dengan animasi fade-in yang rapi dan tidak menggeser layout form secara kasar.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-004
**Module:** Security & RBAC Guard  
**Role:** Driver / Cross-Role Tampering  
**Scenario:** Upaya Akses Halaman Terlarang (Cross-Role URL Direct Navigation)  
**Priority:** Critical  

**Precondition:**
- Login sebagai **Driver** (`driver@wms.id`).

**Steps:**
1. Saat berada di `/driver/dashboard`, ubah URL browser secara manual menjadi [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) lalu tekan Enter.
2. Coba ubah URL menjadi [http://localhost:3000/customer/dashboard](http://localhost:3000/customer/dashboard) lalu tekan Enter.

**Expected Result:**
- Frontend / Backend RBAC Guards menolak akses.
- Halaman menampilkan kartu error penolakan hak akses (*Access Denied 403 / Forbidden*) atau mengarahkan kembali ke `/driver/dashboard`.
- Data statistik Admin atau tagihan Customer sama sekali **TIDAK bocor** ke layar Driver.

**What I should observe manually:**
- Pastikan tidak ada data sensitif yang sempat ter-render sebelum error screen muncul.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-005
**Module:** Customer — Warehouse Space Rental  
**Role:** Customer (`haidar@gmail.com`)  
**Scenario:** Penyewaan Kapasitas Gudang Cold Storage Baru & Pembuatan Faktur Otomatis  
**Priority:** Critical  

**Precondition:**
- Login sebagai Customer A (`haidar@gmail.com`).
- Buka menu **"Rent Storage"** pada [http://localhost:3000/customer/warehouses](http://localhost:3000/customer/warehouses).

**Steps:**
1. Pilih fasilitas gudang: `Cakung Logistics Central Hub (WH-CKG-01)`.
2. Klik tombol **"Rent Storage Space"**.
3. Pada modal sewa gudang:
   - Storage Type: Pilih **Cold Storage** (Tarif: Rp 2.500.000 / m³ / bulan).
   - Space Volume: Masukkan `10` m³.
   - Duration: Pilih `3 Months`.
4. Periksa ringkasan kalkulasi biaya:
   - Monthly Fee: $10 \text{ m}^3 \times \text{Rp } 2.500.000 = \text{Rp } 25.000.000$.
   - Grand Total (3 Bulan): $3 \times \text{Rp } 25.000.000 = \text{Rp } 75.000.000$.
5. Klik **"Confirm & Generate Invoice"**.

**Expected Result:**
- Request `POST /api/v1/warehouses/rent` berhasil (HTTP 201 Created).
- Faktur tagihan baru diterbitkan dengan status `UNPAID` atau `PENDING_PAYMENT`.
- Muncul toast notifikasi sukses dan modal otomatis tertutup.
- Customer diarahkan ke `/customer/billing` untuk melihat tagihan sebesar Rp 75.000.000.

**What I should observe manually:**
- Kalkulasi angka di modal berubah secara *real-time* saat volume atau durasi diubah.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-006
**Module:** Customer — Goods Registration & Inbound Request  
**Role:** Customer (`haidar@gmail.com`)  
**Scenario:** Pendaftaran Barang Dagangan Baru dengan Permintaan Penjemputan Armada (*Pickup*)  
**Priority:** Critical  

**Precondition:**
- Login sebagai Customer A (`haidar@gmail.com`).
- Buka menu **"Register Goods"** pada [http://localhost:3000/customer/goods/new](http://localhost:3000/customer/goods/new).

**Steps:**
1. Isi form pendaftaran komoditas:
   - Item Name: `Norwegian Salmon Fillet Grade A`
   - Category: `FOOD_FROZEN`
   - Storage Requirement: Centang opsi **Requires Cold Storage (-18°C)**.
   - Package Quantity: `50` Box.
   - Package Dimensions: Length `50` cm, Width `40` cm, Height `30` cm.
   - Unit Weight: `10` kg / box (Total: 500 kg).
2. Periksa kalkulasi otomatis volume:
   - Formula: $\frac{50 \times 40 \times 30}{1.000.000} \times 50 = 0.06 \times 50 = 3.00 \text{ m}^3$.
3. Centang opsi **"Request Logistics Fleet Pickup"**:
   - Pickup Address: `Jl. Pelabuhan Muara Baru No. 12, Jakarta Utara`
   - Pickup Date: Pilih tanggal hari ini / besok.
4. Klik tombol **"Submit Inbound Registration"**.

**Expected Result:**
- Data barang berhasil tersimpan dengan status awal `PENDING_PICKUP` atau `IN_TRANSIT_INBOUND`.
- Barcode SKU otomatis dibuat dengan format `BRG-2026-FROZEN-XXXXXX`.
- Delivery Order tipe `INBOUND_PICKUP` otomatis terbuat di database logistik.
- Barang muncul di daftar inventaris Customer pada [http://localhost:3000/customer/goods](http://localhost:3000/customer/goods).

**What I should observe manually:**
- Badge status barang bertuliskan *"Inbound Transit / Pending Pickup"* dengan warna yang sesuai dan tidak berubah warna saat di-hover.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-007
**Module:** Logistics & Fleet Dispatching  
**Role:** Warehouse Admin (`admin@wms.id`)  
**Scenario:** Admin Menugaskan Pengemudi & Kendaraan Reefer untuk Order Inbound  
**Priority:** Critical  

**Precondition:**
- Login sebagai Admin (`admin@wms.id`).
- Buka menu **"Fleet & Logistics"** pada [http://localhost:3000/admin/logistics](http://localhost:3000/admin/logistics).

**Steps:**
1. Cari Delivery Order Inbound yang baru dibuat oleh Customer A pada tabel order.
2. Klik tombol **"Assign Fleet & Driver"** (atau ikon truk).
3. Pada modal penugasan armada:
   - Pilih Driver: `Agus Pratama (driver@wms.id)`.
   - Pilih Kendaraan: `Isuzu Giga Reefer Cold Truck (B 9821 WMS)` — Pastikan tipe kendaraan adalah *Reefer Cold*.
4. Klik **"Confirm Dispatch Assignment"**.

**Expected Result:**
- Request `PATCH /api/v1/logistics/orders/:id/assign-driver` berhasil (HTTP 200 OK).
- Status Delivery Order berubah menjadi `DRIVER_ASSIGNED`.
- Status kendaraan berubah dari `AVAILABLE` menjadi `IN_SERVICE`.
- Notifikasi penugasan tugas baru otomatis masuk ke akun Driver `driver@wms.id`.

**What I should observe manually:**
- Dropdown kendaraan memfilter kendaraan yang kompatibel (truk berpendingin untuk kargo beku).
- Status di tabel langsung ter-refresh secara reaktif tanpa perlu reload halaman penuh.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-008
**Module:** Driver Operations — Inbound Transit Lifecycle  
**Role:** Driver (`driver@wms.id`)  
**Scenario:** Driver Mengambil Muatan dan Membawa Kargo ke Dermaga Gudang (*Inbound Transit*)  
**Priority:** Critical  

**Precondition:**
- Login sebagai Driver (`driver@wms.id`).
- Buka [http://localhost:3000/driver/dashboard](http://localhost:3000/driver/dashboard).

**Steps:**
1. Periksa kartu tugas aktif di dashboard driver. Pastikan tugas penjemputan dari Customer A muncul.
2. Klik tombol **"View Task Details"** $\rightarrow$ Masuk ke `/driver/tasks/[id]`.
3. Klik tombol **"Start Pickup Trip"** $\rightarrow$ Status berubah menjadi `EN_ROUTE`.
4. Klik tombol **"Confirm Cargo Loaded at Supplier"** $\rightarrow$ Status berubah menjadi `IN_TRANSIT`.
5. Buka tab `/driver/transit` untuk melihat simulasi telemetri suhu truk dingin ($-19.2^\circ\text{C}$).
6. Setelah tiba di gudang, klik **"Confirm Arrival at Warehouse Dock"**.

**Expected Result:**
- Status Delivery Order berubah menjadi `ARRIVED`.
- Kargo berstatus siap dilakukan verifikasi fisik (*Receiving*) oleh Admin Gudang.
- Driver **TIDAK memiliki wewenang** untuk langsung memasukkan barang ke rak gudang (*RBAC isolation*).

**What I should observe manually:**
- Driver UI dirancang dengan tombol berukuran besar dan mudah ditekan di layar sentuh mobile.
- Banner rute dan indikator kargo dingin (*Cold Chain*) tampil jelas.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-009
**Module:** Inbound Receiving & Physical Verification  
**Role:** Warehouse Admin (`admin@wms.id`)  
**Scenario:** Admin Melakukan Inspeksi Fisik Barang Datang (*Receiving Inspection*)  
**Priority:** Critical  

**Precondition:**
- Login sebagai Admin (`admin@wms.id`).
- Truk armada kargo Customer A telah berstatus `ARRIVED` di dermaga logistik.
- Buka menu [http://localhost:3000/admin/logistics](http://localhost:3000/admin/logistics).

**Steps:**
1. Klik tombol **"Verify Receiving"** pada baris order Customer A yang telah tiba.
2. Pada modal verifikasi penerimaan fisik (*Inbound Goods Receiving Verification*):
   - Received Quantity: Masukkan `50` Box.
   - Damaged Quantity: Masukkan `0` Box.
   - Missing Quantity: Masukkan `0` Box.
   - Physical Condition: Pilih `GOOD_SEALED`.
   - Temperature at Receiving: Masukkan `-19.0` °C.
   - Receiving Notes: `Barang diterima lengkap dan segel cold chain utuh.`
3. Klik **"Confirm & Accept Inbound Goods"**.

**Expected Result:**
- Request `POST /api/v1/logistics/orders/:id/receive` berhasil diproses (HTTP 200 OK).
- Status Delivery Order berubah menjadi `DELIVERED` / `RECEIVED`.
- Kendaraan `B 9821 WMS` kembali berstatus `AVAILABLE` untuk penugasan berikutnya.
- Status barang berubah menjadi `INSPECTION` / Siap dialokasikan ke rak (*Put-Away*).
- Riwayat mutasi tercatat: *"Inbound Receiving Verified by Warehouse Staff"*.

**What I should observe manually:**
- Validasi form mencegah input `Damaged + Missing + Received` melebihi total muatan order.
- Toast sukses hijau muncul di pojok kanan bawah.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-010
**Module:** Put-Away & Rack Storage Allocation  
**Role:** Warehouse Admin (`admin@wms.id`)  
**Scenario:** Penempatan Barang ke Slot Rak Gudang Dingin (*Put-Away Execution*)  
**Priority:** Critical  

**Precondition:**
- Login sebagai Admin (`admin@wms.id`).
- Buka menu **"Goods & Inventory"** pada [http://localhost:3000/admin/goods](http://localhost:3000/admin/goods).

**Steps:**
1. Cari barang `Norwegian Salmon Fillet Grade A` yang berstatus menunggu penempatan (*Pending Put-Away*).
2. Klik tombol **"Put-Away to Rack"** (ikon rak gudang).
3. Pada modal pemilihan slot rak:
   - Pilih Gudang: `Cakung Logistics Central Hub`.
   - Pilih Slot Rak: Pilih slot dingin `COLD-A01` (Kapasitas: $20.0 \text{ m}^3$, Tersedia: $\ge 3.0 \text{ m}^3$).
   - Perhatikan bahwa slot `DRY-B01` (Standard Dry) berlabel disabled atau memberikan peringatan zona tidak cocok.
4. Klik **"Confirm Put-Away Allocation"**.

**Expected Result:**
- Request `PATCH /api/v1/goods/:id/status` dengan status `STORED` dan `slotId` berhasil (HTTP 200 OK).
- Status barang resmi berubah menjadi `STORED`.
- Volume slot rak `COLD-A01` terisi bertambah $+3.00 \text{ m}^3$ dan sisa kapasitas berkurang secara akurat.
- Tercatat entri mutasi gudang tipe `INBOUND` pada riwayat log transaksi.
- Customer A dapat melihat lokasi slot `COLD-A01` di portalnya.

**What I should observe manually:**
- Indikator kapasitas bar di halaman rak gudang [http://localhost:3000/admin/warehouses](http://localhost:3000/admin/warehouses) meningkat secara visual.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-011
**Module:** Outbound Dispatch & Delivery Request  
**Role:** Customer (`haidar@gmail.com`) & Admin (`admin@wms.id`)  
**Scenario:** Permintaan Pengiriman Barang Keluar Gudang (*Outbound Delivery*)  
**Priority:** Critical  

**Precondition:**
- Barang `Norwegian Salmon Fillet Grade A` berstatus `STORED` di slot `COLD-A01`.
- Login sebagai Customer A (`haidar@gmail.com`).

**Steps:**
1. Buka [http://localhost:3000/customer/logistics](http://localhost:3000/customer/logistics).
2. Klik **"Create Delivery Order"**.
3. Isi data outbound:
   - Select Goods: Pilih `Norwegian Salmon Fillet Grade A (50 Box / 3.00 m³)`.
   - Destination Address: `Supermarket Grand Lucky SCBD, Jl. Jend Sudirman Kav 52, Jakarta Selatan`.
   - Delivery Date & Time: Pilih besok pukul 08:00 WIB.
   - Recipient Contact: `Pak Gunawan (081122334455)`.
4. Klik **"Submit Outbound Request"**.
5. Switch ke akun Admin (`admin@wms.id`):
   - Buka `/admin/logistics`, cari order outbound tersebut, lalu tugaskan driver `Agus Pratama` dan truk `B 9821 WMS`.

**Expected Result:**
- Delivery Order tipe `OUTBOUND_DELIVERY` dibuat dengan status `PENDING` $\rightarrow$ `DRIVER_ASSIGNED`.
- Status barang berubah menjadi `PENDING_DELIVERY` $\rightarrow$ `IN_TRANSIT_OUTBOUND`.
- Tugas otomatis muncul di dashboard driver `driver@wms.id`.

**What I should observe manually:**
- Customer dapat melacak tahapan status pengiriman secara *real-time* di stepper `/customer/logistics/tracking`.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-012
**Module:** Driver Operations — Proof of Delivery (POD)  
**Role:** Driver (`driver@wms.id`)  
**Scenario:** Driver Mengantarkan Kargo ke Tujuan & Mengunggah Bukti Pengiriman Digital (*Digital POD*)  
**Priority:** Critical  

**Precondition:**
- Order outbound berada dalam perjalanan (*Status: IN_TRANSIT*).
- Login sebagai Driver (`driver@wms.id`).

**Steps:**
1. Buka tugas outbound di [http://localhost:3000/driver/tasks/[id]](http://localhost:3000/driver/tasks/[id]).
2. Klik **"Arrived at Destination"** $\rightarrow$ Status berubah menjadi `ARRIVED`.
3. Klik tombol **"Submit Digital POD (Proof of Delivery)"**.
4. Pada form POD:
   - Recipient Name: Masukkan `Gunawan Wibisono`.
   - Recipient Signature: Buat coretan tanda tangan pada canvas digital (atau gunakan tanda tangan demo).
   - Cargo Photo Proof: Unggah foto serah terima barang (atau gunakan kamera / foto simulasi).
   - Recipient Rating: Beri rating ⭐⭐⭐⭐⭐ (5 Bintang).
   - Notes: `Kargo diterima dalam suhu -18.8°C dan kondisi beku sempurna.`
5. Klik **"Complete Outbound Delivery"**.

**Expected Result:**
- Request `POST /api/v1/logistics/orders/:id/pod` berhasil (HTTP 200 OK).
- Status Delivery Order resmi berubah menjadi `DELIVERED`.
- Status barang di database berubah menjadi `DELIVERED`.
- Kapasitas slot rak `COLD-A01` kembali dibebaskan (kapasitas terpakai berkurang $-3.00 \text{ m}^3$).
- Kendaraan driver kembali berstatus `AVAILABLE`.

**What I should observe manually:**
- Canvas tanda tangan merespons goresan kursor / sentuhan layar secara halus tanpa lag.
- Tanda tangan dan foto tersimpan dan dapat dilihat kembali di detail order.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-013
**Module:** Billing & Payment Settlement  
**Role:** Customer (`haidar@gmail.com`) & Admin (`admin@wms.id`)  
**Scenario:** Pembayaran Faktur Tagihan Sewa, Unggah Bukti Transfer, dan Verifikasi Admin  
**Priority:** Critical  

**Precondition:**
- Customer A memiliki faktur tagihan sewa berstatus `UNPAID` sebesar Rp 75.000.000.
- Login sebagai Customer A (`haidar@gmail.com`).

**Steps:**
1. Buka menu [http://localhost:3000/customer/billing](http://localhost:3000/customer/billing).
2. Klik tombol **"Pay Invoice"** pada faktur yang belum lunas.
3. Pada modal pembayaran:
   - Payment Method: Pilih **Bank Transfer (BCA Virtual Account / Mandiri)**.
   - Payment Reference: Masukkan `TRF-BCA-20260825-9921`.
   - Proof of Transfer: Unggah gambar bukti struk pembayaran (*image/png* atau simulasi URL).
   - Notes: `Pembayaran sewa cold storage 3 bulan lunas.`
4. Klik **"Submit Payment Confirmation"**.
5. Switch browser (Incognito) ke Admin (`admin@wms.id`):
   - Buka menu [http://localhost:3000/admin/billing](http://localhost:3000/admin/billing).
   - Klik tab **"Pending Verifications"**.
   - Periksa bukti transfer Customer A yang berstatus `UNDER_REVIEW`.
   - Klik **"Verify & Approve Payment"**.

**Expected Result:**
- Saat Customer submit, status pembayaran menjadi `UNDER_REVIEW` dan faktur berstatus `PENDING_PAYMENT`.
- Saat Admin approve, request `PATCH /api/v1/billing/invoices/:id/verify-payment` berhasil.
- Status faktur resmi berubah menjadi `PAID` (Lunas).
- Nomor kuitansi resmi (*Receipt Number*) diterbitkan (misal: `RCP-2026-08-XXXX`).
- Tombol **"Download Official Receipt"** aktif dan dapat diklik.

**What I should observe manually:**
- Badge status faktur berubah dari kuning (*Pending Payment*) menjadi hijau (*PAID*).
- Tagihan tidak lagi muncul di daftar tagihan jatuh tempo (*overdue*).

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-014
**Module:** Multi-Tenant Isolation & Privacy  
**Role:** Customer A (`haidar@gmail.com`) vs Customer B (`pandu@gmail.com`)  
**Scenario:** Uji Ketat Pemisahan Data Antar-Tenant (*Zero Data Leakage*)  
**Priority:** Critical  

**Precondition:**
- Customer A (`haidar@gmail.com`) memiliki barang *Salmon Sashimi* dan faktur Rp 75.000.000.
- Customer B (`pandu@gmail.com`) memiliki barang *Office Chair* dan faktur tersendiri.

**Steps:**
1. Login sebagai Customer A (`haidar@gmail.com`):
   - Buka `/customer/goods`: Pastikan hanya daftar barang Customer A yang tampil.
   - Buka `/customer/billing`: Pastikan hanya faktur tagihan Customer A yang tampil.
   - Buka `/customer/logistics/tracking`: Pastikan hanya delivery order Customer A yang tampil.
   - Catat salah satu `id` barang milik Customer B dari database jika diketahui (misal `brg-chair-002`).
   - Coba akses langsung melalui URL browser jika ada rute detail.
2. Logout, lalu Login sebagai Customer B (`pandu@gmail.com`):
   - Periksa `/customer/goods`, `/customer/billing`, dan riwayat transaksi.

**Expected Result:**
- Customer A **SAMA SEKALI TIDAK BISA MELIHAT** barang, total volume sewa, tagihan invoice, maupun rute kargo milik Customer B.
- Customer B **SAMA SEKALI TIDAK BISA MELIHAT** data milik Customer A.
- Ringkasan Dashboard pada `/customer/dashboard` menghitung utilisasi dan biaya murni berdasarkan tenant yang sedang aktif.

**What I should observe manually:**
- Verifikasi visual bahwa nama perusahaan, daftar kargo, dan histori transaksi 100% terisolasi.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

### TC-015
**Module:** Notifications & Operational Alerts  
**Role:** All Roles  
**Scenario:** Pengujian Siklus Notifikasi Real-Time, Counter Badge, dan State Read/Unread  
**Priority:** High  

**Precondition:**
- Melakukan aksi mutasi (misal: Admin menyetujui pembayaran atau menugaskan driver).

**Steps:**
1. Buka portal pengguna yang menerima notifikasi (misal Customer A).
2. Perhatikan ikon lonceng notifikasi di pojok kanan atas navbar.
3. Klik ikon lonceng untuk membuka **Notification Drawer**.
4. Klik salah satu item notifikasi untuk menandai sebagai terbaca (*Mark as Read*).
5. Klik tombol **"Mark All as Read"** di bagian atas drawer.

**Expected Result:**
- Counter badge merah pada lonceng menunjukkan jumlah notifikasi yang belum dibaca (*unread count*).
- Saat drawer dibuka, daftar notifikasi terbaru terurut dari yang paling baru (*descending by timestamp*).
- Saat diklik, warna latar item notifikasi berubah dari highlight aktif menjadi netral.
- Angka counter berkurang secara real-time dan request `PATCH /api/v1/notifications/:id/read` berhasil.
- Tombol *"Mark All as Read"* mengeset counter menjadi 0.

**What I should observe manually:**
- Animasi slide-over drawer terbuka dan tertutup secara mulus (*smooth transition*).
- Klik di luar area drawer (*click outside*) otomatis menutup drawer.

**Result:**
- [ ] PASS
- [ ] FAIL
- [ ] BLOCKED
- [ ] NOT TESTED

**Bug Notes:**  

---

## 6. GOODS & RACK CALCULATION VALIDATION GUIDE

Sebagai tester, Anda harus memverifikasi rumus matematis sistem dengan kalkulator manual:

### 📐 Rumus 1: Perhitungan Volume Barang (m³)
$$\text{Volume per Unit (m}^3) = \frac{\text{Panjang (cm)} \times \text{Lebar (cm)} \times \text{Tinggi (cm)}}{1.000.000}$$
$$\text{Total Volume (m}^3) = \text{Volume per Unit} \times \text{Jumlah Koli}$$

*Contoh Validasi:*
- Ukuran Koli: $60 \text{ cm} \times 40 \text{ cm} \times 50 \text{ cm}$
- Volume per Koli: $\frac{60 \times 40 \times 50}{1.000.000} = \frac{120.000}{1.000.000} = 0.12 \text{ m}^3$
- Jumlah: $25 \text{ Koli}$
- **Total Volume yang Wajib Ditampilkan UI:** $0.12 \times 25 = \mathbf{3.00 \text{ m}^3}$.

---

### 💰 Rumus 2: Perhitungan Biaya Sewa Gudang Bulanan (IDR)
$$\text{Biaya Bulanan} = \max(\text{Minimum Fee}, \text{Total Volume (m}^3) \times \text{Tarif per m}^3)$$

*Daftar Tarif Sistem WMS Nusantara:*
- **Cold Storage:** Rp 2.500.000 / m³ / bulan
- **Standard Dry Storage:** Rp 1.000.000 / m³ / bulan
- **Minimum Rental Fee:** Rp 500.000 / bulan

*Contoh Validasi:*
- Sewa Cold Storage: $4.5 \text{ m}^3$ selama $2 \text{ Bulan}$
- Biaya per Bulan: $4.5 \times \text{Rp } 2.500.000 = \text{Rp } 11.250.000$
- **Grand Total Invoice:** $2 \times \text{Rp } 11.250.000 = \mathbf{\text{Rp } 22.500.000}$.

---

### ⚠️ Rumus 3: Denda Keterlambatan Pembayaran (Penalty Fee)
$$\text{Denda} = \text{Subtotal Tagihan} \times 5\% \times \text{Jumlah Minggu Keterlambatan}$$

*Contoh Validasi:*
- Tagihan: Rp 10.000.000, terlambat 2 minggu melewati *Due Date*.
- **Denda Penalti:** $\text{Rp } 10.000.000 \times 0.05 \times 2 = \mathbf{\text{Rp } 1.000.000}$.
- **Total Tagihan Baru:** $\mathbf{\text{Rp } 11.000.000}$.

---

## 7. UI/UX MANUAL CHECKLIST (HUMAN-CENTERED HEURISTICS)

Gunakan checklist ini saat menjelajahi setiap halaman:

| No | Elemen UI / UX | Hal yang Harus Diperhatikan Manusia | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Konsistensi Layout** | Sidebar, Topbar, Header, dan padding konsisten antar-halaman. | [ ] PASS |
| 2 | **Hierarki Visual & Tipografi** | Ukuran font judul, subjudul, label, dan angka monospaced proporsional. | [ ] PASS |
| 3 | **Warna & Kontras Peran** | Admin bernuansa Indigo/Slate, Customer bernuansa Emerald/Teal, Driver bernuansa Amber/Dark. | [ ] PASS |
| 4 | **7 UX States** | Memeriksa apakah komponen memiliki state: *Loading (Skeleton)*, *Empty State*, *Error State*, *Success*, *Offline*, *Disabled*, dan *Form Validation*. | [ ] PASS |
| 5 | **Perilaku Hover & Kursor** | Tombol yang dapat diklik memiliki kursor *pointer* dan hover halus; label/badge data statis **TIDAK berubah warna** saat disentuh mouse. | [ ] PASS |
| 6 | **Modal & Dialogs** | Modal memiliki tombol tutup (X), backdrop blur yang rapi, dan tidak memicu overflow scroll ganda. | [ ] PASS |
| 7 | **Responsivitas Layar** | Pada layar mobile/tablet, sidebar berubah menjadi drawer hamburger yang dapat dibuka-tutup. | [ ] PASS |
| 8 | **Feedback Aksi (Toasts)** | Setiap submit mutasi memicu Toast notifikasi (Hijau: Sukses, Merah: Gagal, Biru: Info). | [ ] PASS |

---

## 8. EXPLORATORY & RESILIENCE TESTING (SKENARIO EKSTREM)

Ujilah skenario-skenario tak terduga berikut untuk membuktikan ketangguhan sistem:

1. **Double-Click Spamming:**
   - Klik tombol submit pembayaran atau put-away sebanyak 3–4 kali secara cepat.
   - *Target:* Sistem tidak boleh membuat transaksi duplikat di database (*idempotency protection*).
2. **Browser Refresh Saat Modal Terbuka:**
   - Buka modal penugasan driver, lalu tekan tombol refresh browser (`F5`).
   - *Target:* Halaman kembali ke state normal tanpa crash atau blank screen.
3. **Multi-Tab Concurrency:**
   - Buka 2 tab browser: Tab 1 Admin Logistics, Tab 2 Driver Task.
   - Selesaikan tugas di Tab 2, lalu periksa Tab 1.
   - *Target:* Data di Tab 1 dapat di-refresh dan mencerminkan status terbaru tanpa konflik.
4. **Network Interruption Simulation:**
   - Matikan koneksi internet (atau aktifkan mode *Offline* di DevTools Network Tab) saat berada di dashboard.
   - *Target:* Muncul kartu error ramah pengguna (*"Network Connection Issue — Retry Connection"*), bukan pesan crash JavaScript mentah.
5. **Direct URL Tampering:**
   - Masukkan ID acak yang tidak ada pada URL (misal `/driver/tasks/random-uuid-9999`).
   - *Target:* Muncul halaman 404 terdesain rapi (*"Page Not Found"*), bukan layar putih.

---

## 9. BUSINESS LOGIC SANITY CHECKLIST (PERTANYAAN VALIDASI PM)

Jawablah pertanyaan-pertanyaan ini untuk memastikan logika bisnis sesuai standar industri logistik:

- [ ] **Q1:** *Apakah barang langsung berstatus `STORED` saat baru tiba di gudang?*  
  **Jawaban WMS:** **TIDAK.** Barang harus melalui status `ARRIVED` $\rightarrow$ Inspeksi Fisik (*Receiving*) $\rightarrow$ baru kemudian dialokasikan ke slot rak (*Put-Away*) untuk menjadi `STORED`.
- [ ] **Q2:** *Apakah Driver memiliki izin untuk melakukan verifikasi penerimaan barang fisik di gudang?*  
  **Jawaban WMS:** **TIDAK.** Hanya Warehouse Admin yang berhak melakukan verifikasi fisik (*Inbound Receiving Verification*).
- [ ] **Q3:** *Kapan armada kendaraan truk kembali berstatus `AVAILABLE`?*  
  **Jawaban WMS:** Tepat setelah proses *Receiving* selesai (pada Inbound) atau setelah *Digital POD* diunggah (pada Outbound).
- [ ] **Q4:** *Kapan kapasitas rak gudang berkurang/bertambah?*  
  **Jawaban WMS:** Kapasitas terpakai bertambah saat aksi *Put-Away*, dan dibebaskan saat barang dikeluarkan untuk *Outbound Delivery*.
- [ ] **Q5:** *Apakah komoditas beku (Cold Storage) dapat dialokasikan ke rak Standard Dry?*  
  **Jawaban WMS:** **TIDAK.** Sistem mencegah salah zona untuk menjaga integritas kualitas rantai dingin (*Cold Chain Compliance*).

---

## 10. BUG REPORT TEMPLATE

Gunakan format ini jika Anda menemukan cacat / bug selama pengujian manual:

```markdown
### 🐛 BUG-[NO]: [Judul Ringkas Bug]

- **Module:** [Auth / Goods / Warehouse / Logistics / Billing / Notifications / UI-UX]
- **Role:** [Admin / Customer / Driver / Guest]
- **Environment:** Chrome 128 / Windows 11 / Localhost (Port 3000 & 5000)
- **Severity:** [Critical / High / Medium / Low]
- **Priority:** [P1 - Blocker / P2 - Major / P3 - Minor]

#### Steps to Reproduce:
1. Login sebagai ...
2. Navigasi ke halaman ...
3. Lakukan aksi ...
4. Klik tombol ...

#### Expected Result:
[Jelaskan apa yang seharusnya terjadi secara bisnis & UI]

#### Actual Result:
[Jelaskan apa yang terjadi saat ini di layar]

#### Evidence:
- Screenshot / Video Recording: [Lampirkan file / path]
- Console Error (F12): `[Salin teks error merah di console jika ada]`
- Network Response (F12): `[Salin status code & payload response]`

#### Business Impact:
[Dampak cacat ini terhadap operasional pengguna nyata]
```

---

## 11. SEVERITY GUIDELINES

| Severity Level | Kriteria & Dampak Bisnis | Contoh Kasus Nyata |
| :--- | :--- | :--- |
| 🔴 **Critical (Blocker)** | Sistem crash, data hilang/rusak, celah isolasi data antar-tenant bocor, atau alur utama (*Auth, Inbound, Billing*) macet total tanpa alternatif jalan keluar. | Customer A dapat melihat kargo Customer B; Pembayaran gagal diverifikasi dan memblokir seluruh workflow. |
| 🟠 **High (Major)** | Fitur utama mengalami malfungsi bisnis penting, tetapi ada alternatif manual sementara; kalkulasi angka meleset signifikan. | Kalkulasi volume koli salah hitung; Driver tidak dapat mengunggah tanda tangan POD. |
| 🟡 **Medium (Minor)** | Fungsi bisnis berjalan benar, tetapi ada cacat kosmetik yang mengganggu visual, teks bahasa salah/terpotong, atau state loading tidak konsisten. | Teks error masih berbahasa Indonesia saat mode Inggris; Badge berubah warna saat di-hover; Alignment tabel bergeser di resolusi tertentu. |
| 🟢 **Low (Trivial)** | Saran peningkatan kenyamanan (*nice-to-have*), typo minor pada teks bantuan/tooltip. | Perataan jarak margin tombol selisih 2px; Penambahan tooltip penjelasan status. |

---

## 12. URUTAN EKSEKUSI PENGUJIAN MANUAL TERBAIK

Agar pengujian manual berjalan efisien tanpa perlu berulang kali membuat data dari nol, ikuti urutan linear berikut:

```text
1. AUTH & ONBOARDING       (Register Customer Baru → Login Admin, Customer, Driver)
        │
        ▼
2. WAREHOUSE CAPACITY      (Sewa Kapasitas Cold Storage oleh Customer A)
        │
        ▼
3. BILLING INVOICE 1       (Penerbitan Faktur Sewa → Bayar → Approval Admin)
        │
        ▼
4. INBOUND GOODS REG       (Daftarkan Komoditas Cold Storage + Permintaan Pickup)
        │
        ▼
5. LOGISTICS DISPATCH      (Admin Menugaskan Driver Agus & Truk Reefer)
        │
        ▼
6. DRIVER INBOUND TRIP     (Driver Pickup → Perjalanan Transit → Tiba di Gudang)
        │
        ▼
7. RECEIVING & PUT-AWAY    (Admin Verifikasi Fisik di Dermaga → Masukkan ke Slot COLD-A01)
        │
        ▼
8. OUTBOUND DELIVERY       (Customer Buat Order Kirim → Dispatch Driver → Tiba di Tujuan)
        │
        ▼
9. DIGITAL POD             (Driver Submit Tanda Tangan & Foto Penerima → Slot Dibebaskan)
        │
        ▼
10. CROSS-TENANT CHECK     (Login Customer B → Pastikan 0% Data Customer A Terlihat)
        │
        ▼
11. EXPLORATORY & UI/UX    (Double Click, Offline Simulation, Mobile Screen, Dark Mode)
        │
        ▼
12. FINAL ACCEPTANCE SIGN-OFF
```

---

## 13. FINAL ACCEPTANCE SIGN-OFF CHECKLIST

Sebelum Project Manager menyatakan **"Functional QA PASS"** dan melangkah ke tahap *Security Testing & Deployment*, centang seluruh gerbang kualitas berikut:

- [ ] **Semua Critical Workflows (13 Test Cases Utama) Berstatus PASS.**
- [ ] **Tidak ada bug dengan severity Critical atau High yang belum terselesaikan.**
- [ ] **Multi-Tenant Isolation terbukti 100% aman (Zero Data Leakage).**
- [ ] **Kalkulasi matematis (Volume m³, Sewa Bulanan, Denda Keterlambatan) akurat 100%.**
- [ ] **RBAC Authorization berjalan ketat (Driver tidak bisa akses modul Admin/Customer).**
- [ ] **Seluruh penanganan error jaringan dan validasi form menggunakan Bahasa Inggris.**
- [ ] **Pengujian responsif pada layar desktop dan mobile berjalan mulus tanpa layout breaking.**

---

## 14. TEST RESULT SUMMARY SCORECARD

| Modul Pengujian | Total Test Cases | PASS | FAIL | BLOCKED | Status Modul |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Authentication & RBAC** | 4 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **2. Warehouse Space Rental** | 2 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **3. Goods & Inventory Management** | 3 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **4. Logistics & Fleet Dispatch** | 3 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **5. Inbound Receiving & Put-Away**| 2 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **6. Outbound Delivery & POD** | 2 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **7. Billing, Invoices & Payments**| 2 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **8. Multi-Tenant Privacy** | 1 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **9. System Notifications** | 1 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **10. UI/UX & Exploratory** | 2 | [ ] | [ ] | [ ] | *Pending Manual Run* |
| **TOTAL SCORE** | **22 Skenario** | **0** | **0** | **0** | **READY FOR UAT** |

---

*Dokumen ini siap digunakan sebagai acuan pengujian manual resmi Anda. Selamat melakukan validasi User Acceptance Testing (UAT)!*
