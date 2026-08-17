import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { storageConfig } from './config/storage.config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { GoodsModule } from './modules/goods/goods.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { BillingModule } from './modules/billing/billing.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';

@Module({
  imports: [
    // Global Configuration with Schema Validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Structured Logging with Pino
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDev = configService.get<string>('app.nodeEnv') === 'development';
        const logLevel = configService.get<string>('app.logLevel') || 'debug';

        return {
          pinoHttp: {
            level: logLevel,
            autoLogging: false,
            transport: isDev
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'body.password',
                'body.newPassword',
                'body.currentPassword',
                'body.token',
                'body.refreshToken',
                'body.signatureData',
              ],
              censor: '[REDACTED_SECRET]',
            },
          },
        };
      },
    }),

    // Core Database Module (Prisma + PostgreSQL)
    DatabaseModule,

    // Health & Liveness Module
    HealthModule,

    // Authentication & RBAC Module
    AuthModule,

    // Core Business Modules (Phase 11)
    WarehouseModule,
    GoodsModule,
    LogisticsModule,
    BillingModule,
    TelemetryModule,
  ],
})
export class AppModule {}
