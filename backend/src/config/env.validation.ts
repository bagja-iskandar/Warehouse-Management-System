import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().empty('').default(5000),
  API_PREFIX: Joi.string().allow('').default('api/v1'),
  CORS_ORIGIN: Joi.string().allow('').default('http://localhost:3000'),

  DATABASE_URL: Joi.string().required().description('PostgreSQL connection string'),

  JWT_ACCESS_SECRET: Joi.string()
    .min(16)
    .default('wms_default_access_secret_for_dev_mode_only_2026'),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(16)
    .default('wms_default_refresh_secret_for_dev_mode_only_2026'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  MINIO_ENDPOINT: Joi.string().default('localhost'),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().default('minioadmin'),
  MINIO_SECRET_KEY: Joi.string().default('minioadmin'),
  MINIO_BUCKET_NAME: Joi.string().default('wms-storage'),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .allow('')
    .default('debug'),
});
