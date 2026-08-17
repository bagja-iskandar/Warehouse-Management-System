# ADR-001: Backend Framework Selection

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
Sistem Warehouse Management System (WMS Nusantara) membutuhkan backend service yang tangguh, modular, mudah diuji, dan mampu menangani proses bisnis kompleks seperti alokasi slot 3D, verifikasi rantai dingin (*cold chain telemetry*), dispatching armada logistik, dan otomasi perhitungan penagihan serta denda.

Backend harus dibangun dengan standar rekayasa modern yang memiliki ekosistem kuat, dukungan TypeScript kelas satu, dan kemampuan integrasi client-agnostic (Next.js Web, Kotlin Android, dan IoT devices).

## Decision Drivers
1. **Dukungan TypeScript Strict End-to-End:** Menjaga keselarasan tipe data domain dari frontend TypeScript ke backend.
2. **Arsitektur Modular & Dependency Injection:** Memisahkan concern antar bounded context (Auth, Warehouse, Goods, Logistics, Billing, Telemetry).
3. **Standarisasi Ekosistem & Best Practices:** Memiliki integrasi bawaan untuk DTO validation, Swagger/OpenAPI, guards, interceptors, dan exception filters.
4. **Maintainability & Testability:** Kemudahan pembuatan unit test, integration test, dan E2E test dengan mocking terstruktur.
5. **Kesiapan Skalabilitas:** Siap berevolusi dari modular monolith ke microservices jika volume transaksi pergudangan meningkat.

## Considered Options

### Option 1: NestJS (Node.js LTS + TypeScript)
- **Kelebihan:**
  - Arsitektur berbasis modul dan dependency injection out-of-the-box (mirip Angular / Spring Boot).
  - Integrasi kelas satu dengan TypeScript, Prisma ORM, OpenAPI/Swagger, `@nestjs/passport`, dan `@nestjs/throttler`.
  - Struktur kode terstandarisasi, meminimalkan *architectural drift*.
  - Ekosistem pengujian komprehensif menggunakan Jest.
- **Kekurangan:**
  - Overhead abstraksi lebih tinggi dibandingkan Express polos.
  - Learning curve konsep decorator dan DI container.

### Option 2: Express.js (Node.js + TypeScript)
- **Kelebihan:**
  - Sangat ringan, fleksibel, dan minimalis.
  - Familiar bagi hampir seluruh engineer Node.js.
- **Kekurangan:**
  - Tidak memiliki struktur arsitektur baku, rentan spaghetti code pada proyek skala menengah-besar.
  - Harus merakit manual dependensi DI, validasi DTO, OpenAPI generation, dan middleware handling.

### Option 3: Go (Golang + Gin / Echo)
- **Kelebihan:**
  - Performa sangat tinggi dan konsumsi memori rendah.
  - Binary kompilasi tunggal mandiri.
- **Kekurangan:**
  - Ekosistem TypeScript terputus (tidak dapat berbagi tipe atau pemahaman domain langsung dengan frontend).
  - Kecepatan iterasi fitur lebih lambat untuk domain bisnis yang dinamis.

## Decision
Kami memutuskan untuk menggunakan **NestJS** dengan **Node.js LTS** dan **TypeScript (Strict Mode)** sebagai framework utama backend WMS Nusantara.

## Rationale
NestJS menyediakan struktur enterprise yang matang dengan pola Clean Architecture / Layered Architecture secara native. Fitur *Dependency Injection*, *Guards* (untuk RBAC), *Pipes* (untuk validasi DTO otomatis via `class-validator`), dan auto-generated *OpenAPI Swagger documentation* sangat krusial untuk memastikan backend bersifat client-agnostic dan terdokumentasi sempurna bagi pengembang mobile Android Kotlin.

## Consequences

### Positive
- Struktur proyek seragam dan terorganisir per modul domain (`AuthModule`, `WarehouseModule`, `GoodsModule`, `LogisticsModule`, `BillingModule`, `TelemetryModule`).
- Swagger/OpenAPI spec dapat di-generate otomatis dari controller dan DTO.
- Validasi payload request otomatis dengan respon error yang konsisten.
- Pengujian unit dan integrasi mudah dilakukan melalui dependency injection container NestJS.

### Negative
- Sedikit peningkatan footprint memori dibandingkan runtime micro-framework.
- Memerlukan disiplin tinggi dalam penggunaan decorator dan pemisahan lapisan (Controller $\rightarrow$ Service $\rightarrow$ Repository).

### Risks & Mitigations
- *Risk:* Pengembang tergoda menaruh business logic di Controller.
- *Mitigation:* Terapkan arsitektur berlapis ketat; Controller hanya menangani request/response HTTP, seluruh logic didelegasikan ke Service layer.
