# AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
**Warehouse Management System (WMS Nusantara)**
*Arsitektur Autentikasi, JWT Token Rotation, dan Keamanan Multi-Peran*

---

## 1. Arsitektur Autentikasi & Alur Otorisasi

Sistem mengadopsi arsitektur otentikasi berbasis **JSON Web Token (JWT) Dual-Token** (Access Token + Refresh Token dengan Token Rotation dan Revocation di Database).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                           │
└────────────────────────────────────────────────────────────────────────┘

1. Login Flow:
   Client (Web / Mobile)
     │  POST /api/v1/auth/login (email + password)
     ▼
   AuthController ──> AuthService
                          │
                          ├─ 1. Query Prisma: user.findUnique({ email })
                          ├─ 2. bcrypt.compare(password, user.passwordHash)
                          ├─ 3. Verify user.status === 'ACTIVE'
                          ├─ 4. jwtService.signAsync (Access Token - 15m)
                          ├─ 5. jwtService.signAsync (Refresh Token - 7d + jti)
                          ├─ 6. Save SHA-256 hash in `refresh_tokens` table
                          ▼
   Client receives: { accessToken, refreshToken, expiresIn, user (safe profile) }

2. Protected Request Flow (RBAC):
   Client
     │  Authorization: Bearer <accessToken>
     ▼
   JwtAuthGuard ──> PassportStrategy ('jwt')
     │                │
     │                ├─ Verify Signature with JWT_ACCESS_SECRET
     │                └─ Query Prisma: user.findUnique({ id: payload.sub })
     ▼
   RolesGuard (@Roles('ADMIN', 'CUSTOMER', 'DRIVER'))
     │
     ├─ Read @Roles() metadata via Reflector
     └─ Verify req.user.role in allowed roles (403 Forbidden if mismatched)
     ▼
   Target Controller & Business Service
```

---

## 2. Mekanisme Token Rotation & Revocation

Untuk mencegah pencurian refresh token dan replay attacks:
1. **Refresh Token ID (`jti`):** Setiap refresh token memiliki klaim UUID `jti` unik yang menjamin token tidak dapat diduplikasi.
2. **Database Hashing:** Token disimpan dalam tabel `refresh_tokens` sebagai hash SHA-256 (`token_hash`). Password hash dan raw refresh token **tidak pernah disimpan dalam bentuk plaintext**.
3. **Single-Use Rotation:** Ketika endpoint `POST /api/v1/auth/refresh` dipanggil:
   - Token lama diverifikasi di tabel `refresh_tokens`.
   - Token lama langsung ditandai `is_revoked = true`.
   - Token pair baru (Access Token + Refresh Token baru) diterbitkan dan disimpan ke database.
4. **Logout Revocation:** Pemanggilan `POST /api/v1/auth/logout` secara eksplisit mencabut token aktif dari database, mencegah token digunakan kembali.

---

## 3. RBAC Guards & Decorators

### 3.1 `@Roles(...)` & `RolesGuard`
Digunakan untuk membatasi endpoint hanya untuk peran tertentu:
```typescript
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin/dashboard')
getAdminDashboard() { ... }
```

### 3.2 `@Public()` & `JwtAuthGuard`
Secara default seluruh rute dapat dilindungi secara global atau per-controller. Endpoint publik (seperti Login dan Health Probe) dianotasi dengan `@Public()`.

### 3.3 `@CurrentUser()`
Decorator kustom untuk menginjeksi entitas pengguna terotentikasi ke parameter controller:
```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
getProfile(@CurrentUser() user: AuthenticatedUser) {
  return this.authService.getProfile(user.id);
}
```

---

## 4. Keamanan & Kepatuhan Praktik Terbaik (Security Best Practices)

- **Hashing Kata Sandi:** Menggunakan algoritma **Bcrypt dengan 10 salt rounds**.
- **Sanitasi Profil:** Properti `passwordHash` **dihapus dan tidak pernah disertakan** dalam respons API maupun log HTTP.
- **Header Redaction:** Header `Authorization`, cookie, dan properti request `password`, `refreshToken` otomatis disensor (`[REDACTED_SECRET]`) pada logger Pino.
- **Client Agnostic:** Mendukung penuh format standar REST JSON untuk aplikasi Web Next.js dan Mobile Kotlin di masa mendatang.
