# REST API SPECIFICATION & CONTRACT
**Warehouse Management System (WMS Nusantara)**
*Version 1.0.0 — Client-Agnostic REST API for Web & Mobile*

---

## 1. Overview & General Conventions

- **Base URL:** `http://localhost:5000/api/v1`
- **Interactive OpenAPI / Swagger UI:** `http://localhost:5000/api/docs`
- **Swagger JSON Specification:** `http://localhost:5000/api/docs-json`
- **Authentication Scheme:** HTTP Bearer Token (JSON Web Tokens)
- **Response Format:** Pure JSON enveloped with metadata (`success`, `message`, `data`, `meta`)

---

## 2. Standard Envelope Structure

### 2.1 Success Envelope
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": {},
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/me",
    "version": "1.0.0"
  }
}
```

### 2.2 Error Envelope
```json
{
  "success": false,
  "message": "Email atau password salah",
  "data": null,
  "statusCode": 401,
  "errors": [
    {
      "field": "email",
      "message": "Format email tidak valid"
    }
  ],
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```

---

## 3. Authentication & RBAC Endpoints

### 3.1 `POST /api/v1/auth/login`
Autentikasi pengguna berdasarkan email dan password, kemudian menerbitkan token pair (Access Token & Refresh Token).

- **Access:** Public (No token required)
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "email": "admin@wms.id",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "usr-admin-1",
      "name": "Budi Santoso (Admin)",
      "email": "admin@wms.id",
      "role": "ADMIN",
      "phone": "081234567890",
      "avatarUrl": "https://images.unsplash.com/...",
      "companyName": "PT Logistik Prima Nusantara",
      "address": "Kawasan Industri Pulo Gadung, Jakarta Timur",
      "status": "ACTIVE",
      "createdAt": "2026-08-16T14:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/login"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Format input tidak valid (misal email kosong atau password < 6 karakter).
  - `401 Unauthorized`: Email/password salah atau status akun disuspend.

---

### 3.2 `POST /api/v1/auth/refresh`
Memperbarui Access Token yang telah kedaluwarsa dengan mekanisme **Token Rotation** (Refresh token lama dicabut di database dan token pair baru diterbitkan).

- **Access:** Public
- **Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Pembaruan token berhasil",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/refresh"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Refresh token tidak valid, telah kedaluwarsa, atau telah digunakan sebelumnya (replay attempt).

---

### 3.3 `POST /api/v1/auth/logout`
Mencabut refresh token pengguna dan mengakhiri sesi aktif.

- **Access:** Protected (`Bearer <access_token>`)
- **Request Body (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
*(Jika refreshToken tidak dikirimkan, semua sesi refresh token aktif milik pengguna akan dicabut).*
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Sesi berhasil diakhiri dan token berhasil dicabut",
  "data": {
    "success": true,
    "message": "Sesi berhasil diakhiri dan token berhasil dicabut"
  },
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/logout"
  }
}
```

---

### 3.4 `GET /api/v1/auth/me`
Mengambil profil data pengguna yang saat ini sedang login.

- **Access:** Protected (`Bearer <access_token>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Profil pengguna berhasil diambil",
  "data": {
    "id": "usr-admin-1",
    "name": "Budi Santoso (Admin)",
    "email": "admin@wms.id",
    "role": "ADMIN",
    "phone": "081234567890",
    "avatarUrl": "https://images.unsplash.com/...",
    "companyName": "PT Logistik Prima Nusantara",
    "address": "Kawasan Industri Pulo Gadung, Jakarta Timur",
    "status": "ACTIVE",
    "createdAt": "2026-08-16T14:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-08-16T14:15:00.000Z",
    "path": "/api/v1/auth/me"
  }
}
```

---

---

## 4. Warehouse & Storage Endpoints (`/api/v1/warehouses`)

### 4.1 `GET /api/v1/warehouses`
Mengambil daftar fasilitas gudang aktif dengan ringkasan kapasitas ($m^3$), zona penyimpanan, dan statistik utilisasi slot rak.

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `search`: Pencarian nama gudang, kode, atau kota (contoh: `?search=Cakung`)
  - `city`: Filter kota tertentu (contoh: `?city=Bandung`)
  - `isActive`: Filter boolean (contoh: `?isActive=true`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar fasilitas gudang berhasil diambil",
  "data": [
    {
      "id": "wh-jkt-central",
      "code": "WH-CKG-01",
      "name": "Gudang Utama Cakung Logistics Hub",
      "address": "Kawasan Industri Pulo Gadung Kav. 12-14",
      "city": "Jakarta Timur",
      "totalCapacityM3": 5000,
      "usedCapacityM3": 3150,
      "occupancyPercent": 63,
      "slotsCount": 6,
      "occupiedSlotsCount": 4,
      "zones": {
        "standardCapacityM3": 3500,
        "coldStorageCapacityM3": 1500,
        "heavyDutyCapacityM3": 0
      },
      "isActive": true,
      "managerName": "Hendra Wijaya",
      "contactPhone": "021-4609876",
      "createdAt": "2026-08-16T14:00:00.000Z",
      "updatedAt": "2026-08-16T14:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-08-16T14:20:00.000Z",
    "path": "/api/v1/warehouses"
  }
}
```

---

### 4.2 `GET /api/v1/warehouses/:id`
Mengambil informasi lengkap gudang tertentu beserta detail zona penyimpanan sub-zero / standar dan visualisasi grid slot rak 3D.

- **Access:** Protected (`Bearer <access_token>`)
- **Path Parameter:**
  - `id`: ID unik UUID (misal: `wh-jkt-central`) atau Kode Fasilitas (misal: `WH-CKG-01`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Detail fasilitas gudang berhasil diambil",
  "data": {
    "id": "wh-jkt-central",
    "code": "WH-CKG-01",
    "name": "Gudang Utama Cakung Logistics Hub",
    "address": "Kawasan Industri Pulo Gadung Kav. 12-14",
    "city": "Jakarta Timur",
    "totalCapacityM3": 5000,
    "usedCapacityM3": 3150,
    "occupancyPercent": 63,
    "slotsCount": 6,
    "occupiedSlotsCount": 4,
    "zones": {
      "standardCapacityM3": 3500,
      "coldStorageCapacityM3": 1500,
      "heavyDutyCapacityM3": 0
    },
    "zoneDetails": [
      {
        "id": "zone-ckg-cold",
        "name": "Zona Cold Storage Sub-Zero",
        "type": "COLD_STORAGE",
        "capacityM3": 1500,
        "usedM3": 850,
        "targetTempMin": -25,
        "targetTempMax": -18
      },
      {
        "id": "zone-ckg-std",
        "name": "Zona Standar Rak Bertingkat Lantai 1-3",
        "type": "STANDARD",
        "capacityM3": 3500,
        "usedM3": 2300,
        "targetTempMin": null,
        "targetTempMax": null
      }
    ],
    "slots": [
      {
        "id": "slot-c01",
        "warehouseId": "wh-jkt-central",
        "zoneId": "zone-ckg-cold",
        "code": "COLD-A01",
        "zone": "COLD_STORAGE",
        "capacityM3": 100,
        "usedM3": 85,
        "temperatureCelsius": -18.5,
        "humidityPercent": 85,
        "status": "OCCUPIED",
        "currentGoodsCount": 1,
        "currentGoodsIds": ["brg-001"]
      }
    ],
    "isActive": true,
    "managerName": "Hendra Wijaya",
    "contactPhone": "021-4609876",
    "createdAt": "2026-08-16T14:00:00.000Z",
    "updatedAt": "2026-08-16T14:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-08-16T14:20:00.000Z",
    "path": "/api/v1/warehouses/wh-jkt-central"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token tidak valid atau tidak disertakan.
  - `404 Not Found`: Fasilitas gudang dengan ID atau kode tersebut tidak ditemukan.

---

---

## 5. Goods & Inventory Endpoints (`/api/v1/goods`)

### 5.1 `GET /api/v1/goods`
Mengambil daftar master barang (SKU) dengan paginasi, pencarian nama/barcode, filtering kategori/status gudang, dan isolasi data per peran (Customer hanya melihat barang miliknya).

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `page`: Nomor halaman (1-based, default: `1`)
  - `limit`: Jumlah data per halaman (default: `10`, max: `100`)
  - `search`: Pencarian nama barang atau kode barcode/SKU (contoh: `?search=salmon`)
  - `category`: Filter kategori (`FURNITURE`, `COLD_FOOD`, `GENERAL_ELECTRONICS`, `TEXTILE`)
  - `status`: Filter status (`DRAFT`, `PENDING_PICKUP`, `IN_TRANSIT_INBOUND`, `INSPECTING`, `STORED`, `PENDING_DELIVERY`, `IN_TRANSIT_OUTBOUND`, `DELIVERED`, `CANCELLED`)
  - `warehouseId`: Filter ID gudang penyimpanan (contoh: `?warehouseId=wh-jkt-central`)
  - `requiresColdStorage`: Filter boolean ruang pendingin (contoh: `?requiresColdStorage=true`)
  - `customerId`: Filter ID customer pemilik (*Hanya diizinkan untuk peran ADMIN*)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Data barang berhasil diambil",
  "data": [
    {
      "id": "brg-001",
      "barcode": "BRG-2026-FROZEN-001",
      "customerId": "usr-cust-1",
      "customerName": "Siti Rahma (Customer - Fresh Foods)",
      "customerCompany": "CV Fresh Frozen Nusantara",
      "warehouseId": "wh-jkt-central",
      "warehouseName": "Gudang Utama Cakung Logistics Hub",
      "warehouseCode": "WH-CKG-01",
      "slotId": "slot-c01",
      "slotCode": "COLD-A01",
      "name": "Norwegian Salmon Fillet Grade A",
      "category": "COLD_FOOD",
      "description": "Ikan salmon beku kualitas ekspor dalam kemasan insulated box vakum.",
      "dimensions": {
        "lengthCm": 120,
        "widthCm": 80,
        "heightCm": 100,
        "volumeM3": 0.96,
        "weightKg": 450
      },
      "quantity": 30,
      "unit": "Master Box",
      "requiresColdStorage": true,
      "targetTempMin": -22,
      "targetTempMax": -18,
      "currentTemp": -19.4,
      "storageStartDate": "2026-08-01T09:00:00.000Z",
      "storageEndDate": null,
      "monthlyRentalFee": 2400000,
      "status": "STORED",
      "imageUrl": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
      "qrCodeData": "WMS://ITEM/brg-001?code=BRG-2026-FROZEN-001",
      "createdAt": "2026-08-01T09:00:00.000Z",
      "updatedAt": "2026-08-01T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 4,
    "totalPages": 1,
    "timestamp": "2026-08-16T14:30:00.000Z",
    "path": "/api/v1/goods"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token tidak valid atau tidak disertakan.

---

### 5.2 `GET /api/v1/goods/:id`
Mengambil detail lengkap barang tertentu berdasarkan ID atau Barcode, termasuk relasi fasilitas gudang, slot rak 3D, profil customer, dan histori mutasi audit status.

- **Access:** Protected (`Bearer <access_token>`)
- **Path Parameter:**
  - `id`: ID unik UUID (misal: `brg-001`) atau Barcode/SKU (misal: `BRG-2026-FROZEN-001`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Detail data barang berhasil diambil",
  "data": {
    "id": "brg-001",
    "barcode": "BRG-2026-FROZEN-001",
    "customerId": "usr-cust-1",
    "customerName": "Siti Rahma (Customer - Fresh Foods)",
    "customerCompany": "CV Fresh Frozen Nusantara",
    "warehouseId": "wh-jkt-central",
    "warehouseName": "Gudang Utama Cakung Logistics Hub",
    "warehouseCode": "WH-CKG-01",
    "slotId": "slot-c01",
    "slotCode": "COLD-A01",
    "name": "Norwegian Salmon Fillet Grade A",
    "category": "COLD_FOOD",
    "description": "Ikan salmon beku kualitas ekspor dalam kemasan insulated box vakum.",
    "dimensions": {
      "lengthCm": 120,
      "widthCm": 80,
      "heightCm": 100,
      "volumeM3": 0.96,
      "weightKg": 450
    },
    "quantity": 30,
    "unit": "Master Box",
    "requiresColdStorage": true,
    "targetTempMin": -22,
    "targetTempMax": -18,
    "currentTemp": -19.4,
    "storageStartDate": "2026-08-01T09:00:00.000Z",
    "storageEndDate": null,
    "monthlyRentalFee": 2400000,
    "status": "STORED",
    "imageUrl": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400",
    "qrCodeData": "WMS://ITEM/brg-001?code=BRG-2026-FROZEN-001",
    "createdAt": "2026-08-01T09:00:00.000Z",
    "updatedAt": "2026-08-01T09:00:00.000Z",
    "warehouse": {
      "id": "wh-jkt-central",
      "code": "WH-CKG-01",
      "name": "Gudang Utama Cakung Logistics Hub",
      "city": "Jakarta Timur"
    },
    "slot": {
      "id": "slot-c01",
      "code": "COLD-A01",
      "zone": "COLD_STORAGE",
      "temperatureCelsius": -18.5,
      "status": "OCCUPIED"
    },
    "customer": {
      "id": "usr-cust-1",
      "name": "Siti Rahma (Customer - Fresh Foods)",
      "companyName": "CV Fresh Frozen Nusantara",
      "email": "customer@freshfoods.id",
      "phone": "081809876543"
    },
    "history": [
      {
        "id": "mut-01",
        "goodsId": "brg-001",
        "status": "STORED",
        "title": "Barang Disimpan di Gudang",
        "description": "Inspeksi suhu memenuhi syarat (-19.4 C). Ditempatkan di Slot COLD-A01.",
        "actorName": "Budi Santoso (Admin)",
        "actorRole": "ADMIN",
        "location": "Slot COLD-A01, Gudang Cakung",
        "timestamp": "2026-08-01T11:45:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-08-16T14:30:00.000Z",
    "path": "/api/v1/goods/brg-001"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token tidak valid atau tidak disertakan.
  - `404 Not Found`: Barang tidak ditemukan atau bukan milik akun Anda (*Anti-IDOR protection*).

---

### 5.3 `POST /api/v1/goods`
Mendaftarkan master barang baru (SKU) dengan kalkulasi volume kubikasi server-side ($P \times L \times T / 10^6 \times Qty$), penentuan tarif sewa bulanan otomatis, dan penjanaan barcode / QR unik.

- **Access:** Protected (`Bearer <access_token>`)
- **Request Body:**
```json
{
  "name": "Frozen Tuna Loin Export Quality",
  "category": "COLD_FOOD",
  "description": "Tuna beku grade sashimi kemasan karton vacuum.",
  "lengthCm": 100,
  "widthCm": 50,
  "heightCm": 40,
  "weightKg": 250,
  "quantity": 5,
  "unit": "Carton Box",
  "requiresColdStorage": true,
  "warehouseId": "wh-jkt-central",
  "pickupRequired": true,
  "pickupAddress": "Pelabuhan Perikanan Muara Baru Kav. 5, Jakarta Utara"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Barang berhasil didaftarkan ke sistem",
  "data": {
    "id": "brg-7a8b9c1d",
    "barcode": "BRG-2026-FROZEN-A1B2C3",
    "customerId": "usr-cust-1",
    "customerName": "Siti Rahma (Customer - Fresh Foods)",
    "customerCompany": "CV Fresh Frozen Nusantara",
    "warehouseId": "wh-jkt-central",
    "warehouseName": "Gudang Utama Cakung Logistics Hub",
    "warehouseCode": "WH-CKG-01",
    "slotId": null,
    "slotCode": null,
    "name": "Frozen Tuna Loin Export Quality",
    "category": "COLD_FOOD",
    "description": "Tuna beku grade sashimi kemasan karton vacuum.",
    "dimensions": {
      "lengthCm": 100,
      "widthCm": 50,
      "heightCm": 40,
      "volumeM3": 1,
      "weightKg": 250
    },
    "quantity": 5,
    "unit": "Carton Box",
    "requiresColdStorage": true,
    "targetTempMin": -22,
    "targetTempMax": -18,
    "currentTemp": -19.4,
    "storageStartDate": "2026-08-16T14:40:00.000Z",
    "storageEndDate": null,
    "monthlyRentalFee": 2500000,
    "status": "PENDING_PICKUP",
    "imageUrl": null,
    "qrCodeData": "WMS://ITEM/BRG-2026-FROZEN-A1B2C3?wh=WH-CKG-01",
    "createdAt": "2026-08-16T14:40:00.000Z",
    "updatedAt": "2026-08-16T14:40:00.000Z",
    "warehouse": {
      "id": "wh-jkt-central",
      "code": "WH-CKG-01",
      "name": "Gudang Utama Cakung Logistics Hub",
      "city": "Jakarta Timur"
    },
    "slot": null,
    "customer": {
      "id": "usr-cust-1",
      "name": "Siti Rahma (Customer - Fresh Foods)",
      "companyName": "CV Fresh Frozen Nusantara",
      "email": "customer@freshfoods.id",
      "phone": "081809876543"
    },
    "history": [
      {
        "id": "mut-02",
        "goodsId": "brg-7a8b9c1d",
        "status": "PENDING_PICKUP",
        "title": "Permintaan Penjemputan Diajukan",
        "description": "Customer mengajukan input barang dan meminta penjemputan armada WMS ke alamat: Pelabuhan Perikanan Muara Baru Kav. 5, Jakarta Utara.",
        "actorName": "Siti Rahma (Customer - Fresh Foods)",
        "actorRole": "CUSTOMER",
        "location": "Pelabuhan Perikanan Muara Baru Kav. 5, Jakarta Utara",
        "timestamp": "2026-08-16T14:40:00.000Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-08-16T14:40:00.000Z",
    "path": "/api/v1/goods"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Validasi dimensi/kuantitas gagal.
  - `401 Unauthorized`: Token tidak valid atau tidak disertakan.
  - `404 Not Found`: Fasilitas gudang atau Customer tidak ditemukan.

---

### 5.4 `PATCH /api/v1/goods/:id/status`
Memperbarui status siklus penyimpanan barang dalam alur state machine WMS yang terkontrol, dilengkapi alokasi slot rak, manajemen kapasitas gudang atomik, dan pencatatan jejak audit mutasi.

- **Access:** Protected (`Bearer <access_token>`)
- **Path Parameter:**
  - `id`: ID unik UUID barang atau Barcode
- **Request Body:**
```json
{
  "status": "STORED",
  "slotId": "slot-c03",
  "note": "Inspeksi suhu memenuhi syarat (-19.0 C). Ditempatkan di Slot COLD-A03.",
  "location": "Slot COLD-A03, Gudang Cakung"
}
```
- **Alur State Machine & Otorisasi Peran:**
  - `DRAFT` $\to$ `PENDING_PICKUP` (Customer / Admin)
  - `PENDING_PICKUP` $\to$ `IN_TRANSIT_INBOUND` (Driver / Admin)
  - `IN_TRANSIT_INBOUND` $\to$ `INSPECTING` (Admin)
  - `INSPECTING` $\to$ `STORED` (Admin - *memerlukan alokasi slot rak dan memverifikasi kapasitas*)
  - `STORED` $\to$ `PENDING_DELIVERY` (Customer / Admin)
  - `PENDING_DELIVERY` $\to$ `IN_TRANSIT_OUTBOUND` (Driver / Admin)
  - `IN_TRANSIT_OUTBOUND` $\to$ `DELIVERED` (Driver / Admin - *membebaskan kapasitas slot rak*)
  - `DRAFT` / `PENDING_PICKUP` $\to$ `CANCELLED` (Customer / Admin)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Status barang berhasil diperbarui",
  "data": {
    "id": "brg-7a8b9c1d",
    "status": "STORED",
    "slotId": "slot-c03",
    "slotCode": "COLD-A03"
  },
  "meta": {
    "timestamp": "2026-08-16T14:40:00.000Z",
    "path": "/api/v1/goods/brg-7a8b9c1d/status"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Transisi status melompati state machine yang diizinkan atau kapasitas slot rak terlampaui.
  - `401 Unauthorized`: Token tidak valid.
  - `403 Forbidden`: Peran akun tidak berhak melakukan perubahan status tersebut.
  - `404 Not Found`: Barang atau slot rak tidak ditemukan.

---

## 6. Logistics & Fleet Endpoints (`/api/v1/logistics`)

### 6.1 `GET /api/v1/logistics/vehicles`
Mengambil direktori armada truk WMS (Reefer Truck, Box Truck, Blind Van, Wing Box) dengan rincian kapasitas muatan kg/$m^3$, status kesiapan, dan driver yang ditugaskan.

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `type`: Filter tipe kendaraan (`VAN`, `BOX_TRUCK_SMALL`, `REEFER_TRUCK`, `WING_BOX_LARGE`)
  - `status`: Filter status (`AVAILABLE`, `IN_SERVICE`, `MAINTENANCE`)
  - `hasRefrigeration`: Filter ketersediaan unit pendingin (`true` / `false`)
  - `search`: Pencarian plat nomor, nama kendaraan, atau kota pangkalan
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar armada kendaraan berhasil diambil",
  "data": [
    {
      "id": "veh-01",
      "plateNumber": "B 9821 WMS",
      "name": "Isuzu Giga Reefer Cold Truck 5T",
      "type": "REEFER_TRUCK",
      "maxWeightKg": 5000,
      "maxVolumeM3": 18.5,
      "hasRefrigeration": true,
      "minTempCelsius": -25,
      "status": "AVAILABLE",
      "currentDriverId": "usr-driver-1",
      "currentDriverName": "Agus Pratama (Driver)",
      "currentDriverPhone": "085711223344",
      "locationCity": "Jakarta Timur (Cakung Logistics Hub)",
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2026-08-16T14:48:00.000Z",
    "path": "/api/v1/logistics/vehicles"
  }
}
```

---

### 6.2 `POST /api/v1/logistics/vehicles/assign`
Menugaskan pengemudi resmi (Driver) ke unit kendaraan operasional (*Hanya diizinkan untuk Admin*).

- **Access:** Protected (`Bearer <access_token>` - Admin only)
- **Request Body:**
```json
{
  "vehicleId": "veh-01",
  "driverId": "usr-driver-1"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Penugasan driver ke kendaraan berhasil",
  "data": {
    "id": "veh-01",
    "plateNumber": "B 9821 WMS",
    "name": "Isuzu Giga Reefer Cold Truck 5T",
    "type": "REEFER_TRUCK",
    "status": "IN_SERVICE",
    "currentDriverId": "usr-driver-1",
    "currentDriverName": "Agus Pratama (Driver)",
    "locationCity": "Jakarta Timur (Cakung Logistics Hub)"
  }
}
```

---

### 6.3 `GET /api/v1/logistics/orders`
Mengambil daftar surat jalan pengiriman (Delivery Order) dengan paginasi, filter status, dan isolasi per peran.

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `page`: Nomor halaman (default: `1`)
  - `limit`: Jumlah data per halaman (default: `10`)
  - `status`: Filter status pengiriman (`PENDING_ASSIGNMENT`, `DRIVER_ASSIGNED`, `EN_ROUTE_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `ARRIVED_DESTINATION`, `DELIVERED`, `CONFIRMED`, `DELAYED`, `CANCELLED`)
  - `type`: Filter tipe (`PICKUP` / `DELIVERY`)
  - `scheduledDate`: Filter tanggal (format `YYYY-MM-DD`)
  - `search`: Pencarian nomor surat jalan, komoditas kargo, atau kota asal/tujuan
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar delivery order berhasil diambil",
  "data": [
    {
      "id": "ord-01",
      "orderNumber": "ORD-2026-092",
      "type": "PICKUP",
      "customerId": "usr-cust-1",
      "customerName": "Siti Rahma (Customer - Fresh Foods)",
      "customerPhone": "081809876543",
      "goodsItemIds": ["brg-001"],
      "goodsSummary": "30x Norwegian Salmon Fillet Grade A",
      "totalVolumeM3": 0.96,
      "totalWeightKg": 450,
      "requiresReefer": true,
      "originAddress": "Kavling Cold Chain Sudirman Kav. 21",
      "originCity": "Jakarta Selatan",
      "destinationAddress": "Kawasan Industri Pulo Gadung Kav. 12-14",
      "destinationCity": "Jakarta Timur",
      "scheduledDate": "2026-08-01",
      "scheduledTimeSlot": "08:00 - 12:00 WIB",
      "driverId": "usr-driver-1",
      "driverName": "Agus Pratama (Driver)",
      "vehiclePlate": "B 9821 WMS",
      "vehicleType": "REEFER_TRUCK",
      "status": "IN_TRANSIT",
      "estimatedDurationMins": 60,
      "distanceKm": 28.5
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "timestamp": "2026-08-16T14:48:00.000Z",
    "path": "/api/v1/logistics/orders"
  }
}
```

---

### 6.4 `POST /api/v1/logistics/orders`
Membuat Surat Jalan / Delivery Order baru dengan kalkulasi volume & berat total, serta validasi wajib armada Reefer Truck untuk komoditas Cold Storage.

- **Access:** Protected (`Bearer <access_token>`)
- **Request Body:**
```json
{
  "type": "PICKUP",
  "goodsItemIds": ["brg-001"],
  "originAddress": "Kavling Cold Chain Sudirman Kav. 21",
  "originCity": "Jakarta Selatan",
  "destinationAddress": "Kawasan Industri Pulo Gadung Kav. 12-14",
  "destinationCity": "Jakarta Timur",
  "scheduledDate": "2026-08-01",
  "scheduledTimeSlot": "08:00 - 12:00 WIB",
  "vehicleId": "veh-01",
  "driverId": "usr-driver-1",
  "distanceKm": 28.5,
  "estimatedDurationMins": 60
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Delivery order berhasil dibuat",
  "data": {
    "id": "ord-7b8c9d0e",
    "orderNumber": "ORD-2026-E1F2A3",
    "type": "PICKUP",
    "customerId": "usr-cust-1",
    "status": "DRIVER_ASSIGNED",
    "requiresReefer": true,
    "totalVolumeM3": 0.96,
    "totalWeightKg": 450,
    "goodsSummary": "30x Norwegian Salmon Fillet Grade A"
  }
}
```

---

### 6.5 `PATCH /api/v1/logistics/orders/:id/status`
Memperbarui status pengiriman dalam alur State Machine logistik.

- **Access:** Protected (`Bearer <access_token>` - Driver / Admin)
- **Request Body:**
```json
{
  "status": "ARRIVED_DESTINATION",
  "isDelayed": false
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Status delivery order berhasil diperbarui",
  "data": {
    "id": "ord-7b8c9d0e",
    "status": "ARRIVED_DESTINATION"
  }
}
```

---

### 6.6 `POST /api/v1/logistics/orders/:id/pod`
Mengunggah Bukti Serah Terima Digital POD (Tanda tangan digital penerima, foto kargo MinIO/S3, dan rating driver). Menyelesaikan pengiriman (`DELIVERED`) dan membebaskan armada truk.

- **Access:** Protected (`Bearer <access_token>`)
- **Request Body:**
```json
{
  "proofOfDeliveryUrl": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
  "recipientName": "Bpk. Ahmad Subarjo",
  "recipientSignature": "data:image/svg+xml;utf8,<svg>signature</svg>",
  "driverRating": 5.0
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Bukti serah terima Digital POD berhasil diunggah",
  "data": {
    "id": "ord-7b8c9d0e",
    "status": "DELIVERED",
    "proofOfDeliveryUrl": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500",
    "recipientName": "Bpk. Ahmad Subarjo",
    "driverRating": 5.0,
    "confirmedByDriver": true
  }
}
```

---

## 7. Billing & Invoices Endpoints (`/api/v1/billing`)

### 7.1 `GET /api/v1/billing/invoices`
Mengambil daftar faktur tagihan sewa bulanan dengan paginasi, filter status (`UNPAID`, `PAID`, `OVERDUE`), kalkulasi denda keterlambatan 5%/minggu otomatis, dan isolasi tenant (Customer hanya melihat faktur miliknya).

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `page`: Nomor halaman (default: `1`)
  - `limit`: Jumlah data per halaman (default: `10`)
  - `status`: Filter status (`UNPAID`, `PENDING_VERIFICATION`, `PAID`, `OVERDUE`, `CANCELLED`)
  - `billingMonth`: Filter periode bulan tagihan (contoh: `?billingMonth=Agustus 2026`)
  - `customerId`: Filter ID customer pemilik (*Hanya diizinkan untuk peran ADMIN*)
  - `sortBy`: Pengurutan berdasarkan `dueDate`, `issueDate`, `createdAt`, `totalAmount`
  - `sortOrder`: Arah pengurutan `asc` / `desc` (default: `desc`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar faktur tagihan berhasil diambil",
  "data": [
    {
      "id": "inv-001",
      "invoiceNumber": "INV-2026-08-001",
      "customerId": "usr-cust-1",
      "customerName": "Siti Rahma (Customer - Fresh Foods)",
      "customerCompany": "CV Fresh Frozen Nusantara",
      "customerEmail": "customer@freshfoods.id",
      "billingMonth": "Agustus 2026",
      "issueDate": "2026-08-01T00:00:00.000Z",
      "dueDate": "2026-08-10T23:59:59.000Z",
      "paidDate": null,
      "subtotal": 7440000,
      "penaltyFee": 372000,
      "totalAmount": 7812000,
      "status": "OVERDUE",
      "paymentMethod": null,
      "paymentProofUrl": null,
      "verifiedByAdminId": null,
      "verifiedAt": null,
      "daysOverdue": 7,
      "overdueWeeks": 1,
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-17T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "timestamp": "2026-08-17T10:00:00.000Z",
    "path": "/api/v1/billing/invoices"
  }
}
```

---

### 7.2 `GET /api/v1/billing/invoices/:id`
Mengambil detail lengkap faktur tagihan beserta rincian item SKU/volume kargo yang disewa, tarif per $m^3$, histori verifikasi, dan data bukti transfer.

- **Access:** Protected (`Bearer <access_token>`)
- **Path Parameter:**
  - `id`: ID unik UUID faktur atau Nomor Faktur (misal: `INV-2026-08-001`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Detail faktur tagihan berhasil diambil",
  "data": {
    "id": "inv-001",
    "invoiceNumber": "INV-2026-08-001",
    "customerId": "usr-cust-1",
    "customerName": "Siti Rahma (Customer - Fresh Foods)",
    "customerCompany": "CV Fresh Frozen Nusantara",
    "customerEmail": "customer@freshfoods.id",
    "billingMonth": "Agustus 2026",
    "issueDate": "2026-08-01T00:00:00.000Z",
    "dueDate": "2026-08-10T23:59:59.000Z",
    "paidDate": null,
    "subtotal": 7440000,
    "penaltyFee": 372000,
    "totalAmount": 7812000,
    "status": "OVERDUE",
    "paymentMethod": null,
    "paymentProofUrl": null,
    "verifiedByAdminId": null,
    "verifiedAt": null,
    "daysOverdue": 7,
    "overdueWeeks": 1,
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-17T00:00:00.000Z",
    "customer": {
      "id": "usr-cust-1",
      "name": "Siti Rahma (Customer - Fresh Foods)",
      "companyName": "CV Fresh Frozen Nusantara",
      "email": "customer@freshfoods.id",
      "phone": "081809876543"
    },
    "verifiedByAdminName": null,
    "items": [
      {
        "id": "inv-item-1",
        "goodsId": "brg-001",
        "description": "Sewa Cold Storage (Slot COLD-A01) - 0.96 m3",
        "goodsName": "Norwegian Salmon Fillet Grade A",
        "volumeM3": 0.96,
        "ratePerM3": 2500000,
        "subtotal": 2400000
      }
    ]
  },
  "meta": {
    "timestamp": "2026-08-17T10:00:00.000Z",
    "path": "/api/v1/billing/invoices/inv-001"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Token tidak valid atau tidak disertakan.
  - `404 Not Found`: Faktur tagihan tidak ditemukan atau bukan milik akun Anda (*Anti-IDOR protection*).

---

### 7.3 `POST /api/v1/billing/invoices/:id/pay`
Menyerahkan bukti transfer pembayaran faktur tagihan (VA/Transfer/QRIS). Memvalidasi kecocokan nominal transfer secara presisi di server dan mengubah status faktur menjadi `PENDING_VERIFICATION`.

- **Access:** Protected (`Bearer <access_token>`)
- **Path Parameter:**
  - `id`: ID unik UUID faktur atau Nomor Faktur
- **Request Body:**
```json
{
  "paymentMethod": "VIRTUAL_ACCOUNT",
  "paymentProofUrl": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
  "amount": 7812000,
  "paymentReference": "VA-BCA-9920192831",
  "notes": "Pelunasan tagihan sewa Cold Storage periode Agustus 2026"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Bukti pembayaran berhasil diserahkan dan menunggu verifikasi Admin",
  "data": {
    "id": "inv-001",
    "invoiceNumber": "INV-2026-08-001",
    "status": "PENDING_VERIFICATION",
    "paymentMethod": "VIRTUAL_ACCOUNT",
    "paymentProofUrl": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
    "totalAmount": 7812000
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Nominal pembayaran tidak sesuai dengan total kewajiban tagihan atau tagihan sudah lunas / sedang dalam verifikasi.
  - `404 Not Found`: Faktur tidak ditemukan.

---

### 7.4 `PATCH /api/v1/billing/invoices/:id/verify`
Memproses verifikasi bukti transfer pembayaran faktur oleh Admin (*Admin Only*). Jika disetujui (`VERIFY`), status faktur berubah menjadi `PAID`. Jika ditolak (`REJECT`), status faktur kembali ke `UNPAID` atau `OVERDUE`.

- **Access:** Protected (`Bearer <access_token>` - Admin only)
- **Path Parameter:**
  - `id`: ID unik UUID faktur atau Nomor Faktur
- **Request Body:**
```json
{
  "action": "VERIFY",
  "note": "Dana transfer telah terverifikasi masuk ke rekening operasional BCA WMS"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Verifikasi pembayaran faktur berhasil diproses",
  "data": {
    "id": "inv-001",
    "invoiceNumber": "INV-2026-08-001",
    "status": "PAID",
    "paidDate": "2026-08-17T10:00:00.000Z",
    "verifiedByAdminName": "Budi Santoso (Admin)"
  }
}
```
- **Error Responses:**
  - `403 Forbidden`: Hanya Admin yang berhak memproses verifikasi pembayaran.
  - `404 Not Found`: Faktur tidak ditemukan.

---

## 8. IoT Telemetry & Monitoring Endpoints (`/api/v1/telemetry`)

### 8.1 `POST /api/v1/telemetry/ingest`
Menerima dan mencatat pembacaan sensor telemetri suhu dan kelembaban IoT dari slot Cold Storage gudang (`slotId`) atau kargo armada Reefer Truck (`vehicleId`).
Otomatis mendeteksi anomali suhu jika $> -18.0^\circ\text{C}$, menyinkronkan suhu aktual pada slot dan kargo barang yang tersimpan, serta menerbitkan notifikasi peringatan dini (*alert notification*) secara atomik.

- **Access:** Protected (`Bearer <access_token>`)
- **Request Body:**
```json
{
  "slotId": "slot-c01",
  "temperatureCelsius": -19.4,
  "humidityPercent": 85.0,
  "recordedAt": "2026-08-17T10:00:00.000Z"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Data sensor telemetri berhasil dicatat",
  "data": {
    "id": "1",
    "slotId": "slot-c01",
    "slotCode": "COLD-A01",
    "warehouseName": "Gudang Utama Cakung Logistics Hub",
    "vehicleId": null,
    "vehiclePlate": null,
    "temperatureCelsius": -19.4,
    "humidityPercent": 85.0,
    "isAnomaly": false,
    "recordedAt": "2026-08-17T10:00:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Parameter `slotId` atau `vehicleId` tidak disertakan, atau nilai suhu di luar jangkauan yang valid.
  - `404 Not Found`: ID slot atau kendaraan tidak ditemukan di database.

---

### 8.2 `GET /api/v1/telemetry/monitoring`
Mengambil ringkasan data *live cold chain monitoring feed* untuk seluruh fasilitas pergudangan Cold Storage dan armada Reefer Truck, termasuk status kondisi kesehatan rantai pendingin (`SAFE` jika $\le -18^\circ\text{C}$, `WARNING` jika $-18^\circ\text{C} < T \le -15^\circ\text{C}$, dan `CRITICAL` jika $> -15^\circ\text{C}$).

- **Access:** Protected (`Bearer <access_token>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Data live monitoring telemetri berhasil diambil",
  "data": {
    "summary": {
      "totalMonitoredSensors": 4,
      "activeAnomaliesCount": 0,
      "coldStorageSafeCount": 3,
      "coldStorageWarningCount": 1,
      "coldStorageCriticalCount": 0,
      "averageColdTempCelsius": -19.2
    },
    "slots": [
      {
        "slotId": "slot-c01",
        "slotCode": "COLD-A01",
        "warehouseId": "wh-jkt-central",
        "warehouseName": "Gudang Utama Cakung Logistics Hub",
        "warehouseCode": "WH-CKG-01",
        "currentTempCelsius": -19.4,
        "humidityPercent": 85.0,
        "status": "OCCUPIED",
        "condition": "SAFE",
        "goodsCount": 1,
        "storedGoodsNames": [
          "Norwegian Salmon Fillet Grade A"
        ]
      }
    ],
    "vehicles": [
      {
        "vehicleId": "veh-01",
        "plateNumber": "B 9821 WMS",
        "name": "Isuzu Giga Reefer Cold Truck 5T",
        "currentDriverName": "Agus Pratama (Driver)",
        "currentTempCelsius": -20.2,
        "minTempCelsius": -25.0,
        "condition": "SAFE",
        "status": "AVAILABLE"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-08-17T10:00:00.000Z",
    "path": "/api/v1/telemetry/monitoring"
  }
}
```

---

### 8.3 `GET /api/v1/telemetry/logs`
Mengambil riwayat log pembacaan sensor IoT dengan paginasi, filter rentang tanggal, slot/kendaraan, dan anomali suhu.

- **Access:** Protected (`Bearer <access_token>`)
- **Query Parameters (Optional):**
  - `page`: Nomor halaman (default: `1`)
  - `limit`: Jumlah data per halaman (default: `20`)
  - `slotId`: Filter ID slot gudang
  - `vehicleId`: Filter ID kendaraan armada
  - `isAnomaly`: Filter flag anomali suhu (`true` / `false`)
  - `startDate`: Filter awal rentang waktu (ISO 8601)
  - `endDate`: Filter akhir rentang waktu (ISO 8601)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Daftar log telemetri berhasil diambil",
  "data": [
    {
      "id": "1",
      "slotId": "slot-c01",
      "slotCode": "COLD-A01",
      "warehouseName": "Gudang Utama Cakung Logistics Hub",
      "vehicleId": null,
      "vehiclePlate": null,
      "temperatureCelsius": -19.4,
      "humidityPercent": 85.0,
      "isAnomaly": false,
      "recordedAt": "2026-08-17T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "timestamp": "2026-08-17T10:00:00.000Z",
    "path": "/api/v1/telemetry/logs"
  }
}
```

---

## 9. Akun Uji Coba Development (Seeded Credentials)

| Role | Email | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@wms.id` | `Password123!` | Pengelola fasilitas pergudangan dan verifikasi tarif |
| **CUSTOMER** | `customer@freshfoods.id` | `Password123!` | Penyewa Cold Storage (CV Fresh Frozen Nusantara) |
| **CUSTOMER** | `michael@megafurniture.co.id` | `Password123!` | Penyewa Rak Standar (PT Mega Furniture Indo) |
| **DRIVER** | `driver@wms.id` | `Password123!` | Pengemudi Armada Reefer Truck (SIM B2) |
| **DRIVER** | `dedi.driver@wms.id` | `Password123!` | Pengemudi Armada Box Truck Hub Bandung |






