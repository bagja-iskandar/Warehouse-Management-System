import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    let datasourceUrl = process.env.DATABASE_URL;

    // Automatically adapt Supabase Session Pooler (port 5432, max 15 clients)
    // to Transaction Pooler (port 6543, serverless scalable PgBouncer mode)
    if (datasourceUrl && datasourceUrl.includes('pooler.supabase.com:5432')) {
      try {
        const u = new URL(datasourceUrl);
        u.port = '6543';
        if (!u.searchParams.has('pgbouncer')) {
          u.searchParams.set('pgbouncer', 'true');
        }
        if (!u.searchParams.has('connection_limit')) {
          u.searchParams.set('connection_limit', '1');
        }
        datasourceUrl = u.toString();
      } catch {
        // Fallback to original url if parsing fails
      }
    }

    super({
      datasources: datasourceUrl
        ? {
            db: {
              url: datasourceUrl,
            },
          }
        : undefined,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database');
    } catch (error) {
      this.logger.error(`Failed to connect to PostgreSQL database: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
