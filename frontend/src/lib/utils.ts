import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah (IDR)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Format ISO date string to localized readable date
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Calculate volume in cubic meters (m3) from dimensions in cm.
 * Uses 4 decimal places for precision on smaller items (e.g. 20cm x 15cm x 10cm = 0.0030 m³).
 */
export function calculateVolumeM3(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  decimals = 4
): number {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  if (isNaN(lengthCm) || isNaN(widthCm) || isNaN(heightCm)) return 0;
  return Number(((lengthCm * widthCm * heightCm) / 1_000_000).toFixed(decimals));
}

/**
 * Convert weight in kilograms (kg) to metric tons (ton).
 */
export function kgToTon(weightKg: number, decimals = 2): number {
  if (!weightKg || weightKg <= 0 || isNaN(weightKg)) return 0;
  return Number((weightKg / 1_000).toFixed(decimals));
}

/**
 * Convert weight in metric tons (ton) to kilograms (kg).
 */
export function tonToKg(weightTon: number, decimals = 1): number {
  if (!weightTon || weightTon <= 0 || isNaN(weightTon)) return 0;
  return Number((weightTon * 1_000).toFixed(decimals));
}


/**
 * Format date to relative time (e.g. Just now, 5m ago, 2h ago, Yesterday, or date)
 */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format volume in cubic meters (m³)
 */
export function formatVolumeM3(volume: number | string | null | undefined, decimals = 2): string {
  if (volume === null || volume === undefined || isNaN(Number(volume))) return "0.00 m³";
  return `${Number(volume).toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} m³`;
}

/**
 * Format weight in kilograms (kg)
 */
export function formatWeightKg(weight: number | string | null | undefined, decimals = 1): string {
  if (weight === null || weight === undefined || isNaN(Number(weight))) return "0.0 kg";
  return `${Number(weight).toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} kg`;
}

/**
 * Format temperature in Celsius (°C)
 */
export function formatTemperature(temp: number | string | null | undefined): string {
  if (temp === null || temp === undefined || isNaN(Number(temp))) return "-";
  return `${Number(temp).toFixed(1)}°C`;
}

/**
 * Format percentage (e.g. 85.5%)
 */
export function formatPercentage(pct: number | string | null | undefined): string {
  if (pct === null || pct === undefined || isNaN(Number(pct))) return "0.0%";
  return `${Number(pct).toFixed(1)}%`;
}

/**
 * Generates unique QR code string for goods / tracking items
 */
export function generateBarcodeId(prefix: "BRG" | "ORD" | "TRK" | "INV"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomStr}`;
}

