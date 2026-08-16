# WMS Nusantara (Warehouse Management System)

Platform tata kelola operasional pergudangan modern terintegrasi dengan arsitektur **Monorepo** yang memisahkan client frontend dan service backend secara independen.

---

## Struktur Monorepo

```text
Warehouse/
├── frontend/             # Next.js 15 Web Application (Admin, Customer, Driver)
├── backend/              # Standalone Backend Service & API (PostgreSQL Gateway)
├── docs/                 # Dokumentasi Sistem (SRS, API Contract, Architecture)
├── Project-Context/      # Panduan Konteks, Roadmap, dan Handoff Specification
└── Skills/               # Developer Skill References
```

---

## Panduan Menjalankan Frontend

### Prasyarat
- Node.js v18.18+ atau v20+
- npm v9+

### Langkah Menjalankan
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser pada alamat:
   - [http://localhost:3000](http://localhost:3000)

### Perintah Pengujian Frontend
```bash
# Validasi TypeScript
npm run type-check

# Linting Kode
npm run lint

# Build Produksi
npm run build
```

---

## Status Arsitektur Saat Ini
- **Frontend:** `STABLE / READY` (100% Selesai & Audited)
- **Backend:** `PLACEHOLDER ONLY / NOT STARTED`
- **Database PostgreSQL:** `NOT IMPLEMENTED`
- **REST API Endpoints:** `NOT IMPLEMENTED`
