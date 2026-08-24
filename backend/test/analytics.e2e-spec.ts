import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('Analytics Engine (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let customerAccessToken: string;
  let driverAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1', {
      exclude: ['health/(.*)', 'health'],
    });

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

    // Login as Admin
    const adminLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'admin@wms.id',
      password: 'Password123!',
    });
    adminAccessToken = adminLoginRes.body.data.accessToken;

    // Login as Customer
    const customerLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'customer@freshfoods.id',
      password: 'Password123!',
    });
    customerAccessToken = customerLoginRes.body.data.accessToken;

    // Login as Driver
    const driverLoginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: 'driver@wms.id',
      password: 'Password123!',
    });
    driverAccessToken = driverLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/analytics/admin-overview', () => {
    it('should reject unauthenticated request with 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/analytics/admin-overview').expect(401);
    });

    it('should reject non-admin users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/analytics/admin-overview')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(403);
    });

    it('should return admin overview statistics for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/admin-overview')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('warehouse');
      expect(response.body.data).toHaveProperty('goods');
      expect(response.body.data).toHaveProperty('logistics');
      expect(response.body.data).toHaveProperty('billing');
      expect(response.body.data).toHaveProperty('telemetry');
      expect(response.body.data).toHaveProperty('recentActivities');

      // Verify mathematical data types
      expect(typeof response.body.data.warehouse.totalCapacityM3).toBe('number');
      expect(typeof response.body.data.warehouse.utilizationPercent).toBe('number');
      expect(typeof response.body.data.goods.totalSkus).toBe('number');
      expect(typeof response.body.data.billing.paidRevenueRp).toBe('number');
      expect(typeof response.body.data.telemetry.avgColdTempCelsius).toBe('number');
    });

    it('should return warehouse-scoped statistics when warehouseId is specified', async () => {
      // Test Cakung (wh-jkt-central)
      const cakungRes = await request(app.getHttpServer())
        .get('/api/v1/analytics/admin-overview?warehouseId=wh-jkt-central')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(cakungRes.body.data.activeWarehouse).toBeDefined();
      expect(cakungRes.body.data.activeWarehouse.code).toBe('WH-CKG-01');
      expect(cakungRes.body.data.warehouse.totalCapacityM3).toBe(5000);
      expect(cakungRes.body.data.warehouse.usedCapacityM3).toBeGreaterThanOrEqual(3150);

      // Test Gedebage (wh-bdg-01)
      const bandungRes = await request(app.getHttpServer())
        .get('/api/v1/analytics/admin-overview?warehouseId=wh-bdg-01')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(bandungRes.body.data.activeWarehouse).toBeDefined();
      expect(bandungRes.body.data.activeWarehouse.code).toBe('WH-BDG-01');
      expect(bandungRes.body.data.warehouse.totalCapacityM3).toBe(3000);
      expect(bandungRes.body.data.warehouse.usedCapacityM3).toBe(1400);

      // Ensure that metrics for Cakung and Gedebage are distinctly isolated and calculated
      expect(cakungRes.body.data.warehouse.totalCapacityM3).not.toEqual(
        bandungRes.body.data.warehouse.totalCapacityM3,
      );
    });
  });

  describe('GET /api/v1/analytics/customer-summary', () => {
    it('should return customer summary for authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/customer-summary')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('rentedSpaceM3');
      expect(response.body.data).toHaveProperty('usedSpaceM3');
      expect(response.body.data).toHaveProperty('utilizationPercent');
      expect(response.body.data).toHaveProperty('totalSkus');
      expect(response.body.data).toHaveProperty('totalQuantityPackages');
      expect(response.body.data).toHaveProperty('monthlyBillingRp');
      expect(typeof response.body.data.currentTempCelsius).toBe('number');
    });
  });

  describe('GET /api/v1/analytics/driver-summary', () => {
    it('should return driver summary for authenticated driver', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/analytics/driver-summary')
        .set('Authorization', `Bearer ${driverAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('completedTripsCount');
      expect(response.body.data).toHaveProperty('activeTripsCount');
      expect(response.body.data).toHaveProperty('rating');
      expect(response.body.data).toHaveProperty('onTimePerformancePercent');
    });
  });
});
