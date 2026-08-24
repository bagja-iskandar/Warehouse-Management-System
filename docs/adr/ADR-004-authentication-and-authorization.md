# ADR-004: Authentication & RBAC Authorization Strategy

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
WMS Nusantara memiliki 3 aktor dengan hak akses yang sangat terisolasi:
1. **ADMIN:** Akses penuh ke seluruh gudang, manajemen armada, penetapan slot, approval DO, dan monitoring penagihan.
2. **CUSTOMER:** Akses terbatas hanya pada data inventaris miliknya, pemesanan ruang sewa, request DO, dan pembayaran faktur sendiri.
3. **DRIVER:** Akses terbatas hanya pada tugas DO yang dialokasikan, checklist armada, transit GPS, dan upload Digital POD.

Sistem otentikasi harus stateless (kompatibel untuk Web dan Mobile Native) dan otorisasi harus diverifikasi secara mutlak di sisi server (*server-side enforcement*).

## Decision Drivers
1. **Multi-Platform Support:** Stateless token yang dapat disimpan dengan aman di Web (localStorage/memory) dan Mobile (EncryptedSharedPreferences / Keystore).
2. **Strict Server-Side Authorization (RBAC):** Mencegah eskalasi hak akses (contoh: Customer tidak boleh memanipulasi slot rak atau data customer lain).
3. **High Password Security:** Proteksi kredensial dari brute-force dan rainbow table attacks.
4. **Token Revocation & Lifecycle:** Mekanisme refresh token untuk memperbarui session tanpa mengharuskan login berulang kali.

## Considered Options

### Option 1: JWT Bearer Token (Stateless) + Bcrypt Password Hash + NestJS RBAC Guard
- **Kelebihan:**
  - 100% client-agnostic (mudah dikonsumsi oleh Next.js Fetch API dan Android OkHttp/Retrofit Authenticator).
  - Server tidak perlu menyimpan session state di memori untuk setiap request.
  - Bcrypt / Argon2 adalah algoritma hashing yang sangat tahan terhadap GPU/ASIC cracking.
  - NestJS `@UseGuards(JwtAuthGuard, RolesGuard)` dan decorator `@Roles('ADMIN')` sangat deklaratif dan aman.
- **Kekurangan:**
  - Token JWT tidak dapat dibatalkan seketika tanpa blacklist store (dimitigasi dengan masa berlaku access token singkat 15m + refresh token rotation).

### Option 2: Stateful Cookie-Based Session (express-session + Redis)
- **Kelebihan:**
  - Pembatalan session instan di sisi server.
- **Kekurangan:**
  - Masalah kompleksitas Cookie/CSRF pada aplikasi native Android Kotlin.
  - Memerlukan infrastruktur Redis stateful sejak hari pertama.

## Decision
Kami memutuskan untuk menggunakan:
1. **Stateless JWT (JSON Web Token)** untuk Access Token (umur 15 menit).
2. **Bcrypt** dengan salt round 10 untuk password hashing.
3. **NestJS Passport JWT Strategy + RolesGuard + Ownership Checks** untuk penegakan RBAC dan isolasi data per tenant.
4. **Refresh Token Table** di PostgreSQL (dengan tokenHash SHA-256) untuk mendukung token rotation dan revocation multi-perangkat.

## Role & Permission Matrix

| Resource / Endpoint | ADMIN | CUSTOMER | DRIVER | Catatan Isolasi |
| :--- | :---: | :---: | :---: | :--- |
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ | Public |
| `POST /api/v1/auth/register` | ✅ | ✅ | ❌ | Registrasi Customer mandiri |
| `GET /api/v1/warehouses` | ✅ | ✅ | ✅ | Read list fasilitas |
| `GET /api/v1/warehouses/slots/:id` | ✅ | ❌ | ❌ | Detail slot internal gudang |
| `GET /api/v1/goods` | ✅ (All) | ✅ (Own) | ❌ | Customer difilter otomatis `WHERE customer_id = req.user.id` |
| `POST /api/v1/goods` | ✅ | ✅ | ❌ | Registrasi barang baru |
| `PATCH /api/v1/goods/:id/status` | ✅ | ❌ | ❌ | Alokasi rak & status pergudangan |
| `GET /api/v1/logistics/orders` | ✅ (All) | ✅ (Own) | ✅ (Own) | Driver difilter `WHERE driver_id = req.user.id` |
| `POST /api/v1/logistics/orders/:id/pod`| ❌ | ❌ | ✅ | Driver upload bukti serah terima |
| `GET /api/v1/billing/invoices` | ✅ (All) | ✅ (Own) | ❌ | Customer hanya melihat tagihan miliknya |
| `POST /api/v1/billing/invoices/:id/pay`| ❌ | ✅ | ❌ | Customer bayar invoice |

## Consequences

### Positive
- Perlindungan keamanan berlapis: validasi token $\rightarrow$ verifikasi peran $\rightarrow$ verifikasi kepemilikan resource (*Tenant Ownership Check*).
- Kompatibilitas universal antara Next.js dan Kotlin Android.
- Standar enkripsi sandi terkini berstandar OWASP.

### Negative
- Perlu penanganan refresh token flow di sisi klien saat access token kedaluwarsa (HTTP 401).
