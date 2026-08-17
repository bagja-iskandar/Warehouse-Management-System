import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('IoT Telemetry & Monitoring Module (e2e)', () => {
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

    // Authenticate admin user
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@wms.id', password: 'Password123!' });
    adminAccessToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    const prisma = app.get<PrismaService>(PrismaService);
    await prisma.storageSlot.update({
      where: { id: 'slot-c01' },
      data: {
        temperatureCelsius: -18.5,
        humidityPercent: 85.0,
      },
    });
    await app.close();
  });

  describe('1. Live Telemetry Monitoring Feed (GET /api/v1/telemetry/monitoring)', () => {
    it('should reject unauthenticated request without token with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/telemetry/monitoring')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return live cold chain monitoring snapshot with summary stats', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/telemetry/monitoring')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data live monitoring telemetri berhasil diambil');
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalMonitoredSensors).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(response.body.data.slots)).toBe(true);
      expect(Array.isArray(response.body.data.vehicles)).toBe(true);

      const coldSlot = response.body.data.slots.find(
        (s: { slotId: string }) => s.slotId === 'slot-c01',
      );
      expect(coldSlot).toBeDefined();
      expect(coldSlot.slotCode).toBe('COLD-A01');
      expect(coldSlot.warehouseCode).toBe('WH-CKG-01');
    });
  });

  describe('2. Sensor Data Ingestion (POST /api/v1/telemetry/ingest)', () => {
    it('should reject ingestion when neither slotId nor vehicleId is supplied', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/telemetry/ingest')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          temperatureCelsius: -19.4,
          humidityPercent: 85.0,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('slotId atau vehicleId');
    });

    it('should record normal cold temperature reading (-19.5 C) with isAnomaly = false', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/telemetry/ingest')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          slotId: 'slot-c01',
          temperatureCelsius: -19.5,
          humidityPercent: 85.0,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.slotId).toBe('slot-c01');
      expect(response.body.data.temperatureCelsius).toBe(-19.5);
      expect(response.body.data.isAnomaly).toBe(false);
    });

    it('should detect temperature anomaly for Cold Storage slot (-13.5 C > -18.0 C)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/telemetry/ingest')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          slotId: 'slot-c01',
          temperatureCelsius: -13.5,
          humidityPercent: 88.0,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isAnomaly).toBe(true);
      expect(response.body.data.temperatureCelsius).toBe(-13.5);
    });

    it('should detect temperature anomaly for Reefer Truck vehicle (-11.0 C > -18.0 C)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/telemetry/ingest')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          vehicleId: 'veh-01',
          temperatureCelsius: -11.0,
          humidityPercent: 80.0,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isAnomaly).toBe(true);
      expect(response.body.data.vehicleId).toBe('veh-01');
    });
  });

  describe('3. Telemetry Logs History (GET /api/v1/telemetry/logs)', () => {
    it('should retrieve paginated telemetry logs with anomaly filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/telemetry/logs?isAnomaly=true&page=1&limit=10')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      for (const log of response.body.data) {
        expect(log.isAnomaly).toBe(true);
      }
    });
  });
});
