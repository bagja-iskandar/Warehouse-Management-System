import { ForbiddenException } from '@nestjs/common';
import { OrderStatus, OrderType, UserRole } from '@prisma/client';

/**
 * State Machine transisi status pengiriman Delivery Order
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING_ASSIGNMENT]: [OrderStatus.DRIVER_ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.DRIVER_ASSIGNED]: [
    OrderStatus.EN_ROUTE_PICKUP,
    OrderStatus.PENDING_ASSIGNMENT,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.EN_ROUTE_PICKUP]: [
    OrderStatus.PICKED_UP,
    OrderStatus.DELAYED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT, OrderStatus.DELAYED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.ARRIVED_DESTINATION, OrderStatus.DELAYED],
  [OrderStatus.ARRIVED_DESTINATION]: [OrderStatus.DELIVERED, OrderStatus.DELAYED],
  [OrderStatus.DELIVERED]: [OrderStatus.CONFIRMED],
  [OrderStatus.DELAYED]: [
    OrderStatus.EN_ROUTE_PICKUP,
    OrderStatus.PICKED_UP,
    OrderStatus.IN_TRANSIT,
    OrderStatus.ARRIVED_DESTINATION,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Validates role-based permissions when updating an order status.
 */
export function validateRolePermissionOnOrder(
  role: UserRole,
  newStatus: OrderStatus,
  orderType: OrderType = OrderType.DELIVERY,
): void {
  if (role === UserRole.CUSTOMER) {
    if (orderType === OrderType.PICKUP) {
      throw new ForbiddenException(
        'Customers are not permitted to update inbound shipment status (Receiving is handled by warehouse admin)',
      );
    }
    const customerAllowed: OrderStatus[] = [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
    if (!customerAllowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Customer is not permitted to update shipment status to '${newStatus}'`,
      );
    }
  } else if (role === UserRole.DRIVER) {
    const driverAllowed: OrderStatus[] =
      orderType === OrderType.PICKUP
        ? [
            OrderStatus.EN_ROUTE_PICKUP,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
            OrderStatus.ARRIVED_DESTINATION,
            OrderStatus.DELAYED,
          ]
        : [
            OrderStatus.EN_ROUTE_PICKUP,
            OrderStatus.PICKED_UP,
            OrderStatus.IN_TRANSIT,
            OrderStatus.ARRIVED_DESTINATION,
            OrderStatus.DELIVERED,
            OrderStatus.DELAYED,
          ];
    if (!driverAllowed.includes(newStatus)) {
      throw new ForbiddenException(
        `Driver is not permitted to update shipment status to '${newStatus}'`,
      );
    }
  }
}
