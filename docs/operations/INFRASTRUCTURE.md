# Infrastructure & Container Specification
**Warehouse Management System (WMS Nusantara)**
*Docker Compose Topology, PostgreSQL 16 Alpine, MinIO Object Storage, and Network Configuration*

---

## 1. Local Infrastructure Topology (Docker Compose)

```text
                               ┌─────────────────────────────┐
                               │   WMS Docker Network        │
                               │   (wms_network / bridge)    │
                               └──────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
     ┌─────────────────────────────┐                     ┌─────────────────────────────┐
     │        wms_postgres         │                     │          wms_minio          │
     │      (PostgreSQL 16)        │                     │   (S3 Object Storage)       │
     ├─────────────────────────────┤                     ├─────────────────────────────┤
     │ • Port: 5432                │                     │ • API Port: 9000            │
     │ • User: wms_user            │                     │ • Web Console: 9001         │
     │ • DB: wms_nusantara         │                     │ • Root: minioadmin          │
     │ • Volume: wms_postgres_data │                     │ • Volume: wms_minio_data    │
     │ • Health: pg_isready        │                     │ • Health: /minio/health/live│
     └─────────────────────────────┘                     └──────────────┬──────────────┘
                                                                        │ depends_on (healthy)
                                                                        ▼
                                                         ┌─────────────────────────────┐
                                                         │   wms_minio_createbuckets   │
                                                         │ (mc: MinIO Client Bootstrap)│
                                                         │ • Auto-creates 'wms-storage'│
                                                         │ • Sets private/auth policies│
                                                         └─────────────────────────────┘
```

---

## 2. PostgreSQL 16 Service Configuration
- **Base Image:** `postgres:16-alpine`
- **Default Database:** `wms_nusantara`
- **Port Binding:** `5432:5432`
- **Persistent Storage:** Docker named volume `wms_postgres_data` terikat ke `/var/lib/postgresql/data`.
- **Healthcheck Probe:**
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```

---

## 3. MinIO S3 Object Storage Configuration
- **Base Image:** `minio/minio:latest`
- **API Endpoint:** `http://localhost:9000`
- **Management Web Console:** `http://localhost:9001`
- **Default Bucket:** `wms-storage` (dibuat otomatis oleh helper container `wms_minio_createbuckets`)
- **Persistent Storage:** Docker named volume `wms_minio_data` pada `/data`.

---

## 4. Operational Container Commands

```bash
# Menjalankan seluruh dependencies infrastruktur di background
docker compose up -d

# Memeriksa status kesehatan container
docker compose ps

# Memeriksa live log PostgreSQL
docker compose logs -f postgres

# Memeriksa live log MinIO
docker compose logs -f minio

# Mematikan service tanpa menghapus volume data
docker compose down

# Menghapus container dan volume data (Reset Total)
docker compose down -v
```
