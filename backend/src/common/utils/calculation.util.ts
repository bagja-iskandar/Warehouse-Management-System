import { Decimal } from '@prisma/client/runtime/library';
import {
  MINIMUM_MONTHLY_RENTAL_FEE,
  OVERDUE_PENALTY_RATE_PER_WEEK,
} from '../constants/pricing.constants';

/**
 * Standard calculation engine for Warehouse Management System (WMS Nusantara).
 * Enforces mathematically consistent and deterministic conversions across all backend services.
 */

/**
 * Calculate volume in cubic meters (m³) from dimensions in centimeters (cm).
 * Formula: (lengthCm * widthCm * heightCm) / 1,000,000
 * Guarded against negative, zero, and NaN inputs.
 */
export function calculateVolumeM3(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  decimals = 4,
): number {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  if (isNaN(lengthCm) || isNaN(widthCm) || isNaN(heightCm)) return 0;
  if (!isFinite(lengthCm) || !isFinite(widthCm) || !isFinite(heightCm)) return 0;

  const volume = (lengthCm * widthCm * heightCm) / 1_000_000;
  return Number(volume.toFixed(decimals));
}

/**
 * Calculate total volume for a package batch (unit volume * quantity).
 */
export function calculateTotalVolumeM3(
  volumePerItemM3: number,
  quantity = 1,
  decimals = 4,
): number {
  if (!volumePerItemM3 || volumePerItemM3 <= 0 || quantity <= 0) return 0;
  if (isNaN(volumePerItemM3) || isNaN(quantity)) return 0;
  if (!isFinite(volumePerItemM3) || !isFinite(quantity)) return 0;

  return Number((volumePerItemM3 * quantity).toFixed(decimals));
}

/**
 * Convert weight in kilograms (kg) to metric tons (ton).
 * Formula: weightKg / 1,000
 */
export function kgToTon(weightKg: number, decimals = 2): number {
  if (!weightKg || weightKg <= 0 || isNaN(weightKg) || !isFinite(weightKg)) return 0;
  return Number((weightKg / 1_000).toFixed(decimals));
}

/**
 * Convert weight in metric tons (ton) to kilograms (kg).
 * Formula: weightTon * 1,000
 */
export function tonToKg(weightTon: number, decimals = 1): number {
  if (!weightTon || weightTon <= 0 || isNaN(weightTon) || !isFinite(weightTon)) return 0;
  return Number((weightTon * 1_000).toFixed(decimals));
}

/**
 * Calculate monthly storage rental fee with minimum threshold enforcement.
 * Fee = max(minimumFee, round(volumeM3 * ratePerM3))
 */
export function calculateMonthlyRentalFee(
  volumeM3: number,
  ratePerM3: number,
  minFee: number = MINIMUM_MONTHLY_RENTAL_FEE,
): number {
  if (!volumeM3 || volumeM3 <= 0 || isNaN(volumeM3)) return minFee;
  if (!ratePerM3 || ratePerM3 <= 0 || isNaN(ratePerM3)) return minFee;

  const calculatedFee = Math.round(volumeM3 * ratePerM3);
  return Math.max(minFee, calculatedFee);
}

/**
 * Calculate deterministic overdue penalty fee using Decimal precision.
 * Formula: subtotal * (penaltyRatePerWeek * overdueWeeks)
 */
export function calculateOverduePenalty(
  subtotal: Decimal | number,
  overdueWeeks: number,
  penaltyRatePerWeek: number = OVERDUE_PENALTY_RATE_PER_WEEK,
): Decimal {
  if (overdueWeeks <= 0) return new Decimal(0);
  const subtotalDec = new Decimal(subtotal.toString());
  const penaltyRateDec = new Decimal(penaltyRatePerWeek.toString()).mul(overdueWeeks);
  return subtotalDec.mul(penaltyRateDec).toDecimalPlaces(2);
}
