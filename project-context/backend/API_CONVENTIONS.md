# API CONVENTIONS & CONTRACT STANDARDS
**Warehouse Management System (WMS Nusantara)**
*Standar Format Request, Response, Validasi, dan Error Handling bagi Web & Mobile Client*

---

## 1. Prinsip Utama (Client-Agnostic Standards)

Seluruh endpoint REST API WMS Nusantara dirancang agar:
1. **Stateless:** Mengandalkan HTTP Authorization Header `Bearer <token>`.
2. **Platform-Independent:** Tidak mengandung abstraksi HTML atau dependensi browser; seluruh payload adalah JSON murni yang mudah diparsing oleh Next.js Fetch API dan Android Retrofit.
3. **Deterministik:** Struktur JSON konsisten untuk setiap kemungkinan response (sukses, error validasi, unauthorized, server error).

---

## 2. Struktur Format Response Baku (Envelope Specification)

### 2.1 Standard Success Response Envelope (HTTP 200 / 201)
Setiap response sukses dibungkus oleh `TransformResponseInterceptor` dengan format:
```json
{
  "success": true,
  "message": "Deskripsi operasi berhasil",
  "data": {
    "id": "usr-uuid-001",
    "name": "Budi Santoso",
    "role": "ADMIN"
  },
  "meta": {
    "timestamp": "2026-08-16T19:30:00.000Z",
    "path": "/api/v1/users/me",
    "correlationId": "req-uuid-9876"
  }
}
```

### 2.2 Standard Paginated List Response Envelope (HTTP 200)
Untuk endpoint list (`/goods`, `/warehouses`, `/logistics/orders`, `/invoices`):
```json
{
  "success": true,
  "message": "Data list berhasil diambil",
  "data": [
    { "id": "brg-001", "name": "Wagyu A5" },
    { "id": "brg-002", "name": "Frozen Salmon" }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "timestamp": "2026-08-16T19:30:00.000Z",
    "path": "/api/v1/goods?page=1&limit=10",
    "correlationId": "req-uuid-9876"
  }
}
```

### 2.3 Standard Error Response Envelope (HTTP 4xx / 5xx)
Setiap error ditangani oleh `GlobalExceptionFilter` dengan format:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    {
      "field": "dimensions.lengthCm",
      "message": "dimensions.lengthCm must be a positive number"
    },
    {
      "field": "quantity",
      "message": "quantity must not be less than 1"
    }
  ],
  "meta": {
    "timestamp": "2026-08-16T19:30:00.000Z",
    "path": "/api/v1/goods",
    "correlationId": "req-uuid-9876"
  },
  "statusCode": 422
}
```

---

## 3. Query Parameter Standar (Filtering, Searching & Pagination)

| Parameter | Tipe Data | Default | Keterangan |
| :--- | :---: | :---: | :--- |
| `page` | Integer | `1` | Nomor halaman (1-indexed). |
| `limit` | Integer | `10` | Jumlah data per halaman (Maksimal `100`). |
| `search` | String | `null` | Pencarian teks pada barcode, nama, nomor DO, nomor faktur. |
| `sortBy` | String | `createdAt` | Nama kolom acuan pengurutan. |
| `sortOrder`| String | `desc` | Arah pengurutan: `asc` atau `desc`. |

---

## 4. HTTP Headers Standar

| Header Name | Arah | Wajib | Keterangan |
| :--- | :---: | :---: | :--- |
| `Authorization` | Request | Ya (Protected) | Format: `Bearer <JWT_ACCESS_TOKEN>` |
| `Content-Type` | Request | Ya | Format: `application/json` atau `multipart/form-data` |
| `x-correlation-id`| Req / Res | Opsional | Unique Request Trace ID untuk distributed logging. |
| `x-idempotency-key`| Request | Opsional | UUID unik untuk mencegah duplikasi transaksi di jaringan mobile. |
