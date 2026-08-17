# INFRASTRUCTURE & CONTAINER SPECIFICATION
**Warehouse Management System (WMS Nusantara)**
*Spesifikasi Docker Compose, PostgreSQL 16, MinIO Object Storage, dan Arsitektur Jaringan*

---

## 1. Topologi Infrastruktur Lokal (Docker Compose)

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
                                                         │ • Sets download policy      │
                                                         └─────────────────────────────┘
```

---

## 2. PostgreSQL 16 Configuration
- **Base Image:** `postgres:16-alpine`
- **Default Database:** `wms_nusantara`
- **User / Password:** `wms_user` / `wms_secure_pass` (overridable via `.env`)
- **Persistent Storage:** Docker named volume `wms_postgres_data` yang terikat pada `/var/lib/postgresql/data`. Data aman saat container dimatikan/dihapus.
- **Healthcheck Probe:**
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U wms_user -d wms_nusantara"]
  interval: 5s
  timeout: 5s
  retries: 5
  ```

---

## 3. MinIO Object Storage Configuration
- **Base Image:** `minio/minio:latest`
- **API Endpoint:** `http://localhost:9000`
- **Management Web Console:** `http://localhost:9001`
- **Root Credentials:** `minioadmin` / `minioadmin` (overridable via `.env`)
- **Default Bucket:** `wms-storage` (dibuat secara otomatis oleh helper container `wms_minio_createbuckets`)
- **Persistent Storage:** Docker named volume `wms_minio_data` pada `/data`.

---

## 4. Perintah Operasional Docker Compose

```bash
# Menjalankan seluruh dependency di background
docker compose up -d

# Melihat status healthiness container
docker compose ps

# Memeriksa log PostgreSQL
docker compose logs -f postgres

# Memeriksa log MinIO
docker compose logs -f minio

# Mematikan service tanpa menghapus volume data
docker compose down

# Menghapus container dan volume data (Reset Total)
docker compose down -v
```
