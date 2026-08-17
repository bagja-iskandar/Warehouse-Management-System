import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, LivenessStatus, ReadinessStatus } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Verifies that the backend process is running and responding to HTTP requests.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      example: {
        success: true,
        message: 'Liveness check passed',
        data: {
          status: 'UP',
          uptimeSeconds: 120,
          timestamp: '2026-08-16T19:30:00.000Z',
          nodeVersion: 'v20.x.x',
          memoryUsageMb: { rss: 45, heapTotal: 30, heapUsed: 22 },
        },
        meta: {
          timestamp: '2026-08-16T19:30:00.000Z',
          path: '/api/v1/health/liveness',
        },
      },
    },
  })
  getLiveness(): { message: string; data: LivenessStatus } {
    return {
      message: 'Liveness check passed',
      data: this.healthService.getLiveness(),
    };
  }

  @Public()
  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Verifies that the backend and its critical infrastructure dependencies (PostgreSQL database) are healthy.',
  })
  @ApiResponse({
    status: 200,
    description: 'Infrastructure dependencies are ready',
    schema: {
      example: {
        success: true,
        message: 'Readiness check passed',
        data: {
          status: 'UP',
          services: {
            database: { status: 'UP', latencyMs: 5 },
            storage: { status: 'UP', target: 'localhost' },
          },
          timestamp: '2026-08-16T19:30:00.000Z',
        },
        meta: {
          timestamp: '2026-08-16T19:30:00.000Z',
          path: '/api/v1/health/readiness',
        },
      },
    },
  })
  async getReadiness(): Promise<{ message: string; data: ReadinessStatus }> {
    const result = await this.healthService.getReadiness();
    return {
      message:
        result.status === 'UP'
          ? 'Readiness check passed'
          : 'Readiness check degraded: database dependency issue',
      data: result,
    };
  }
}
