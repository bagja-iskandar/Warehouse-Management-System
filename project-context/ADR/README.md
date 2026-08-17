# Architecture Decision Records (ADRs)
**Warehouse Management System (WMS Nusantara)**

Dokumen ini memuat catatan keputusan arsitektur teknis (*Architecture Decision Records*) yang mengatur pondasi, pilihan teknologi, dan standar rekayasa backend WMS Nusantara.

---

## Indeks Keputusan Arsitektur

| ADR | Judul | Status | Tanggal | Keputusan Utama |
| :--- | :--- | :---: | :---: | :--- |
| [ADR-001](ADR-001-backend-framework.md) | Backend Framework Selection | **Accepted** | 2026-08-16 | **NestJS** (Node.js LTS, TypeScript Strict) |
| [ADR-002](ADR-002-database-and-orm.md) | Database Engine & ORM | **Accepted** | 2026-08-16 | **PostgreSQL 16** + **Prisma ORM** |
| [ADR-003](ADR-003-api-architecture-and-contracts.md) | API Architecture & Client-Agnostic Design | **Accepted** | 2026-08-16 | **RESTful API v1** + **OpenAPI / Swagger** |
| [ADR-004](ADR-004-authentication-and-authorization.md) | Authentication & RBAC Authorization Strategy | **Accepted** | 2026-08-16 | **Stateless JWT** + **Argon2id** + **RBAC Guards** |
| [ADR-005](ADR-005-file-storage-and-digital-pod.md) | Object Storage Strategy for Digital POD | **Accepted** | 2026-08-16 | **S3-Compatible Object Storage** (MinIO / AWS S3) |
| [ADR-006](ADR-006-iot-telemetry-and-monitoring.md) | IoT Telemetry & Cold Storage Monitoring | **Accepted** | 2026-08-16 | **Hybrid Ingestion** (REST Batch + In-memory cache + Anomaly Guard) |

---

## Standar Format ADR
Setiap ADR mengadopsi format terstandarisasi:
1. **Title & Status**
2. **Context & Problem Statement**
3. **Decision Drivers**
4. **Considered Options & Trade-offs**
5. **Decision & Rationale**
6. **Consequences (Positive, Negative, Risks & Mitigations)**
7. **Implementation Notes**
