import { StorageZoneType } from '@prisma/client';

/**
 * MASTER PRICING CONFIGURATION (Single Source of Truth)
 * Standardized storage rates per cubic meter (m³) per month in IDR.
 */
export const MASTER_STORAGE_RATES: Record<StorageZoneType, number> = {
  [StorageZoneType.STANDARD]: 50_000,
  [StorageZoneType.HEAVY_DUTY]: 75_000,
  [StorageZoneType.COLD_STORAGE]: 150_000,
};

/** Default rate per m³ if unspecified (Standard Storage) */
export const DEFAULT_STORAGE_RATE_PER_M3 = 50_000;

/** Minimum monthly rental fee for any goods registration (IDR) */
export const MINIMUM_MONTHLY_RENTAL_FEE = 50_000;

/** Overdue penalty rate: 5% per week past due date */
export const OVERDUE_PENALTY_RATE_PER_WEEK = 0.05;

/** Standard invoice payment grace period in days */
export const INVOICE_PAYMENT_GRACE_DAYS = 14;
