import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  let service: TelemetryService;

  const mockLogDto = {
    id: '1',
    slotId: 'slot-c01',
    slotCode: 'COLD-A01',
    warehouseName: 'Gudang Utama Cakung Logistics Hub',
    vehicleId: null,
    vehiclePlate: null,
    temperatureCelsius: -19.4,
    humidityPercent: 85.0,
    isAnomaly: false,
    recordedAt: '2026-08-17T10:00:00.000Z',
  };

  const mockSnapshot = {
    summary: {
      totalMonitoredSensors: 4,
      activeAnomaliesCount: 0,
      coldStorageSafeCount: 3,
      coldStorageWarningCount: 1,
      coldStorageCriticalCount: 0,
      averageColdTempCelsius: -19.2,
    },
    slots: [],
    vehicles: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: {
            ingest: jest.fn().mockResolvedValue(mockLogDto),
            getMonitoringSnapshot: jest.fn().mockResolvedValue(mockSnapshot),
            findAllLogs: jest.fn().mockResolvedValue({
              items: [mockLogDto],
              meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('ingest', () => {
    it('should ingest telemetry and return enveloped result', async () => {
      const response = await controller.ingest({
        slotId: 'slot-c01',
        temperatureCelsius: -19.4,
      });

      expect(response.message).toBe('Data sensor telemetri berhasil dicatat');
      expect(response.data.id).toBe('1');
    });
  });

  describe('getMonitoringSnapshot', () => {
    it('should return live monitoring snapshot', async () => {
      const response = await controller.getMonitoringSnapshot();

      expect(response.message).toBe('Data live monitoring telemetri berhasil diambil');
      expect(response.data.summary.totalMonitoredSensors).toBe(4);
    });
  });

  describe('findAllLogs', () => {
    it('should return paginated telemetry logs', async () => {
      const response = await controller.findAllLogs({});

      expect(response.message).toBe('Daftar log telemetri berhasil diambil');
      expect(response.data.items).toHaveLength(1);
    });
  });
});
