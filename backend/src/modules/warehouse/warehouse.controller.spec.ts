import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';

describe('WarehouseController', () => {
  let controller: WarehouseController;
  let service: WarehouseService;

  const mockWarehouseListItem = {
    id: 'wh-jkt-central',
    code: 'WH-CKG-01',
    name: 'Gudang Utama Cakung Logistics Hub',
    address: 'Kawasan Industri Pulo Gadung Kav. 12-14',
    city: 'Jakarta Timur',
    totalCapacityM3: 5000.0,
    usedCapacityM3: 3150.0,
    occupancyPercent: 63.0,
    slotsCount: 6,
    occupiedSlotsCount: 4,
    zones: {
      standardCapacityM3: 3500.0,
      coldStorageCapacityM3: 1500.0,
    },
    isActive: true,
    managerName: 'Hendra Wijaya',
    contactPhone: '021-4609876',
    createdAt: '2026-08-16T14:00:00.000Z',
    updatedAt: '2026-08-16T14:00:00.000Z',
  };

  const mockWarehouseDetail = {
    ...mockWarehouseListItem,
    zoneDetails: [],
    slots: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseController],
      providers: [
        {
          provide: WarehouseService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockWarehouseListItem]),
            findById: jest.fn().mockResolvedValue(mockWarehouseDetail),
          },
        },
      ],
    }).compile();

    controller = module.get<WarehouseController>(WarehouseController);
    service = module.get<WarehouseService>(WarehouseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return enveloped warehouse list with message', async () => {
      const response = await controller.findAll({});

      expect(response.message).toBe('Daftar fasilitas gudang berhasil diambil');
      expect(response.data).toHaveLength(1);
      expect(response.data[0].id).toBe('wh-jkt-central');
    });
  });

  describe('findById', () => {
    it('should return enveloped warehouse detail with message', async () => {
      const response = await controller.findById('wh-jkt-central');

      expect(response.message).toBe('Detail fasilitas gudang berhasil diambil');
      expect(response.data.id).toBe('wh-jkt-central');
      expect(response.data.code).toBe('WH-CKG-01');
    });
  });
});
