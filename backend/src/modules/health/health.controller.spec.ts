import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const mockHealthService = {
      getLiveness: jest.fn().mockReturnValue({
        status: 'UP',
        uptimeSeconds: 10,
        timestamp: new Date().toISOString(),
        nodeVersion: 'v20.0.0',
        memoryUsageMb: { rss: 30, heapTotal: 20, heapUsed: 15 },
      }),
      getReadiness: jest.fn().mockResolvedValue({
        status: 'UP',
        services: {
          database: { status: 'UP', latencyMs: 5 },
          storage: { status: 'UP', target: 'localhost' },
        },
        timestamp: new Date().toISOString(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return liveness status', () => {
    const res = controller.getLiveness();
    expect(res.message).toBe('Liveness check passed');
    expect(res.data.status).toBe('UP');
  });

  it('should return readiness status', async () => {
    const res = await controller.getReadiness();
    expect(res.message).toBe('Readiness check passed');
    expect(res.data.status).toBe('UP');
  });
});
