import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

describe('Goods & Inventory Module (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let customer1AccessToken: string;
  let customer2AccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformResponseInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    // 1. Authenticate Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@wms.id', password: 'Password123!' });
    adminAccessToken = adminLogin.body.data.accessToken;

    // 2. Authenticate Customer 1 (Fresh Foods)
    const cust1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@freshfoods.id', password: 'Password123!' });
    customer1AccessToken = cust1Login.body.data.accessToken;

    // 3. Authenticate Customer 2 (Mega Furniture)
    const cust2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'michael@megafurniture.co.id', password: 'Password123!' });
    customer2AccessToken = cust2Login.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Inventory Directory (GET /api/v1/goods)', () => {
    it('should reject unauthenticated request without token with 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/goods').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('should allow Admin to see all goods across all customers with pagination metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data barang berhasil diambil');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);

      // Verify pagination meta
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.totalItems).toBeGreaterThanOrEqual(4);
    });

    it('should enforce Tenant Isolation: Customer 1 only sees their own goods', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      for (const item of response.body.data) {
        expect(item.customerId).toBe('usr-cust-1');
      }
    });

    it('should filter goods by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods?category=FURNITURE')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      for (const item of response.body.data) {
        expect(item.category).toBe('FURNITURE');
      }
    });

    it('should filter goods by search query on name or barcode', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods?search=Wagyu')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].barcode).toBe('BRG-2026-FROZEN-002');
    });

    it('should support pagination with page and limit query params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods?page=1&limit=2')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });
  });

  describe('2. Goods Creation & Server-Side Calculations (POST /api/v1/goods)', () => {
    it('should create new goods item with server-side volume calculation (P x L x T / 10^6 x Qty)', async () => {
      // 100cm x 50cm x 40cm = 200,000 cm3 = 0.20 m3 per item.
      // Qty 5 -> Total Volume = 1.00 m3
      const response = await request(app.getHttpServer())
        .post('/api/v1/goods')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          name: 'Frozen Tuna Loin Export Quality',
          category: 'COLD_FOOD',
          description: 'Tuna beku grade sashimi kemasan karton vacuum.',
          lengthCm: 100,
          widthCm: 50,
          heightCm: 40,
          weightKg: 250,
          quantity: 5,
          unit: 'Carton Box',
          requiresColdStorage: true,
          warehouseId: 'wh-jkt-central',
          pickupRequired: true,
          pickupAddress: 'Pelabuhan Perikanan Muara Baru Kav. 5, Jakarta Utara',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('berhasil');
      expect(response.body.data.id).toBeDefined();

      expect(response.body.data.customerId).toBe('usr-cust-1');
      expect(response.body.data.dimensions.volumeM3).toBe(1.0);
      expect(response.body.data.quantity).toBe(5);
      expect(response.body.data.status).toBe('PENDING_PICKUP');
      expect(response.body.data.barcode).toMatch(/^BRG-2026-FROZEN-/);
      expect(response.body.data.qrCodeData).toContain('WMS://ITEM/');
      expect(response.body.data.monthlyRentalFee).toBeGreaterThanOrEqual(2500000);

      // Verify audit mutation was created
      expect(response.body.data.history).toHaveLength(1);
      expect(response.body.data.history[0].status).toBe('PENDING_PICKUP');
    });

    it('should enforce customer ownership even if client attempts to pass another customerId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/goods')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          name: 'Hacked Item Attempt',
          category: 'FURNITURE',
          description: 'Attempting to inject customer 2 ownership',
          lengthCm: 50,
          widthCm: 50,
          heightCm: 50,
          weightKg: 10,
          quantity: 1,
          unit: 'Pcs',
          warehouseId: 'wh-jkt-central',
          customerId: 'usr-cust-2', // Customer 1 trying to forge Customer 2's ID
        })
        .expect(201);

      // Must be forced to Customer 1's ID ('usr-cust-1')
      expect(response.body.data.customerId).toBe('usr-cust-1');
    });

    it('should reject creation with non-existent warehouse with 404', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/goods')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          name: 'Invalid Warehouse Item',
          category: 'FURNITURE',
          description: 'Testing non-existent warehouse',
          lengthCm: 50,
          widthCm: 50,
          heightCm: 50,
          weightKg: 10,
          quantity: 1,
          unit: 'Pcs',
          warehouseId: 'non-existent-warehouse-uuid',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('3. Controlled State Machine & Slot Allocation (PATCH /api/v1/goods/:id/status)', () => {
    let testGoodsId: string;

    beforeAll(async () => {
      // Create a fresh test goods in DRAFT state
      const res = await request(app.getHttpServer())
        .post('/api/v1/goods')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          name: 'State Machine Test Cargo',
          category: 'COLD_FOOD',
          description: 'Testing controlled transitions',
          lengthCm: 100,
          widthCm: 100,
          heightCm: 100,
          weightKg: 100,
          quantity: 1,
          unit: 'Pallet',
          requiresColdStorage: true,
          warehouseId: 'wh-jkt-central',
          pickupRequired: false, // Starts as DRAFT
        });
      testGoodsId = res.body.data.id;
    });

    it('should reject arbitrary state transition jumping (e.g. DRAFT -> DELIVERED) with 400', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'DELIVERED' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('tidak diizinkan');
    });

    it('should reject Customer attempting to transition status to STORED with 403 Forbidden', async () => {
      // Transition from DRAFT to PENDING_PICKUP first
      await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ status: 'PENDING_PICKUP' })
        .expect(200);

      // Customer trying to jump to STORED
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ status: 'STORED', slotId: 'slot-c03' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });

    it('should transition through full lifecycle: PENDING_PICKUP -> IN_TRANSIT_INBOUND -> INSPECTING -> STORED', async () => {
      // Step 1: Inbound transit
      await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'IN_TRANSIT_INBOUND' })
        .expect(200);

      // Step 2: Inspecting at warehouse
      await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'INSPECTING' })
        .expect(200);

      // Step 3: Admin allocates available Cold Slot 'slot-c03' (COLD-A03) and sets STORED
      const storedRes = await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          status: 'STORED',
          slotId: 'slot-c03',
          note: 'Inspeksi suhu memenuhi syarat (-19.0 C). Ditempatkan di Slot COLD-A03.',
        })
        .expect(200);

      expect(storedRes.body.data.status).toBe('STORED');
      expect(storedRes.body.data.slot.code).toBe('COLD-A03');
      expect(storedRes.body.data.history.length).toBeGreaterThanOrEqual(4);
    });

    it('should transition to DELIVERED and free up storage capacity', async () => {
      // STORED -> PENDING_DELIVERY
      await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ status: 'PENDING_DELIVERY' })
        .expect(200);

      // PENDING_DELIVERY -> IN_TRANSIT_OUTBOUND
      await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'IN_TRANSIT_OUTBOUND' })
        .expect(200);

      // IN_TRANSIT_OUTBOUND -> DELIVERED
      const deliveredRes = await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'DELIVERED', note: 'Serah terima kargo selesai.' })
        .expect(200);

      expect(deliveredRes.body.data.status).toBe('DELIVERED');
    });

    it('should enforce Anti-IDOR: Customer 2 cannot update status of Customer 1 goods', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/goods/${testGoodsId}/status`)
        .set('Authorization', `Bearer ${customer2AccessToken}`)
        .send({ status: 'CANCELLED' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('4. Goods Detail & Audit History (GET /api/v1/goods/:id)', () => {
    it('should return detailed goods with warehouse, slot, customer, and history for Admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods/brg-001')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Detail data barang berhasil diambil');
      expect(response.body.data.id).toBe('brg-001');
      expect(response.body.data.barcode).toBe('BRG-2026-FROZEN-001');

      expect(response.body.data.warehouse).toBeDefined();
      expect(response.body.data.slot).toBeDefined();
      expect(response.body.data.customer).toBeDefined();
      expect(Array.isArray(response.body.data.history)).toBe(true);
    });

    it('should allow Customer 1 to view their own goods detail', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods/brg-001')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('brg-001');
    });

    it('should enforce Anti-IDOR: Customer 2 cannot access Customer 1 goods and gets 404', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/goods/brg-001')
        .set('Authorization', `Bearer ${customer2AccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });
  });
});
