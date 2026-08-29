import { OVERDUE_PENALTY_RATE_PER_WEEK } from './pricing.constants';

export const APP_CONSTANTS = {
  DEFAULT_PORT: 5000,
  DEFAULT_API_PREFIX: 'api/v1',
  DEFAULT_PAGINATION_LIMIT: 10,
  MAX_PAGINATION_LIMIT: 100,
  IS_PUBLIC_KEY: 'isPublic',
  ROLES_KEY: 'roles',
  CORRELATION_ID_HEADER: 'x-correlation-id',
  IDEMPOTENCY_KEY_HEADER: 'x-idempotency-key',
} as const;

export const BUSINESS_RULES = {
  // Late payment penalty per week (SRS UC12 - Single Source of Truth)
  LATE_PENALTY_RATE_PER_WEEK: OVERDUE_PENALTY_RATE_PER_WEEK,
  // Cold storage temperature limits (SRS UC9)
  COLD_STORAGE_TEMP_MIN_CELSIUS: -25.0,
  COLD_STORAGE_TEMP_MAX_CELSIUS: -18.0,
  COLD_STORAGE_ANOMALY_THRESHOLD_CELSIUS: -16.0,
} as const;
