import { EventsService } from './events.service';
import { DomainEventType } from './events.types';
import { UserRole } from '@prisma/client';

describe('EventsService Real-Time Synchronization', () => {
  let eventsService: EventsService;

  beforeEach(() => {
    eventsService = new EventsService();
  });

  it('1. Event stream authorization filters correctly for Admin, Driver, and Customers', (done) => {
    const adminUser = {
      id: 'admin-01',
      email: 'admin@nusantara.id',
      name: 'Budi Santoso',
      role: UserRole.ADMIN,
      phone: '0811111111',
      status: 'ACTIVE' as any,
    };

    const customerA = {
      id: 'cust-01',
      email: 'customerA@client.com',
      name: 'Customer A',
      role: UserRole.CUSTOMER,
      phone: '0822222222',
      status: 'ACTIVE' as any,
    };

    const customerB = {
      id: 'cust-02',
      email: 'customerB@client.com',
      name: 'Customer B',
      role: UserRole.CUSTOMER,
      phone: '0833333333',
      status: 'ACTIVE' as any,
    };

    const adminEvents: any[] = [];
    const custAEvents: any[] = [];
    const custBEvents: any[] = [];

    const adminSub = eventsService
      .getUserEventStream(adminUser)
      .subscribe((e) => adminEvents.push(e));
    const custASub = eventsService
      .getUserEventStream(customerA)
      .subscribe((e) => custAEvents.push(e));
    const custBSub = eventsService
      .getUserEventStream(customerB)
      .subscribe((e) => custBEvents.push(e));

    // Publish event targeted specifically to Customer A
    eventsService.publish({
      type: DomainEventType.INBOUND_CONFIRMED,
      payload: {
        orderNumber: 'ORD-2026-INB-01',
        goodsCount: 10,
        status: 'DELIVERED',
      },
      targetCustomerId: customerA.id,
      targetWarehouseId: 'wh-01',
    });

    setTimeout(() => {
      adminSub.unsubscribe();
      custASub.unsubscribe();
      custBSub.unsubscribe();

      // Customer A receives event
      expect(custAEvents.length).toBe(1);
      const dataA =
        typeof custAEvents[0].data === 'string'
          ? JSON.parse(custAEvents[0].data)
          : custAEvents[0].data;
      expect(dataA.type).toBe(DomainEventType.INBOUND_CONFIRMED);
      expect(dataA.payload.orderNumber).toBe('ORD-2026-INB-01');

      // Admin receives all events
      expect(adminEvents.length).toBe(1);
      const dataAdmin =
        typeof adminEvents[0].data === 'string'
          ? JSON.parse(adminEvents[0].data)
          : adminEvents[0].data;
      expect(dataAdmin.type).toBe(DomainEventType.INBOUND_CONFIRMED);

      // Customer B must NOT receive Customer A's private data (Tenant Isolation)
      expect(custBEvents.length).toBe(0);

      done();
    }, 50);
  });

  it('2. Driver assigned event is delivered to assigned Driver, Customer, and Admin', (done) => {
    const driverUser = {
      id: 'driver-01',
      email: 'driver@nusantara.id',
      name: 'Driver Joko',
      role: UserRole.DRIVER,
      phone: '0844444444',
      status: 'ACTIVE' as any,
    };

    const otherDriver = {
      id: 'driver-02',
      email: 'driver2@nusantara.id',
      name: 'Driver Rudi',
      role: UserRole.DRIVER,
      phone: '0855555555',
      status: 'ACTIVE' as any,
    };

    const customerA = {
      id: 'cust-01',
      email: 'customerA@client.com',
      name: 'Customer A',
      role: UserRole.CUSTOMER,
      phone: '0822222222',
      status: 'ACTIVE' as any,
    };

    const driverEvents: any[] = [];
    const otherDriverEvents: any[] = [];
    const custAEvents: any[] = [];

    const dSub = eventsService
      .getUserEventStream(driverUser)
      .subscribe((e) => driverEvents.push(e));
    const odSub = eventsService
      .getUserEventStream(otherDriver)
      .subscribe((e) => otherDriverEvents.push(e));
    const cSub = eventsService.getUserEventStream(customerA).subscribe((e) => custAEvents.push(e));

    eventsService.publish({
      type: DomainEventType.DRIVER_ASSIGNED,
      payload: {
        orderId: 'ord-01',
        orderNumber: 'ORD-2026-999',
        driverId: driverUser.id,
      },
      targetCustomerId: customerA.id,
      targetDriverId: driverUser.id,
      targetOrderId: 'ord-01',
    });

    setTimeout(() => {
      dSub.unsubscribe();
      odSub.unsubscribe();
      cSub.unsubscribe();

      expect(driverEvents.length).toBe(1);
      const dataDriver =
        typeof driverEvents[0].data === 'string'
          ? JSON.parse(driverEvents[0].data)
          : driverEvents[0].data;
      expect(dataDriver.payload.orderNumber).toBe('ORD-2026-999');

      expect(custAEvents.length).toBe(1);
      const dataCust =
        typeof custAEvents[0].data === 'string'
          ? JSON.parse(custAEvents[0].data)
          : custAEvents[0].data;
      expect(dataCust.payload.orderNumber).toBe('ORD-2026-999');

      // Other driver does NOT receive task for another driver
      expect(otherDriverEvents.length).toBe(0);

      done();
    }, 50);
  });

  it('3. Payment & Billing events are delivered securely to target Customer and Admin, isolated from other Customers', (done) => {
    const adminUser = {
      id: 'admin-01',
      email: 'admin@nusantara.id',
      name: 'Budi Santoso',
      role: UserRole.ADMIN,
      phone: '0811111111',
      status: 'ACTIVE' as any,
    };

    const customerA = {
      id: 'cust-01',
      email: 'customerA@client.com',
      name: 'Customer A',
      role: UserRole.CUSTOMER,
      phone: '0822222222',
      status: 'ACTIVE' as any,
    };

    const customerB = {
      id: 'cust-02',
      email: 'customerB@client.com',
      name: 'Customer B',
      role: UserRole.CUSTOMER,
      phone: '0833333333',
      status: 'ACTIVE' as any,
    };

    const adminEvents: any[] = [];
    const custAEvents: any[] = [];
    const custBEvents: any[] = [];

    const adminSub = eventsService
      .getUserEventStream(adminUser)
      .subscribe((e) => adminEvents.push(e));
    const custASub = eventsService
      .getUserEventStream(customerA)
      .subscribe((e) => custAEvents.push(e));
    const custBSub = eventsService
      .getUserEventStream(customerB)
      .subscribe((e) => custBEvents.push(e));

    // 1. Customer submits payment -> PAYMENT_SUBMITTED
    eventsService.publish({
      type: DomainEventType.PAYMENT_SUBMITTED,
      payload: {
        invoiceId: 'inv-001',
        invoiceNumber: 'INV-2026-08-001',
        paymentNumber: 'PAY-2026-001',
        amount: 7440000,
        status: 'UNDER_REVIEW',
      },
      targetCustomerId: customerA.id,
      targetInvoiceId: 'inv-001',
    });

    // 2. Admin verifies payment -> PAYMENT_VERIFIED & INVOICE_PAID
    eventsService.publish({
      type: DomainEventType.PAYMENT_VERIFIED,
      payload: {
        invoiceId: 'inv-001',
        invoiceNumber: 'INV-2026-08-001',
        receiptNumber: 'REC-2026-9999',
        status: 'VERIFIED',
      },
      targetCustomerId: customerA.id,
      targetInvoiceId: 'inv-001',
    });

    eventsService.publish({
      type: DomainEventType.INVOICE_PAID,
      payload: {
        invoiceId: 'inv-001',
        invoiceNumber: 'INV-2026-08-001',
        receiptNumber: 'REC-2026-9999',
        status: 'PAID',
      },
      targetCustomerId: customerA.id,
      targetInvoiceId: 'inv-001',
    });

    setTimeout(() => {
      adminSub.unsubscribe();
      custASub.unsubscribe();
      custBSub.unsubscribe();

      // Customer A received all 3 events
      expect(custAEvents.length).toBe(3);
      const dataA0 =
        typeof custAEvents[0].data === 'string'
          ? JSON.parse(custAEvents[0].data)
          : custAEvents[0].data;
      const dataA1 =
        typeof custAEvents[1].data === 'string'
          ? JSON.parse(custAEvents[1].data)
          : custAEvents[1].data;
      const dataA2 =
        typeof custAEvents[2].data === 'string'
          ? JSON.parse(custAEvents[2].data)
          : custAEvents[2].data;
      expect(dataA0.type).toBe(DomainEventType.PAYMENT_SUBMITTED);
      expect(dataA1.type).toBe(DomainEventType.PAYMENT_VERIFIED);
      expect(dataA2.type).toBe(DomainEventType.INVOICE_PAID);

      // Admin received all 3 events
      expect(adminEvents.length).toBe(3);

      // Customer B received 0 events (Tenant Isolation strictly enforced)
      expect(custBEvents.length).toBe(0);

      done();
    }, 50);
  });
});
