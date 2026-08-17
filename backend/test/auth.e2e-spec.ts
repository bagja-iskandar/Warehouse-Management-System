import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

describe('Auth & RBAC Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replicate main.ts bootstrap configurations
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Login (POST /api/v1/auth/login)', () => {
    it('should authenticate Admin user and return valid JWT tokens and user profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@wms.id',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login berhasil');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.expiresIn).toBe(900);
      expect(response.body.data.user.email).toBe('admin@wms.id');
      expect(response.body.data.user.role).toBe('ADMIN');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should authenticate Customer user and return customer role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@freshfoods.id',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('CUSTOMER');
    });

    it('should authenticate Driver user and return driver role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'driver@wms.id',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('DRIVER');
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@wms.id',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Email atau password salah');
    });

    it('should return 401 Unauthorized for non-existent user email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent.user@wms.id',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('should return 400 Bad Request when request body is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('2. Protected Session Profile (GET /api/v1/auth/me)', () => {
    let adminAccessToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'admin@wms.id',
        password: 'Password123!',
      });
      adminAccessToken = loginRes.body.data.accessToken;
    });

    it('should return user profile when valid Bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('usr-admin-1');
      expect(response.body.data.email).toBe('admin@wms.id');
      expect(response.body.data.role).toBe('ADMIN');
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 Unauthorized when no token is provided', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('should return 401 Unauthorized when malformed token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.structure')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('3. Token Rotation Flow (POST /api/v1/auth/refresh)', () => {
    let initialRefreshToken: string;
    let newAccessToken: string;
    let newRefreshToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'customer@freshfoods.id',
        password: 'Password123!',
      });
      initialRefreshToken = loginRes.body.data.refreshToken;
    });

    it('should successfully issue a new token pair given a valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: initialRefreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      newAccessToken = response.body.data.accessToken;
      newRefreshToken = response.body.data.refreshToken;
    });

    it('should allow access to protected endpoint with newly issued access token', async () => {
      expect(newRefreshToken).toBeDefined();
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('customer@freshfoods.id');
    });

    it('should reject already used/rotated refresh token (Token Rotation Security)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: initialRefreshToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('should reject tampered or invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'tampered.refresh.token',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });
  });

  describe('4. Logout & Session Invalidation (POST /api/v1/auth/logout)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'driver@wms.id',
        password: 'Password123!',
      });
      accessToken = loginRes.body.data.accessToken;
      refreshToken = loginRes.body.data.refreshToken;
    });

    it('should successfully logout and revoke session token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('berhasil');
    });

    it('should reject refresh token that was revoked on logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });
  });
});
