# Engineering Skills & Workflow Playbook
**Warehouse Management System (WMS Nusantara)**
*Curated Index of Repository Skills and Best-Practice Workflows for AI Agents & Engineers*

---

## 1. Skill Categories & Directory Mapping

Setiap skill tersimpan pada direktori `/skills/<skill-name>/` dan memuat panduan, instruksi, dan standar rekayasa:

| Skill Directory | Domain / Spesialisasi | Kapan Menggunakan |
| :--- | :--- | :--- |
| `skills/docs-architect/` | Dokumentasi Teknis | Merancang dokumentasi, arsitektur informasi, standar API docs, dan single source of truth. |
| `skills/codebase-cleanup-refactor-clean/` | Refactoring & Hygiene | Membersihkan dead code, restrukturisasi folder, menghapus artefak sementara tanpa regresi. |
| `skills/secrets-management/` | Keamanan Secrets | Audit credential hardcoded, enkripsi, manajemen environment variable, dan rotasi secret. |
| `skills/nextjs-app-router-patterns/` | Frontend Web | Pola App Router Next.js 15, Server vs Client components, layout hierarchy, routing guards. |
| `skills/react-state-management/` | State Management | Zustand store design, React Query cache invalidation, hydration handling. |
| `skills/application-performance-performance-optimization/` | Performa & Optimasi | Mengurangi bundle size, optimasi query rendering, memory leak prevention, indexing. |
| `skills/postgresql/` | Database PostgreSQL | Query optimization, indexing strategy, transaction isolation, connection pooling, migrasi. |
| `skills/systematic-debugging/` | Debugging Sistem | Investigasi root cause, reproduksi bug, tracing correlation ID, resilience testing. |

---

## 2. Standard Workflow Playbook

1. **Investigasi & Audit Sebelum Mengubah Kode**:
   - Selalu lakukan audit menyeluruh terhadap file yang terdampak.
   - Buat laporan temuan atau rencana implementasi (*Implementation Plan*) sebelum melakukan modifikasi.
2. **Kepatuhan Tipe Data (Strict Type-Safety)**:
   - Backend: DTO menggunakan `class-validator` dan `class-transformer`.
   - Frontend: Seluruh interaksi API mematuhi TypeScript interfaces di `src/types/`.
3. **Atomic Transaction Enforcement**:
   - Seluruh mutasi yang memengaruhi lebih dari satu tabel (contoh: alokasi slot barang $\rightarrow$ mutasi log $\rightarrow$ kalkulasi kapasitas gudang) wajib dibungkus dalam Prisma `$transaction`.
4. **Resilience & Safe Fallbacks**:
   - Cegah user mengalami infinite spinner atau blank screen dengan error boundaries dan fallback card yang deskriptif.
