export type VehicleType = "VAN" | "BOX_TRUCK_SMALL" | "REEFER_TRUCK" | "WING_BOX_LARGE";

export type OrderType = "PICKUP" | "DELIVERY";

export type OrderStatus =
  | "PENDING_ASSIGNMENT"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_DESTINATION"
  | "DELIVERED"
  | "CONFIRMED"
  | "DELAYED"
  | "CANCELLED";

export type OrderMessageType =
  | "DRIVER_PENDING"
  | "REEFER_UNAVAILABLE"
  | "DELIVERY_DELAYED"
  | "DRIVER_ASSIGNED"
  | "VEHICLE_ASSIGNED"
  | "SCHEDULE_CHANGED"
  | "CUSTOM";

export interface DeliveryOrderMessage {
  id: string;
  orderId: string;
  customerId: string;
  senderId?: string | null;
  senderName: string;
  senderRole: string;
  messageType: OrderMessageType;
  title: string;
  content: string;
  channel: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
  status: "SENT" | "DELIVERED" | "FAILED";
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface CreateOrderMessagePayload {
  messageType: OrderMessageType;
  title: string;
  content: string;
  channel?: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
}

export interface Vehicle {
  id: string;
  plateNumber: string; // e.g. "B 9821 WMS"
  name: string;
  type: VehicleType;
  maxWeightKg: number;
  maxVolumeM3: number;
  hasRefrigeration: boolean;
  minTempCelsius?: number;
  status: "AVAILABLE" | "IN_SERVICE" | "MAINTENANCE";
  activeOrdersCount?: number;
  currentDriverId?: string;
  currentDriverName?: string;
  locationCity: string;
}

export interface DeliveryOrderItem {
  id?: string;
  goodsId?: string;
  name?: string;
  barcode?: string;
  quantity: number;
  unit?: string;
  requiresColdStorage?: boolean;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string; // e.g. "ORD-2026-092"
  type: OrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  goodsItemIds: string[];
  goodsSummary: string; // e.g. "2x Frozen Salmon Box, 1x Frozen Beef"
  items?: DeliveryOrderItem[];
  totalPackages?: number;
  totalVolumeM3: number;
  totalWeightKg: number;
  requiresReefer: boolean;

  originAddress: string;
  originCity: string;
  destinationAddress: string;
  destinationCity: string;

  scheduledDate: string;
  scheduledTimeSlot: string;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;

  vehicleId?: string;
  vehiclePlate?: string;
  vehicleType?: VehicleType;

  status: OrderStatus;
  estimatedDurationMins: number;
  distanceKm: number;

  isDelayed?: boolean;
  delayReason?: string;
  rescheduledTime?: string;

  proofOfDeliveryUrl?: string;
  recipientName?: string;
  recipientSignature?: string;
  confirmedByCustomer?: boolean;
  confirmedByDriver?: boolean;
  confirmedByAdmin?: boolean;
  confirmedAt?: string;

  unreadMessagesCount?: number;
  latestMessage?: DeliveryOrderMessage | null;
  messages?: DeliveryOrderMessage[];

  createdAt: string;
  updatedAt: string;
}

