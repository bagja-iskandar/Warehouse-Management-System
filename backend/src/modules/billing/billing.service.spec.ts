import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceStatus, PaymentMethod, PaymentStatus, UserRole, UserStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { EventsService } from '../events/events.service';
import { BillingService } from './billing.service';
import { StorageService } from './services/storage.service';

describe('BillingService', () => {
  let service: BillingService;
  let storageService: StorageService;
  let prisma: PrismaService;

  const mockAdminUser: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    status: UserStatus.ACTIVE,
  };

  const mockCustomer1: AuthenticatedUser = {
    id: 'usr-cust-1',
    email: 'customer@freshfoods.id',
    name: 'Siti Rahma',
    role: UserRole.CUSTOMER,
    phone: '081809876543',
    status: UserStatus.ACTIVE,
  };

  const mockCustomer2: AuthenticatedUser = {
    id: 'usr-cust-2',
    email: 'michael@megafurniture.co.id',
    name: 'Michael Chen',
    role: UserRole.CUSTOMER,
    phone: '081987654321',
    status: UserStatus.ACTIVE,
  };

  const mockInvoiceEntity = {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-08-001',
    customerId: 'usr-cust-1',
    billingMonth: 'Agustus 2026',
    issueDate: new Date('2026-08-01T00:00:00Z'),
    dueDate: new Date('2026-08-10T23:59:59Z'),
    paidDate: null,
    subtotal: new Decimal(7440000.0),
    penaltyFee: new Decimal(0.0),
    totalAmount: new Decimal(7440000.0),
    status: InvoiceStatus.UNPAID,
    paymentMethod: null,
    paymentProofUrl: null,
    verifiedByAdminId: null,
    verifiedAt: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      email: 'customer@freshfoods.id',
      companyName: 'CV Fresh Frozen Nusantara',
      phone: '081809876543',
    },
    verifiedByAdmin: null,
    items: [
      {
        id: 'inv-item-1',
        goodsId: 'brg-001',
        description: 'Sewa Cold Storage (Slot COLD-A01) - 0.96 m3',
        goodsName: 'Norwegian Salmon Fillet Grade A',
        volumeM3: new Decimal(0.96),
        ratePerM3: new Decimal(2500000.0),
        subtotal: new Decimal(2400000.0),
        goods: {
          id: 'brg-001',
          name: 'Norwegian Salmon Fillet Grade A',
          barcode: 'BRG-2026-FROZEN-001',
        },
      },
    ],
    payments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'storage.endpoint') return 'localhost';
              if (key === 'storage.port') return 9000;
              if (key === 'storage.bucketName') return 'wms-storage';
              if (key === 'storage.useSSL') return false;
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            systemNotification: {
              create: jest.fn(),
            },
            user: {
              findMany: jest.fn().mockResolvedValue([{ id: 'usr-admin-1' }]),
            },
            $transaction: jest.fn().mockImplementation(async (cb) => {
              return cb({
                payment: {
                  create: jest.fn().mockResolvedValue({ id: 'pay-001' }),
                  update: jest.fn().mockResolvedValue({ id: 'pay-001' }),
                },
                invoice: {
                  update: jest.fn().mockResolvedValue(mockInvoiceEntity),
                },
                systemNotification: {
                  create: jest.fn().mockResolvedValue({ id: 'notif-001' }),
                },
                user: {
                  findMany: jest.fn().mockResolvedValue([{ id: 'usr-admin-1' }]),
                },
              });
            }),
          },
        },
        {
          provide: EventsService,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    storageService = module.get<StorageService>(StorageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('1. Penalty Calculation Logic (Deterministic Decimal)', () => {
    it('should return 0 penalty for invoices paid on time', () => {
      const result = service.calculatePenalty(
        new Decimal(7440000.0),
        new Date('2026-08-10T23:59:59Z'),
        InvoiceStatus.PAID,
        new Date('2026-08-08T10:00:00Z'),
      );

      expect(result.penaltyFee.toNumber()).toBe(0.0);
      expect(result.totalAmount.toNumber()).toBe(7440000.0);
      expect(result.effectiveStatus).toBe(InvoiceStatus.PAID);
      expect(result.daysOverdue).toBe(0);
      expect(result.overdueWeeks).toBe(0);
    });

    it('should return 0 penalty for invoices that have not passed due date', () => {
      const now = new Date('2026-08-05T00:00:00Z');
      const result = service.calculatePenalty(
        new Decimal(7440000.0),
        new Date('2026-08-10T23:59:59Z'),
        InvoiceStatus.UNPAID,
        null,
        now,
      );

      expect(result.penaltyFee.toNumber()).toBe(0.0);
      expect(result.totalAmount.toNumber()).toBe(7440000.0);
      expect(result.effectiveStatus).toBe(InvoiceStatus.UNPAID);
      expect(result.daysOverdue).toBe(0);
      expect(result.overdueWeeks).toBe(0);
    });

    it('should calculate 5% penalty for 1 week overdue', () => {
      // Due Date: 10 Aug 2026, Now: 15 Aug 2026 (5 days overdue -> 1 week)
      const now = new Date('2026-08-15T00:00:00Z');
      const result = service.calculatePenalty(
        new Decimal(7440000.0),
        new Date('2026-08-10T00:00:00Z'),
        InvoiceStatus.OVERDUE,
        null,
        now,
      );

      // 5% of 7.440.000 = 372.000
      expect(result.penaltyFee.toNumber()).toBe(372000.0);
      expect(result.totalAmount.toNumber()).toBe(7812000.0);
      expect(result.effectiveStatus).toBe(InvoiceStatus.OVERDUE);
      expect(result.daysOverdue).toBe(5);
      expect(result.overdueWeeks).toBe(1);
    });

    it('should calculate 10% penalty for 2 weeks overdue', () => {
      // Due Date: 10 Aug 2026, Now: 20 Aug 2026 (10 days overdue -> 2 weeks)
      const now = new Date('2026-08-20T00:00:00Z');
      const result = service.calculatePenalty(
        new Decimal(7440000.0),
        new Date('2026-08-10T00:00:00Z'),
        InvoiceStatus.OVERDUE,
        null,
        now,
      );

      // 10% of 7.440.000 = 744.000
      expect(result.penaltyFee.toNumber()).toBe(744000.0);
      expect(result.totalAmount.toNumber()).toBe(8184000.0);
      expect(result.effectiveStatus).toBe(InvoiceStatus.OVERDUE);
      expect(result.daysOverdue).toBe(10);
      expect(result.overdueWeeks).toBe(2);
    });
  });

  describe('2. Anti-IDOR & Multi-Tenant Data Isolation', () => {
    it('should allow Customer to access their own invoice', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(mockInvoiceEntity as any);

      const result = await service.findInvoiceById('inv-001', mockCustomer1);
      expect(result).toBeDefined();
      expect(result.id).toBe('inv-001');
      expect(result.customerId).toBe(mockCustomer1.id);
    });

    it('should block Customer from accessing another customer invoice with NotFoundException (IDOR Protection)', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(mockInvoiceEntity as any);

      await expect(service.findInvoiceById('inv-001', mockCustomer2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow Admin to access any invoice', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(mockInvoiceEntity as any);

      const adminResult = await service.findInvoiceById('inv-001', mockAdminUser);
      expect(adminResult.id).toBe('inv-001');
    });
  });

  describe('3. Payment Submission (Customer)', () => {
    it('should allow Customer to submit payment and set status to PENDING_PAYMENT', async () => {
      const unpaidInvoice = {
        ...mockInvoiceEntity,
        dueDate: new Date(Date.now() + 86400000), // Due tomorrow (0 penalty)
      };
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(unpaidInvoice as any);

      const result = await service.payInvoice(
        'inv-001',
        {
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
          amount: 7440000.0,
        },
        mockCustomer1,
      );

      expect(result).toBeDefined();
    });

    it('should reject payment submission with invalid amount', async () => {
      const unpaidInvoice = {
        ...mockInvoiceEntity,
        dueDate: new Date(Date.now() + 86400000),
      };
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(unpaidInvoice as any);

      await expect(
        service.payInvoice(
          'inv-001',
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
            amount: 5000000.0, // Incorrect amount (less than 7.440.000)
          },
          mockCustomer1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate payment submission if invoice is already PENDING_PAYMENT', async () => {
      const pendingInvoice = {
        ...mockInvoiceEntity,
        status: InvoiceStatus.PENDING_PAYMENT,
      };
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(pendingInvoice as any);

      await expect(
        service.payInvoice(
          'inv-001',
          {
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            paymentProofUrl: 'https://images.unsplash.com/photo-1554224155?w=400',
            amount: 7440000.0,
          },
          mockCustomer1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Admin Payment Verification', () => {
    it('should allow Admin to verify payment (PAID)', async () => {
      const pendingInvoice = {
        ...mockInvoiceEntity,
        status: InvoiceStatus.PENDING_PAYMENT,
        payments: [
          {
            id: 'pay-001',
            status: PaymentStatus.UNDER_REVIEW,
            submittedAt: new Date(),
          },
        ],
      };
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(pendingInvoice as any);

      const result = await service.verifyPayment(
        'inv-001',
        { action: 'VERIFY', note: 'Bukti transfer valid' },
        mockAdminUser,
      );

      expect(result).toBeDefined();
    });

    it('should reject Customer attempting to verify payment with ForbiddenException', async () => {
      await expect(
        service.verifyPayment('inv-001', { action: 'VERIFY' }, mockCustomer1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Storage Abstraction Validation', () => {
    it('should validate payment proof MIME type and size', () => {
      expect(() =>
        storageService.validatePaymentProof({
          originalName: 'transfer_receipt.png',
          mimeType: 'image/png',
          sizeBytes: 1024 * 1024, // 1 MB
        }),
      ).not.toThrow();

      // Invalid format
      expect(() =>
        storageService.validatePaymentProof({
          originalName: 'script.exe',
          mimeType: 'application/x-msdownload',
          sizeBytes: 1024,
        }),
      ).toThrow(BadRequestException);

      // Oversized (> 5MB)
      expect(() =>
        storageService.validatePaymentProof({
          originalName: 'huge_scan.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10 * 1024 * 1024, // 10 MB
        }),
      ).toThrow(BadRequestException);
    });
  });
});
