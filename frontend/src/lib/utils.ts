import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah (IDR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string to localized readable date
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Calculate volume in cubic meters (m3) from dimensions in cm
 */
export function calculateVolumeM3(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  return Number(((lengthCm * widthCm * heightCm) / 1000000).toFixed(2));
}

/**
 * Generates unique QR code string for goods / tracking items
 */
export function generateBarcodeId(prefix: "BRG" | "ORD" | "TRK" | "INV"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}
