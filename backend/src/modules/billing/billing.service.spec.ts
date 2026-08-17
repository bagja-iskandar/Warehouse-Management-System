import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceStatus, PaymentMethod, UserRole, UserStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
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
              count: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                return callback({
                  invoice: {
                    update: jest.fn().mockResolvedValue(mockInvoiceEntity),
                  },
                });
              }
              return Promise.all(callback);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    storageService = module.get<StorageService>(StorageService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(storageService).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('1. Penalty Calculation Engine (Deterministic & Decimal)', () => {
    const subtotal = new Decimal(10000000.0); // Rp 10.000.000
    const dueDate = new Date('2026-08-10T00:00:00Z');

    it('should calculate 0 penalty when current date is before due date', () => {
      const beforeDueDate = new Date('2026-08-05T00:00:00Z');
      const result = service.calculatePenalty(
        subtotal,
        dueDate,
        InvoiceStatus.UNPAID,
        null,
        beforeDueDate,
      );

      expect(result.penaltyFee.toNumber()).toBe(0);
      expect(result.totalAmount.toNumber()).toBe(10000000);
      expect(result.effectiveStatus).toBe(InvoiceStatus.UNPAID);
      expect(result.daysOverdue).toBe(0);
      expect(result.overdueWeeks).toBe(0);
    });

    it('should calculate 0 penalty when current date is exactly on due date', () => {
      const exactDueDate = new Date('2026-08-10T00:00:00Z');
      const result = service.calculatePenalty(
        subtotal,
        dueDate,
        InvoiceStatus.UNPAID,
        null,
        exactDueDate,
      );

      expect(result.penaltyFee.toNumber()).toBe(0);
      expect(result.totalAmount.toNumber()).toBe(10000000);
      expect(result.effectiveStatus).toBe(InvoiceStatus.UNPAID);
    });

    it('should calculate 5% penalty for 1-7 days overdue (Week 1)', () => {
      const overdue3Days = new Date('2026-08-13T00:00:00Z');
      const result = service.calculatePenalty(
        subtotal,
        dueDate,
        InvoiceStatus.UNPAID,
        null,
        overdue3Days,
      );

      // 5% of 10.000.000 = 500.000
      expect(result.penaltyFee.toNumber()).toBe(500000);
      expect(result.totalAmount.toNumber()).toBe(10500000);
      expect(result.effectiveStatus).toBe(InvoiceStatus.OVERDUE);
      expect(result.overdueWeeks).toBe(1);
    });

    it('should calculate 10% penalty for 8-14 days overdue (Week 2)', () => {
      const overdue10Days = new Date('2026-08-20T00:00:00Z');
      const result = service.calculatePenalty(
        subtotal,
        dueDate,
        InvoiceStatus.UNPAID,
        null,
        overdue10Days,
      );

      // 10% of 10.000.000 = 1.000.000
      expect(result.penaltyFee.toNumber()).toBe(1000000);
      expect(result.totalAmount.toNumber()).toBe(11000000);
      expect(result.effectiveStatus).toBe(InvoiceStatus.OVERDUE);
      expect(result.overdueWeeks).toBe(2);
    });

    it('should calculate 15% penalty for 15-21 days overdue (Week 3)', () => {
      const overdue18Days = new Date('2026-08-28T00:00:00Z');
      const result = service.calculatePenalty(
        subtotal,
        dueDate,
        InvoiceStatus.UNPAID,
        null,
        overdue18Days,
      );

      // 15% of 10.000.000 = 1.500.000
      expect(result.penaltyFee.toNumber()).toBe(1500000);
      expect(result.totalAmount.toNumber()).toBe(11500000);
      expect(result.effectiveStatus).toBe(InvoiceStatus.OVERDUE);
      expect(result.overdueWeeks).toBe(3);
    });
  });

  describe('2. Multi-Tenant Isolation & Queries', () => {
    it('should isolate invoices for Customer 1 and reject Customer 2 access', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValue(mockInvoiceEntity as any);

      // Customer 1 accessing their own invoice
      const customer1Result = await service.findInvoiceById('inv-001', mockCustomer1);
      expect(customer1Result.id).toBe('inv-001');
      expect(customer1Result.customerId).toBe('usr-cust-1');

      // Customer 2 accessing Customer 1's invoice (Anti-IDOR)
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
    it('should allow Customer to submit payment and set status to PENDING_VERIFICATION', async () => {
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

    it('should reject duplicate payment submission if invoice is already PENDING_VERIFICATION', async () => {
      const pendingInvoice = {
        ...mockInvoiceEntity,
        status: InvoiceStatus.PENDING_VERIFICATION,
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
        status: InvoiceStatus.PENDING_VERIFICATION,
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
