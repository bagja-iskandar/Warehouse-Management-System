# BACKEND LOCAL SETUP & DEVELOPMENT GUIDE
**Warehouse Management System (WMS Nusantara)**
*Panduan Memulai & Menjalankan Service Backend Secara Lokal*

---

## 1. Prasyarat Sistem (System Prerequisites)

Pastikan lingkungan lokal telah memiliki:
- **Node.js:** Versi 20.x LTS atau lebih tinggi (`node -v`)
- **npm:** Versi 10.x atau lebih tinggi (`npm -v`)
- **PostgreSQL Server:** PostgreSQL v16/v17 terinstall lokal di Windows (`localhost:5432`).
- **pgAdmin 4:** Digunakan untuk inspeksi tabel, schema, data, dan query visual.
- *(Opsional)* Docker Compose jika ingin menjalankan MinIO object storage lokal.

---

## 2. Langkah-langkah Setup Cepat (Quick Start)

### Langkah 1: Pindah ke Direktori Backend
```bash
cd backend
```

### Langkah 2: Konfigurasi Environment Variables
Salin template konfigurasi `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database PostgreSQL lokal Anda pada file `.env`:
```env
PORT=5000
API_PREFIX=api/v1
DATABASE_URL=postgresql://<USERNAME>:<PASSWORD>@localhost:5432/wms_db?schema=public
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=wms-storage
```
*(Ganti `<USERNAME>` dan `<PASSWORD>` dengan kredensial PostgreSQL / pgAdmin lokal Anda)*

### Langkah 3: Install Dependensi & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### Langkah 4: Jalankan Database Migration & Seeding
```bash
# Menjalankan migrasi skema 15 entitas relasional ke database wms_db
npx prisma migrate dev --name init_wms_db

# Memuat dataset realistis (Admin, Customer, Driver, Gudang, Slot 3D, Barang, DO, Invoice)
npx prisma db seed
```

### Langkah 5: Jalankan Server Backend dalam Mode Development
```bash
npm run start:dev
```

Server akan aktif pada:
- **Base API:** `http://localhost:5000/api/v1`
- **Swagger Documentation:** `http://localhost:5000/api/docs`
- **Swagger JSON Spec:** `http://localhost:5000/api/docs-json`
- **Liveness Probe:** `http://localhost:5000/health/liveness`
- **Readiness Probe:** `http://localhost:5000/health/readiness`
- **pgAdmin 4:** Buka pgAdmin di Windows untuk melihat database `wms_db` beserta 15 tabel dan relasinya.

---

## 3. Daftar Perintah npm yang Tersedia

| Command | Deskripsi |
| :--- | :--- |
| `npm run start:dev` | Menjalankan backend dengan hot-reload (*watch mode*). |
| `npm run build` | Melakukan kompilasi TypeScript ke bundle `dist/`. |
| `npm run start:prod` | Menjalankan hasil build production (`dist/main.js`). |
| `npm run lint` | Menjalankan ESLint dan auto-fix format code style. |
| `npm run typecheck` | Menjalankan compiler typecheck tanpa emit (`tsc --noEmit`). |
| `npm run test` | Menjalankan unit test suite menggunakan Jest. |
| `npm run test:e2e` | Menjalankan End-to-End API tests menggunakan Supertest. |
| `npm run prisma:generate` | Men-generate ulang Prisma Client dari `schema.prisma`. |
| `npm run prisma:studio` | Membuka UI web Prisma Studio untuk menginspeksi database. |
