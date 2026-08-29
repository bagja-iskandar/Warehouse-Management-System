import { GoodsStorageStatus } from '@prisma/client';

export interface InventoryItemEligibility {
  status: GoodsStorageStatus;
  slotId?: string | null;
  quantity?: number;
}

/**
 * Validates whether an inventory item is eligible for Inbound logistics pickup.
 * Only DRAFT and PENDING_PICKUP items are allowed.
 * CANCELLED, INSPECTING, STORED, DELIVERED items are strictly blocked.
 */
export function canInboundItem(status: GoodsStorageStatus): boolean {
  if (status === GoodsStorageStatus.CANCELLED) {
    return false;
  }
  return status === GoodsStorageStatus.DRAFT || status === GoodsStorageStatus.PENDING_PICKUP;
}

/**
 * Validates whether an inventory item is ready for Put-Away allocation into a rack slot.
 * Only INSPECTING items (physically received and verified at the loading dock) are allowed.
 */
export function canPutAwayItem(status: GoodsStorageStatus): boolean {
  if (status === GoodsStorageStatus.CANCELLED) {
    return false;
  }
  return status === GoodsStorageStatus.INSPECTING;
}

/**
 * Validates whether an inventory item is eligible for Outbound delivery dispatch.
 * Only STORED items that have an active slot allocation and available quantity > 0 are allowed.
 * Items in DRAFT, PENDING_PICKUP, IN_TRANSIT_INBOUND, INSPECTING, or CANCELLED are strictly blocked.
 */
export function canOutboundItem(item: InventoryItemEligibility): boolean {
  if (item.status === GoodsStorageStatus.CANCELLED) {
    return false;
  }
  if (item.status !== GoodsStorageStatus.STORED) {
    return false;
  }
  if (!item.slotId) {
    return false;
  }
  if (item.quantity !== undefined && item.quantity <= 0) {
    return false;
  }
  return true;
}

/**
 * Validates whether a customer can perform a simple Pre-Inbound Warehouse Change.
 * Allowed ONLY if no inventory has entered warehouse operations (i.e. no items are INSPECTING, STORED,
 * PENDING_DELIVERY, IN_TRANSIT_OUTBOUND, or DELIVERED).
 */
export function canChangeRentalWarehouse(goodsList: { status: GoodsStorageStatus }[]): {
  allowed: boolean;
  reason?: string;
} {
  const operationalStatuses: GoodsStorageStatus[] = [
    GoodsStorageStatus.INSPECTING,
    GoodsStorageStatus.STORED,
    GoodsStorageStatus.PENDING_DELIVERY,
    GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
    GoodsStorageStatus.DELIVERED,
  ];

  const hasEnteredOps = goodsList.some((g) => operationalStatuses.includes(g.status));

  if (hasEnteredOps) {
    return {
      allowed: false,
      reason:
        'Warehouse transfer is unavailable because inventory has already entered warehouse operations. Please use Physical Inventory Transfer.',
    };
  }

  return { allowed: true };
}
