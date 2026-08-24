# ADR-003: API Architecture & Client-Agnostic Design

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
WMS Nusantara memiliki arsitektur multi-klien: Web Frontend (Next.js 15) yang telah selesai dikembangkan, dan Mobile Client (Kotlin Android) yang akan dikembangkan untuk pengemudi armada di lapangan. API backend harus dirancang sedemikian rupa sehingga kedua klien mengonsumsi antarmuka data yang sama tanpa ketergantungan khusus pada salah satu klien.

## Decision Drivers
1. **Client-Agnosticism:** Tidak ada perlakuan khusus untuk browser web; mobile client Android harus dapat mengonsumsi endpoint secara mulus.
2. **Predictability & Consistency:** Format response sukses dan response error yang seragam di seluruh endpoint.
3. **Automated Documentation & Contract-First:** API terdokumentasi via OpenAPI (Swagger) untuk memfasilitasi pembuatan DTO klien Android (Retrofit / Kotlinx.serialization).
4. **Resilience & Idempotency:** Perlindungan dari request berulang akibat fluktuasi sinyal mobile di lapangan.

## Considered Options

### Option 1: RESTful JSON API v1 with Global Response Envelope + OpenAPI (Swagger)
- **Kelebihan:**
  - Standar industri universal, didukung secara native oleh browser (Fetch/Axios) dan mobile (Retrofit/OkHttp).
  - Mudah di-cache, di-debug, dan diuji.
  - Swagger UI memfasilitasi pengujian interaktif mandiri.
- **Kekurangan:**
  - Masalah over-fetching/under-fetching jika tidak dirancang dengan query parameter filtering yang baik.

### Option 2: GraphQL API
- **Kelebihan:**
  - Klien dapat meminta tepat field yang dibutuhkan.
- **Kekurangan:**
  - Kompleksitas caching HTTP, rate limiting, dan overhead query execution.
  - Frontend Next.js yang sudah selesai dibangun berbasis REST Service layer; GraphQL akan memicu rework besar pada frontend.

### Option 3: gRPC (HTTP/2 Protocol Buffers)
- **Kelebihan:**
  - Sangat cepat dan payload binary kompak.
- **Kekurangan:**
  - Kurang ramah bagi Web Client standar tanpa proxy gRPC-web.

## Decision
Kami memutuskan untuk menggunakan **RESTful JSON API (Prefix `/api/v1/`)** dengan **Global Response Envelope**, **Global Exception Filter**, dan **OpenAPI / Swagger 3.0 Documentation**.

## Standard Response Contract

### Success Envelope (200 / 201)
```json
{
  "success": true,
  "message": "Operasi berhasil dieksekusi",
  "data": { },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "timestamp": "2026-08-16T19:30:00.000Z"
  }
}
```

### Error Envelope (4xx / 5xx)
```json
{
  "success": false,
  "message": "Pesan error deskriptif untuk pengguna",
  "errors": [
    { "field": "email", "message": "Email sudah digunakan" }
  ],
  "statusCode": 400,
  "timestamp": "2026-08-16T19:30:00.000Z",
  "path": "/api/v1/auth/register"
}
```

## Consequences

### Positive
- Transisi frontend dari `MockService` ke `HttpService` 100% transparan tanpa perubahan komponen UI.
- Developer Android Kotlin dapat langsung mengunduh file `swagger.json` / `openapi.json` untuk auto-generate data class.
- Error handling seragam mempermudah penanganan toast/alert di sisi web dan mobile.

### Negative
- Memerlukan konfigurasi Global Interceptor dan Global Filter di NestJS untuk membungkus seluruh response secara konsisten.
