import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface LivenessStatus {
  status: 'UP' | 'DOWN';
  uptimeSeconds: number;
  timestamp: string;
  nodeVersion: string;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

export interface ReadinessStatus {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  services: {
    database: {
      status: 'UP' | 'DOWN';
      latencyMs?: number;
    };
    storage: {
      status: 'UP' | 'UNAVAILABLE';
      target: string;
    };
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  getLiveness(): LivenessStatus {
    const memory = process.memoryUsage();
    return {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round(memory.rss / (1024 * 1024)),
        heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
      },
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const startDb = Date.now();
    const isDbHealthy = await this.prismaService.isHealthy();
    const dbLatencyMs = Date.now() - startDb;

    const overallStatus = isDbHealthy ? 'UP' : 'DEGRADED';

    return {
      status: overallStatus,
      services: {
        database: {
          status: isDbHealthy ? 'UP' : 'DOWN',
          latencyMs: dbLatencyMs,
        },
        storage: {
          status: 'UP',
          target: process.env.MINIO_ENDPOINT || 'localhost',
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
