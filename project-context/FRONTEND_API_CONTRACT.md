# FRONTEND API CONTRACT SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Spesifikasi Kontrak REST API & JSON Payload untuk Backend Development*

---

## 1. Standar Komunikasi API

### 1.1 Base URL & Format
- **Base URL:** `/api/v1`
- **Content-Type:** `application/json`
- **Authentication Header:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```

### 1.2 Format Standard Response Wrapper (JSON)
Setiap response API diharapkan mengikuti struktur konsisten:

#### Response Sukses (200 OK / 201 Created):
```json
{
  "success": true,
  "message": "Deskripsi sukses operasi",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "timestamp": "2026-08-16T19:00:00.000Z"
  }
}
```

#### Response Error (400 / 401 / 403 / 404 / 422 / 500):
```json
{
  "success": false,
  "message": "Pesan error human-readable untuk ditampilkan di UI",
  "errors": [
    {
      "field": "email",
      "message": "Format email tidak valid"
    }
  ],
  "timestamp": "2026-08-16T19:00:00.000Z"
}
```

---

## 2. Authentication & User Management Endpoints

### 2.1 Login Multi-Role
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@wms-nusantara.com",
    "password": "password123",
    "role": "ADMIN" // Optional hint ("ADMIN" | "CUSTOMER" | "DRIVER")
  }
  ```
- **Response Data (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-admin-01",
      "name": "Budi Santoso",
      "email": "admin@wms-nusantara.com",
      "role": "ADMIN",
      "phone": "0812-3456-7890",
      "avatarUrl": "https://avatar.iran.liara.run/public/boy",
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
  ```

### 2.2 Registrasi Mandiri Customer
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "name": "Hendra Prasetya",
    "email": "customer@freshfoods.id",
    "password": "SecurePassword123!",
    "phone": "0812-9988-7766",
    "companyName": "PT Fresh Foods Indonesia",
    "address": "Jl. Industri Raya No. 45, Jakarta Barat"
  }
  ```
- **Response Data (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-cust-991",
      "name": "Hendra Prasetya",
      "email": "customer@freshfoods.id",
      "role": "CUSTOMER",
      "phone": "0812-9988-7766",
      "companyName": "PT Fresh Foods Indonesia",
      "address": "Jl. Industri Raya No. 45, Jakarta Barat",
      "status": "ACTIVE",
      "createdAt": "2026-08-16T19:00:00.000Z"
    }
  }
  ```

### 2.3 Get Current User Profile (Session Check)
- **Endpoint:** `GET /api/v1/auth/me`
- **Auth:** Bearer Token
- **Response Data (200 OK):** `UserProfile` object.

### 2.4 Ganti Kata Sandi
- **Endpoint:** `POST /api/v1/auth/change-password`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword456!"
  }
  ```

---

## 3. Warehouse & Storage Slot Endpoints

### 3.1 List Fasilitas Gudang & Kapasitas
- **Endpoint:** `GET /api/v1/warehouses`
- **Auth:** Bearer Token
- **Query Params:** `?city=Jakarta&isActive=true`
- **Response Data (200 OK):**
  ```json
  [
    {
      "id": "wh-ckg-01",
      "code": "WH-CKG-01",
      "name": "Gudang Utama Cakung Logistics Hub",
      "address": "Kawasan Industri Pulo Gadung, Cakung",
      "city": "Jakarta Timur",
      "totalCapacityM3": 1200,
      "usedCapacityM3": 890,
      "slotsCount": 120,
      "occupiedSlotsCount": 89,
      "zones": {
        "standardCapacityM3": 800,
        "coldStorageCapacityM3": 400
      },
      "isActive": true,
      "managerName": "Bambang Sudirjo",
      "contactPhone": "0811-2233-4455"
    }
  ]
  ```

### 3.2 Detail Gudang & Grid Slot Rak
- **Endpoint:** `GET /api/v1/warehouses/:id`
- **Auth:** Bearer Token
- **Response Data (200 OK):** Detail warehouse beserta array `slots`:
  ```json
  {
    "id": "wh-ckg-01",
    "code": "WH-CKG-01",
    "name": "Gudang Utama Cakung Logistics Hub",
    "slots": [
      {
        "id": "slot-a-01-01",
        "warehouseId": "wh-ckg-01",
        "code": "A-01-01",
        "zone": "COLD_STORAGE",
        "capacityM3": 5.0,
        "usedM3": 4.2,
        "temperatureCelsius": -18.4,
        "humidityPercent": 65,
        "status": "OCCUPIED",
        "currentGoodsIds": ["brg-001"]
      }
    ]
  }
  ```

---

## 4. Goods & Inventory Management Endpoints

### 4.1 List Barang / Master SKU
- **Endpoint:** `GET /api/v1/goods`
- **Auth:** Bearer Token
- **Query Params:**
  - `customerId`: Filter berdasarkan ID tenant
  - `category`: `"FURNITURE" | "COLD_FOOD" | "GENERAL_ELECTRONICS" | "TEXTILE"`
  - `status`: `"STORED" | "PENDING_PICKUP" | "IN_TRANSIT" | "DELIVERED"`
  - `search`: Pencarian nama barang, barcode, atau SKU
  - `page`: Nomor halaman (default: `1`)
  - `limit`: Jumlah data per halaman (default: `10`)

### 4.2 Registrasi Barang Baru (Customer Self-Service)
- **Endpoint:** `POST /api/v1/goods`
- **Auth:** Bearer Token (Role: `CUSTOMER` / `ADMIN`)
- **Request Body:**
  ```json
  {
    "warehouseId": "wh-ckg-01",
    "name": "Daging Sapi Wagyu A5 Import",
    "category": "COLD_FOOD",
    "description": "Daging beku grade A5 suhu sub-zero",
    "dimensions": {
      "lengthCm": 50,
      "widthCm": 40,
      "heightCm": 30,
      "weightKg": 25
    },
    "quantity": 100,
    "unit": "Koli",
    "requiresColdStorage": true,
    "pickupRequired": true,
    "pickupAddress": "Jl. Supplier Raya No. 12, Bekasi",
    "pickupDate": "2026-08-20"
  }
  ```

### 4.3 Update Status Barang / Slot Allocation
- **Endpoint:** `PATCH /api/v1/goods/:id/status`
- **Auth:** Bearer Token (Role: `ADMIN`)
- **Request Body:**
  ```json
  {
    "status": "STORED",
    "slotId": "slot-a-01-01",
    "note": "Barang telah dialokasikan ke Slot Rak A-01-01 Cold Zone"
  }
  ```

---

## 5. Logistics, Fleet & Delivery Order Endpoints

### 5.1 List Delivery Orders
- **Endpoint:** `GET /api/v1/logistics/orders`
- **Auth:** Bearer Token
- **Query Params:** `?driverId=...&customerId=...&status=...&date=...`

### 5.2 Create Delivery Order Request (Outbound / Inbound)
- **Endpoint:** `POST /api/v1/logistics/orders`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "type": "DELIVERY",
    "customerId": "usr-cust-01",
    "goodsItemIds": ["brg-001"],
    "originAddress": "Gudang Utama Cakung Loading Dock 2",
    "destinationAddress": "FreshMarket Superstore BSD, Tangerang Selatan",
    "scheduledDate": "2026-08-18",
    "scheduledTimeSlot": "08:30 WIB",
    "requiresReefer": true
  }
  ```

### 5.3 Submit Digital Proof of Delivery (POD)
- **Endpoint:** `POST /api/v1/logistics/orders/:id/pod`
- **Auth:** Bearer Token (Role: `DRIVER`)
- **Request Body:**
  ```json
  {
    "recipientName": "Hendra Wijaya",
    "recipientRole": "Supervisor Receiving",
    "photoUrl": "https://storage.wms-nusantara.com/pod/do-2026-001.jpg",
    "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "customerRating": 5,
    "recipientNote": "Barang diterima dalam kondisi beku optimal, segel utuh."
  }
  ```

---

## 6. Billing & Late Penalty Endpoints

### 6.1 List Faktur Tagihan
- **Endpoint:** `GET /api/v1/billing/invoices`
- **Auth:** Bearer Token
- **Query Params:** `?customerId=...&status=UNPAID|PAID|OVERDUE`

### 6.2 Bayar Tagihan (Virtual Account / Bukti Bayar)
- **Endpoint:** `POST /api/v1/billing/invoices/:id/pay`
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "paymentMethod": "VIRTUAL_ACCOUNT",
    "paymentProofUrl": "https://storage.wms-nusantara.com/receipts/inv-001.pdf"
  }
  ```
