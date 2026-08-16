# WMS Nusantara — Approved Design Baseline & Visual Source of Truth

**Status:** APPROVED BY PROJECT MANAGER / IT LEAD (DESIGN FREEZE)  
**Stitch Project:** `projects/6633718355165483958` (*Warehouse Management System — WMS*)  
**Design System Asset:** `assets/a235cada51df4422a9170274009cc094` (*WMS Nusantara*)  
**Design Philosophy:** Corporate Modernism, High Data Density, Industrial Operational Utility  

---

## 1. Approved Baseline Screens

Berikut adalah 4 screen fondasi yang telah disetujui sebagai **Visual Source of Truth**:

| No | Screen Name | ID Screen Stitch | Deskripsi & Peran Visual |
| :--- | :--- | :--- | :--- |
| 1 | **Portal Login WMS Nusantara** | `6fb962ffdeae45a4843f13e8b4291b4d` | Halaman login multi-role (Admin, Customer, Driver) dengan role tabs switcher, validasi error banner, dan standard security footer. |
| 2 | **Master Shell Navigasi WMS** | `4712e0ac788140b3a8a36cacbfdc0f1a` | Kerangka aplikasi master desktop (280px left sidebar, 64px topbar dengan breadcrumb, facility switcher, search bar `Cmd+K`, dan real-time telemetry badge). |
| 3 | **Dashboard Operasional Admin** | `fbfe601bcdc745ca8a052cebd2bf1d1a` | Pusat kontrol operasional: 4 KPI Cards teratas, Utilisasi Zona Gudang (Cold/Standard), Antrean Logistik & Dispatch, Telemetri Sensor Suhu Realtime, Timeline Aktivitas, dan Quick Actions. |
| 4 | **Visualisasi Kapasitas Gudang & Slot Rak** | `3a9989436aac49549d9d0158d2992812` | Denah interaktif hirarki `Gudang -> Zona -> Rak -> Slot` (70% Grid multi-zona + 30% Panel Inspeksi Detail Slot dengan telemetri suhu & barcode). |

---

## 2. Core Design Tokens & Rules (Extracted Design System)

Seluruh screen baru yang dibuat wajib menggunakan token yang sama persis:

### 2.1 Palet Warna (Color Palette)
- **Base Canvas (Background):** Neutral Light Slate `#F8FAFC`
- **Surface / Cards:** Pure White `#FFFFFF` dengan 1px solid border `Slate-200` (`#E2E8F0`)
- **Structure (Sidebar & Header Elements):** Deep Slate & Navy (`#0F172A` / `#1E293B`)
- **Primary Brand / Interactive Action:** Indigo `#4F46E5` / `#3525CD`
- **Semantic Operational Colors:**
  - ❄️ **Cold Storage / Pendingin:** Cyan `#0284C7` (Badge: `#E0F2FE`, Text: `#0369A1`)
  - 🛋️ **Standard / Furniture:** Amber `#D97706` (Badge: `#FEF3C7`, Text: `#92400E`)
  - 🟢 **Available / Success / Stored:** Emerald `#10B981` (Badge: `#ECFDF5`, Text: `#047857`)
  - 🔴 **Occupied / Overdue / Error:** Crimson Red `#BA1A1A` (Badge: `#FEE2E2`, Text: `#991B1B`)
  - 🟡 **Warning / Partial / In-Transit:** Amber `#F59E0B` (Badge: `#FFFBEB`, Text: `#B45309`)

### 2.2 Tipografi (Typography)
- **Font Utama:** **Inter** (100% konsisten)
- **Scale:**
  - `Display-LG`: 36px / Bold (Page Headers)
  - `Headline-MD`: 24px / SemiBold (Section Titles & KPI Numbers)
  - `Headline-SM`: 20px / SemiBold (Card Titles)
  - `Body-LG / MD / SM`: 16px / 14px / 13px (Regular text)
  - `Label-Bold / MD`: 12px / Medium & SemiBold (Badges & Form Labels)
  - `Mono-Data`: **Courier Prime / JetBrains Mono** (14px untuk SKU, Barcode `BRG-xxx`, Nomor Order `ORD-xxx`, dan Kode Slot `COLD-xxx`).

### 2.3 Layout & Elevation
- **Grid Layout:** 12-Column fluid grid dengan 280px fixed left sidebar dan 16px/24px gutters.
- **Corner Radius:** Soft `rounded-sm` (4px) untuk buttons, inputs, badges; `rounded-lg` (8px) untuk card containers.
- **Elevation:** Tonal layering dan 1px border. Hindari heavy drop shadows.

---

## 3. Workflow Ekstensi Screen Baru (Controlled Expansion)

Setiap pembuatan screen baru (Customer Portal, Driver Mobile, Modul Billing, Laporan) harus melalui alur:

```text
[ Approved Design System (assets/a235cada51df4422a9170274009cc094) ]
                             │
                             ▼
[ Screen Extension Generation via Stitch (Menggunakan Prompt Terstruktur) ]
                             │
                             ▼
[ Verifikasi Konsistensi Token & Visual Language ]
                             │
                             ▼
[ Review & Approval Project Manager ]
```
