import { ForbiddenException } from '@nestjs/common';
import { GoodsStorageStatus, UserRole } from '@prisma/client';

/**
 * State Machine transisi status barang yang diizinkan (Strict Operational Flow)
 */
export const ALLOWED_GOODS_TRANSITIONS: Record<GoodsStorageStatus, GoodsStorageStatus[]> = {
  [GoodsStorageStatus.DRAFT]: [GoodsStorageStatus.PENDING_PICKUP, GoodsStorageStatus.CANCELLED],
  [GoodsStorageStatus.PENDING_PICKUP]: [
    GoodsStorageStatus.IN_TRANSIT_INBOUND,
    GoodsStorageStatus.CANCELLED,
    GoodsStorageStatus.DRAFT,
  ],
  [GoodsStorageStatus.IN_TRANSIT_INBOUND]: [
    GoodsStorageStatus.INSPECTING,
    GoodsStorageStatus.PENDING_PICKUP,
  ],
  [GoodsStorageStatus.INSPECTING]: [
    GoodsStorageStatus.STORED,
    GoodsStorageStatus.CANCELLED,
    GoodsStorageStatus.IN_TRANSIT_INBOUND,
  ],
  [GoodsStorageStatus.STORED]: [GoodsStorageStatus.PENDING_DELIVERY, GoodsStorageStatus.STORED],
  [GoodsStorageStatus.PENDING_DELIVERY]: [
    GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
    GoodsStorageStatus.STORED,
  ],
  [GoodsStorageStatus.IN_TRANSIT_OUTBOUND]: [
    GoodsStorageStatus.DELIVERED,
    GoodsStorageStatus.PENDING_DELIVERY,
  ],
  [GoodsStorageStatus.DELIVERED]: [],
  [GoodsStorageStatus.CANCELLED]: [],
};

/**
 * Validates role-based permissions when attempting a goods storage status transition.
 */
export function validateGoodsRolePermissionOnTransition(
  role: UserRole,
  newStatus: GoodsStorageStatus,
): void {
  if (role === UserRole.CUSTOMER) {
    const customerAllowed: GoodsStorageStatus[] = [
      GoodsStorageStatus.PENDING_PICKUP,
      GoodsStorageStatus.PENDING_DELIVERY,
      GoodsStorageStatus.CANCELLED,
    ];
    if (!customerAllowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Customer is not permitted to change goods status to '${newStatus}'`,
      );
    }
  } else if (role === UserRole.DRIVER) {
    const driverAllowed: GoodsStorageStatus[] = [
      GoodsStorageStatus.IN_TRANSIT_INBOUND,
      GoodsStorageStatus.IN_TRANSIT_OUTBOUND,
      GoodsStorageStatus.DELIVERED,
    ];
    if (!driverAllowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Driver is not permitted to change goods status to '${newStatus}'`,
      );
    }
  }
}
