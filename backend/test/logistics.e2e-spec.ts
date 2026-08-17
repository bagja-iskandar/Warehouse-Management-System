import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

describe('Logistics & Fleet Management Module (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let customer1AccessToken: string;
  let customer2AccessToken: string;
  let driverAccessToken: string;

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

    // Authenticate users
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@wms.id', password: 'Password123!' });
    adminAccessToken = adminLogin.body.data.accessToken;

    const cust1Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@freshfoods.id', password: 'Password123!' });
    customer1AccessToken = cust1Login.body.data.accessToken;

    const cust2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'michael@megafurniture.co.id', password: 'Password123!' });
    customer2AccessToken = cust2Login.body.data.accessToken;

    const driverLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'driver@wms.id', password: 'Password123!' });
    driverAccessToken = driverLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Fleet & Vehicle Directory (GET /api/v1/logistics/vehicles)', () => {
    it('should reject unauthenticated request without token with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/logistics/vehicles')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return list of all vehicles from PostgreSQL with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/logistics/vehicles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daftar armada kendaraan berhasil diambil');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);

      const reefer = response.body.data.find(
        (v: { plateNumber: string }) => v.plateNumber === 'B 9821 WMS',
      );
      expect(reefer).toBeDefined();
      expect(reefer.type).toBe('REEFER_TRUCK');
      expect(reefer.hasRefrigeration).toBe(true);
      expect(reefer.maxWeightKg).toBe(5000);
    });
  });

  describe('2. Driver Vehicle Assignment (POST /api/v1/logistics/vehicles/assign)', () => {
    it('should allow Admin to assign driver to vehicle', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/logistics/vehicles/assign')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          vehicleId: 'veh-01',
          driverId: 'usr-driver-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentDriverId).toBe('usr-driver-1');
      expect(response.body.data.status).toBe('IN_SERVICE');
    });

    it('should reject Customer attempting to assign driver with 403 Forbidden', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/logistics/vehicles/assign')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          vehicleId: 'veh-01',
          driverId: 'usr-driver-1',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });
  });

  describe('3. Delivery Orders Creation & Reefer Validation (POST /api/v1/logistics/orders)', () => {
    let testOrderId: string;

    it('should reject non-reefer vehicle when goods require Cold Storage', async () => {
      // veh-02 is a Dry Box Truck Small / Van without refrigeration
      const response = await request(app.getHttpServer())
        .post('/api/v1/logistics/orders')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          type: 'PICKUP',
          goodsItemIds: ['brg-001'], // Salmon (Cold Storage)
          originAddress: 'Kavling Cold Chain Sudirman',
          originCity: 'Jakarta Selatan',
          destinationAddress: 'Gudang Utama Cakung',
          destinationCity: 'Jakarta Timur',
          scheduledDate: '2026-08-01',
          scheduledTimeSlot: '08:00 - 12:00 WIB',
          vehicleId: 'veh-02', // Non-reefer truck
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Reefer');
    });

    it('should create delivery order successfully with Reefer Truck', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/logistics/orders')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          type: 'PICKUP',
          goodsItemIds: ['brg-001'],
          originAddress: 'Kavling Cold Chain Sudirman',
          originCity: 'Jakarta Selatan',
          destinationAddress: 'Gudang Utama Cakung',
          destinationCity: 'Jakarta Timur',
          scheduledDate: '2026-08-01',
          scheduledTimeSlot: '08:00 - 12:00 WIB',
          vehicleId: 'veh-01',
          driverId: 'usr-driver-1',
          distanceKm: 28.5,
          estimatedDurationMins: 60,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      testOrderId = response.body.data.id;
      expect(response.body.data.orderNumber).toMatch(/^ORD-2026-/);
      expect(response.body.data.customerId).toBe('usr-cust-1');
      expect(response.body.data.requiresReefer).toBe(true);
      expect(response.body.data.totalWeightKg).toBe(450);
      expect(response.body.data.status).toBe('DRIVER_ASSIGNED');
    });

    it('should enforce Tenant Isolation: Customer 1 only sees their own delivery orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/logistics/orders')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      for (const order of response.body.data) {
        expect(order.customerId).toBe('usr-cust-1');
      }
    });

    it('should progress state machine: DRIVER_ASSIGNED -> EN_ROUTE_PICKUP -> PICKED_UP -> IN_TRANSIT -> ARRIVED_DESTINATION', async () => {
      // Step 1: EN_ROUTE_PICKUP
      await request(app.getHttpServer())
        .patch(`/api/v1/logistics/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .send({ status: 'EN_ROUTE_PICKUP' })
        .expect(200);

      // Step 2: PICKED_UP
      await request(app.getHttpServer())
        .patch(`/api/v1/logistics/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .send({ status: 'PICKED_UP' })
        .expect(200);

      // Step 3: IN_TRANSIT
      await request(app.getHttpServer())
        .patch(`/api/v1/logistics/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .send({ status: 'IN_TRANSIT' })
        .expect(200);

      // Step 4: ARRIVED_DESTINATION
      const arrivedRes = await request(app.getHttpServer())
        .patch(`/api/v1/logistics/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .send({ status: 'ARRIVED_DESTINATION' })
        .expect(200);

      expect(arrivedRes.body.data.status).toBe('ARRIVED_DESTINATION');
    });

    it('should upload Digital POD and complete delivery order', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/logistics/orders/${testOrderId}/pod`)
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .send({
          proofOfDeliveryUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
          recipientName: 'Bpk. Ahmad Subarjo',
          recipientSignature: 'data:image/svg+xml;utf8,<svg>signature</svg>',
          driverRating: 5.0,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DELIVERED');
      expect(response.body.data.recipientName).toBe('Bpk. Ahmad Subarjo');
      expect(response.body.data.driverRating).toBe(5.0);
    });

    it('should enforce Anti-IDOR: Customer 2 cannot access Customer 1 delivery order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/logistics/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customer2AccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });
  });
});
