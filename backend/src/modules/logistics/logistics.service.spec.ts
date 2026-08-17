import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  GoodsCategory,
  OrderStatus,
  OrderType,
  UserRole,
  UserStatus,
  VehicleStatus,
  VehicleType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { LogisticsService } from './logistics.service';

describe('LogisticsService', () => {
  let service: LogisticsService;
  let prisma: PrismaService;

  const mockAdminUser: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    status: UserStatus.ACTIVE,
  };

  const mockCustomerUser: AuthenticatedUser = {
    id: 'usr-cust-1',
    email: 'customer@freshfoods.id',
    name: 'Siti Rahma',
    role: UserRole.CUSTOMER,
    phone: '081809876543',
    status: UserStatus.ACTIVE,
  };

  const mockVehicleEntity = {
    id: 'veh-01',
    plateNumber: 'B 9821 WMS',
    name: 'Isuzu Giga Reefer Cold Truck 5T',
    type: VehicleType.REEFER_TRUCK,
    maxWeightKg: new Decimal(5000.0),
    maxVolumeM3: new Decimal(18.5),
    hasRefrigeration: true,
    minTempCelsius: new Decimal(-25.0),
    status: VehicleStatus.AVAILABLE,
    currentDriverId: 'usr-driver-1',
    locationCity: 'Jakarta Timur',
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
    driver: {
      id: 'usr-driver-1',
      name: 'Agus Pratama',
      phone: '081398765432',
    },
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
    quantity: 30,
    unit: 'Master Box',
    requiresColdStorage: true,
    targetTempMin: new Decimal(-22.0),
    targetTempMax: new Decimal(-18.0),
    currentTemp: new Decimal(-19.4),
    storageStartDate: new Date('2026-08-01T09:00:00Z'),
    storageEndDate: null,
    monthlyRentalFee: new Decimal(2400000.0),
    status: 'STORED',
    imageUrl: null,
    qrCodeData: 'WMS://ITEM/brg-001',
    createdAt: new Date('2026-08-01T09:00:00Z'),
    updatedAt: new Date('2026-08-01T09:00:00Z'),
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      companyName: 'CV Fresh Frozen Nusantara',
      email: 'customer@freshfoods.id',
      phone: '081809876543',
    },
    warehouse: {
      id: 'wh-jkt-central',
      code: 'WH-CKG-01',
      name: 'Gudang Utama Cakung Logistics Hub',
      city: 'Jakarta Timur',
    },
    slot: {
      id: 'slot-c01',
      code: 'COLD-A01',
      zone: 'COLD_STORAGE',
      temperatureCelsius: new Decimal(-18.5),
      status: 'OCCUPIED',
    },
  };

  const mockOrderEntity = {
    id: 'ord-01',
    orderNumber: 'ORD-2026-092',
    type: OrderType.PICKUP,
    customerId: 'usr-cust-1',
    driverId: 'usr-driver-1',
    vehicleId: 'veh-01',
    goodsSummary: '30x Norwegian Salmon Fillet Grade A',
    totalVolumeM3: new Decimal(0.96),
    totalWeightKg: new Decimal(450.0),
    requiresReefer: true,
    originAddress: 'Kavling Cold Chain Sudirman Kav. 21',
    originCity: 'Jakarta Selatan',
    destinationAddress: 'Kawasan Industri Pulo Gadung Kav. 12-14',
    destinationCity: 'Jakarta Timur',
    scheduledDate: new Date('2026-08-01'),
    scheduledTimeSlot: '08:00 - 12:00 WIB',
    status: OrderStatus.IN_TRANSIT,
    estimatedDurationMins: 60,
    distanceKm: new Decimal(28.5),
    isDelayed: false,
    delayReason: null,
    rescheduledTime: null,
    proofOfDeliveryUrl: null,
    recipientName: null,
    recipientSignature: null,
    driverRating: null,
    createdAt: new Date('2026-08-01T07:30:00Z'),
    updatedAt: new Date('2026-08-01T07:30:00Z'),
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      companyName: 'CV Fresh Frozen Nusantara',
      email: 'customer@freshfoods.id',
      phone: '081809876543',
    },
    driver: {
      id: 'usr-driver-1',
      name: 'Agus Pratama',
      phone: '081398765432',
    },
    vehicle: {
      id: 'veh-01',
      plateNumber: 'B 9821 WMS',
      name: 'Isuzu Giga Reefer Cold Truck 5T',
      type: VehicleType.REEFER_TRUCK,
      hasRefrigeration: true,
    },
    orderItems: [
      {
        goodsId: 'brg-001',
        goods: mockGoodsItem,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            goodsItem: {
              findMany: jest.fn(),
            },
            deliveryOrder: {
              count: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                return callback({
                  deliveryOrder: {
                    create: jest.fn().mockResolvedValue(mockOrderEntity),
                    update: jest.fn().mockResolvedValue(mockOrderEntity),
                  },
                  vehicle: {
                    update: jest.fn().mockResolvedValue(mockVehicleEntity),
                  },
                });
              }
              return Promise.all(callback);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LogisticsService>(LogisticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('findAllVehicles', () => {
    it('should return list of vehicles with driver details', async () => {
      jest.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([mockVehicleEntity as any]);

      const result = await service.findAllVehicles({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('veh-01');
      expect(result[0].plateNumber).toBe('B 9821 WMS');
      expect(result[0].currentDriverName).toBe('Agus Pratama');
    });
  });

  describe('assignDriver', () => {
    it('should allow Admin to assign driver to vehicle', async () => {
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(mockVehicleEntity as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'usr-driver-1',
        role: UserRole.DRIVER,
      } as any);
      jest.spyOn(prisma.vehicle, 'update').mockResolvedValue({
        ...mockVehicleEntity,
        status: VehicleStatus.IN_SERVICE,
      } as any);

      const result = await service.assignDriver(
        { vehicleId: 'veh-01', driverId: 'usr-driver-1' },
        mockAdminUser,
      );

      expect(result.id).toBe('veh-01');
      expect(result.status).toBe(VehicleStatus.IN_SERVICE);
    });

    it('should reject non-admin users with ForbiddenException', async () => {
      await expect(
        service.assignDriver({ vehicleId: 'veh-01', driverId: 'usr-driver-1' }, mockCustomerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createOrder', () => {
    it('should create delivery order and validate cold storage reefer truck requirement', async () => {
      jest.spyOn(prisma.goodsItem, 'findMany').mockResolvedValue([mockGoodsItem as any]);
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(mockVehicleEntity as any);
      jest.spyOn(prisma.deliveryOrder, 'findFirst').mockResolvedValue(mockOrderEntity as any);

      const result = await service.createOrder(
        {
          type: OrderType.PICKUP,
          goodsItemIds: ['brg-001'],
          originAddress: 'Kavling Cold Chain',
          originCity: 'Jakarta Selatan',
          destinationAddress: 'Gudang Cakung',
          destinationCity: 'Jakarta Timur',
          scheduledDate: '2026-08-01',
          scheduledTimeSlot: '08:00 - 12:00 WIB',
          vehicleId: 'veh-01',
        },
        mockCustomerUser,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('ord-01');
      expect(result.requiresReefer).toBe(true);
    });

    it('should reject allocation of non-reefer vehicle when goods require cold storage', async () => {
      const dryVan = {
        ...mockVehicleEntity,
        type: VehicleType.VAN,
        hasRefrigeration: false,
      };
      jest.spyOn(prisma.goodsItem, 'findMany').mockResolvedValue([mockGoodsItem as any]);
      jest.spyOn(prisma.vehicle, 'findUnique').mockResolvedValue(dryVan as any);

      await expect(
        service.createOrder(
          {
            type: OrderType.PICKUP,
            goodsItemIds: ['brg-001'],
            originAddress: 'Kavling Cold Chain',
            originCity: 'Jakarta Selatan',
            destinationAddress: 'Gudang Cakung',
            destinationCity: 'Jakarta Timur',
            scheduledDate: '2026-08-01',
            scheduledTimeSlot: '08:00 - 12:00 WIB',
            vehicleId: 'veh-02',
          },
          mockCustomerUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrderStatus', () => {
    it('should reject arbitrary state transitions', async () => {
      jest.spyOn(prisma.deliveryOrder, 'findFirst').mockResolvedValue({
        ...mockOrderEntity,
        status: OrderStatus.PENDING_ASSIGNMENT,
      } as any);

      await expect(
        service.updateOrderStatus('ord-01', { status: OrderStatus.DELIVERED }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitPod', () => {
    it('should update POD data and transition status to DELIVERED', async () => {
      jest.spyOn(prisma.deliveryOrder, 'findFirst').mockResolvedValue(mockOrderEntity as any);

      const result = await service.submitPod(
        'ord-01',
        {
          proofOfDeliveryUrl: 'https://example.com/pod.jpg',
          recipientName: 'Bpk. Ahmad Subarjo',
          recipientSignature: 'data:image/png;base64,...',
          driverRating: 5.0,
        },
        mockAdminUser,
      );

      expect(result).toBeDefined();
    });
  });
});
