import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { BillingService } from '../src/modules/billing/billing.service';
import { WarehouseService } from '../src/modules/warehouse/warehouse.service';
import { EventsService } from '../src/modules/events/events.service';
import { DomainEventType } from '../src/modules/events/events.types';
import {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  StorageZoneType,
  UserRole,
} from '@prisma/client';

describe('Real-Time Payment & Billing Synchronization E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let billingService: BillingService;
  let warehouseService: WarehouseService;
  let eventsService: EventsService;

  let adminUser: any;
  let customerA: any;
  let customerB: any;
  let warehouse: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    billingService = moduleFixture.get<BillingService>(BillingService);
    warehouseService = moduleFixture.get<WarehouseService>(WarehouseService);
    eventsService = moduleFixture.get<EventsService>(EventsService);

    adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    const customers = await prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      take: 2,
    });
    customerA = customers[0];
    customerB = customers[1] || {
      id: 'cust-isolated-999',
      name: 'Customer B',
      email: 'custb@test.id',
      role: UserRole.CUSTOMER,
    };
    warehouse = await prisma.warehouse.findFirst();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Space rental booking generates invoice and emits INVOICE_CREATED event in real time to Customer and Admin', async () => {
    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const customerBStream$ = eventsService.getUserEventStream({
      id: customerB.id,
      email: customerB.email,
      name: customerB.name,
      role: UserRole.CUSTOMER,
      phone: customerB.phone || '08123456789',
      status: customerB.status || ('ACTIVE' as any),
    });

    const adminStream$ = eventsService.getUserEventStream({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: UserRole.ADMIN,
      phone: adminUser.phone,
      status: adminUser.status,
    });

    const customerAEvents: any[] = [];
    const customerBEvents: any[] = [];
    const adminEvents: any[] = [];

    const subA = customerAStream$.subscribe((e) => customerAEvents.push(e));
    const subB = customerBStream$.subscribe((e) => customerBEvents.push(e));
    const subAdmin = adminStream$.subscribe((e) => adminEvents.push(e));

    // Customer A rents warehouse space
    const rentalResult = await warehouseService.rentSpace(
      {
        warehouseId: warehouse.id,
        volumeM3: 5,
        storageType: StorageZoneType.STANDARD,
        durationMonths: 1,
      },
      {
        id: customerA.id,
        email: customerA.email,
        name: customerA.name,
        role: UserRole.CUSTOMER,
        phone: customerA.phone,
        status: customerA.status,
      },
    );

    expect(rentalResult.invoice).toBeDefined();
    expect(rentalResult.invoice.status).toBe(InvoiceStatus.UNPAID);

    await new Promise((resolve) => setTimeout(resolve, 60));

    subA.unsubscribe();
    subB.unsubscribe();
    subAdmin.unsubscribe();

    // 1. Customer A receives INVOICE_CREATED event
    const invoiceCreatedEventA = customerAEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.INVOICE_CREATED,
    );
    expect(invoiceCreatedEventA).toBeDefined();
    const dataA =
      typeof invoiceCreatedEventA.data === 'string'
        ? JSON.parse(invoiceCreatedEventA.data)
        : invoiceCreatedEventA.data;
    expect(dataA.payload.invoiceId).toBe(rentalResult.invoice.id);
    expect(dataA.targetCustomerId).toBe(customerA.id);

    // 2. Admin receives the event
    const invoiceCreatedEventAdmin = adminEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.INVOICE_CREATED,
    );
    expect(invoiceCreatedEventAdmin).toBeDefined();

    // 3. Customer B does NOT receive Customer A's invoice event (Tenant Isolation)
    const invoiceCreatedEventB = customerBEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.INVOICE_CREATED,
    );
    expect(invoiceCreatedEventB).toBeUndefined();
  });

  it('2. Customer submits payment -> PAYMENT_SUBMITTED & INVOICE_UPDATED emitted in real time to Customer and Admin', async () => {
    // Find unpaid invoice of Customer A
    const invoice = await prisma.invoice.findFirst({
      where: { customerId: customerA.id, status: InvoiceStatus.UNPAID },
      orderBy: { createdAt: 'desc' },
    });
    expect(invoice).toBeDefined();

    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const adminStream$ = eventsService.getUserEventStream({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: UserRole.ADMIN,
      phone: adminUser.phone,
      status: adminUser.status,
    });

    const customerAEvents: any[] = [];
    const adminEvents: any[] = [];

    const subA = customerAStream$.subscribe((e) => customerAEvents.push(e));
    const subAdmin = adminStream$.subscribe((e) => adminEvents.push(e));

    // Customer A submits proof of payment
    const updatedInvoice = await billingService.payInvoice(
      invoice!.id,
      {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
        amount: Number(invoice!.totalAmount),
        paymentReference: `TRX-${Date.now().toString().slice(-8)}`,
        notes: 'Payment proof test submission',
      },
      {
        id: customerA.id,
        email: customerA.email,
        name: customerA.name,
        role: UserRole.CUSTOMER,
        phone: customerA.phone,
        status: customerA.status,
      },
    );

    expect(updatedInvoice.status).toBe(InvoiceStatus.PENDING_PAYMENT);

    await new Promise((resolve) => setTimeout(resolve, 60));

    subA.unsubscribe();
    subAdmin.unsubscribe();

    // Verify Customer A receives PAYMENT_SUBMITTED
    const paymentSubmittedEventA = customerAEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.PAYMENT_SUBMITTED,
    );
    expect(paymentSubmittedEventA).toBeDefined();
    const dataA =
      typeof paymentSubmittedEventA.data === 'string'
        ? JSON.parse(paymentSubmittedEventA.data)
        : paymentSubmittedEventA.data;
    expect(dataA.payload.invoiceId).toBe(invoice!.id);
    expect(dataA.payload.status).toBe(PaymentStatus.UNDER_REVIEW);

    // Verify Admin receives PAYMENT_SUBMITTED
    const paymentSubmittedEventAdmin = adminEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.PAYMENT_SUBMITTED,
    );
    expect(paymentSubmittedEventAdmin).toBeDefined();
  });

  it('3. Admin verifies payment -> PAYMENT_VERIFIED & INVOICE_PAID emitted in real time to Customer without refresh', async () => {
    // Find pending payment invoice of Customer A
    const invoice = await prisma.invoice.findFirst({
      where: { customerId: customerA.id, status: InvoiceStatus.PENDING_PAYMENT },
      orderBy: { createdAt: 'desc' },
    });
    expect(invoice).toBeDefined();

    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const customerAEvents: any[] = [];
    const subA = customerAStream$.subscribe((e) => customerAEvents.push(e));

    // Admin verifies payment
    const verifiedInvoice = await billingService.verifyPayment(
      invoice!.id,
      {
        action: 'VERIFY',
        note: 'Payment verified and confirmed by Admin',
      },
      {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: UserRole.ADMIN,
        phone: adminUser.phone,
        status: adminUser.status,
      },
    );

    expect(verifiedInvoice.status).toBe(InvoiceStatus.PAID);
    expect(verifiedInvoice.receiptNumber).toBeDefined();

    await new Promise((resolve) => setTimeout(resolve, 60));
    subA.unsubscribe();

    // Verify Customer A received PAYMENT_VERIFIED
    const paymentVerifiedEvent = customerAEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.PAYMENT_VERIFIED,
    );
    expect(paymentVerifiedEvent).toBeDefined();

    // Verify Customer A received INVOICE_PAID
    const invoicePaidEvent = customerAEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.INVOICE_PAID,
    );
    expect(invoicePaidEvent).toBeDefined();
    const dataPaid =
      typeof invoicePaidEvent.data === 'string'
        ? JSON.parse(invoicePaidEvent.data)
        : invoicePaidEvent.data;
    expect(dataPaid.payload.status).toBe(InvoiceStatus.PAID);
    expect(dataPaid.payload.receiptNumber).toBeDefined();
  });

  it('4. Admin rejects payment -> PAYMENT_REJECTED emitted with reason to Customer in real time', async () => {
    // 1. Create a fresh rental to get a new invoice
    const rental = await warehouseService.rentSpace(
      {
        warehouseId: warehouse.id,
        volumeM3: 2,
        storageType: StorageZoneType.STANDARD,
        durationMonths: 1,
      },
      {
        id: customerA.id,
        email: customerA.email,
        name: customerA.name,
        role: UserRole.CUSTOMER,
        phone: customerA.phone,
        status: customerA.status,
      },
    );

    // 2. Customer submits payment
    await billingService.payInvoice(
      rental.invoice.id,
      {
        paymentMethod: PaymentMethod.QRIS,
        paymentProofUrl: 'https://example.com/invalid-receipt.jpg',
        amount: Number(rental.invoice.totalAmount),
        paymentReference: 'TRX-INVALID-001',
      },
      {
        id: customerA.id,
        email: customerA.email,
        name: customerA.name,
        role: UserRole.CUSTOMER,
        phone: customerA.phone,
        status: customerA.status,
      },
    );

    // 3. Customer listens to stream
    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const customerAEvents: any[] = [];
    const subA = customerAStream$.subscribe((e) => customerAEvents.push(e));

    // 4. Admin rejects payment
    const rejectedInvoice = await billingService.verifyPayment(
      rental.invoice.id,
      {
        action: 'REJECT',
        rejectionReason: 'Invalid transfer receipt. Amount does not match bank record.',
        note: 'Invalid transfer receipt.',
      },
      {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: UserRole.ADMIN,
        phone: adminUser.phone,
        status: adminUser.status,
      },
    );

    expect(rejectedInvoice.status).toBe(InvoiceStatus.UNPAID);
    expect(rejectedInvoice.latestPaymentStatus).toBe(PaymentStatus.REJECTED);

    await new Promise((resolve) => setTimeout(resolve, 60));
    subA.unsubscribe();

    // Verify Customer receives PAYMENT_REJECTED with rejectionReason
    const rejectedEvent = customerAEvents.find(
      (e) =>
        (typeof e.data === 'string' ? JSON.parse(e.data) : e.data).type ===
        DomainEventType.PAYMENT_REJECTED,
    );
    expect(rejectedEvent).toBeDefined();
    const dataRejected =
      typeof rejectedEvent.data === 'string' ? JSON.parse(rejectedEvent.data) : rejectedEvent.data;
    expect(dataRejected.payload.status).toBe(PaymentStatus.REJECTED);
    expect(dataRejected.payload.rejectionReason).toBe(
      'Invalid transfer receipt. Amount does not match bank record.',
    );
  });
});
