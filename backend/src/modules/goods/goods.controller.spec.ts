import { Test, TestingModule } from '@nestjs/testing';
import { GoodsCategory, GoodsStorageStatus, UserRole, UserStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { GoodsController } from './goods.controller';
import { GoodsService } from './goods.service';

describe('GoodsController', () => {
  let controller: GoodsController;
  let service: GoodsService;

  const mockUser: AuthenticatedUser = {
    id: 'usr-admin-1',
    email: 'admin@wms.id',
    name: 'Budi Santoso',
    role: UserRole.ADMIN,
    phone: '081234567890',
    status: UserStatus.ACTIVE,
  };

  const mockGoodsListItem = {
    id: 'brg-001',
    barcode: 'BRG-2026-FROZEN-001',
    customerId: 'usr-cust-1',
    customerName: 'Siti Rahma',
    warehouseId: 'wh-jkt-central',
    warehouseName: 'Gudang Utama Cakung Logistics Hub',
    warehouseCode: 'WH-CKG-01',
    name: 'Norwegian Salmon Fillet Grade A',
    category: GoodsCategory.COLD_FOOD,
    description: 'Ikan salmon beku kualitas ekspor',
    dimensions: {
      lengthCm: 120.0,
      widthCm: 80.0,
      heightCm: 100.0,
      volumeM3: 0.96,
      weightKg: 450.0,
    },
    quantity: 30,
    unit: 'Master Box',
    requiresColdStorage: true,
    storageStartDate: '2026-08-01T09:00:00Z',
    monthlyRentalFee: 2400000.0,
    status: GoodsStorageStatus.STORED,
    qrCodeData: 'WMS://ITEM/brg-001',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  };

  const mockGoodsDetail = {
    ...mockGoodsListItem,
    warehouse: {
      id: 'wh-jkt-central',
      code: 'WH-CKG-01',
      name: 'Gudang Utama Cakung Logistics Hub',
      city: 'Jakarta Timur',
    },
    customer: {
      id: 'usr-cust-1',
      name: 'Siti Rahma',
      email: 'customer@freshfoods.id',
      phone: '081809876543',
    },
    history: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodsController],
      providers: [
        {
          provide: GoodsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockGoodsDetail),
            updateStatus: jest.fn().mockResolvedValue(mockGoodsDetail),
            findAll: jest.fn().mockResolvedValue({
              items: [mockGoodsListItem],
              meta: {
                page: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
              },
            }),
            findById: jest.fn().mockResolvedValue(mockGoodsDetail),
          },
        },
      ],
    }).compile();

    controller = module.get<GoodsController>(GoodsController);
    service = module.get<GoodsService>(GoodsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create goods and return enveloped detail', async () => {
      const response = await controller.create(
        {
          name: 'Norwegian Salmon Fillet',
          category: GoodsCategory.COLD_FOOD,
          description: 'Ikan salmon beku kualitas ekspor',
          lengthCm: 120,
          widthCm: 80,
          heightCm: 100,
          weightKg: 450,
          quantity: 30,
          unit: 'Master Box',
          warehouseId: 'wh-jkt-central',
        },
        mockUser,
      );

      expect(response.message).toBe('Goods registered successfully');
      expect(response.data.id).toBe('brg-001');
    });
  });

  describe('updateStatus', () => {
    it('should update status and return enveloped detail', async () => {
      const response = await controller.updateStatus(
        'brg-001',
        { status: GoodsStorageStatus.STORED, slotId: 'slot-c01' },
        mockUser,
      );

      expect(response.message).toBe('Goods status updated successfully');
      expect(response.data.id).toBe('brg-001');
    });
  });

  describe('findAll', () => {
    it('should return enveloped paginated goods items', async () => {
      const response = await controller.findAll({}, mockUser);

      expect(response.message).toBe('Goods retrieved successfully');
      expect(response.data.items).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return enveloped goods detail', async () => {
      const response = await controller.findById('brg-001', mockUser);

      expect(response.message).toBe('Goods detail retrieved successfully');
      expect(response.data.id).toBe('brg-001');
    });
  });
});
