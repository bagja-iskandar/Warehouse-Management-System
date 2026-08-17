# FRONTEND INTEGRATION & BACKEND HANDOFF NOTES
**Warehouse Management System (WMS Nusantara)**
*Panduan Teknis Integrasi Frontend ke Backend & Aturan Bisnis Wajib*

---

## 1. Mekanisme Substitusi Service Layer

Frontend telah dirancang dengan pola **Service Abstraction Layer** yang terpusat di `frontend/src/services/`. Untuk menghubungkan frontend dengan backend nyata (*real REST API*), backend developer hanya perlu melakukan:

```typescript
// Contoh transisi pada frontend/src/services/auth.service.ts
export class HttpAuthService implements IAuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Login gagal.");
    
    // Simpan token JWT ke localStorage
    localStorage.setItem("wms_auth_token", json.data.token);
    return json.data.user;
  }
}

// Ganti instance export:
export const authService: IAuthService = new HttpAuthService();
```

> [!IMPORTANT]
> **Zero UI Modification:**
> Pergantian dari `MockService` ke `HttpService` **TIDAK MEMERLUKAN PERUBAHAN APAPUN** pada komponen halaman (`frontend/src/app/**`) ataupun UI components (`frontend/src/components/**`).

---

## 2. Formula Bisnis & Konstanta yang Tidak Boleh Diubah

Backend **WAJIB** menerapkan formula perhitungan yang identik dengan SRS:

### 2.1 Formula Volume Fisik Barang ($m^3$)
$$\text{Volume } (m^3) = \frac{\text{Panjang (cm)} \times \text{Lebar (cm)} \times \text{Tinggi (cm)}}{1.000.000} \times \text{Jumlah Koli}$$

### 2.2 Tarif Sewa Ruang Gudang
- **Cold Storage Sub-Zero ($-18^\circ\text{C}$ s/d $-25^\circ\text{C}$):** $\text{Rp } 150.000 \text{ / } m^3 \text{ / bulan}$
- **Standard Dry Storage ($24^\circ\text{C}$):** $\text{Rp } 50.000 \text{ / } m^3 \text{ / bulan}$

### 2.3 Formula Denda Keterlambatan Pembayaran (SRS UC12)
$$\text{Denda} = 5\% \times \text{Tagihan Pokok} \times \text{Jumlah Minggu Keterlambatan}$$

---

## 3. Aturan Autentikasi & RBAC Data Filtering

Backend harus memastikan isolasi data berdasarkan token JWT yang dikirim:

1. **Role ADMIN:**
   - Dapat melihat seluruh data warehouse, slot rak, seluruh customer, seluruh driver, dan seluruh delivery order.
   - Memiliki wewenang alokasi slot, dispatch armada, dan approval invoice.
2. **Role CUSTOMER:**
   - **HANYA DAPAT MELIHAT** barang (`GoodsItem`), riwayat mutasi, delivery order, dan invoice miliknya sendiri (`customerId = req.user.id`).
   - Tidak boleh mengakses data slot rak tenant lain.
3. **Role DRIVER:**
   - **HANYA DAPAT MELIHAT** Delivery Order yang ditugaskan kepadanya (`driverId = req.user.id`).
   - Dapat mengunggah foto POD dan data e-signature untuk DO yang sedang aktif.

---

## 4. Format Pagination, Search & Filtering

Setiap endpoint list (`GET /api/v1/goods`, `GET /api/v1/logistics/orders`, `GET /api/v1/billing/invoices`) harus mendukung parameter standar:

| Parameter | Tipe | Contoh | Deskripsi |
| :--- | :---: | :--- | :--- |
| `page` | number | `?page=1` | Nomor halaman (1-based) |
| `limit` | number | `?limit=10` | Jumlah data per halaman |
| `search` | string | `?search=Wagyu` | Pencarian teks pada barcode, nama, nomor DO/INV |
| `status` | string | `?status=STORED` | Filter status spesifik |
| `sortBy` | string | `?sortBy=createdAt` | Field pengurutan |
| `sortOrder`| string | `?sortOrder=desc` | Arah urutan (`asc` / `desc`) |

---

## 5. Kompatibilitas dengan Kotlin Android Client (Masa Depan)

Karena arsitektur API dirancang **API-First**:
- Mobile Client Android (Kotlin) akan menggunakan endpoint yang **100% sama** dengan Frontend Web.
- Upload foto POD dari mobile dapat dikirim via `multipart/form-data` atau `base64 JSON` sesuai endpoint `POST /api/v1/logistics/orders/:id/pod`.

---

## 6. Status Integrasi API Frontend Phase 12 (100% COMPLETED)

| Sub-Phase | Domain Layanan | Service Terhubung | Status |
| :--- | :--- | :--- | :---: |
| **Phase 12.1** | Authentication & RBAC | `HttpAuthService` $\rightarrow$ `/api/v1/auth/*` | ✅ COMPLETED |
| **Phase 12.2** | Warehouse & Capacity Grid | `HttpWarehouseService` $\rightarrow$ `/api/v1/warehouses/*` | ✅ COMPLETED |
| **Phase 12.3** | Goods & Inventory (Barcode QR) | `HttpGoodsService` $\rightarrow$ `/api/v1/goods/*` | ✅ COMPLETED |
| **Phase 12.4** | Logistics & Fleet (Digital POD) | `HttpLogisticsService` $\rightarrow$ `/api/v1/logistics/*` | ✅ COMPLETED |
| **Phase 12.5** | Billing & Invoicing (Denda 5%) | `HttpBillingService` $\rightarrow$ `/api/v1/billing/*` | ✅ COMPLETED |
| **Phase 12.6** | Telemetry & IoT Sensor Stream | `HttpTelemetryService` $\rightarrow$ `/api/v1/telemetry/*` | ✅ COMPLETED |
| **Phase 12.7** | Full E2E Integration Audit | 41 Frontend Routes & Full Multi-Role Lifecycle | ✅ COMPLETED |

