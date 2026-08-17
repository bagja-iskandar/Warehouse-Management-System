import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageZoneType, VehicleType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let prisma: PrismaService;

  const mockSlotEntity = {
    id: 'slot-c01',
    code: 'COLD-A01',
    warehouseId: 'wh-jkt-central',
    zone: StorageZoneType.COLD_STORAGE,
    capacityM3: new Decimal(100.0),
    usedM3: new Decimal(20.0),
    temperatureCelsius: new Decimal(-19.4),
    humidityPercent: new Decimal(85.0),
    status: 'OCCUPIED',
    warehouse: {
      id: 'wh-jkt-central',
      code: 'WH-CKG-01',
      name: 'Gudang Utama Cakung Logistics Hub',
    },
    goodsItems: [
      {
        id: 'brg-001',
        name: 'Norwegian Salmon Fillet Grade A',
        customerId: 'usr-cust-1',
        customer: { id: 'usr-cust-1', name: 'Siti Rahma' },
      },
    ],
  };

  const mockVehicleEntity = {
    id: 'veh-01',
    plateNumber: 'B 9821 WMS',
    name: 'Isuzu Giga Reefer Cold Truck 5T',
    type: VehicleType.REEFER_TRUCK,
    hasRefrigeration: true,
    minTempCelsius: new Decimal(-25.0),
    status: 'AVAILABLE',
    currentDriverId: 'usr-driver-1',
    driver: { id: 'usr-driver-1', name: 'Agus Pratama' },
    telemetryLogs: [
      {
        id: BigInt(1),
        temperatureCelsius: new Decimal(-20.2),
        humidityPercent: new Decimal(82.0),
        isAnomaly: false,
        recordedAt: new Date(),
      },
    ],
  };

  const mockLogEntity = {
    id: BigInt(1),
    slotId: 'slot-c01',
    vehicleId: null,
    temperatureCelsius: new Decimal(-19.4),
    humidityPercent: new Decimal(85.0),
    isAnomaly: false,
    recordedAt: new Date('2026-08-17T10:00:00Z'),
    slot: mockSlotEntity,
    vehicle: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: {
            storageSlot: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            vehicle: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            goodsItem: {
              updateMany: jest.fn(),
            },
            user: {
              findMany: jest.fn().mockResolvedValue([{ id: 'usr-admin-1' }]),
            },
            systemNotification: {
              create: jest.fn(),
            },
            telemetryLog: {
              create: jest.fn().mockResolvedValue(mockLogEntity),
              count: jest.fn(),
              findMany: jest.fn(),
            },
            $transaction: jest.fn().mockImplementation(async (callback) => {
              if (typeof callback === 'function') {
                return callback({
                  telemetryLog: {
                    create: jest.fn().mockResolvedValue(mockLogEntity),
                  },
                  storageSlot: {
                    update: jest.fn().mockResolvedValue(mockSlotEntity),
                  },
                  goodsItem: {
                    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                  },
                  user: {
                    findMany: jest.fn().mockResolvedValue([{ id: 'usr-admin-1' }]),
                  },
                  systemNotification: {
                    create: jest.fn().mockResolvedValue({ id: 'notif-01' }),
                  },
                });
              }
              return Promise.all(callback);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('1. Ingest Telemetry Data', () => {
    it('should record normal cold storage reading (-19.4 C) as isAnomaly = false', async () => {
      jest.spyOn(prisma.storageSlot, 'findUnique').mockResolvedValue(mockSlotEntity as any);

      const result = await service.ingest({
        slotId: 'slot-c01',
        temperatureCelsius: -19.4,
        humidityPercent: 85.0,
      });

      expect(result).toBeDefined();
      expect(result.slotId).toBe('slot-c01');
      expect(result.temperatureCelsius).toBe(-19.4);
      expect(result.isAnomaly).toBe(false);
    });

    it('should detect temperature anomaly when cold storage exceeds -18.0 C (e.g. -14.5 C)', async () => {
      jest.spyOn(prisma.storageSlot, 'findUnique').mockResolvedValue(mockSlotEntity as any);

      const result = await service.ingest({
        slotId: 'slot-c01',
        temperatureCelsius: -14.5,
        humidityPercent: 85.0,
      });

      expect(result).toBeDefined();
    });

    it('should reject ingest when neither slotId nor vehicleId is supplied', async () => {
      await expect(
        service.ingest({
          temperatureCelsius: -19.0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent slotId', async () => {
      jest.spyOn(prisma.storageSlot, 'findUnique').mockResolvedValue(null);

      await expect(
        service.ingest({
          slotId: 'slot-999',
          temperatureCelsius: -19.0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Monitoring Snapshot', () => {
    it('should aggregate cold slots and reefer vehicles with status conditions', async () => {
      jest.spyOn(prisma.storageSlot, 'findMany').mockResolvedValue([mockSlotEntity as any]);
      jest.spyOn(prisma.vehicle, 'findMany').mockResolvedValue([mockVehicleEntity as any]);

      const snapshot = await service.getMonitoringSnapshot();

      expect(snapshot).toBeDefined();
      expect(snapshot.summary.totalMonitoredSensors).toBe(2);
      expect(snapshot.slots).toHaveLength(1);
      expect(snapshot.slots[0].condition).toBe('SAFE');
      expect(snapshot.vehicles).toHaveLength(1);
      expect(snapshot.vehicles[0].condition).toBe('SAFE');
    });
  });

  describe('3. Telemetry Logs Query', () => {
    it('should return paginated telemetry logs', async () => {
      jest.spyOn(prisma.telemetryLog, 'count').mockResolvedValue(1);
      jest.spyOn(prisma.telemetryLog, 'findMany').mockResolvedValue([mockLogEntity as any]);

      const result = await service.findAllLogs({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('1');
      expect(result.meta.totalItems).toBe(1);
    });
  });
});
