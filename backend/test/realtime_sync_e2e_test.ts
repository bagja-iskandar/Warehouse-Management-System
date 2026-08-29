import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EventsService } from '../src/modules/events/events.service';
import { DomainEventType } from '../src/modules/events/events.types';
import { GoodsStorageStatus, OrderStatus, OrderType, UserRole } from '@prisma/client';
import { firstValueFrom, take, toArray } from 'rxjs';

describe('Real-Time Data Synchronization Architecture E2E Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let eventsService: EventsService;

  let adminUser: any;
  let driverUser: any;
  let customerA: any;
  let customerB: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    eventsService = moduleFixture.get<EventsService>(EventsService);

    // Fetch existing users for multi-session testing
    adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    driverUser = await prisma.user.findFirst({ where: { role: UserRole.DRIVER } });
    const customers = await prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      take: 2,
    });
    customerA = customers[0];
    customerB = customers[1] || customers[0];
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. Event stream authorization filters correctly for Admin, Driver, Customer A and Customer B', async () => {
    const adminStream$ = eventsService.getUserEventStream({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: UserRole.ADMIN,
      phone: adminUser.phone,
      status: adminUser.status,
    });

    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const customerBStream$ = eventsService.getUserEventStream({
      id: 'diff-customer-id-999',
      email: 'customerB@example.com',
      name: 'Customer B',
      role: UserRole.CUSTOMER,
      phone: '08123456789',
      status: 'ACTIVE' as any,
    });

    const adminEvents: any[] = [];
    const customerAEvents: any[] = [];
    const customerBEvents: any[] = [];

    const subAdmin = adminStream$.subscribe((e) => adminEvents.push(e));
    const subCustA = customerAStream$.subscribe((e) => customerAEvents.push(e));
    const subCustB = customerBStream$.subscribe((e) => customerBEvents.push(e));

    // Publish a tenant-isolated event targeted specifically to Customer A
    eventsService.publish({
      type: DomainEventType.INBOUND_CONFIRMED,
      payload: {
        orderNumber: 'ORD-TEST-RT-01',
        goodsCount: 5,
        status: OrderStatus.DELIVERED,
      },
      targetCustomerId: customerA.id,
    });

    // Small delay to allow synchronous stream emission
    await new Promise((resolve) => setTimeout(resolve, 50));

    subAdmin.unsubscribe();
    subCustA.unsubscribe();
    subCustB.unsubscribe();

    // Verification:
    // 1. Customer A must receive the event
    expect(customerAEvents.length).toBeGreaterThanOrEqual(1);
    const parsedCustA = JSON.parse(customerAEvents[0].data);
    expect(parsedCustA.type).toBe(DomainEventType.INBOUND_CONFIRMED);
    expect(parsedCustA.payload.orderNumber).toBe('ORD-TEST-RT-01');

    // 2. Admin must also receive the event (Admins monitor all operations)
    expect(adminEvents.length).toBeGreaterThanOrEqual(1);
    const parsedAdmin = JSON.parse(adminEvents[0].data);
    expect(parsedAdmin.type).toBe(DomainEventType.INBOUND_CONFIRMED);

    // 3. Customer B must NOT receive Customer A's private event (Tenant Isolation)
    expect(customerBEvents.length).toBe(0);
  });

  it('2. Driver assigned event is delivered to assigned Driver and Order Customer in real time', async () => {
    const driverStream$ = eventsService.getUserEventStream({
      id: driverUser.id,
      email: driverUser.email,
      name: driverUser.name,
      role: UserRole.DRIVER,
      phone: driverUser.phone,
      status: driverUser.status,
    });

    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const driverEvents: any[] = [];
    const custAEvents: any[] = [];

    const subDriver = driverStream$.subscribe((e) => driverEvents.push(e));
    const subCustA = customerAStream$.subscribe((e) => custAEvents.push(e));

    eventsService.publish({
      type: DomainEventType.DRIVER_ASSIGNED,
      payload: {
        orderId: 'ord-test-01',
        orderNumber: 'ORD-2026-ASSIGN',
        driverId: driverUser.id,
      },
      targetCustomerId: customerA.id,
      targetDriverId: driverUser.id,
      targetOrderId: 'ord-test-01',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    subDriver.unsubscribe();
    subCustA.unsubscribe();

    expect(driverEvents.length).toBeGreaterThanOrEqual(1);
    const parsedDriver = JSON.parse(driverEvents[0].data);
    expect(parsedDriver.type).toBe(DomainEventType.DRIVER_ASSIGNED);
    expect(parsedDriver.payload.driverId).toBe(driverUser.id);

    expect(custAEvents.length).toBeGreaterThanOrEqual(1);
    const parsedCust = JSON.parse(custAEvents[0].data);
    expect(parsedCust.type).toBe(DomainEventType.DRIVER_ASSIGNED);
    expect(parsedCust.payload.orderNumber).toBe('ORD-2026-ASSIGN');
  });

  it('3. Order message real-time delivery to Customer session', async () => {
    const customerAStream$ = eventsService.getUserEventStream({
      id: customerA.id,
      email: customerA.email,
      name: customerA.name,
      role: UserRole.CUSTOMER,
      phone: customerA.phone,
      status: customerA.status,
    });

    const custEvents: any[] = [];
    const subCust = customerAStream$.subscribe((e) => custEvents.push(e));

    eventsService.publish({
      type: DomainEventType.ORDER_MESSAGE_CREATED,
      payload: {
        messageId: 'msg-01',
        orderNumber: 'ORD-2026-092',
        title: 'Shipment Delayed - Heavy Traffic',
        content: 'Driver is delayed by 15 mins due to road repairs.',
      },
      targetCustomerId: customerA.id,
      targetOrderId: 'ord-01',
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    subCust.unsubscribe();

    expect(custEvents.length).toBeGreaterThanOrEqual(1);
    const parsed = JSON.parse(custEvents[0].data);
    expect(parsed.type).toBe(DomainEventType.ORDER_MESSAGE_CREATED);
    expect(parsed.payload.title).toBe('Shipment Delayed - Heavy Traffic');
  });
});
