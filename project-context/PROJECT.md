# WMS Nusantara — Project Master Context
**Warehouse Management & Cold Chain Logistics Platform**

---

## 1. Project Overview

- **Project Name:** Warehouse Management System (WMS Nusantara)
- **Project Type:** Modern Web-based & Mobile-ready Cold Chain Logistics & Warehouse Management System
- **Architecture:** Monorepo (`/frontend` Next.js 15 Web Client, `/backend` NestJS 10 API Gateway, `/docs` Technical Documentation)
- **Current Status:** 🔒 **FRONTEND (PHASE 1–7) & BACKEND (PHASE 8–12) 100% IMPLEMENTED, INTEGRATED & STABILIZED** | 🛡️ **SECURITY & QA READY**

---

## 2. Business Capabilities & Multi-Role Personas

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

1. **Self-Service Storage Rental ($m^3$)**: Penyewaan kapasitas mandiri dengan kalkulasi otomatis volume kubikasi.
2. **Cold Chain Integrity Sub-Zero**: Pemantauan suhu real-time ($-18.0^\circ\text{C}$ s/d $-25.0^\circ\text{C}$) dengan alarm anomali.
3. **Fleet Dispatch & Logistics**: Penugasan armada (Reefer, Box, Van), checklist dock, dan rute GPS live.
4. **Digital Proof of Delivery (POD)**: Bukti serah terima berbasis foto dan tanda tangan digital (*E-Signature*).
5. **Billing & Denda Keterlambatan**: Tagihan bulanan otomatis dan penalti $5\%/\text{minggu}$ keterlambatan bayar.

---

## 3. Master Documentation Index (`/docs`)

Untuk detail arsitektur lengkap, silakan merujuk ke direktori `/docs`:

- **System Architecture**: [`docs/architecture/SYSTEM_OVERVIEW.md`](file:///d:/Project/Warehouse/docs/architecture/SYSTEM_OVERVIEW.md)
- **Backend Architecture**: [`docs/architecture/BACKEND.md`](file:///d:/Project/Warehouse/docs/architecture/BACKEND.md)
- **Frontend Architecture**: [`docs/architecture/FRONTEND.md`](file:///d:/Project/Warehouse/docs/architecture/FRONTEND.md)
- **Domain Models & Relational Schema**: [`docs/architecture/DOMAIN_MODELS.md`](file:///d:/Project/Warehouse/docs/architecture/DOMAIN_MODELS.md)
- **Design System & UI Tokens**: [`docs/architecture/DESIGN_SYSTEM.md`](file:///d:/Project/Warehouse/docs/architecture/DESIGN_SYSTEM.md)
- **REST API Contract & Envelopes**: [`docs/api/API_CONTRACT.md`](file:///d:/Project/Warehouse/docs/api/API_CONTRACT.md)
- **Database Architecture & Migration**: [`docs/database/DATABASE_ARCHITECTURE.md`](file:///d:/Project/Warehouse/docs/database/DATABASE_ARCHITECTURE.md)
- **Architecture Decision Records (ADRs)**: [`docs/adr/README.md`](file:///d:/Project/Warehouse/docs/adr/README.md)
- **Infrastructure & Docker Compose**: [`docs/operations/INFRASTRUCTURE.md`](file:///d:/Project/Warehouse/docs/operations/INFRASTRUCTURE.md)
- **Security Audit Phase 1**: [`docs/security/SECURITY_AUDIT_PHASE_1.md`](file:///d:/Project/Warehouse/docs/security/SECURITY_AUDIT_PHASE_1.md)
- **Pre-QA Readiness Declaration**: [`docs/qa/PRE_QA_READINESS.md`](file:///d:/Project/Warehouse/docs/qa/PRE_QA_READINESS.md)
- **System Stabilization Audit**: [`docs/qa/SYSTEM_STABILIZATION_AUDIT.md`](file:///d:/Project/Warehouse/docs/qa/SYSTEM_STABILIZATION_AUDIT.md)
- **SRS 16 Use Cases Traceability**: [`docs/qa/SRS_TRACEABILITY.md`](file:///d:/Project/Warehouse/docs/qa/SRS_TRACEABILITY.md)