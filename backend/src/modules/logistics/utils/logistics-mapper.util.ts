import { DeliveryOrderListItemDto, OrderItemDto } from '../dto/order-response.dto';
import { OrderMessageResponseDto } from '../dto/order-message-response.dto';

export function mapToOrderListItemDto(order: any): DeliveryOrderListItemDto {
  const items: OrderItemDto[] = (order.orderItems || []).map((oi: any) => ({
    id: oi.id,
    goodsId: oi.goodsId || oi.goods?.id || '',
    name: oi.goods?.name || 'Cargo Item',
    barcode: oi.goods?.barcode || '',
    quantity: Number(oi.quantity) || 1,
    unit: oi.goods?.unit || 'Packages',
    volumeM3: oi.goods?.volumeM3 ? Number(oi.goods.volumeM3) : 0,
    weightKg: oi.goods?.weightKg ? Number(oi.goods.weightKg) : 0,
    requiresColdStorage: Boolean(oi.goods?.requiresColdStorage),
  }));

  const totalPackages =
    items.length > 0 ? items.reduce((sum, it) => sum + (it.quantity || 0), 0) : 1;

  const rawMessages = order.messages || [];
  const messages: OrderMessageResponseDto[] = rawMessages.map((m: any) => ({
    id: m.id,
    orderId: m.orderId,
    customerId: m.customerId,
    senderId: m.senderId || null,
    senderName: m.senderName || 'Dispatcher',
    senderRole: m.senderRole || 'ADMIN',
    messageType: m.messageType,
    title: m.title,
    content: m.content,
    channel: m.channel,
    status: m.status,
    isRead: m.isRead,
    readAt: m.readAt
      ? m.readAt instanceof Date
        ? m.readAt.toISOString()
        : String(m.readAt)
      : null,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
  }));

  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;
  const latestMessage = messages.length > 0 ? messages[0] : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type,
    customerId: order.customerId,
    customerName: order.customer?.name || '',
    customerPhone: order.customer?.phone || '',
    goodsItemIds: (order.orderItems || []).map((oi: any) => oi.goodsId),
    items,
    totalPackages,
    goodsSummary: order.goodsSummary,
    totalVolumeM3: Number(order.totalVolumeM3),
    totalWeightKg: Number(order.totalWeightKg),
    requiresReefer: order.requiresReefer,
    originAddress: order.originAddress,
    originCity: order.originCity,
    destinationAddress: order.destinationAddress,
    destinationCity: order.destinationCity,
    scheduledDate:
      order.scheduledDate instanceof Date
        ? order.scheduledDate.toISOString().split('T')[0]
        : String(order.scheduledDate).split('T')[0],
    scheduledTimeSlot: order.scheduledTimeSlot,
    driverId: order.driverId,
    driverName: order.driver?.name || null,
    driverPhone: order.driver?.phone || null,
    vehicleId: order.vehicleId,
    vehiclePlate: order.vehicle?.plateNumber || null,
    vehicleType: order.vehicle?.type || null,
    status: order.status,
    estimatedDurationMins: order.estimatedDurationMins,
    distanceKm: Number(order.distanceKm),
    isDelayed: order.isDelayed,
    delayReason: order.delayReason,
    rescheduledTime: order.rescheduledTime ? new Date(order.rescheduledTime).toISOString() : null,
    proofOfDeliveryUrl: order.proofOfDeliveryUrl,
    recipientName: order.recipientName,
    recipientSignature: order.recipientSignature,
    driverRating: order.driverRating ? Number(order.driverRating) : null,
    unreadMessagesCount,
    latestMessage,
    createdAt:
      order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    updatedAt:
      order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
  };
}
