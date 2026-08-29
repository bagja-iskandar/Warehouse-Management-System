import { Vehicle, User } from "@/types";

export interface OrderCargoRequirement {
  requiresReefer: boolean;
  requiredTempCelsius?: number | null;
  totalVolumeM3: number;
  totalWeightKg: number;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  isSelectable: boolean;
  reason?: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "destructive" | "outline" | "default";
  coolingLabel: string;
}

export interface DriverEligibilityResult {
  isEligible: boolean;
  isSelectable: boolean;
  reason?: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "destructive" | "outline" | "default";
}

/**
 * Format Vehicle Type to clean human-readable text
 */
export function formatVehicleTypeName(type: string): string {
  switch (type) {
    case "REEFER_TRUCK":
      return "Reefer Cold Truck";
    case "BOX_TRUCK_SMALL":
      return "Box Truck";
    case "VAN":
      return "Cargo Van";
    case "WING_BOX_LARGE":
      return "Wing Box Large";
    default:
      return type.replace(/_/g, " ");
  }
}

/**
 * Evaluates vehicle suitability against cargo requirements, status, and payload.
 */
export function evaluateVehicleCompatibility(
  vehicle: Vehicle,
  req: OrderCargoRequirement
): CompatibilityResult {
  const isReeferVehicle =
    vehicle.hasRefrigeration || vehicle.type === "REEFER_TRUCK";
  const minTemp =
    vehicle.minTempCelsius !== undefined && vehicle.minTempCelsius !== null
      ? Number(vehicle.minTempCelsius)
      : null;
  const targetTemp =
    req.requiredTempCelsius !== null && req.requiredTempCelsius !== undefined
      ? Number(req.requiredTempCelsius)
      : req.requiresReefer
      ? -18
      : null;

  const coolingLabel = isReeferVehicle
    ? `❄️ ${minTemp !== null ? `${minTemp}°C` : "-18°C"} REEFER`
    : "✕ Standard Dry (No Cooling)";

  // 1. Check Refrigeration & Temperature Capability
  if (req.requiresReefer) {
    if (!isReeferVehicle) {
      return {
        isCompatible: false,
        isSelectable: false,
        reason:
          "Incompatible — Non-reefer vehicle without cooling system (Order requires -18°C Cold Storage)",
        badgeLabel: "No Cooling System",
        badgeVariant: "destructive",
        coolingLabel,
      };
    }

    if (targetTemp !== null && minTemp !== null && minTemp > targetTemp) {
      return {
        isCompatible: false,
        isSelectable: false,
        reason: `Incompatible — Insufficient cooling capability (Vehicle min temp: ${minTemp}°C, Required: ${targetTemp}°C)`,
        badgeLabel: `Min ${minTemp}°C (Needs ${targetTemp}°C)`,
        badgeVariant: "destructive",
        coolingLabel,
      };
    }
  }

  // 2. Check Vehicle Status & Active Delivery Conflicts
  if (vehicle.status === "IN_SERVICE") {
    return {
      isCompatible: true,
      isSelectable: false,
      reason: "Disabled — Vehicle is currently In Service on another dispatch",
      badgeLabel: "In Service",
      badgeVariant: "warning",
      coolingLabel,
    };
  }

  if (vehicle.status === "MAINTENANCE") {
    return {
      isCompatible: true,
      isSelectable: false,
      reason: "Disabled — Vehicle is currently undergoing Maintenance",
      badgeLabel: "Maintenance",
      badgeVariant: "destructive",
      coolingLabel,
    };
  }

  if (vehicle.activeOrdersCount && vehicle.activeOrdersCount > 0) {
    return {
      isCompatible: true,
      isSelectable: false,
      reason:
        "Disabled — Vehicle currently has an active in-progress delivery assignment",
      badgeLabel: "Assigned (Active)",
      badgeVariant: "warning",
      coolingLabel,
    };
  }

  // 3. Check Payload Weight and Volume Capacity
  if (req.totalVolumeM3 > 0 && req.totalVolumeM3 > vehicle.maxVolumeM3) {
    return {
      isCompatible: false,
      isSelectable: false,
      reason: `Incompatible — Exceeds volume capacity (Cargo: ${req.totalVolumeM3.toFixed(
        2
      )} m³, Vehicle Max: ${vehicle.maxVolumeM3} m³)`,
      badgeLabel: "Volume Exceeded",
      badgeVariant: "destructive",
      coolingLabel,
    };
  }

  if (req.totalWeightKg > 0 && req.totalWeightKg > vehicle.maxWeightKg) {
    return {
      isCompatible: false,
      isSelectable: false,
      reason: `Incompatible — Exceeds weight payload (Cargo: ${req.totalWeightKg} kg, Vehicle Max: ${vehicle.maxWeightKg} kg)`,
      badgeLabel: "Payload Exceeded",
      badgeVariant: "destructive",
      coolingLabel,
    };
  }

  // 4. Compatible & Available
  return {
    isCompatible: true,
    isSelectable: true,
    badgeLabel: "✓ Compatible",
    badgeVariant: "success",
    coolingLabel,
  };
}

/**
 * Evaluates driver eligibility, certification/license, and availability.
 */
export function evaluateDriverEligibility(driver: User): DriverEligibilityResult {
  if (driver.role !== "DRIVER") {
    return {
      isEligible: false,
      isSelectable: false,
      reason: "Ineligible — User does not have Driver role",
      badgeLabel: "Not a Driver",
      badgeVariant: "destructive",
    };
  }

  if (driver.status !== "ACTIVE") {
    return {
      isEligible: false,
      isSelectable: false,
      reason: "Ineligible — Driver account is inactive or suspended",
      badgeLabel: "Inactive",
      badgeVariant: "destructive",
    };
  }

  if (driver.driverLicenseExpiry) {
    const expiry = new Date(driver.driverLicenseExpiry);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return {
        isEligible: false,
        isSelectable: false,
        reason: "Ineligible — Driver license (SIM) has expired",
        badgeLabel: "SIM Expired",
        badgeVariant: "destructive",
      };
    }
  }

  if (driver.activeOrdersCount && driver.activeOrdersCount > 0) {
    return {
      isEligible: true,
      isSelectable: false,
      reason:
        "Disabled — Driver is currently executing another active delivery order",
      badgeLabel: "On Active Delivery",
      badgeVariant: "warning",
    };
  }

  return {
    isEligible: true,
    isSelectable: true,
    badgeLabel: "✓ Ready & Available",
    badgeVariant: "success",
  };
}
