import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SlotStatus, StorageZoneType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { WarehouseService } from './warehouse.service';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let prisma: PrismaService;

  const mockWarehouseData = {
    id: 'wh-jkt-central',
    code: 'WH-CKG-01',
    name: 'Gudang Utama Cakung Logistics Hub',
    address: 'Kawasan Industri Pulo Gadung Kav. 12-14',
    city: 'Jakarta Timur',
    totalCapacityM3: new Decimal(5000.0),
    usedCapacityM3: new Decimal(3150.0),
    isActive: true,
    managerName: 'Hendra Wijaya',
    contactPhone: '021-4609876',
    createdAt: new Date('2026-08-16T14:00:00.000Z'),
    updatedAt: new Date('2026-08-16T14:00:00.000Z'),
    zones: [
      {
        id: 'zone-1',
        warehouseId: 'wh-jkt-central',
        name: 'Zona Standar',
        type: StorageZoneType.STANDARD,
        capacityM3: new Decimal(3500.0),
        usedM3: new Decimal(2300.0),
        targetTempMin: null,
        targetTempMax: null,
        createdAt: new Date(),
      },
      {
        id: 'zone-2',
        warehouseId: 'wh-jkt-central',
        name: 'Zona Cold Storage',
        type: StorageZoneType.COLD_STORAGE,
        capacityM3: new Decimal(1500.0),
        usedM3: new Decimal(850.0),
        targetTempMin: new Decimal(-25.0),
        targetTempMax: new Decimal(-18.0),
        createdAt: new Date(),
      },
    ],
    slots: [
      {
        id: 'slot-1',
        warehouseId: 'wh-jkt-central',
        zoneId: 'zone-2',
        code: 'COLD-A01',
        zone: StorageZoneType.COLD_STORAGE,
        capacityM3: new Decimal(100.0),
        usedM3: new Decimal(85.0),
        temperatureCelsius: new Decimal(-18.5),
        humidityPercent: new Decimal(85.0),
        status: SlotStatus.OCCUPIED,
        goodsItems: [{ id: 'brg-001', status: 'STORED', volumeM3: new Decimal(85.0) }],
      },
      {
        id: 'slot-2',
        warehouseId: 'wh-jkt-central',
        zoneId: 'zone-1',
        code: 'RAK-F01',
        zone: StorageZoneType.STANDARD,
        capacityM3: new Decimal(200.0),
        usedM3: new Decimal(0.0),
        temperatureCelsius: new Decimal(24.0),
        humidityPercent: new Decimal(55.0),
        status: SlotStatus.AVAILABLE,
        goodsItems: [],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        {
          provide: PrismaService,
          useValue: {
            warehouse: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('findAll', () => {
    it('should return mapped warehouse list with calculated capacities and occupancy percent', async () => {
      jest.spyOn(prisma.warehouse, 'findMany').mockResolvedValue([mockWarehouseData as any]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wh-jkt-central');
      expect(result[0].code).toBe('WH-CKG-01');
      expect(result[0].slotsCount).toBe(2);
      expect(result[0].occupiedSlotsCount).toBe(1);
      expect(result[0].zones.standardCapacityM3).toBe(3500.0);
      expect(result[0].zones.coldStorageCapacityM3).toBe(1500.0);
    });

    it('should pass search and filter parameters to Prisma findMany', async () => {
      const findManySpy = jest.spyOn(prisma.warehouse, 'findMany').mockResolvedValue([]);

      await service.findAll({
        search: 'Cakung',
        city: 'Jakarta Timur',
        isActive: true,
      });

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            city: { contains: 'Jakarta Timur', mode: 'insensitive' },
            OR: [
              { name: { contains: 'Cakung', mode: 'insensitive' } },
              { code: { contains: 'Cakung', mode: 'insensitive' } },
              { city: { contains: 'Cakung', mode: 'insensitive' } },
              { address: { contains: 'Cakung', mode: 'insensitive' } },
            ],
          },
          orderBy: { code: 'asc' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return detailed warehouse with zones and slots', async () => {
      jest.spyOn(prisma.warehouse, 'findFirst').mockResolvedValue(mockWarehouseData as any);

      const result = await service.findById('wh-jkt-central');

      expect(result.id).toBe('wh-jkt-central');
      expect(result.zoneDetails).toHaveLength(2);
      expect(result.slots).toHaveLength(2);
      expect(result.slots[0].code).toBe('COLD-A01');
      expect(result.slots[0].currentGoodsCount).toBe(1);
      expect(result.slots[0].currentGoodsIds).toEqual(['brg-001']);
    });

    it('should throw NotFoundException when warehouse is not found', async () => {
      jest.spyOn(prisma.warehouse, 'findFirst').mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
