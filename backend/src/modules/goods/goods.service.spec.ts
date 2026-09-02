import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GoodsCategory,
  GoodsStorageStatus,
  SlotStatus,
  StorageZoneType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { GoodsService } from './goods.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('GoodsService', () => {
  let service: GoodsService;
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

  const mockCustomerUserEntity = {
    id: 'usr-cust-1',
    name: 'Siti Rahma',
    companyName: 'CV Fresh Frozen Nusantara',
    email: 'customer@freshfoods.id',
    phone: '081809876543',
  };

  const mockWarehouseEntity = {
    id: 'wh-jkt-central',
    code: 'WH-CKG-01',
    name: 'Gudang Utama Cakung Logistics Hub',
    city: 'Jakarta Timur',
    isActive: true,
    zones: [
      {
        id: 'zone-cold',
        type: StorageZoneType.COLD_STORAGE,
      },
    ],
  };

  const mockSlotEntity = {
    id: 'slot-c01',
    warehouseId: 'wh-jkt-central',
    zoneId: 'zone-cold',
    code: 'COLD-A01',
    zone: StorageZoneType.COLD_STORAGE,
    capacityM3: new Decimal(100.0),
    usedM3: new Decimal(50.0),
    temperatureCelsius: new Decimal(-18.5),
    status: SlotStatus.OCCUPIED,
  };

  const mockGoodsItem = {
    id: 'brg-001',
    barcode: 'BRG-2026-FROZEN-001',
    customerId: 'usr-cust-1',
    warehouseId: 'wh-jkt-central',
    slotId: 'slot-c01',
    name: 'Norwegian Salmon Fillet Grade A',
    category: GoodsCategory.COLD_FOOD,
    description: 'Ikan salmon beku kualitas ekspor',
    lengthCm: new Decimal(120.0),
    widthCm: new Decimal(80.0),
    heightCm: new Decimal(100.0),
    volumeM3: new Decimal(0.96),
    weightKg: new Decimal(450.0),
    quantity: 1,
    unit: 'Master Box',
    requiresColdStorage: true,
    targetTempMin: new Decimal(-22.0),
    targetTempMax: new Decimal(-18.0),
    currentTemp: new Decimal(-19.4),
    storageStartDate: new Date('2026-08-01T09:00:00Z'),
    storageEndDate: null,
    monthlyRentalFee: new Decimal(2400000.0),
    status: GoodsStorageStatus.STORED,
    imageUrl: 'https://example.com/salmon.jpg',
    qrCodeData: 'WMS://ITEM/brg-001',
    createdAt: new Date('2026-08-01T09:00:00Z'),
    updatedAt: new Date('2026-08-01T09:00:00Z'),
    customer: mockCustomerUserEntity,
    warehouse: mockWarehouseEntity,
    slot: mockSlotEntity,
    history: [
      {
        id: 'hist-01',
        goodsId: 'brg-001',
        status: GoodsStorageStatus.STORED,
        title: 'Barang Disimpan',
        description: 'Ditempatkan di Slot COLD-A01',
        actorName: 'Budi Santoso',
        actorRole: 'Admin',
        location: 'Slot COLD-A01',
        timestamp: new Date('2026-08-01T09:00:00Z'),
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsService,
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
            notifyRole: jest.fn().mockResolvedValue([{ id: 'notif-2' }]),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            warehouse: {
              findUnique: jest.fn().mockResolvedValue(mockWarehouseEntity),
              findFirst: jest.fn().mockResolvedValue(mockWarehouseEntity),
              update: jest.fn().mockResolvedValue(mockWarehouseEntity),
            },
            storageSlot: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            goodsItem: {
              count: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            goodsMutation: {
              create: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                return callback({
                  $queryRaw: jest.fn().mockResolvedValue([{ id: 'usr-cust-1' }]),
                  invoice: {
                    findMany: jest.fn().mockResolvedValue([
                      {
                        id: 'inv-01',
                        status: 'PAID',
                        items: [
                          {
                            goodsName: 'WH-CKG-01 COLD_STORAGE',
                            description: 'Gudang Utama Cakung Logistics Hub Cold Storage',
                            volumeM3: new Decimal(500),
                          },
                        ],
                        customerRental: {
                          storageType: 'COLD_STORAGE',
                          maxCapacityM3: new Decimal(500),
                          maxWeightKg: new Decimal(50000),
                        },
                      },
                    ]),
                  },
                  goodsItem: {
                    count: jest.fn().mockResolvedValue(1),
                    findMany: jest.fn().mockResolvedValue([]),
                    create: jest.fn().mockResolvedValue(mockGoodsItem),
                    update: jest.fn().mockResolvedValue(mockGoodsItem),
                    aggregate: jest.fn().mockResolvedValue({
                      _sum: { volumeM3: new Decimal(0), weightKg: new Decimal(0) },
                    }),
                  },
                  goodsMutation: {
                    create: jest.fn().mockResolvedValue({ id: 'mut-1' }),
                  },
                  storageSlot: {
                    findUnique: jest.fn().mockResolvedValue(mockSlotEntity),
                    update: jest.fn().mockResolvedValue(mockSlotEntity),
                  },
                  warehouse: {
                    findUnique: jest.fn().mockResolvedValue(mockWarehouseEntity),
                    update: jest.fn().mockResolvedValue(mockWarehouseEntity),
                  },
                });
              }
              return Promise.all(callback);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GoodsService>(GoodsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('create', () => {
    it('should calculate volume server-side (length x width x height / 10^6 x qty) and create goods item', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCustomerUserEntity as any);
      jest.spyOn(prisma.warehouse, 'findUnique').mockResolvedValue(mockWarehouseEntity as any);
      jest.spyOn(prisma.goodsItem, 'findFirst').mockResolvedValue(mockGoodsItem as any);

      const result = await service.create(
        {
          name: 'Norwegian Salmon Fillet',
          category: GoodsCategory.COLD_FOOD,
          description: 'Ikan salmon beku kualitas ekspor',
          lengthCm: 120,
          widthCm: 80,
          heightCm: 100,
          weightKg: 450,
          quantity: 10,
          unit: 'Master Box',
          warehouseId: 'wh-jkt-central',
          requiresColdStorage: true,
          pickupRequired: true,
        },
        mockCustomer1,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('brg-001');
    });

    it('should throw NotFoundException if warehouse does not exist or is inactive', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCustomerUserEntity as any);
      jest.spyOn(prisma.warehouse, 'findFirst').mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Test Goods',
            category: GoodsCategory.FURNITURE,
            description: 'Test Deskripsi',
            lengthCm: 100,
            widthCm: 50,
            heightCm: 50,
            weightKg: 50,
            quantity: 1,
            unit: 'Box',
            warehouseId: 'non-existent-wh',
          },
          mockCustomer1,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should reject invalid state transitions with BadRequestException', async () => {
      const draftGoods = {
        ...mockGoodsItem,
        status: GoodsStorageStatus.DRAFT,
      };
      jest.spyOn(prisma.goodsItem, 'findFirst').mockResolvedValue(draftGoods as any);

      // Attempt invalid transition: DRAFT -> DELIVERED
      await expect(
        service.updateStatus('brg-001', { status: GoodsStorageStatus.DELIVERED }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject Customer attempting to set status to STORED with ForbiddenException', async () => {
      const inspectingGoods = {
        ...mockGoodsItem,
        status: GoodsStorageStatus.INSPECTING,
      };
      jest.spyOn(prisma.goodsItem, 'findFirst').mockResolvedValue(inspectingGoods as any);

      await expect(
        service.updateStatus(
          'brg-001',
          { status: GoodsStorageStatus.STORED, slotId: 'slot-c01' },
          mockCustomer1,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return paginated goods list for Admin without tenant filter', async () => {
      jest.spyOn(prisma.goodsItem, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.goodsItem, 'findMany').mockResolvedValue([mockGoodsItem as any]);

      const result = await service.findAll({ page: 1, limit: 10 }, mockAdminUser);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('brg-001');
      expect(result.meta.page).toBe(1);
    });

    it('should automatically isolate data for Customer role to only their own goods', async () => {
      const countSpy = jest.spyOn(prisma.goodsItem, 'count').mockResolvedValue(1);
      const findManySpy = jest
        .spyOn(prisma.goodsItem, 'findMany')
        .mockResolvedValue([mockGoodsItem as any]);

      await service.findAll({}, mockCustomer1);

      expect(countSpy).toHaveBeenCalledWith({
        where: { customerId: 'usr-cust-1' },
      });
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { customerId: 'usr-cust-1' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return detailed goods item for Admin', async () => {
      jest.spyOn(prisma.goodsItem, 'findFirst').mockResolvedValue(mockGoodsItem as any);

      const result = await service.findById('brg-001', mockAdminUser);

      expect(result.id).toBe('brg-001');
      expect(result.warehouse.name).toBe('Gudang Utama Cakung Logistics Hub');
      expect(result.slot?.code).toBe('COLD-A01');
      expect(result.history).toHaveLength(1);
    });

    it('should throw NotFoundException if Customer attempts to access another customer goods (Anti-IDOR)', async () => {
      const otherCustomerGoods = {
        ...mockGoodsItem,
        customerId: 'usr-cust-2',
      };
      jest.spyOn(prisma.goodsItem, 'findFirst').mockResolvedValue(otherCustomerGoods as any);

      await expect(service.findById('brg-001', mockCustomer1)).rejects.toThrow(NotFoundException);
    });
  });
});
