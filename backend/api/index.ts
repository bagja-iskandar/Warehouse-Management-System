import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

const server: Express = express();
let initPromise: Promise<void> | null = null;

/**
 * Bootstraps the NestJS application wrapped within the Express instance for Vercel Serverless.
 * Does NOT call app.listen() to comply with serverless execution models.
 */
async function bootstrapServerless(expressInstance: Express): Promise<void> {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      bufferLogs: true,
    },
  );

  // Attach Structured Pino Logger
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const rawCorsOrigin = configService.get<string>('app.corsOrigin');
  const corsOrigin = rawCorsOrigin && rawCorsOrigin.trim() ? rawCorsOrigin.trim() : '*';
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // Security HTTP Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Gzip / Brotli Payload Compression
  app.use(compression());

  // CORS Configuration (Aligned with main.ts)
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        nodeEnv === 'development' ||
        corsOrigin.includes('*') ||
        corsOrigin
          .split(',')
          .map((o) => o.trim())
          .includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Accept,Authorization,X-Requested-With,X-Idempotency-Key,X-Request-ID,x-request-id,X-Correlation-ID,x-correlation-id',
    exposedHeaders:
      'X-Request-ID,x-request-id,X-Correlation-ID,x-correlation-id,Content-Disposition',
    credentials: true,
  });

  // Global API Route Prefix (e.g. /api/v1)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health/(.*)', 'health'],
  });

  // Global Validation Pipe (Strict Boundary)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformResponseInterceptor());

  // Global Error Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // OpenAPI / Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('WMS Nusantara — Warehouse Management System REST API')
    .setDescription(
      'Spesifikasi resmi RESTful API Backend WMS Nusantara untuk Web Next.js dan Mobile Android Kotlin.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Masukkan JWT Bearer token: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health & Monitoring', 'Liveness & Readiness probe endpoints')
    .addTag('Authentication', 'Login, Register, Refresh Token & User Profiles (Phase 10)')
    .addTag('Warehouses & 3D Slots', 'Gudang, zona simpan, dan visualisasi rak 3D (Phase 11)')
    .addTag('Goods & Inventory', 'Master SKU, dimensi kubikasi m3, dan barcode QR (Phase 11)')
    .addTag('Logistics & Fleet', 'Armada truk Reefer/Box, DO Dispatch, dan Digital POD (Phase 11)')
    .addTag('Billing & Invoicing', 'Faktur sewa bulanan, VA, dan denda 5%/minggu (Phase 11)')
    .addTag('IoT Telemetry', 'Ingestion sensor suhu Cold Storage & anomali deteksi (Phase 11)')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // Mount Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'WMS Nusantara API Documentation',
  });

  // Export Swagger JSON spec endpoint at /api/docs-json
  app.getHttpAdapter().get('/api/docs-json', (req: Request, res: Response) => {
    res.json(swaggerDocument);
  });

  // Root endpoint info
  app.getHttpAdapter().get('/', (req: Request, res: Response) => {
    res.json({
      name: 'WMS Nusantara Backend REST API',
      status: 'UP',
      environment: nodeEnv,
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health/liveness',
    });
  });

  // Initialize without persistent TCP listen
  await app.init();
}

/**
 * Ensures singleton application initialization across warm serverless function invocations.
 */
async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = bootstrapServerless(server);
  }
  return initPromise;
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req: Request, res: Response): Promise<void> {
  await ensureInitialized();
  server(req, res);
}
