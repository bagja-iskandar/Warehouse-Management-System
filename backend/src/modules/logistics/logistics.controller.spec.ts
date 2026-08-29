import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderStatus,
  OrderType,
  UserRole,
  UserStatus,
  VehicleStatus,
  VehicleType,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

describe('LogisticsController', () => {
  let controller: LogisticsController;
  let service: LogisticsService;

  const mockAdmin: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    status: UserStatus.ACTIVE,
  };

  const mockVehicle = {
    id: 'veh-01',
    plateNumber: 'B 9821 WMS',
    name: 'Isuzu Giga Reefer Cold Truck 5T',
    type: VehicleType.REEFER_TRUCK,
    maxWeightKg: 5000.0,
    maxVolumeM3: 18.5,
    hasRefrigeration: true,
    status: VehicleStatus.AVAILABLE,
    locationCity: 'Jakarta Timur',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const mockOrder = {
    id: 'ord-01',
    orderNumber: 'ORD-2026-092',
    type: OrderType.PICKUP,
    customerId: 'usr-cust-1',
    customerName: 'Siti Rahma',
    customerPhone: '081809876543',
    goodsItemIds: ['brg-001'],
    goodsSummary: '30x Salmon',
    totalVolumeM3: 0.96,
    totalWeightKg: 450.0,
    requiresReefer: true,
    originAddress: 'Sudirman',
    originCity: 'Jakarta Selatan',
    destinationAddress: 'Cakung',
    destinationCity: 'Jakarta Timur',
    scheduledDate: '2026-08-01',
    scheduledTimeSlot: '08:00 - 12:00 WIB',
    status: OrderStatus.IN_TRANSIT,
    estimatedDurationMins: 60,
    distanceKm: 28.5,
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      email: 'customer@freshfoods.id',
      phone: '081809876543',
    },
    items: [],
    createdAt: '2026-08-01T07:30:00Z',
    updatedAt: '2026-08-01T07:30:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsController],
      providers: [
        {
          provide: LogisticsService,
          useValue: {
            findAllVehicles: jest.fn().mockResolvedValue([mockVehicle]),
            assignDriver: jest.fn().mockResolvedValue(mockVehicle),
            findAllOrders: jest.fn().mockResolvedValue({
              items: [mockOrder],
              meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
            }),
            findOrderById: jest.fn().mockResolvedValue(mockOrder),
            createOrder: jest.fn().mockResolvedValue(mockOrder),
            updateOrderStatus: jest.fn().mockResolvedValue(mockOrder),
            submitPod: jest.fn().mockResolvedValue(mockOrder),
          },
        },
      ],
    }).compile();

    controller = module.get<LogisticsController>(LogisticsController);
    service = module.get<LogisticsService>(LogisticsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAllVehicles', () => {
    it('should return enveloped vehicle list', async () => {
      const response = await controller.findAllVehicles({});
      expect(response.message).toBe('Daftar armada kendaraan berhasil diambil');
      expect(response.data).toHaveLength(1);
    });
  });

  describe('findAllOrders', () => {
    it('should return enveloped order list', async () => {
      const response = await controller.findAllOrders({}, mockAdmin);
      expect(response.message).toBe('Delivery orders retrieved successfully');
      expect(response.data.items).toHaveLength(1);
    });
  });
});
