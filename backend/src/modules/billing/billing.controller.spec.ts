import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceStatus, PaymentMethod, UserRole, UserStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let service: BillingService;

  const mockAdmin: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    status: UserStatus.ACTIVE,
  };

  const mockInvoice = {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-08-001',
    customerId: 'usr-cust-1',
    customerName: 'Siti Rahma',
    customerEmail: 'customer@freshfoods.id',
    billingMonth: 'Agustus 2026',
    issueDate: '2026-08-01T00:00:00.000Z',
    dueDate: '2026-08-10T23:59:59.000Z',
    subtotal: 7440000.0,
    penaltyFee: 0.0,
    totalAmount: 7440000.0,
    status: InvoiceStatus.UNPAID,
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      email: 'customer@freshfoods.id',
      phone: '081809876543',
    },
    items: [],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: {
            findAllInvoices: jest.fn().mockResolvedValue({
              items: [mockInvoice],
              meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
            }),
            findInvoiceById: jest.fn().mockResolvedValue(mockInvoice),
            payInvoice: jest.fn().mockResolvedValue(mockInvoice),
            verifyPayment: jest.fn().mockResolvedValue(mockInvoice),
          },
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAllInvoices', () => {
    it('should return enveloped invoice list', async () => {
      const response = await controller.findAllInvoices({}, mockAdmin);
      expect(response.message).toBe('Daftar faktur tagihan berhasil diambil');
      expect(response.data.items).toHaveLength(1);
    });
  });

  describe('findInvoiceById', () => {
    it('should return enveloped invoice detail', async () => {
      const response = await controller.findInvoiceById('inv-001', mockAdmin);
      expect(response.message).toBe('Detail faktur tagihan berhasil diambil');
      expect(response.data.id).toBe('inv-001');
    });
  });

  describe('payInvoice', () => {
    it('should process payment submission and return enveloped response', async () => {
      const response = await controller.payInvoice(
        'inv-001',
        {
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          paymentProofUrl: 'https://example.com/receipt.jpg',
          amount: 7440000.0,
        },
        mockAdmin,
      );
      expect(response.message).toContain('berhasil');
    });
  });
});
