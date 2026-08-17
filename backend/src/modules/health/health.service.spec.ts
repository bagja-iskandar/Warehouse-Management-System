import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLiveness', () => {
    it('should return UP status with uptime and memory stats', () => {
      const result = service.getLiveness();
      expect(result.status).toBe('UP');
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(result.nodeVersion).toBeDefined();
      expect(result.memoryUsageMb).toBeDefined();
    });
  });

  describe('getReadiness', () => {
    it('should return UP when database is healthy', async () => {
      prismaService.isHealthy.mockResolvedValueOnce(true);
      const result = await service.getReadiness();
      expect(result.status).toBe('UP');
      expect(result.services.database.status).toBe('UP');
    });

    it('should return DEGRADED when database is down', async () => {
      prismaService.isHealthy.mockResolvedValueOnce(false);
      const result = await service.getReadiness();
      expect(result.status).toBe('DEGRADED');
      expect(result.services.database.status).toBe('DOWN');
    });
  });
});
