# WMS Nusantara — Project Context & Master Specification

## 1. Project Overview

**Project Name:** Warehouse Management System (WMS Nusantara)  
**Project Type:** Modern Web-based & Mobile-ready Warehouse Management and Cold Chain Logistics Platform  
**Architecture:** Monorepo (`/frontend` Web Client, `/backend` API Gateway, `/docs` System Specs)  
**Current Status:** **Frontend Phase 1–7 100% COMPLETE & STABLE** | **Backend Phase 8: READY FOR IMPLEMENTATION**

---

## 2. Business Objectives & Core Capabilities

WMS Nusantara adalah modernisasi sistem pergudangan terintegrasi yang melayani penyimpanan umum (*General Dry Storage*) dan rantai dingin (*Cold Storage Sub-zero*):

1. **Self-Service Storage Rental:** Customer dapat menghitung estimasi volume ($m^3$) dan menyewa ruang gudang secara mandiri.
2. **Cold Chain Integrity:** Pemantauan telemetri suhu real-time (ambang batas $-18.0^\circ\text{C}$ s/d $-25.0^\circ\text{C}$) pada ruang simpan dan armada truk reefer.
3. **Fleet & Logistics Dispatch:** Pengelolaan armada truk (*Reefer & Box*), penugasan driver, alokasi loading dock, dan pelacakan rute GPS.
4. **Digital Proof of Delivery (POD):** Validasi serah terima kargo menggunakan dokumentasi foto dan tanda tangan digital (*E-Signature*).
5. **Automated Billing & Penalty:** Penerbitan faktur sewa bulanan dan perhitungan otomatis denda keterlambatan pembayaran sebesar $5\%$ per minggu.

---

## 3. Multi-Role Personas

```text
┌───────────────────────────┐   ┌───────────────────────────┐   ┌───────────────────────────┐
│       ADMIN PORTAL        │   │      CUSTOMER PORTAL      │   │       DRIVER FLEET        │
│   (Pusat Operasional)     │   │      (Tenant Mandiri)     │   │    (Eksekusi Lapangan)    │
├───────────────────────────┤   ├───────────────────────────┤   ├───────────────────────────┤
│ • Alokasi Slot Rak 3D     │   │ • Sewa Ruang Gudang (m³)  │   │ • Antrean Task DO Aktif   │
│ • Approval Dispatch DO    │   │ • Registrasi Master SKU   │   │ • Pemilihan Armada Truk   │
│ • Manajemen Driver & Truk │   │ • Monitor Suhu Cold Room  │   │ • Checklist Loading Dock  │
│ • Telemetri Sensor IoT    │   │ • Request Penjemputan DO  │   │ • Navigasi Rute Live GPS  │
│ • Verifikasi Faktur Sewa  │   │ • Pembayaran Virtual Acc  │   │ • Upload Digital POD & TTD│
│ • Laporan Eksekutif (PDF) │   │ • Validasi Penerimaan DO  │   │ • Riwayat & Rating Trip   │
└───────────────────────────┘   └───────────────────────────┘   └───────────────────────────┘
```

---

## 4. Repositori & Monorepo Architecture

```text
Warehouse/
├── frontend/             # Next.js 15 App Router Web Client (Port 3000)
├── backend/              # Standalone API Server & PostgreSQL Gateway (Target Port 5000/8080)
├── docs/                 # SRS docx, API contracts, dan arsitektur database
└── Project-Context/      # Master Context, Roadmap, API Contract, dan Domain Models
```

---

## 5. Constraint & Aturan Arsitektur Backend

1. **Zero Direct DB Access from Clients:** Web Frontend (Next.js) dan Mobile Client (Kotlin Android) **tidak boleh mengakses PostgreSQL secara langsung**. Seluruh komunikasi wajib melalui REST API.
2. **Frozen Frontend UI:** UI/UX frontend telah 100% selesai dan diaudit. Backend developer wajib menyesuaikan response data dengan kontrak `FRONTEND_API_CONTRACT.md`.
3. **Stateless JWT Authentication:** Backend bertanggung jawab memvalidasi JWT Bearer token dan menegakkan Role-Based Access Control (RBAC).