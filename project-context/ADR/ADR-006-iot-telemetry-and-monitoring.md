# ADR-006: IoT Telemetry & Cold Storage Monitoring

## Status
**Accepted**

## Tanggal
2026-08-16

## Context
WMS Nusantara mengelola Cold Storage sub-zero ($-18.0^\circ\text{C}$ s/d $-25.0^\circ\text{C}$) dan armada Truk Reefer. Integritas suhu wajib dipantau secara berkala. Kegagalan kompresor atau anomali suhu berpotensi merusak muatan makanan beku dan daging impor milik tenant. Backend harus mampu menerima aliran data telemetri suhu secara efisien, mendeteksi anomali suhu secara otomatis, dan menyajikan data telemetri untuk grafik monitoring real-time.

## Decision Drivers
1. **High Ingestion Efficiency:** Efisien dalam mencatat log pembacaan sensor berkala tanpa membebani tabel transaksional utama.
2. **Real-time Anomaly Detection:** Memicu status peringatan instan jika suhu naik melebihi ambang batas aman (misal: suhu Cold Storage $> -16.0^\circ\text{C}$).
3. **Data Aggregation:** Menyajikan riwayat suhu 24 jam untuk visualisasi tren pada Web Admin/Customer dan Mobile Driver.

## Considered Options

### Option 1: Hybrid Ingestion (REST Batch Ingestion + PostgreSQL Partitioned Table / Timescale)
- **Kelebihan:**
  - Endpoint REST standar `POST /api/v1/telemetry/ingest` yang dapat dikirim oleh IoT Gateway maupun aplikasi driver.
  - Skema tabel `telemetry_logs` dengan indexing pada `(source_type, source_id, recorded_at DESC)`.
  - Sederhana dioperasikan tanpa memerlukan cluster MQTT/Kafka terpisah pada tahap awal.
  - Mudah diperluas ke TimescaleDB extension jika skala sensor bertambah ribuan node.
- **Kekurangan:**
  - Polling interval wajar (misal setiap 30 detik s/d 1 menit per node).

### Option 2: Dedicated Message Broker (MQTT / Apache Kafka)
- **Kelebihan:**
  - Skala jutaan message per detik.
- **Kekurangan:**
  - Kompleksitas infrastruktur berlebih (*over-engineering*) untuk tahap awal operasional gudang.

## Decision
Kami memutuskan untuk mengadopsi **Hybrid REST Telemetry Ingestion Engine** di dalam NestJS Backend dengan persistensi pada tabel terindeks `telemetry_logs` di PostgreSQL, serta cache suhu terkini (*latest state*) pada level in-memory / cache service.

## Anomaly Detection Rules
- **Cold Storage Room:** Jika `temperature > -16.0°C` selama 2 interval pembacaan berturut-turut, tandai `is_anomaly = true` dan trigger sistem notifikasi peringatan.
- **Reefer Truck:** Jika suhu box pendingin naik di atas $-15.0^\circ\text{C}$ saat status DO `IN_TRANSIT`, trigger peringatan ke dashboard Admin & Driver.

## Consequences

### Positive
- Tidak memerlukan broker eksternal tambahan pada tahap awal implementasi.
- Query riwayat monitoring 24 jam sangat cepat dengan memanfaatkan B-Tree composite index.
- Siap bermigrasi ke TimescaleDB / MQTT di masa depan tanpa mengubah API contract ke client.
