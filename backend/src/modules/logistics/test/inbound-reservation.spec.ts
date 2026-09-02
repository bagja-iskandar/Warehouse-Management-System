import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GoodsCategory,
  GoodsStorageStatus,
  OrderStatus,
  OrderType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from '../../notifications/notifications.service';
import { LogisticsService } from '../logistics.service';

describe('LogisticsService - Inbound Reservation & Duplicate Prevention', () => {
  let service: LogisticsService;
  let prisma: any;

  const mockCustomerUser: AuthenticatedUser = {
    id: 'usr-cust-test',
    email: 'customer.test@wms.id',
    name: 'Customer Test',
    role: UserRole.CUSTOMER,
    phone: '08123456789',
    status: UserStatus.ACTIVE,
  };

  const createMockGoods = (qty = 100, status: GoodsStorageStatus = GoodsStorageStatus.DRAFT) => ({
    id: 'goods-100-qty',
    barcode: 'BRG-TEST-100',
    customerId: 'usr-cust-test',
    warehouseId: 'wh-test-01',
    slotId: null,
    name: 'Pharmaceutical Vaccine Pack',
    category: GoodsCategory.COLD_FOOD,
    description: 'Cold chain pharmaceuticals',
    lengthCm: new Decimal(50.0),
    widthCm: new Decimal(40.0),
    heightCm: new Decimal(30.0),
    volumeM3: new Decimal(0.06),
    weightKg: new Decimal(10.0),
    quantity: qty,
    unit: 'Master Boxes',
    requiresColdStorage: true,
    targetTempMin: new Decimal(-25.0),
    targetTempMax: new Decimal(-15.0),
    currentTemp: new Decimal(-20.0),
    storageStartDate: new Date('2026-09-01T00:00:00Z'),
    storageEndDate: null,
    monthlyRentalFee: new Decimal(1000000.0),
    status,
    imageUrl: null,
    qrCodeData: 'WMS://TEST/goods-100-qty',
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    warehouse: {
      id: 'wh-test-01',
      code: 'WH-TST-01',
      name: 'Central Testing Hub',
      city: 'Jakarta',
    },
    customer: {
      id: 'usr-cust-test',
      name: 'Customer Test',
      companyName: 'PT Bio Farma Test',
      email: 'customer.test@wms.id',
      phone: '08123456789',
    },
  });

  let simulatedOrders: any[] = [];
  let simulatedOrderItems: any[] = [];
  let simulatedGoods: any;
  let mockTx: any;

  beforeEach(async () => {
    simulatedOrders = [];
    simulatedOrderItems = [];
    simulatedGoods = createMockGoods(100, GoodsStorageStatus.DRAFT);

    const mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      notifyRole: jest.fn().mockResolvedValue(true),
    };

    mockTx = {
      $queryRaw: jest.fn().mockImplementation(async () => {
        // Simulates SELECT ... FOR UPDATE row-level locking
        return [{ id: simulatedGoods.id, quantity: simulatedGoods.quantity }];
      }),
      orderItem: {
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          return simulatedOrderItems.filter((item) => {
            const matchesGoods = item.goodsId === where.goodsId;
            const parentOrder = simulatedOrders.find((o) => o.id === item.orderId);
            const matchesType = !where.order?.type || parentOrder?.type === where.order.type;
            const matchesStatus =
              !where.order?.status?.in || where.order.status.in.includes(parentOrder?.status);
            return matchesGoods && matchesType && matchesStatus;
          });
        }),
      },
      deliveryOrder: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }: any) => {
          const newOrder = {
            id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          simulatedOrders.push(newOrder);

          if (data.orderItems?.create) {
            data.orderItems.create.forEach((itemCreate: any) => {
              simulatedOrderItems.push({
                id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                orderId: newOrder.id,
                goodsId: itemCreate.goodsId,
                quantity: itemCreate.quantity,
                order: newOrder,
              });
            });
          }
          return newOrder;
        }),
      },
      goodsItem: {
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          if (simulatedGoods.id === where.id) {
            Object.assign(simulatedGoods, data);
          }
          return simulatedGoods;
        }),
      },
      vehicle: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const mockPrismaService = {
      deliveryOrder: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockImplementation(({ where }: any) => {
          return (
            simulatedOrders.find((o) => o.id === where.OR?.[0]?.id || o.orderNumber === where.OR?.[1]?.orderNumber) ||
            null
          );
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      goodsItem: {
        findMany: jest.fn().mockImplementation(({ where }: any) => {
          if (where.id?.in?.includes(simulatedGoods.id)) {
            return [simulatedGoods];
          }
          return [];
        }),
      },
      $transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback(mockTx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<LogisticsService>(LogisticsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Mock findOrderById to return populated order
    jest.spyOn(service, 'findOrderById').mockImplementation(async (id: string) => {
      const ord = simulatedOrders.find((o) => o.id === id);
      return {
        id: ord.id,
        orderNumber: ord.orderNumber,
        type: ord.type,
        status: ord.status,
        customerId: ord.customerId,
        totalPackages: ord.totalPackages || 10,
        goodsSummary: ord.goodsSummary,
      } as any;
    });
  });

  // ===========================================================================
  // TEST 1: Normal Inbound Order
  // ===========================================================================
  it('Test 1 — Normal order: Goods = 100, Request = 50 => SUCCESS (201)', async () => {
    const orderPayload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 50 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    const result = await service.createOrder(orderPayload as any, mockCustomerUser);
    expect(result).toBeDefined();
    expect(result.type).toBe(OrderType.PICKUP);
    expect(simulatedOrders.length).toBe(1);
    expect(simulatedOrderItems[0].quantity).toBe(50);
  });

  // ===========================================================================
  // TEST 2: Duplicate Same Goods
  // ===========================================================================
  it('Test 2 — Duplicate same goods: Goods = 100, Order #1 = 100, Order #2 = 100 => Order #2 MUST FAIL with ConflictException (409)', async () => {
    const orderPayload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 100 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    // Order #1: Successfully reserves all 100 packages
    await service.createOrder(orderPayload as any, mockCustomerUser);
    expect(simulatedOrders.length).toBe(1);

    // Order #2: Tries to reserve the same 100 packages while Order #1 is active
    await expect(service.createOrder(orderPayload as any, mockCustomerUser)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.createOrder(orderPayload as any, mockCustomerUser)).rejects.toThrow(
      /already fully reserved by active inbound order/,
    );
  });

  // ===========================================================================
  // TEST 3: Over Reservation
  // ===========================================================================
  it('Test 3 — Over reservation: Goods = 100, Order #1 = 60, Order #2 = 50 => MUST FAIL with ConflictException (409)', async () => {
    const order1Payload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 60 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    const order2Payload = {
      ...order1Payload,
      items: [{ goodsId: simulatedGoods.id, quantity: 50 }], // 60 + 50 = 110 > 100
    };

    // Order #1 reserves 60 packages (40 remaining)
    await service.createOrder(order1Payload as any, mockCustomerUser);

    // Order #2 requests 50 packages (> 40 remaining) => MUST FAIL
    await expect(service.createOrder(order2Payload as any, mockCustomerUser)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.createOrder(order2Payload as any, mockCustomerUser)).rejects.toThrow(
      /Insufficient available package quantity/,
    );
  });

  // ===========================================================================
  // TEST 4: Valid Remaining Quantity
  // ===========================================================================
  it('Test 4 — Valid remaining quantity: Goods = 100, Order #1 = 60, Order #2 = 40 => SUCCESS (201)', async () => {
    const order1Payload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 60 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    const order2Payload = {
      ...order1Payload,
      items: [{ goodsId: simulatedGoods.id, quantity: 40 }], // 60 + 40 = 100 <= 100
    };

    // Order #1 reserves 60 packages
    const res1 = await service.createOrder(order1Payload as any, mockCustomerUser);
    expect(res1).toBeDefined();

    // Order #2 reserves remaining 40 packages => SUCCESS
    const res2 = await service.createOrder(order2Payload as any, mockCustomerUser);
    expect(res2).toBeDefined();
    expect(simulatedOrders.length).toBe(2);
  });

  // ===========================================================================
  // TEST 5: Cancelled Order Releases Reservation
  // ===========================================================================
  it('Test 5 — Cancelled order: Goods = 100, Order #1 = 100, Order #1 cancelled, Order #2 = 100 => SUCCESS (201)', async () => {
    const orderPayload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 100 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    // Order #1 reserves all 100 packages
    const order1 = await service.createOrder(orderPayload as any, mockCustomerUser);
    expect(simulatedOrders.length).toBe(1);

    // Order #1 is cancelled by user/admin
    const foundOrder1 = simulatedOrders.find((o) => o.id === order1.id);
    foundOrder1.status = OrderStatus.CANCELLED;

    // Order #2 now requests 100 packages again => MUST SUCCEED because Order #1 released reservation
    const order2 = await service.createOrder(orderPayload as any, mockCustomerUser);
    expect(order2).toBeDefined();
    expect(simulatedOrders.length).toBe(2);
  });

  // ===========================================================================
  // TEST 6: Concurrent Requests Simulation
  // ===========================================================================
  it('Test 6 — Concurrent requests: Two concurrent inbound requests competing for same goods => 1 SUCCESS, 1 CONFLICT (409)', async () => {
    const orderPayload = {
      type: OrderType.PICKUP,
      goodsItemIds: [simulatedGoods.id],
      items: [{ goodsId: simulatedGoods.id, quantity: 100 }],
      originAddress: 'Jl. Pabrik Farmasi No. 1',
      originCity: 'Bandung',
      destinationAddress: 'Gudang Utama Cakung',
      destinationCity: 'Jakarta',
      scheduledDate: '2026-09-05',
      scheduledTimeSlot: '08:00 - 12:00 WIB',
    };

    // Simulate serialized concurrency with transaction queueing
    let lockAcquired = false;
    prisma.$transaction.mockImplementation(async (callback: any) => {
      while (lockAcquired) {
        await new Promise((r) => setTimeout(r, 10));
      }
      lockAcquired = true;
      try {
        return await callback(mockTx);
      } finally {
        lockAcquired = false;
      }
    });

    const results = await Promise.allSettled([
      service.createOrder(orderPayload as any, mockCustomerUser),
      service.createOrder(orderPayload as any, mockCustomerUser),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
  });
});
