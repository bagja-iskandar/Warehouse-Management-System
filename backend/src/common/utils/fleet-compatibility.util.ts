import { UserRole, UserStatus, VehicleStatus, VehicleType } from '@prisma/client';

export interface OrderCargoRequirement {
  requiresReefer: boolean;
  requiredTempCelsius?: number | null;
  totalVolumeM3: number;
  totalWeightKg: number;
}

export interface VehicleCandidate {
  id: string;
  plateNumber: string;
  name: string;
  type: VehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  hasRefrigeration: boolean;
  minTempCelsius: number | null;
  status: VehicleStatus;
  activeOrdersCount?: number;
}

export interface DriverCandidate {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  driverLicenseNumber?: string | null;
  driverLicenseExpiry?: Date | string | null;
  activeOrdersCount?: number;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  isSelectable: boolean;
  reason?: string;
  badgeLabel: string;
  coolingLabel: string;
}

export interface DriverEligibilityResult {
  isEligible: boolean;
  isSelectable: boolean;
  reason?: string;
  badgeLabel: string;
}

/**
 * Evaluates vehicle suitability against cargo requirements, availability, and payload limits.
 */
export function evaluateVehicleCompatibility(
  vehicle: VehicleCandidate,
  req: OrderCargoRequirement,
): CompatibilityResult {
  const isReeferVehicle = vehicle.hasRefrigeration || vehicle.type === VehicleType.REEFER_TRUCK;
  const vehicleMinTemp = vehicle.minTempCelsius !== null ? Number(vehicle.minTempCelsius) : null;
  const targetTemp =
    req.requiredTempCelsius !== null && req.requiredTempCelsius !== undefined
      ? Number(req.requiredTempCelsius)
      : req.requiresReefer
        ? -18
        : null;

  const coolingLabel = isReeferVehicle
    ? `❄️ ${vehicleMinTemp !== null ? `${vehicleMinTemp}°C` : '-18°C'} REEFER`
    : '📦 Standard Dry (No Cooling)';

  // 1. Check Refrigeration & Temperature Capability
  if (req.requiresReefer) {
    if (!isReeferVehicle) {
      return {
        isCompatible: false,
        isSelectable: false,
        reason:
          'Incompatible — Non-reefer vehicle without cooling system (Order requires -18°C Cold Storage)',
        badgeLabel: 'Incompatible (No Cooling)',
        coolingLabel,
      };
    }

    if (targetTemp !== null && vehicleMinTemp !== null && vehicleMinTemp > targetTemp) {
      return {
        isCompatible: false,
        isSelectable: false,
        reason: `Incompatible — Insufficient cooling capability (Vehicle min temp: ${vehicleMinTemp}°C, Required: ${targetTemp}°C)`,
        badgeLabel: `Incompatible (${vehicleMinTemp}°C > ${targetTemp}°C)`,
        coolingLabel,
      };
    }
  }

  // 2. Check Vehicle Status & Active Delivery Conflicts
  if (vehicle.status === VehicleStatus.IN_SERVICE) {
    return {
      isCompatible: true,
      isSelectable: false,
      reason: 'Disabled — Vehicle is currently In Service on another dispatch',
      badgeLabel: 'In Service',
      coolingLabel,
    };
  }

  if (vehicle.status === VehicleStatus.MAINTENANCE) {
    return {
      isCompatible: true,
      isSelectable: false,
      reason: 'Disabled — Vehicle is currently undergoing Maintenance',
      badgeLabel: 'Maintenance',
      coolingLabel,
    };
  }

  if (vehicle.activeOrdersCount && vehicle.activeOrdersCount > 0) {
    return {
      isCompatible: true,
      isSelectable: false,
      reason: 'Disabled — Vehicle currently has an active in-progress delivery assignment',
      badgeLabel: 'Assigned (Active)',
      coolingLabel,
    };
  }

  // 3. Check Payload Weight and Volume Capacity
  if (req.totalVolumeM3 > 0 && req.totalVolumeM3 > vehicle.maxVolumeM3) {
    return {
      isCompatible: false,
      isSelectable: false,
      reason: `Incompatible — Exceeds volume capacity (Cargo: ${req.totalVolumeM3.toFixed(2)} m³, Vehicle Max: ${vehicle.maxVolumeM3} m³)`,
      badgeLabel: 'Volume Exceeded',
      coolingLabel,
    };
  }

  if (req.totalWeightKg > 0 && req.totalWeightKg > vehicle.maxWeightKg) {
    return {
      isCompatible: false,
      isSelectable: false,
      reason: `Incompatible — Exceeds weight payload (Cargo: ${req.totalWeightKg} kg, Vehicle Max: ${vehicle.maxWeightKg} kg)`,
      badgeLabel: 'Payload Exceeded',
      coolingLabel,
    };
  }

  // 4. Compatible & Available
  return {
    isCompatible: true,
    isSelectable: true,
    badgeLabel: 'Compatible & Available',
    coolingLabel,
  };
}

/**
 * Evaluates driver eligibility, certification/license, and availability for a dispatch assignment.
 */
export function evaluateDriverEligibility(driver: DriverCandidate): DriverEligibilityResult {
  if (driver.role !== UserRole.DRIVER) {
    return {
      isEligible: false,
      isSelectable: false,
      reason: 'Ineligible — User does not have Driver role',
      badgeLabel: 'Not a Driver',
    };
  }

  if (driver.status !== UserStatus.ACTIVE) {
    return {
      isEligible: false,
      isSelectable: false,
      reason: 'Ineligible — Driver account is inactive or suspended',
      badgeLabel: 'Inactive',
    };
  }

  if (driver.driverLicenseExpiry) {
    const expiry = new Date(driver.driverLicenseExpiry);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      return {
        isEligible: false,
        isSelectable: false,
        reason: 'Ineligible — Driver license (SIM) has expired',
        badgeLabel: 'SIM Expired',
      };
    }
  }

  if (driver.activeOrdersCount && driver.activeOrdersCount > 0) {
    return {
      isEligible: true,
      isSelectable: false,
      reason: 'Disabled — Driver is currently executing another active delivery order',
      badgeLabel: 'On Delivery (Busy)',
    };
  }

  return {
    isEligible: true,
    isSelectable: true,
    badgeLabel: 'Ready & Available',
  };
}
