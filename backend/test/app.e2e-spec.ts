import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('WMS Backend Foundation (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockResolvedValue(true),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/health/liveness (GET) - should return standard envelope with UP status', async () => {
      const response = await request(app.getHttpServer()).get('/health/liveness').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Liveness check passed');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'UP');
      expect(response.body.data).toHaveProperty('uptimeSeconds');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('timestamp');
    });

    it('/health/readiness (GET) - should return standard envelope with readiness status', async () => {
      const response = await request(app.getHttpServer()).get('/health/readiness').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Readiness check passed');
      expect(response.body.data).toHaveProperty('status', 'UP');
      expect(response.body.data.services).toHaveProperty('database');
      expect(response.body.data.services.database).toHaveProperty('status', 'UP');
    });
  });

  describe('Standard Error Envelope on 404', () => {
    it('/api/v1/non-existent-route (GET) - should return standard error envelope', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('data', null);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('path', '/api/v1/non-existent-route');
      expect(response.body).toHaveProperty('statusCode', 404);
    });
  });
});
