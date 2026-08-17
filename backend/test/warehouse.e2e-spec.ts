import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

describe('Warehouse Module (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;

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

    // Authenticate Admin to obtain Bearer token for protected routes
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@wms.id',
      password: 'Password123!',
    });
    adminAccessToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Warehouse Directory (GET /api/v1/warehouses)', () => {
    it('should reject unauthenticated request without token with 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/warehouses').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('should return list of all warehouses from PostgreSQL with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daftar fasilitas gudang berhasil diambil');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const cakungWh = response.body.data.find((wh: { code: string }) => wh.code === 'WH-CKG-01');
      expect(cakungWh).toBeDefined();
      expect(cakungWh.name).toContain('Cakung');
      expect(cakungWh.city).toBe('Jakarta Timur');
      expect(cakungWh.totalCapacityM3).toBe(5000);
      expect(cakungWh.usedCapacityM3).toBeGreaterThanOrEqual(3150);
      expect(cakungWh.occupancyPercent).toBeGreaterThanOrEqual(63);
      expect(cakungWh.slotsCount).toBeGreaterThanOrEqual(6);
      expect(cakungWh.zones.coldStorageCapacityM3).toBe(1500);
      expect(cakungWh.zones.standardCapacityM3).toBe(3500);
    });

    it('should filter warehouses by city parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses?city=Bandung')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].city).toBe('Bandung');
      expect(response.body.data[0].code).toBe('WH-BDG-01');
    });

    it('should filter warehouses by search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses?search=Gedebage')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toContain('Gedebage');
    });
  });

  describe('2. Warehouse Detail & 3D Slots (GET /api/v1/warehouses/:id)', () => {
    it('should return detailed warehouse with zones and slots for valid ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses/wh-jkt-central')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Detail fasilitas gudang berhasil diambil');
      expect(response.body.data.id).toBe('wh-jkt-central');
      expect(response.body.data.code).toBe('WH-CKG-01');

      // Verify zone details
      expect(Array.isArray(response.body.data.zoneDetails)).toBe(true);
      expect(response.body.data.zoneDetails.length).toBeGreaterThanOrEqual(2);

      // Verify slots
      expect(Array.isArray(response.body.data.slots)).toBe(true);
      const coldSlot = response.body.data.slots.find(
        (s: { code: string }) => s.code === 'COLD-A01',
      );
      expect(coldSlot).toBeDefined();
      expect(coldSlot.zone).toBe('COLD_STORAGE');
      expect(typeof coldSlot.temperatureCelsius).toBe('number');
      expect(coldSlot.temperatureCelsius).toBeLessThanOrEqual(0);
      expect(coldSlot.status).toBe('OCCUPIED');
      expect(coldSlot.currentGoodsCount).toBeGreaterThanOrEqual(1);
      expect(coldSlot.currentGoodsIds).toContain('brg-001');
    });

    it('should return detailed warehouse when queried by Code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses/WH-BDG-01')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.code).toBe('WH-BDG-01');
      expect(response.body.data.city).toBe('Bandung');
    });

    it('should return 404 Not Found for non-existent warehouse ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/warehouses/non-existent-warehouse-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('tidak ditemukan');
    });
  });
});
