import { StorageZoneType } from "@/types";

/**
 * MASTER PRICING CONFIGURATION (Single Source of Truth)
 * Standardized storage rates per cubic meter (m³) per month in IDR.
 */
export const MASTER_STORAGE_RATES: Record<StorageZoneType, number> = {
  STANDARD: 50_000,
  HEAVY_DUTY: 75_000,
  COLD_STORAGE: 150_000,
};

/** Default rate per m³ if unspecified (Standard Storage) */
export const DEFAULT_STORAGE_RATE_PER_M3 = 50_000;

/** Minimum monthly rental fee (IDR) */
export const MINIMUM_MONTHLY_RENTAL_FEE = 50_000;

/** Overdue penalty rate: 5% per week past due date */
export const OVERDUE_PENALTY_RATE_PER_WEEK = 0.05;

/** Standard invoice payment grace period in days */
export const INVOICE_PAYMENT_GRACE_DAYS = 14;

/**
 * Helper to get rate per m3 for a given storage type
 */
export function getStorageRatePerM3(storageType?: StorageZoneType | string): number {
  if (!storageType) return DEFAULT_STORAGE_RATE_PER_M3;
  return MASTER_STORAGE_RATES[storageType as StorageZoneType] ?? DEFAULT_STORAGE_RATE_PER_M3;
}
