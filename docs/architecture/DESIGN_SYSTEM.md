# Design System & UI Visual Standards
**Warehouse Management System (WMS Nusantara)**
*Visual Source of Truth, Semantic Tokens, 7 UX States & Floating Shell Architecture*

---

## 1. Core Principles

1. **Visual Source of Truth:** Admin Floating Shell adalah standar acuan visual. Customer dan Driver menerapkan prinsip *"Same Design System, Different Role Experience"*.
2. **Rounded Floating Architecture:** Seluruh sidebar dan topbar menggunakan card melayang putih (`bg-white`, `rounded-2xl`, `border-slate-200`, `shadow-xl`) di atas canvas latar `#F8FAFC`.
3. **Typography & Tabular Numbers:** Menggunakan font modern **Inter** dengan angka tabular `font-mono` untuk kalkulasi volume $m^3$, nomor pelat kendaraan, dan suhu Cold Storage.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Role Identity Accents
- **Admin Portal:** Primary Indigo (`#4F46E5` / `bg-indigo-600` / `text-indigo-600`)
- **Customer Portal:** Emerald Green (`#059669` / `bg-emerald-600` / `text-emerald-600`)
- **Driver Fleet:** Amber Gold (`#D97706` / `bg-amber-500` / `text-amber-950`)

### 2.2 Semantic Feedback Tokens
- **Success:** Emerald (`bg-emerald-50`, `text-emerald-700`, `border-emerald-200`) — Barang tersimpan, pembayaran lunas, POD diverifikasi.
- **Warning / In-Progress:** Amber (`bg-amber-50`, `text-amber-700`, `border-amber-200`) — Barang dalam transit, menunggu konfirmasi, jadwal mendekati.
- **Destructive / Cold Anomaly:** Rose (`bg-rose-50`, `text-rose-700`, `border-rose-200`) — Suhu melebihi batas, invoice overdue, pembatalan order.
- **Cold Storage / Telemetry:** Sky Blue (`bg-sky-50`, `text-sky-700`, `border-sky-200`) — Status pendingin sub-zero, kelembaban udara RH.

### 2.3 Neutral Tokens (Slate Canvas)
- **Background Canvas:** `#F8FAFC` (`bg-slate-50`)
- **Card Panels:** `#FFFFFF` (`bg-white border border-slate-200 rounded-2xl shadow-sm`)
- **Text Primary:** `#0F172A` (`text-slate-900 font-bold`)
- **Text Muted:** `#64748B` (`text-slate-500`)
- **Borders & Dividers:** `#E2E8F0` (`border-slate-200`)

---

## 3. Standard Layout Spacing Grid

```css
/* Responsive Viewport Standard */
.main-viewport {
  padding-left: 18rem; /* lg:pl-72 */
  display: flex;
  flex-direction: column;
  padding: 1rem; /* p-4 */
  gap: 1rem; /* space-y-4 */
  min-height: 100vh;
  background-color: #F8FAFC;
}
```

---

## 4. Standarisasi 7 UX States

1. **Loading State:** Skeleton loader (`DashboardSkeleton`, `TableSkeleton`).
2. **Empty State:** Komponen ilustrasi inbox/search kosong dengan tombol action (`DashboardEmptyState.tsx`).
3. **Success State:** Badge hijau dan toast notifikasi konfirmasi.
4. **Error State:** Komponen `ErrorStateCard.tsx` dengan Ref ID dan tombol aksi Retry.
5. **Validation State:** Pesan error validasi form Zod inline di bawah input field.
6. **Modal State:** Modal dialog dengan crisp backdrop `bg-slate-950/25` tanpa blur berlebih.
7. **Hydration State:** Hydration gate untuk mencegah flicker saat initial render client.
