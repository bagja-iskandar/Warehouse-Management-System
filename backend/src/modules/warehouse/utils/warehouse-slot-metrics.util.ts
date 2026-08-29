import { SlotStatus } from '@prisma/client';

export interface RawGoodsItemForSlot {
  id: string;
  volumeM3: number | string | { toString(): string };
  weightKg?: number | string | { toString(): string } | null;
  quantity?: number | null;
}

export interface SlotMetricsResult {
  actualSlotUsedM3: number;
  availableM3: number;
  volPct: number;
  maxWeightKg: number;
  actualSlotUsedWeightKg: number;
  availableWeightKg: number;
  weightPct: number;
  capacityStatus: string;
  actualSlotStatus: SlotStatus;
}

/**
 * Calculates real dynamic aggregation for storage slots (Dual Volume + Weight Capacities)
 */
export function calculateSlotMetrics(
  capacityM3Input: number | string | { toString(): string },
  activeStoredGoods: RawGoodsItemForSlot[],
  initialSlotUsedM3: number | string | { toString(): string },
  initialSlotStatus: SlotStatus,
): SlotMetricsResult {
  const capacityM3 =
    isNaN(Number(capacityM3Input)) || Number(capacityM3Input) < 0 ? 0 : Number(capacityM3Input);

  const calculatedSlotUsedM3 = Number(
    activeStoredGoods
      .reduce((sum, g) => {
        const val = Number(g.volumeM3);
        return sum + (!val || isNaN(val) || val < 0 ? 0 : val);
      }, 0)
      .toFixed(2),
  );
  const initialUsed =
    isNaN(Number(initialSlotUsedM3)) || Number(initialSlotUsedM3) < 0
      ? 0
      : Number(initialSlotUsedM3);
  const actualSlotUsedM3 = calculatedSlotUsedM3 > 0 ? calculatedSlotUsedM3 : initialUsed;
  const availableM3 = Math.max(0, Number((capacityM3 - actualSlotUsedM3).toFixed(2)));
  const volPct = capacityM3 > 0 ? Number(((actualSlotUsedM3 / capacityM3) * 100).toFixed(1)) : 0;

  // Standard industrial rack weight rating: 50 kg/m3 (e.g. 100 m3 -> 5,000 kg)
  const maxWeightKg = capacityM3 * 50;
  const actualSlotUsedWeightKg = Number(
    activeStoredGoods
      .reduce((sum, g) => {
        const val = Number(g.weightKg);
        return sum + (!val || isNaN(val) || val < 0 ? 0 : val);
      }, 0)
      .toFixed(2),
  );
  const availableWeightKg = Math.max(0, Number((maxWeightKg - actualSlotUsedWeightKg).toFixed(1)));
  const weightPct =
    maxWeightKg > 0 ? Number(((actualSlotUsedWeightKg / maxWeightKg) * 100).toFixed(1)) : 0;

  let capacityStatus = 'Normal Load';
  if (volPct >= 100 || weightPct >= 100) {
    capacityStatus =
      volPct >= 100 && weightPct >= 100
        ? 'Fully Saturated'
        : volPct >= 100
          ? 'Volume Maxed Out'
          : 'Weight Capacity Maxed Out';
  } else if (weightPct >= 85 && weightPct >= volPct) {
    capacityStatus = 'Near Weight Capacity';
  } else if (volPct >= 85 && volPct > weightPct) {
    capacityStatus = 'Near Volume Capacity';
  } else if (volPct > 50 || weightPct > 50) {
    capacityStatus = 'Moderate Load';
  } else if (actualSlotUsedM3 > 0 || actualSlotUsedWeightKg > 0) {
    capacityStatus = 'Light Load';
  } else {
    capacityStatus = 'Vacant';
  }

  const actualSlotStatus =
    initialSlotStatus === SlotStatus.MAINTENANCE
      ? SlotStatus.MAINTENANCE
      : actualSlotUsedM3 > 0 || actualSlotUsedWeightKg > 0
        ? SlotStatus.OCCUPIED
        : SlotStatus.AVAILABLE;

  return {
    actualSlotUsedM3,
    availableM3,
    volPct,
    maxWeightKg,
    actualSlotUsedWeightKg,
    availableWeightKg,
    weightPct,
    capacityStatus,
    actualSlotStatus,
  };
}
