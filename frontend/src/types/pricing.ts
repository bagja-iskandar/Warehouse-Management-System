import { StorageZoneType } from './warehouse.types';
export {
  MASTER_STORAGE_RATES,
  DEFAULT_STORAGE_RATE_PER_M3,
  MINIMUM_MONTHLY_RENTAL_FEE,
  OVERDUE_PENALTY_RATE_PER_WEEK,
  INVOICE_PAYMENT_GRACE_DAYS,
  getStorageRatePerM3,
} from '@/lib/constants/pricing.constants';

/**
 * Type-safe storage rate mapping per storage zone type.
 */
export type StorageRateMap = Record<StorageZoneType, number>;

/**
 * Standard pricing configuration schema for frontend display and calculations.
 */
export interface PricingConfiguration {
  storageRates: StorageRateMap;
  defaultStorageRatePerM3: number;
  minimumMonthlyRentalFee: number;
  overduePenaltyRatePerWeek: number;
  invoicePaymentGraceDays: number;
}
