import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('Billing & Penalty Module (e2e)', () => {
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

    // Reset inv-001 state in database for clean repeatable test runs
    const prisma = app.get<PrismaService>(PrismaService);
    await prisma.invoice.update({
      where: { id: 'inv-001' },
      data: {
        status: 'OVERDUE',
        paidDate: null,
        paymentMethod: null,
        paymentProofUrl: null,
        verifiedByAdminId: null,
        verifiedAt: null,
      },
    });
  });

  afterAll(async () => {
    const prisma = app.get<PrismaService>(PrismaService);
    await prisma.invoice.update({
      where: { id: 'inv-001' },
      data: {
        status: 'OVERDUE',
        paidDate: null,
        paymentMethod: null,
        paymentProofUrl: null,
        verifiedByAdminId: null,
        verifiedAt: null,
      },
    });
    await app.close();
  });

  describe('1. Invoice Directory & Queries (GET /api/v1/billing/invoices)', () => {
    it('should reject unauthenticated request without token with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow Admin to view all invoices from PostgreSQL', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices?limit=100')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Daftar faktur tagihan berhasil diambil');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const inv1 = response.body.data.find((inv: { id: string }) => inv.id === 'inv-001');
      expect(inv1).toBeDefined();
      expect(inv1.invoiceNumber).toBe('INV-2026-08-001');
      expect(inv1.subtotal).toBe(7440000);
    });

    it('should enforce Tenant Isolation: Customer 1 only sees their own invoices', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      for (const invoice of response.body.data) {
        expect(invoice.customerId).toBe('usr-cust-1');
      }
    });

    it('should enforce Anti-IDOR: Customer 2 cannot access Customer 1 invoice detail', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices/inv-001')
        .set('Authorization', `Bearer ${customer2AccessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });

    it('should return invoice detail with items and penalty calculations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices/inv-001')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('inv-001');
      expect(response.body.data.customer.name).toContain('Siti Rahma');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.subtotal).toBe(7440000);
      expect(response.body.data.totalAmount).toBeGreaterThanOrEqual(7440000);
    });
  });

  describe('2. Payment Submission & Admin Verification Lifecycle', () => {
    let currentTotalAmount: number;

    it('should reject payment submission with incorrect amount', async () => {
      // First get current totalAmount
      const detailRes = await request(app.getHttpServer())
        .get('/api/v1/billing/invoices/inv-001')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .expect(200);

      currentTotalAmount = detailRes.body.data.totalAmount;

      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/invoices/inv-001/pay')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
          paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
          amount: currentTotalAmount - 500000, // Invalid amount
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tidak sesuai');
    });

    it('should allow Customer to submit exact payment amount with proof URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/invoices/inv-001/pay')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
          paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
          amount: currentTotalAmount,
          paymentReference: 'VA-BCA-9920192831',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PENDING_PAYMENT');
      expect(response.body.data.paymentProofUrl).toBeDefined();
    });

    it('should reject duplicate payment submission when invoice is PENDING_PAYMENT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/billing/invoices/inv-001/pay')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({
          paymentMethod: 'VIRTUAL_ACCOUNT',
          paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
          amount: currentTotalAmount,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('review');
    });

    it('should reject Customer attempting to verify payment with 403 Forbidden', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/billing/invoices/inv-001/verify')
        .set('Authorization', `Bearer ${customer1AccessToken}`)
        .send({ action: 'VERIFY' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });

    it('should allow Admin to verify payment and mark invoice as PAID', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/billing/invoices/inv-001/verify')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          action: 'VERIFY',
          note: 'Dana transfer masuk ke rekening operasional BCA WMS',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAID');
      expect(response.body.data.paidDate).toBeDefined();
      expect(response.body.data.verifiedByAdminName).toBeDefined();
    });
  });
});
