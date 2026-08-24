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

  describe('5. Customer Registration (POST /api/v1/auth/register)', () => {
    const timestamp = Date.now();
    const uniqueEmail = `test.customer.${timestamp}@wmsnutantara.id`;

    it('should successfully register a new customer and return JWT tokens with CUSTOMER role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Hendra Pratama QA',
          email: uniqueEmail,
          phone: '081299887766',
          companyName: 'PT Agri Fresh Nusantara',
          address: 'Jl. Daan Mogot KM 12, Jakarta Barat',
          password: 'Password123!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registrasi customer berhasil');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(uniqueEmail);
      expect(response.body.data.user.role).toBe('CUSTOMER');
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 409 Conflict when attempting to register with an existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Hendra Duplicate',
          email: uniqueEmail,
          phone: '081299887766',
          companyName: 'PT Duplicate Corp',
          address: 'Jakarta',
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('sudah terdaftar');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'invalid-email-format',
          phone: '081299887766',
          companyName: 'PT Test',
          address: 'Jakarta',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 Bad Request when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'missing.fields@wms.id',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 Bad Request for weak/short password (< 6 characters)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Weak Pass User',
          email: `weak.${Date.now()}@wms.id`,
          phone: '081299887766',
          companyName: 'PT Test',
          address: 'Jakarta',
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('6. User Profile Management (PATCH /api/v1/users/:id/profile)', () => {
    let customerAccessToken: string;
    let customerUserId: string;
    let adminAccessToken: string;

    beforeAll(async () => {
      // Register a dedicated user for profile update tests to avoid mutating shared seed records
      const profileUserEmail = `profile.test.${Date.now()}@test.wms.id`;
      const custReg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        name: 'Profile Test Customer',
        email: profileUserEmail,
        phone: '081299887766',
        companyName: 'PT Fresh Foods Indonesia',
        address: 'Jakarta Barat',
        password: 'Password123!',
      });
      customerAccessToken = custReg.body.data.accessToken;
      customerUserId = custReg.body.data.user.id;

      const adminLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'admin@wms.id',
        password: 'Password123!',
      });
      adminAccessToken = adminLogin.body.data.accessToken;
    });

    it('should successfully update own profile data', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${customerUserId}/profile`)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          name: 'Hendra Prasetya Updated',
          companyName: 'PT Fresh Foods Indonesia Tbk',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Hendra Prasetya Updated');
      expect(response.body.data.companyName).toBe('PT Fresh Foods Indonesia Tbk');
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 403 Forbidden when Customer tries to modify another user profile', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/usr-admin-1/profile')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          name: 'Hacked Admin Name',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });

    it('should allow Admin to update any user profile', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${customerUserId}/profile`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          address: 'Updated by Admin Support',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address).toBe('Updated by Admin Support');
    });

    it('should return 400 Bad Request when attempting to pass illegal fields (e.g. role, password)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${customerUserId}/profile`)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          role: 'ADMIN',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });
  });

  describe('7. Change Password Flow (POST /api/v1/auth/change-password)', () => {
    let tempUserEmail: string;
    let tempUserAccessToken: string;

    beforeAll(async () => {
      tempUserEmail = `changepass.${Date.now()}@test.wms.id`;
      const regRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        name: 'Pass Change User',
        email: tempUserEmail,
        phone: '081211112222',
        companyName: 'PT Change Password Corp',
        address: 'Jakarta',
        password: 'OldPassword123!',
      });
      tempUserAccessToken = regRes.body.data.accessToken;
    });

    it('should return 401 Unauthorized for wrong current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tempUserAccessToken}`)
        .send({
          currentPassword: 'WrongOldPassword!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('tidak valid');
    });

    it('should return 400 Bad Request if new password is same as current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tempUserAccessToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toContain('sama dengan password lama');
    });

    it('should successfully change password with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${tempUserAccessToken}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('berhasil diperbarui');
    });

    it('should allow login with new password and reject old password', async () => {
      // Old password should fail
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: tempUserEmail,
          password: 'OldPassword123!',
        })
        .expect(401);

      // New password should succeed
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: tempUserEmail,
          password: 'BrandNewPassword123!',
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe(tempUserEmail);
    });
  });

  describe('8. Role-Based Access Control (RBAC)', () => {
    let adminToken: string;
    let customerToken: string;
    let driverToken: string;

    beforeAll(async () => {
      const [adminRes, custRes, driverRes] = await Promise.all([
        request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'admin@wms.id',
          password: 'Password123!',
        }),
        request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'customer@freshfoods.id',
          password: 'Password123!',
        }),
        request(app.getHttpServer()).post('/api/v1/auth/login').send({
          email: 'driver@wms.id',
          password: 'Password123!',
        }),
      ]);

      adminToken = adminRes.body.data.accessToken;
      customerToken = custRes.body.data.accessToken;
      driverToken = driverRes.body.data.accessToken;
    });

    it('should allow Admin to view user list (GET /api/v1/users)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 Forbidden when Customer tries to view user list (GET /api/v1/users)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });

    it('should return 403 Forbidden when Driver tries to view user list (GET /api/v1/users)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });
  });
});
